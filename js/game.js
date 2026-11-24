'use strict';
// ============================================================
//  GAME — trạng thái, vòng lặp, logic bán hàng
// ============================================================

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const stage = document.getElementById('stage');
const backCv = document.createElement('canvas');
const frontCv = document.createElement('canvas');
let PR = 1;
let SW = VW, OX = 0, UIK = 1;   // SW: bề ngang logic (co giãn theo màn hình), OX: phần phố kéo dài bên trái
const MAX_W = 2200;

const SAVE_KEY = 'tiemtaphoa_cohoa_v1';
const rnd = () => Math.random();
const rpick = arr => arr[Math.floor(Math.random() * arr.length)];
const money = n => (n < 0 ? '-' : '') + Math.abs(Math.round(n)).toLocaleString('vi-VN') + 'đ';
const lower1 = s => s.charAt(0).toLowerCase() + s.slice(1);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---------- trạng thái lưu được ----------
let G = null;
function newState() {
  const stock = {};
  for (const id in ITEMS) stock[id] = ITEMS[id].lock ? 0 : ITEMS[id].start;
  return {
    day: 1, minute: OPEN_MIN, money: START_MONEY, rep: 3, weather: 'nang',
    stock, upgrades: {}, debts: {}, seenTutorial: false, best: 0,
    stats: freshStats(),
  };
}
function freshStats() { return { served: 0, angry: 0, sales: 0, cost: 0, credit: 0, collected: 0, oos: 0, lostChange: 0, startMoney: 0 }; }
// Lưu cả khi đang giữa ngày: hàng trong bịch / đang tính tiền được trả lại kệ
function snapshot() {
  const s = JSON.parse(JSON.stringify(G));
  for (const id in bag) s.stock[id] += bag[id];
  customers.forEach(c => {
    if (c.items && (c.state === 'pay' || c.state === 'credit')) for (const id in c.items) { s.stock[id] += c.items[id]; s.stats.cost -= ITEMS[id].cost * c.items[id]; }
  });
  return s;
}
function saveGame() {
  if (!G) return;
  try {
    const s = (phase === 'open' || phase === 'closing') ? snapshot() : JSON.parse(JSON.stringify(G));
    s.lastSeen = Date.now();
    localStorage.setItem(SAVE_KEY, JSON.stringify(s));
  } catch (e) { }
}
function loadGame() {
  try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s && s.day) { const base = newState(); return Object.assign(base, s, { stock: Object.assign(base.stock, s.stock) }); } } catch (e) { }
  return null;
}
function isLocked(id) { const l = ITEMS[id].lock; return !!(l && !G.upgrades[l]); }

// ---------- trạng thái chạy ----------
let customers = [], leavers = [], floats = [], flyers = [];
let bag = {};
let t = 0, last = 0, spawnTimer = 5;
let paused = true, speed = 1, phase = 'menu'; // menu | open | closing | summary
let hover = null, mouse = { x: -1, y: -1 };
let hoa = { pose: 'fan', until: 0, mood: 'neutral', talkUntil: 0 };
let calc = { flashUntil: 0, text: '0' };
let payCtx = null;
let cid = 0;

// ============================================================
//  ÂM THANH (WebAudio, không cần file)
// ============================================================
const SFX = (() => {
  let ac = null, muted = false;
  const ensure = () => { if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { } } if (ac && ac.state === 'suspended') ac.resume(); return ac; };
  function tone(freq, dur, type = 'sine', vol = 0.15, delay = 0, slide = 0) {
    if (muted || !ensure()) return;
    const o = ac.createOscillator(), g = ac.createGain();
    const t0 = ac.currentTime + delay;
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(ac.destination); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  return {
    ctx: ensure,
    unlock() { ensure(); if (typeof MUSIC !== 'undefined' && !document.hidden) MUSIC.start(); },
    toggle() { muted = !muted; return muted; },
    get muted() { return muted; },
    pick() { tone(660, 0.08, 'triangle', 0.12); tone(990, 0.06, 'triangle', 0.08, 0.04); },
    drop() { tone(440, 0.07, 'triangle', 0.1, 0, 0.7); },
    ching() { tone(1318, 0.15, 'square', 0.06); tone(1760, 0.35, 'triangle', 0.12, 0.08); tone(2637, 0.4, 'sine', 0.06, 0.12); },
    bad() { tone(220, 0.18, 'sawtooth', 0.07, 0, 0.7); tone(180, 0.2, 'sawtooth', 0.06, 0.1, 0.7); },
    door() { tone(880, 0.25, 'sine', 0.12); tone(698, 0.35, 'sine', 0.12, 0.18); },
    write() { for (let i = 0; i < 4; i++) tone(2000 + rnd() * 800, 0.03, 'triangle', 0.03, i * 0.07); },
    bill() { tone(520 + rnd() * 80, 0.05, 'triangle', 0.08); },
    buy() { tone(523, 0.1, 'triangle', 0.1); tone(659, 0.1, 'triangle', 0.1, 0.08); tone(784, 0.2, 'triangle', 0.1, 0.16); },
  };
})();

// ============================================================
//  KHỞI TẠO & KÍCH THƯỚC
// ============================================================
function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  SW = Math.round(Math.max(VW, Math.min(MAX_W, VH * w / h)));
  OX = SW - VW;
  const s = Math.min(w / SW, h / VH);
  stage.style.width = SW + 'px';
  stage.style.transform = `translate(${(w - SW * s) / 2}px, ${(h - VH * s) / 2}px) scale(${s})`;
  stage.style.setProperty('--ox', OX + 'px');
  stage.style.setProperty('--s', s);
  const phone = s < 0.78;
  document.body.classList.toggle('phone', phone);
  UIK = phone ? 1.3 : 1;
  PR = s * Math.min(window.devicePixelRatio || 1, 3);
  canvas.style.width = SW + 'px';
  canvas.width = Math.round(SW * PR); canvas.height = Math.round(VH * PR);
  rebuildLayers();
}
// Toàn màn hình + khóa xoay ngang (Android). iPhone: dùng "Thêm vào MH chính".
const isTouch = () => window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
function goFullscreen(force) {
  const el = document.documentElement;
  const lock = () => { try { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => { }); } catch (e) { } };
  if (document.fullscreenElement || document.webkitFullscreenElement) { lock(); return; }
  if (!force && !isTouch()) return;
  const req = el.requestFullscreen || el.webkitRequestFullscreen;
  if (!req) return;
  try { const p = req.call(el, { navigationUI: 'hide' }); if (p && p.then) p.then(lock).catch(() => { }); else lock(); } catch (e) { }
}
function toggleFullscreen() {
  if (document.fullscreenElement || document.webkitFullscreenElement) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); }
  else goFullscreen(true);
}
const canFullscreen = () => !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen);
function rebuildLayers() {
  if (!G) return;
  [[backCv, c => buildBackLayer(c, G, OX)], [frontCv, c => buildFrontLayer(c)]].forEach(([cv, fn]) => {
    cv.width = canvas.width; cv.height = canvas.height;
    const c = cv.getContext('2d'); c.setTransform(PR, 0, 0, PR, OX * PR, 0); fn(c);
  });
}

// ============================================================
//  KHÁCH HÀNG
// ============================================================
function hourMul(type, hour) {
  for (const [a, b, m] of CUSTOMER_TYPES[type].hours) if (hour >= a && hour < b) return m;
  return 1;
}
function pickType() {
  const hour = G.minute / 60, U = G.upgrades;
  const base = { hocsinh: 1, hangxom: 1.25, ongcu: 0.8, shipper: 0.65, mevabe: 0.7 };
  if (U.tukinh) base.hocsinh *= 1.5;
  if (U.thecao) base.shipper *= 2;
  if (U.banghe) base.ongcu *= 1.5;
  if (U.tulanh) { base.shipper *= 1.2; base.ongcu *= 1.3; }
  if (U.giadung) base.hangxom *= 1.2;
  const w = {}; let sum = 0;
  for (const k in base) { w[k] = base[k] * hourMul(k, hour); sum += w[k]; }
  if (sum <= 0) return 'hangxom';
  let r = rnd() * sum;
  for (const k in w) { r -= w[k]; if (r <= 0) return k; }
  return 'hangxom';
}
function makeRequest(type) {
  const T = CUSTOMER_TYPES[type];
  const pool = [];
  for (const id in T.wants) {
    if (!ITEMS[id] || isLocked(id)) continue;
    let w = T.wants[id];
    const isDrink = ['nuocsuoi', 'nuocngot', 'tangluc', 'bia', 'nuocda', 'suachua'].includes(id);
    if (G.weather === 'nang' && isDrink) w *= 1.7;
    if (G.weather === 'mua' && (id === 'mitom' || id === 'phogoi')) w *= 2.2;
    if (G.weather === 'mua' && isDrink) w *= 0.5;
    pool.push([id, w]);
  }
  let n = 1 + (rnd() < 0.5 ? 1 : 0) + (rnd() < 0.22 ? 1 : 0);
  n = Math.min(n, T.maxItems, pool.length);
  const req = [];
  for (let i = 0; i < n; i++) {
    const sum = pool.reduce((a, p) => a + p[1], 0);
    let r = rnd() * sum, k = 0;
    for (; k < pool.length; k++) { r -= pool[k][1]; if (r <= 0) break; }
    k = Math.min(k, pool.length - 1);
    const id = pool[k][0]; pool.splice(k, 1);
    const qty = rnd() < 0.72 ? 1 : 1 + Math.ceil(rnd() * (T.maxQty - 1));
    req.push({ id, qty, oos: false });
  }
  return req;
}
function spawnCustomer() {
  if (customers.length >= QUEUE_X.length) return;
  const type = pickType();
  let reg = null;
  if (rnd() < 0.45) {
    const cands = REGULARS.filter(r => r.type === type && !customers.concat(leavers).some(c => c.reg === r));
    if (cands.length) reg = rpick(cands);
  }
  const req = makeRequest(type);
  if (!req.length) return;
  const T = CUSTOMER_TYPES[type];
  const look = makeLook(type, reg ? reg.name : 'khach' + (++cid) + rnd(), reg || {});
  customers.push({
    id: ++cid, type, reg, name: reg ? reg.name : T.label, look,
    greet: rpick(T.greet), x: -OX - 80, walking: true, phase: 0,
    state: 'queue', patience: 1, req, mood: 'neutral', say: null, sayUntil: 0, remindDone: false,
  });
  UI.refreshBar();
}
function front() { const c = customers[0]; return c && c.state !== 'queue' ? c : null; }
function say(c, text, dur = 2.6) { c.say = text; c.sayUntil = t + dur; }
function fill(s, x) { return s.replace('{x}', x); }

function arrive(c) {
  c.state = 'order';
  SFX.door();
  setHoa('wave', 0.9);
  const d = c.reg && G.debts[c.reg.name];
  if (d && rnd() < c.reg.honesty * 0.5) {
    G.money += d.amt; G.stats.collected += d.amt;
    addFloat('+' + money(d.amt) + ' (trả nợ)', 540, 420, '#2e7d4a');
    delete G.debts[c.reg.name];
    say(c, rpick(LINES.repay), 2.4);
    SFX.ching();
  }
  UI.refreshBar();
}
function leave(c, mood) {
  const i = customers.indexOf(c);
  if (i >= 0) customers.splice(i, 1);
  c.state = 'leave'; c.mood = mood; c.walking = true; c.leaveDelay = mood === 'happy' ? 0.7 : 0.3;
  leavers.push(c);
  if (payCtx && payCtx.cust === c) { payCtx = null; UI.closeChange(); }
  UI.refreshBar();
}
function returnBag() {
  for (const id in bag) G.stock[id] += bag[id];
  bag = {};
}
function addRep(d) { G.rep = clamp(G.rep + d, 0, 5); }
function setHoa(pose, dur) { hoa.pose = pose; hoa.until = t + dur; }
function addFloat(text, x, y, col = '#3b2a20') { floats.push({ text, x, y, col, life: 0 }); }

// ============================================================
//  HÀNH ĐỘNG NGƯỜI CHƠI
// ============================================================
function clickSlot(id) {
  if (isLocked(id)) { const u = UPGRADES.find(u => u.id === ITEMS[id].lock); UI.toast(`🔒 Cần mua nâng cấp "${u.name}"`); SFX.bad(); return; }
  const c = front();
  if (!c || c.state !== 'order') { addFloat(c ? 'Đang tính tiền mà!' : 'Chưa có khách', mouse.x, mouse.y - 10, '#8a3a1a'); return; }
  if (G.stock[id] <= 0) { addFloat('Hết hàng rồi!', mouse.x, mouse.y - 10, '#c0392b'); SFX.bad(); return; }
  G.stock[id]--; bag[id] = (bag[id] || 0) + 1;
  const s = SLOTS[id];
  flyers.push({ id, x0: s.x + s.w / 2, y0: s.y + s.h / 2, x1: RECT_BAG.x + 40, y1: RECT_BAG.y + 40, p: 0 });
  setHoa('pack', 0.45);
  SFX.pick();
  UI.refreshBar();
}
function removeFromBag(id) {
  if (!bag[id]) return;
  bag[id]--; G.stock[id]++;
  if (!bag[id]) delete bag[id];
  SFX.drop(); UI.refreshBar();
}
function clearBag() { returnBag(); SFX.drop(); UI.refreshBar(); }

function bagTotal() { let s = 0; for (const id in bag) s += ITEMS[id].price * bag[id]; return s; }

function handOver() {
  const c = front(); if (!c || c.state !== 'order') return;
  const need = {};
  c.req.forEach(r => { if (!r.oos) need[r.id] = r.qty; });
  let missing = null, extra = null;
  for (const id in need) if ((bag[id] || 0) < need[id]) missing = id;
  for (const id in bag) if (bag[id] > (need[id] || 0)) extra = id;
  if (extra) { say(c, fill(rpick(LINES.extra), lower1(ITEMS[extra].name))); c.patience -= 0.08; SFX.bad(); return; }
  if (missing) { say(c, fill(rpick(LINES.missing), lower1(ITEMS[missing].name))); c.patience -= 0.06; SFX.bad(); return; }
  const total = bagTotal();
  c.items = Object.assign({}, bag); bag = {};
  c.total = total;
  G.stats.cost += Object.keys(c.items).reduce((a, id) => a + ITEMS[id].cost * c.items[id], 0);
  setHoa('pack', 0.6);
  const T = CUSTOMER_TYPES[c.type];
  const debt = c.reg && G.debts[c.reg.name] ? G.debts[c.reg.name].amt : 0;
  if (c.reg && rnd() < T.credit && debt + total <= CREDIT_LIMIT) {
    c.state = 'credit';
    c.creditLine = rpick(LINES.credit[c.type] || LINES.credit.hangxom);
  } else startPayment(c);
  UI.refreshBar();
}

function exactBills(amount) {
  const out = []; const den = BILLS.slice().reverse();
  for (const b of den) while (amount >= b) { out.push(b); amount -= b; }
  return out;
}
function makePayment(c, total) {
  const T = CUSTOMER_TYPES[c.type];
  if (rnd() < T.exact) return exactBills(total);
  const asc = T.bills.slice().sort((a, b) => a - b);
  const pay = []; let sum = 0;
  while (sum < total) {
    const needAmt = total - sum;
    const fit = asc.filter(b => b >= needAmt);
    const b = fit.length ? (rnd() < 0.7 ? fit[0] : rpick(fit)) : asc[asc.length - 1];
    pay.push(b); sum += b;
  }
  const r = total % 10000;
  if (r && sum - total > r && rnd() < 0.3) pay.push(...exactBills(r)); // đưa thêm tiền lẻ cho chẵn
  return pay.sort((a, b) => b - a);
}
function startPayment(c) {
  c.state = 'pay';
  const pay = makePayment(c, c.total);
  const paid = pay.reduce((a, b) => a + b, 0);
  const change = paid - c.total;
  payCtx = { cust: c, total: c.total, pay, paid, change, given: [], hinted: false };
  if (change === 0) { finishSale(c, 'exact'); return; }
  if (change <= 2000 && (c.type === 'shipper' || c.type === 'ongcu') && rnd() < 0.45) {
    say(c, rpick(LINES.keepCh), 2.2);
    finishSale(c, 'keep'); return;
  }
  setHoa('cash', 99);
  UI.openChange(payCtx);
}
function giveBill(v) { if (!payCtx) return; payCtx.given.push(v); SFX.bill(); UI.updateChange(); }
function takeBackBill(i) { if (!payCtx) return; payCtx.given.splice(i, 1); SFX.drop(); UI.updateChange(); }
function calcHint() {
  if (payCtx) {
    calc.text = (payCtx.change / 1000) + '.000';
    calc.flashUntil = t + 3;
    if (!payCtx.hinted) { payCtx.hinted = true; payCtx.cust.patience -= 0.08; }
    UI.updateChange(true);
  } else {
    calc.flashUntil = t + 1;
  }
  SFX.write();
}
function confirmChange() {
  const p = payCtx; if (!p) return;
  const g = p.given.reduce((a, b) => a + b, 0);
  const c = p.cust;
  if (g < p.change) {
    say(c, rpick(LINES.shortCh)); c.patience -= 0.1; addRep(-0.03); SFX.bad();
    UI.shakeChange(); return;
  }
  if (g > p.change) {
    const excess = g - p.change;
    const honest = c.reg ? c.reg.honesty : 0.45;
    if (rnd() < honest) { say(c, rpick(LINES.extraCh), 2.2); addRep(0.02); finishSale(c, 'ok'); }
    else { G.money -= excess; G.stats.lostChange += excess; addFloat('Thối dư ' + money(excess) + ' 😅', 520, 410, '#c0392b'); finishSale(c, 'ok'); }
    return;
  }
  finishSale(c, 'perfect');
}
function finishSale(c, how) {
  const p = payCtx && payCtx.cust === c ? payCtx : null;
  if (how === 'credit') {
    const d = G.debts[c.reg.name] || { amt: 0, day: G.day };
    d.amt += c.total; G.debts[c.reg.name] = d;
    G.stats.credit += c.total;
    addFloat('📒 Ghi sổ ' + money(c.total), 470, 420, '#2a5a9c');
    setHoa('write', 1.4); SFX.write();
  } else {
    let paid;
    if (p) paid = how === 'keep' ? p.paid : p.paid - p.change;
    else paid = c.total;
    G.money += paid;
    addFloat('+' + money(paid), 520, 430, '#2e7d4a');
    SFX.ching();
    setHoa('wave', 1);
  }
  G.stats.sales += c.total; G.stats.served++;
  const gain = 0.015 + 0.04 * clamp(c.patience, 0, 1) + (how === 'perfect' ? 0.015 : 0);
  addRep(gain);
  if (!c.say || c.sayUntil < t) say(c, rpick(LINES.thanks), 2.2);
  payCtx = null; UI.closeChange();
  calc.text = '0';
  leave(c, 'happy');
}
function creditAccept() { const c = front(); if (c && c.state === 'credit') { addRep(0.04); finishSale(c, 'credit'); } }
function creditRefuse() {
  const c = front(); if (!c || c.state !== 'credit') return;
  if (rnd() < 0.65) { say(c, rpick(LINES.refuseOk), 2); startPayment(c); UI.refreshBar(); }
  else {
    say(c, rpick(LINES.refuseNo), 2.4); addRep(-0.08);
    for (const id in c.items) G.stock[id] += c.items[id];
    G.stats.cost -= Object.keys(c.items).reduce((a, id) => a + ITEMS[id].cost * c.items[id], 0);
    leave(c, 'sad');
  }
}
function reportOOS() {
  const c = front(); if (!c || c.state !== 'order') return;
  let any = false;
  c.req.forEach(r => {
    if (r.oos) return;
    const avail = (G.stock[r.id] || 0) + (bag[r.id] || 0);
    if (avail < r.qty) { any = true; if (avail === 0) r.oos = true; else r.qty = avail; }
  });
  if (!any) { say(c, rpick(LINES.oosWrong)); c.patience -= 0.05; SFX.bad(); return; }
  G.stats.oos++; addRep(-0.03);
  if (c.req.every(r => r.oos)) { say(c, rpick(LINES.oosNone), 2.4); returnBag(); leave(c, 'sad'); }
  else { say(c, rpick(LINES.oosOk)); c.patience -= 0.04; }
  UI.refreshBar();
}
function remindDebt() {
  const c = front(); if (!c || !c.reg || c.remindDone) return;
  const d = G.debts[c.reg.name]; if (!d) return;
  c.remindDone = true;
  if (rnd() < c.reg.honesty * 0.8) {
    G.money += d.amt; G.stats.collected += d.amt; delete G.debts[c.reg.name];
    say(c, rpick(LINES.remindOk)); addFloat('+' + money(d.amt) + ' (trả nợ)', 520, 420, '#2e7d4a'); SFX.ching();
  } else { say(c, rpick(LINES.remindNo)); addRep(-0.03); c.patience -= 0.05; SFX.bad(); }
  UI.refreshBar();
}

// ============================================================
//  NGÀY
// ============================================================
function startDay(resume) {
  if (!(resume && G.minute > OPEN_MIN && G.minute < CLOSE_MIN && G.stats)) {
    G.minute = OPEN_MIN;
    G.stats = freshStats(); G.stats.startMoney = G.money;
  }
  customers = []; leavers = []; bag = {}; payCtx = null;
  spawnTimer = 3;
  phase = 'open'; paused = false;
  rebuildLayers();
  UI.refreshBar(); UI.updateHUD();
  UI.toast(`Ngày ${G.day} — ${G.weather === 'mua' ? '🌧️ Trời mưa, khách thưa, mì gói bán chạy' : '☀️ Trời nắng, nước uống bán chạy'}`);
}
// ============================================================
//  OFFLINE VẪN CÓ TIỀN — vắng mặt thì Cô Hoa bán giùm
// ============================================================
const OFFLINE_MIN_MS = 60 * 1000;     // vắng ít nhất 1 phút mới tính
const OFFLINE_MAX_H = 8;              // tính tối đa 8 tiếng
const OFFLINE_SALES_PER_H = 8;      // số món bán được mỗi giờ (ở uy tín 2.5)
let ITEM_POP = null;
function itemPopularity() {
  if (ITEM_POP) return ITEM_POP;
  ITEM_POP = {};
  for (const k in CUSTOMER_TYPES) { const w = CUSTOMER_TYPES[k].wants; for (const id in w) ITEM_POP[id] = (ITEM_POP[id] || 0) + w[id]; }
  return ITEM_POP;
}
function offlineEarn(ms) {
  if (!G || ms < OFFLINE_MIN_MS) return null;
  const hours = Math.min(ms / 3600000, OFFLINE_MAX_H);
  const rate = OFFLINE_SALES_PER_H * (0.5 + G.rep / 5) * (G.upgrades.bienhieu ? 1.1 : 1);
  let n = Math.floor(hours * rate + rnd());
  const pop = itemPopularity();
  const sold = {}; let earned = 0, count = 0, ranOut = false;
  for (let i = 0; i < n; i++) {
    const pool = Object.keys(ITEMS).filter(id => !isLocked(id) && G.stock[id] > 0);
    if (!pool.length) { ranOut = true; break; }
    const sum = pool.reduce((a, id) => a + (pop[id] || 1), 0);
    let r = rnd() * sum, pickId = pool[0];
    for (const id of pool) { r -= pop[id] || 1; if (r <= 0) { pickId = id; break; } }
    G.stock[pickId]--; sold[pickId] = (sold[pickId] || 0) + 1;
    earned += ITEMS[pickId].price; count++;
  }
  // khách nợ ghé trả
  const repaid = [];
  for (const name in G.debts) {
    const reg = REGULARS.find(r => r.name === name);
    if (reg && rnd() < reg.honesty * 0.35 * Math.min(1, hours / 3)) { repaid.push([name, G.debts[name].amt]); earned += G.debts[name].amt; delete G.debts[name]; }
  }
  G.money += earned;
  saveGame();
  return { ms, hours, count, earned, sold, ranOut, repaid, capped: ms / 3600000 > OFFLINE_MAX_H };
}
let hiddenAt = 0;
document.addEventListener('visibilitychange', () => {
  if (!G) return;
  if (document.hidden) {
    hiddenAt = Date.now(); saveGame();
    if (typeof MUSIC !== 'undefined') MUSIC.stop();
  } else {
    const away = hiddenAt ? Date.now() - hiddenAt : 0; hiddenAt = 0;
    if (phase !== 'menu') SFX.unlock();
    const res = offlineEarn(away);
    if (res) UI.showOffline(res, null);
  }
});
window.addEventListener('pagehide', saveGame);

function electricity() { return 15000 + (G.upgrades.quat ? 5000 : 0) + (G.upgrades.tulanh ? 10000 : 0); }
function endDay() {
  phase = 'summary'; paused = true;
  const elec = electricity();
  G.money -= elec;
  const summary = Object.assign({}, G.stats, { elec, endMoney: G.money, day: G.day });
  G.best = Math.max(G.best || 0, G.money);
  G.day++;
  G.weather = rnd() < 0.3 ? 'mua' : 'nang';
  saveGame();
  UI.showSummary(summary);
}
function buyUpgrade(id) {
  const u = UPGRADES.find(u => u.id === id);
  if (!u || G.upgrades[id] || G.money < u.price) return false;
  G.money -= u.price; G.upgrades[id] = true;
  for (const iid in ITEMS) if (ITEMS[iid].lock === id && G.stock[iid] === 0) G.stock[iid] = Math.ceil(ITEMS[iid].start / 2);
  if (id === 'bienhieu') addRep(0.5);
  rebuildLayers(); saveGame(); SFX.buy();
  return true;
}
function restock(id, qty) {
  qty = Math.min(qty, MAX_STOCK - G.stock[id]);
  const afford = Math.floor(G.money / ITEMS[id].cost);
  qty = Math.min(qty, afford);
  if (qty <= 0) return 0;
  G.money -= qty * ITEMS[id].cost; G.stock[id] += qty;
  SFX.pick();
  return qty;
}

// ============================================================
//  CẬP NHẬT
// ============================================================
function spawnInterval() {
  const hour = G.minute / 60;
  let hm = 1;
  if (hour < 8) hm = 1.5; else if (hour < 10) hm = 0.9; else if (hour < 11) hm = 0.85; else if (hour < 13) hm = 1.35;
  else if (hour < 15) hm = 0.65; else if (hour < 16) hm = 0.9; else if (hour < 19) hm = 1.55; else hm = 0.95;
  const repMul = 0.55 + G.rep * 0.17;
  const wMul = G.weather === 'mua' ? 0.75 : 1;
  const sMul = G.upgrades.bienhieu ? 1.1 : 1;
  return 42 / (hm * repMul * wMul * sMul) * (0.6 + rnd() * 0.8);
}

function update(dt) {
  t += dt;
  if (phase !== 'open' && phase !== 'closing') return;
  if (paused) return;
  const sdt = dt * speed;
  const gmin = sdt / SEC_PER_MIN;
  G.minute = Math.min(G.minute + gmin, 22 * 60);

  if (phase === 'open') {
    spawnTimer -= gmin;
    if (spawnTimer <= 0) { spawnCustomer(); spawnTimer = spawnInterval(); }
    if (G.minute >= CLOSE_MIN) { phase = 'closing'; UI.toast('🌙 9 giờ tối rồi — bán nốt khách cuối rồi đóng cửa'); }
  }

  const hour = G.minute / 60;
  const hot = G.weather === 'nang' && hour >= 11 && hour < 14.5 ? 1.2 : 1;
  const fan = G.upgrades.quat ? 0.75 : 1;
  customers.forEach((c, i) => {
    const T = CUSTOMER_TYPES[c.type];
    const tx = QUEUE_X[i];
    if (Math.abs(c.x - tx) > 2) { const far = 1 + clamp((tx - c.x - 150) / 250, 0, 2.5); c.walking = true; c.x += Math.sign(tx - c.x) * Math.min(Math.abs(tx - c.x), T.speed * far * sdt); c.phase += sdt * 9 * Math.min(far, 1.6); }
    else { c.walking = false; c.x = tx; if (i === 0 && c.state === 'queue') arrive(c); }
    let mult = (i === 0 ? 1 : (G.upgrades.banghe ? 0.3 : 0.5)) * hot * fan;
    if (c.state === 'pay' || c.state === 'credit') mult *= 0.5;
    c.patience -= sdt / T.patience * mult;
    if (c.patience <= 0) {
      if (c.state === 'pay' || c.state === 'credit') {
        c.patience = 0;
        if (!c.hurried) { c.hurried = true; say(c, rpick(LINES.hurry), 2.5); addRep(-0.05); }
      } else {
        say(c, rpick(LINES.angry), 2.6);
        if (c.state === 'order') returnBag();
        G.stats.angry++; addRep(-0.2); SFX.bad();
        leave(c, 'angry');
      }
    }
    c.mood = c.patience < 0.25 ? 'angry' : c.patience > 0.7 ? 'neutral' : 'neutral';
  });
  for (let i = leavers.length - 1; i >= 0; i--) {
    const c = leavers[i];
    if (c.leaveDelay > 0) { c.leaveDelay -= sdt; c.walking = false; continue; }
    c.walking = true; c.x -= CUSTOMER_TYPES[c.type].speed * (c.x < -150 ? 2.5 : 1.1) * sdt; c.phase += sdt * 9;
    if (c.x < -OX - 110) leavers.splice(i, 1);
  }
  if (phase === 'closing' && customers.length === 0 && leavers.length === 0) endDay();
}

function updateFx(dt) {
  floats.forEach(f => f.life += dt);
  floats = floats.filter(f => f.life < 1.6);
  flyers.forEach(f => f.p += dt * 4);
  flyers = flyers.filter(f => f.p < 1);
}

// ============================================================
//  VẼ
// ============================================================
function render() {
  ctx.setTransform(PR, 0, 0, PR, OX * PR, 0);
  ctx.clearRect(-OX, 0, SW, VH);
  drawSky(ctx, G.minute, G.weather, t, OX);
  ctx.drawImage(backCv, -OX, 0, SW, VH);
  if (G.weather === 'mua') drawRain(ctx, t, OX);
  drawClockHands(ctx, G.minute);

  for (const id in SLOTS) { const s = SLOTS[id]; if (s.counter) continue; drawSlot(ctx, id, s, G.stock[id], isLocked(id), hover === id, t); }
  drawGlassOverlay(ctx);

  // Cô Hoa
  let pose = 'stand';
  const f = customers[0];
  if (hoa.until > t) pose = hoa.pose;
  else if (!f || f.state === 'queue') pose = 'fan';
  const hmood = hoa.until > t && (hoa.pose === 'wave') ? 'happy' : (!f ? 'happy' : 'neutral');
  drawChibi(ctx, HOA_X, HOA_FEET, LOOK_HOA, { t, pose, mood: hmood, talk: hoa.until > t && hoa.pose === 'wave' });

  ctx.drawImage(frontCv, -OX, 0, SW, VH);
  for (const id in SLOTS) { const s = SLOTS[id]; if (s.counter) drawSlot(ctx, id, s, G.stock[id], isLocked(id), hover === id, t); }
  drawSoNo(ctx, hover === '_sono');
  const calcText = calc.flashUntil > t ? calc.text : (payCtx ? (payCtx.total / 1000) + '.000' : (bagTotal() ? (bagTotal() / 1000) + '.000' : '0'));
  drawCalculator(ctx, calcText, calc.flashUntil > t);
  if (hover === '_calc') { ctx.save(); ctx.shadowColor = '#fff6a0'; ctx.shadowBlur = 10; rrPath(ctx, RECT_CALC.x - 3, RECT_CALC.y - 3, RECT_CALC.w + 6, RECT_CALC.h + 6, 5); fs(ctx, null, 3, '#ffcf33'); ctx.restore(); }
  drawBag(ctx, bag, t);
  if (G.upgrades.quat) drawFan(ctx, t);

  // khách
  const all = leavers.concat(customers.slice().reverse());
  all.forEach(c => {
    const leavingWave = c.state === 'leave' && c.leaveDelay > 0 && c.mood === 'happy';
    const pose = leavingWave ? 'wave' : c.state === 'pay' ? 'cash' : c.mood === 'angry' && !c.walking ? 'angry' : 'stand';
    const mood = c.state === 'leave' ? (c.mood === 'happy' ? 'happy' : c.mood === 'angry' ? 'angry' : 'neutral') : c.mood;
    const talk = c.sayUntil > t;
    const flip = c.state === 'leave' && c.walking;
    if (c.look.kid) drawChibi(ctx, c.x + (flip ? 34 : -34), CUST_FEET + 4, c.look.kid, { t, walking: c.walking, phase: c.phase + 1, mood: mood === 'angry' ? 'angry' : 'happy', pose: 'stand' });
    ctx.save();
    if (flip) { ctx.translate(c.x * 2, 0); ctx.scale(-1, 1); }
    drawChibi(ctx, c.x, CUST_FEET, c.look, { t, walking: c.walking, phase: c.phase, mood, pose, talk });
    ctx.restore();
  });

  // ánh sáng đêm
  const na = nightAmount(G.minute);
  if (na > 0) {
    ctx.fillStyle = `rgba(18,22,60,${na})`; ctx.fillRect(-OX, 0, SW, VH);
    drawBulbGlow(ctx, na);
  }

  // bong bóng thoại
  customers.forEach((c, i) => {
    const sc = (c.look.scale || 1);
    const headTop = CUST_FEET - 150 * sc;
    if (i === 0 && c.state !== 'queue') drawFrontBubble(c, headTop);
    else {
      drawMiniPatience(ctx, c.x, headTop - 12, clamp(c.patience, 0, 1));
      if (c.sayUntil > t) bubbleAt(c.x, headTop - 16, c.name, [{ text: c.say }], null);
    }
  });
  leavers.forEach(c => { if (c.sayUntil > t) bubbleAt(c.x, CUST_FEET - 150 * (c.look.scale || 1), c.name, [{ text: c.say, color: c.mood === 'angry' ? '#c0392b' : undefined }], null); });

  // hàng bay vào túi
  flyers.forEach(f => {
    const p = f.p, x = f.x0 + (f.x1 - f.x0) * p, y = f.y0 + (f.y1 - f.y0) * p - Math.sin(p * Math.PI) * 80;
    ctx.drawImage(ICONS[f.id], x - 16, y - 21, 32, 42);
  });
  floats.forEach(f => {
    ctx.save(); ctx.globalAlpha = 1 - Math.max(0, f.life - 1) / 0.6;
    txt(ctx, f.text, f.x, f.y - f.life * 30, 20, f.col, { stroke: '#fff', sw: 4 });
    ctx.restore();
  });

  // tooltip
  if (hover && ITEMS[hover]) {
    const it = ITEMS[hover];
    const lines = [it.name, isLocked(hover) ? '🔒 Cần nâng cấp: ' + UPGRADES.find(u => u.id === it.lock).name : `Giá ${money(it.price)} • Còn ${G.stock[hover]}`];
    drawTooltip(ctx, mouse.x, mouse.y, lines);
  } else if (hover === '_sono') drawTooltip(ctx, mouse.x, mouse.y, ['Sổ nợ', 'Xem ai đang nợ tiệm']);
  else if (hover === '_calc') drawTooltip(ctx, mouse.x, mouse.y, ['Máy tính', payCtx ? 'Bấm để tính tiền thối (khách chờ lâu hơn)' : 'Hiện tổng tiền']);

  if (phase === 'open' || phase === 'closing') { if (paused && !UI.modalOpen()) { ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(-OX, 0, SW, VH); txt(ctx, 'TẠM DỪNG', SW / 2 - OX, VH / 2, 56, '#fff', { stroke: OUTLINE, sw: 6 }); } }
}

// bong bóng to hơn trên điện thoại
function bubbleAt(ax, ay, header, lines, patience, o = {}) {
  ctx.save();
  ctx.translate(ax, ay); ctx.scale(UIK, UIK); ctx.translate(-ax, -ay);
  o.minX = ax - (ax + OX - 6) / UIK;
  drawBubble(ctx, ax, ay, header, lines, patience, o);
  ctx.restore();
}
function reqText(r) {
  const it = ITEMS[r.id], nm = lower1(it.name);
  return nm.startsWith(it.unit + ' ') ? `${r.qty} ${nm}` : `${r.qty} ${it.unit} ${nm}`;
}
function drawFrontBubble(c, headTop) {
  const ax = c.x + 8, ay = headTop - 4;
  const talking = c.sayUntil > t;
  let header = talking ? c.say : `${c.name}: ${c.greet}...`;
  let lines = [];
  if (c.state === 'order') {
    lines = c.req.map(r => ({ icon: r.id, text: reqText(r), done: (bag[r.id] || 0) >= r.qty && !r.oos, oos: r.oos }));
  } else if (c.state === 'credit') {
    header = talking ? c.say : c.name + ':';
    lines = [{ text: c.creditLine }, { text: 'Tổng: ' + money(c.total), color: '#8a3a1a' }];
  } else if (c.state === 'pay' && payCtx) {
    header = talking ? c.say : c.name + ': Tiền nè cô!';
    lines = [{ text: 'Tổng: ' + money(payCtx.total) }, { text: 'Khách đưa: ' + money(payCtx.paid), color: '#2e7d4a' }];
  }
  bubbleAt(ax, ay, header, lines, clamp(c.patience, 0, 1), { headerColor: talking ? '#c0392b' : '#8a3a1a' });
}

// ============================================================
//  INPUT
// ============================================================
function toLocal(e) {
  const r = canvas.getBoundingClientRect();
  return { x: (e.clientX - r.left) * SW / r.width - OX, y: (e.clientY - r.top) * VH / r.height };
}
function hitTest(x, y) {
  const inR = r => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  for (const id in SLOTS) if (inR(SLOTS[id])) return id;
  if (inR(RECT_SONO)) return '_sono';
  if (inR(RECT_CALC)) return '_calc';
  return null;
}
canvas.addEventListener('pointermove', e => {
  const p = toLocal(e); mouse = p;
  hover = phase === 'menu' ? null : hitTest(p.x, p.y);
  canvas.style.cursor = hover ? 'pointer' : 'default';
});
canvas.addEventListener('pointerleave', () => { hover = null; });
canvas.addEventListener('pointerdown', e => {
  SFX.unlock();
  const p = toLocal(e); mouse = p;
  if (phase !== 'open' && phase !== 'closing') return;
  if (paused) return;
  const h = hitTest(p.x, p.y);
  if (!h) return;
  if (h === '_sono') UI.openDebtBook();
  else if (h === '_calc') calcHint();
  else clickSlot(h);
});
window.addEventListener('keydown', e => {
  if (e.key === ' ' && (phase === 'open' || phase === 'closing') && !UI.modalOpen()) { e.preventDefault(); togglePause(); }
  if (e.key === 'Enter' && !UI.modalOpen() && front() && front().state === 'order') handOver();
});
function togglePause() { paused = !paused; UI.updateHUD(); }

// ============================================================
//  VÒNG LẶP
// ============================================================
let saveTimer = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000 || 0); last = now;
  update(dt); updateFx(dt);
  saveTimer += dt;
  if (saveTimer > 5) { saveTimer = 0; if (phase !== 'menu') saveGame(); }
  if (typeof MUSIC !== 'undefined') MUSIC.setMood(nightAmount(G.minute) > 0.2, G.weather === 'mua');
  render();
  UI.tick();
  requestAnimationFrame(frame);
}

async function boot() {
  try { await Promise.race([document.fonts.load('bold 20px "Patrick Hand"'), new Promise(r => setTimeout(r, 2500))]); } catch (e) { }
  buildIcons();
  const saved = loadGame();
  G = saved || newState();
  let rt = 0; const later = (ms = 80) => { clearTimeout(rt); rt = setTimeout(resize, ms); };
  window.addEventListener('resize', () => later());
  window.addEventListener('orientationchange', () => later(250));
  document.addEventListener('fullscreenchange', () => { later(120); UI.updateHUD(); });
  document.addEventListener('webkitfullscreenchange', () => later(120));
  if (window.visualViewport) window.visualViewport.addEventListener('resize', () => later(120));
  resize();
  UI.init();
  const away = saved && saved.lastSeen ? Date.now() - saved.lastSeen : 0;
  const res = saved ? offlineEarn(away) : null;
  if (res) UI.showOffline(res, () => UI.showMenu(true));
  else UI.showMenu(!!saved);
  requestAnimationFrame(t0 => { last = t0; requestAnimationFrame(frame); });
}
boot();
