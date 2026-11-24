'use strict';
// ============================================================
//  UI — HUD, thanh hành động, các bảng (DOM)
// ============================================================
const UI = (() => {
  const $ = s => document.querySelector(s);
  let modalPaused = false, modalWasPaused = false, modalKind = null;
  let lastHud = '';

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const icon = (id, cls = 'ic') => `<img class="${cls}" src="${ICON_URLS[id]}" alt="">`;
  const billHtml = (v, attrs = '') => `<button class="bill" style="--c:${BILL_COLORS[v]}" ${attrs}><span>${(v / 1000).toLocaleString('vi-VN')}k</span></button>`;

  function init() {
    $('#hud').innerHTML = `
      <div class="hgroup">
        <div class="chip" id="h-day"></div>
        <div class="chip" id="h-time"></div>
      </div>
      <div class="hgroup">
        <div class="chip money" id="h-money" title="Tiền mặt"></div>
        <div class="chip" id="h-rep" title="Uy tín — càng cao càng đông khách"></div>
        <div class="chip debt" id="h-debt" title="Tổng tiền khách đang nợ"></div>
      </div>
      <div class="hgroup">
        <button class="hbtn" id="b-stock">📦 Nhập hàng</button>
        <button class="hbtn" id="b-up">🛠️ Nâng cấp</button>
        <button class="hbtn" id="b-debt">📒 Sổ nợ</button>
        <button class="hbtn sm" id="b-speed" title="Tốc độ">×1</button>
        <button class="hbtn sm" id="b-pause" title="Tạm dừng (Space)">⏸</button>
        <button class="hbtn sm" id="b-music" title="Nhạc nền">🎵</button>
        <button class="hbtn sm" id="b-sound" title="Âm thanh">🔊</button>
      </div>`;
    $('#b-stock').onclick = () => openRestock();
    $('#b-up').onclick = () => openUpgrades();
    $('#b-debt').onclick = () => openDebtBook();
    $('#b-speed').onclick = () => { speed = speed === 1 ? 2 : 1; updateHUD(); };
    $('#b-pause').onclick = () => { if (phase === 'open' || phase === 'closing') togglePause(); };
    $('#b-sound').onclick = () => { const m = SFX.toggle(); $('#b-sound').textContent = m ? '🔇' : '🔊'; };
    const musicBtn = () => { $('#b-music').classList.toggle('off', !MUSIC.enabled); $('#b-music').title = MUSIC.enabled ? 'Tắt nhạc nền' : 'Bật nhạc nền'; };
    $('#b-music').onclick = () => { SFX.ctx(); MUSIC.toggle(); musicBtn(); };
    musicBtn();
    document.addEventListener('pointerdown', () => SFX.unlock(), { capture: true });
    $('#bar').addEventListener('click', onBarClick);
    $('#change').addEventListener('click', onChangeClick);
    refreshBar();
  }

  function stars(r) {
    let s = '';
    for (let i = 1; i <= 5; i++) s += r >= i - 0.25 ? '★' : r >= i - 0.75 ? '⯪' : '☆';
    return s;
  }
  function totalDebt() { return Object.values(G.debts).reduce((a, d) => a + d.amt, 0); }

  function updateHUD() {
    if (!G) return;
    const m = Math.floor(G.minute), hh = String(Math.floor(m / 60)).padStart(2, '0'), mm = String(m % 60).padStart(2, '0');
    const key = [G.day, G.weather, hh, mm, G.money, G.rep.toFixed(2), totalDebt(), speed, paused, phase].join('|');
    if (key === lastHud) return; lastHud = key;
    $('#h-day').textContent = `📅 Ngày ${G.day} ${G.weather === 'mua' ? '🌧️' : '☀️'}`;
    $('#h-time').textContent = `🕐 ${hh}:${mm}`;
    $('#h-time').classList.toggle('late', m >= CLOSE_MIN - 30);
    $('#h-money').textContent = '💰 ' + money(G.money);
    $('#h-money').classList.toggle('neg', G.money < 0);
    $('#h-rep').innerHTML = `<span class="stars">${stars(G.rep)}</span> ${G.rep.toFixed(1)}`;
    const d = totalDebt();
    $('#h-debt').textContent = '📒 Nợ: ' + money(d);
    $('#h-debt').style.display = d ? '' : 'none';
    $('#b-speed').textContent = '×' + speed;
    $('#b-pause').textContent = paused && (phase === 'open' || phase === 'closing') ? '▶' : '⏸';
  }
  function tick() { updateHUD(); }

  // ---------------- thanh hành động ----------------
  function refreshBar() {
    const bar = $('#bar');
    if (!G || phase === 'menu') { bar.innerHTML = ''; return; }
    const c = front();
    if (!c) {
      const waiting = customers.length;
      bar.innerHTML = `<div class="bar-msg">${phase === 'closing' ? '🌙 Hết giờ bán — chờ khách cuối rồi dọn tiệm' : waiting ? '🚶 Khách đang đi tới...' : '☕ Chưa có khách — Cô Hoa ngồi quạt. Tranh thủ <b>📦 Nhập hàng</b> nếu kệ trống!'}</div>`;
      return;
    }
    if (c.state === 'order') {
      const ids = Object.keys(bag);
      const chips = ids.length ? ids.map(id => `<button class="chipitem" data-rm="${id}" title="Bấm để bỏ ra">${icon(id)}<b>×${bag[id]}</b></button>`).join('') : '<span class="hint">👉 Bấm vào hàng trên kệ để bỏ vào bịch</span>';
      const d = c.reg && G.debts[c.reg.name];
      bar.innerHTML = `
        <div class="bag"><div class="bag-label">🛍️ Bịch hàng</div><div class="bag-items">${chips}</div></div>
        <div class="total"><small>Tổng</small><b>${money(bagTotal())}</b></div>
        <div class="acts">
          ${d && !c.remindDone ? `<button class="btn ghost" data-a="remind">📒 Nhắc nợ ${money(d.amt)}</button>` : ''}
          <button class="btn ghost" data-a="oos" title="Báo khách món họ cần đã hết">🚫 Báo hết hàng</button>
          ${ids.length ? '<button class="btn ghost" data-a="clear">↩ Bỏ ra hết</button>' : ''}
          <button class="btn go" data-a="give">✔ Giao hàng <small>(Enter)</small></button>
        </div>`;
    } else if (c.state === 'credit') {
      const d = G.debts[c.reg.name];
      bar.innerHTML = `
        <div class="bar-msg">📒 <b>${esc(c.name)}</b> xin ghi sổ <b>${money(c.total)}</b>${d ? ` <span class="muted">(đang nợ ${money(d.amt)})</span>` : ''}. Khách quen hay bị từ chối sẽ buồn đó!</div>
        <div class="acts">
          <button class="btn go" data-a="credit-yes">📒 Ghi sổ</button>
          <button class="btn ghost" data-a="credit-no">💵 Trả tiền mặt nha!</button>
        </div>`;
    } else if (c.state === 'pay') {
      bar.innerHTML = `<div class="bar-msg">💵 Đang thối tiền cho <b>${esc(c.name)}</b>... Đếm cho kỹ nha!</div>`;
    } else bar.innerHTML = '';
  }
  function onBarClick(e) {
    SFX.unlock();
    const rm = e.target.closest('[data-rm]');
    if (rm) { removeFromBag(rm.dataset.rm); return; }
    const a = e.target.closest('[data-a]'); if (!a) return;
    if (paused) return;
    ({ give: handOver, oos: reportOOS, clear: clearBag, remind: remindDebt, 'credit-yes': creditAccept, 'credit-no': creditRefuse })[a.dataset.a]();
  }

  // ---------------- thối tiền ----------------
  function openChange(p) {
    const el = $('#change');
    el.classList.remove('hidden');
    el.innerHTML = `
      <div class="ch-head">💵 Thối tiền</div>
      <div class="ch-row"><span>Tổng tiền hàng</span><b>${money(p.total)}</b></div>
      <div class="ch-row"><span>Khách đưa</span><b class="green">${money(p.paid)}</b></div>
      <div class="ch-bills">${p.pay.map(v => billHtml(v, 'disabled')).join('')}</div>
      <div class="ch-row need"><span>Cần thối</span><b id="ch-need">?</b></div>
      <div class="ch-sub">Bấm tiền trong ngăn kéo để thối (bấm tiền đã đưa để lấy lại):</div>
      <div class="ch-tray" id="ch-tray"></div>
      <div class="ch-row"><span>Đang thối</span><b id="ch-given">0đ</b></div>
      <div class="ch-drawer">${BILLS.filter(v => v <= 200000).map(v => billHtml(v, `data-give="${v}"`)).join('')}</div>
      <div class="ch-acts">
        <button class="btn ghost" data-ch="calc">🧮 Bấm máy tính</button>
        <button class="btn ghost" data-ch="reset">↩ Đếm lại</button>
        <button class="btn go" data-ch="ok">✔ Thối tiền</button>
      </div>`;
    updateChange(p.hinted);
    refreshBar();
  }
  function updateChange(hinted) {
    if (!payCtx) return;
    const g = payCtx.given.reduce((a, b) => a + b, 0);
    $('#ch-tray').innerHTML = payCtx.given.length ? payCtx.given.map((v, i) => billHtml(v, `data-take="${i}"`)).join('') : '<span class="hint">(chưa đưa đồng nào)</span>';
    $('#ch-given').textContent = money(g);
    if (hinted || payCtx.hinted) $('#ch-need').textContent = money(payCtx.change);
  }
  function closeChange() { $('#change').classList.add('hidden'); $('#change').innerHTML = ''; }
  function shakeChange() { const el = $('#change'); el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
  function onChangeClick(e) {
    if (paused) return;
    const g = e.target.closest('[data-give]'); if (g) { giveBill(+g.dataset.give); return; }
    const tk = e.target.closest('[data-take]'); if (tk) { takeBackBill(+tk.dataset.take); return; }
    const a = e.target.closest('[data-ch]'); if (!a) return;
    if (a.dataset.ch === 'ok') confirmChange();
    else if (a.dataset.ch === 'calc') calcHint();
    else if (a.dataset.ch === 'reset') { payCtx.given = []; updateChange(); }
  }

  // ---------------- modal chung ----------------
  function openModal(html, kind, opts = {}) {
    const bg = $('#modal-bg'), m = $('#modal');
    if (!modalKind) { modalWasPaused = paused; }
    modalKind = kind;
    paused = true;
    m.className = opts.wide ? 'wide' : '';
    m.innerHTML = html + (opts.noClose ? '' : '<button class="mclose" data-close>✕</button>');
    bg.classList.remove('hidden');
    const cl = m.querySelector('[data-close]'); if (cl) cl.onclick = closeModal;
    updateHUD();
  }
  function closeModal() {
    $('#modal-bg').classList.add('hidden');
    const kind = modalKind; modalKind = null;
    if (phase === 'open' || phase === 'closing') paused = modalWasPaused;
    updateHUD(); refreshBar();
    return kind;
  }
  function modalOpen() { return !!modalKind; }

  // ---------------- nhập hàng ----------------
  const GROUPS = [
    ['Đồ ăn vặt', ['snacktom', 'bimbim', 'mitom', 'phogoi', 'banhgau', 'hatdua']],
    ['Gia vị & đồ khô', ['nuocmam', 'nuoctuong', 'tuongot', 'dauan', 'botngot', 'hatnem', 'duong', 'caphe', 'suadac', 'suahop', 'botgiat']],
    ['Đồ uống (tủ mát)', ['nuocsuoi', 'nuocngot', 'suachua', 'tangluc', 'bia', 'nuocda']],
    ['Bánh kẹo (tủ kính)', ['keome', 'banhtrang', 'keomut', 'banhbonglan']],
    ['Gia dụng & linh tinh', ['daugoi', 'nhang', 'batlua', 'nhangmuoi', 'xo', 'choi']],
    ['Thẻ cào', ['thecao10', 'thecao20', 'thecao50']],
  ];
  function openRestock(back) {
    if (phase === 'menu') return;
    let fullCost = 0;
    const rows = GROUPS.map(([gname, ids]) => {
      const cells = ids.map(id => {
        const it = ITEMS[id], locked = isLocked(id), s = G.stock[id];
        if (!locked) fullCost += (MAX_STOCK - s) * it.cost;
        return `<div class="rs-item ${locked ? 'locked' : ''} ${s <= 2 && !locked ? 'low' : ''}">
          ${icon(id, 'rs-ic')}
          <div class="rs-info"><b>${it.name}</b>
            <small>Bán ${money(it.price)} • Vốn ${money(it.cost)}</small>
            <div class="rs-stock"><div style="width:${s / MAX_STOCK * 100}%"></div><span>${locked ? '🔒' : s + '/' + MAX_STOCK}</span></div>
          </div>
          ${locked ? '' : `<div class="rs-btns"><button data-rs="${id}" data-q="1">+1</button><button data-rs="${id}" data-q="5">+5</button><button data-rs="${id}" data-q="99">Đầy</button></div>`}
        </div>`;
      }).join('');
      return `<h3>${gname}</h3><div class="rs-grid">${cells}</div>`;
    }).join('');
    openModal(`<h2>📦 Nhập hàng từ đại lý</h2>
      <div class="m-sub">Tiền mặt: <b class="${G.money < 0 ? 'red' : ''}">${money(G.money)}</b> • Nhập đầy hết: <b>${money(fullCost)}</b>
      <button class="btn go sm" data-rsall>Nhập đầy tất cả</button></div>
      <div class="rs-scroll">${rows}</div>
      ${back ? `<div class="m-acts"><button class="btn go" data-back>← Quay lại tổng kết</button></div>` : ''}`, 'restock', { wide: true });
    const m = $('#modal');
    m.querySelectorAll('[data-rs]').forEach(b => b.onclick = () => {
      const q = restock(b.dataset.rs, +b.dataset.q);
      if (!q) toast(G.stock[b.dataset.rs] >= MAX_STOCK ? 'Kệ đầy rồi!' : 'Không đủ tiền!');
      const st = m.querySelector('.rs-scroll').scrollTop;
      openRestock(back); $('#modal .rs-scroll').scrollTop = st;
    });
    m.querySelector('[data-rsall]').onclick = () => {
      let spent = 0;
      for (const [, ids] of GROUPS) for (const id of ids) if (!isLocked(id)) spent += restock(id, MAX_STOCK) * ITEMS[id].cost;
      if (!spent) toast('Không nhập được gì (đầy kệ hoặc hết tiền)'); else toast('Đã nhập hàng: −' + money(spent));
      const st = m.querySelector('.rs-scroll').scrollTop;
      openRestock(back); $('#modal .rs-scroll').scrollTop = st;
    };
    const bk = m.querySelector('[data-back]'); if (bk) bk.onclick = back;
    if (back) m.querySelector('[data-close]').onclick = back;
  }

  // ---------------- nâng cấp ----------------
  function openUpgrades(back) {
    if (phase === 'menu') return;
    const list = UPGRADES.map(u => {
      const own = G.upgrades[u.id], can = G.money >= u.price;
      const items = Object.keys(ITEMS).filter(id => ITEMS[id].lock === u.id);
      return `<div class="up ${own ? 'own' : ''}">
        <div class="up-info"><b>${u.name}</b><p>${u.desc}</p>
          ${items.length ? `<div class="up-items">${items.map(id => icon(id)).join('')}</div>` : ''}</div>
        <div class="up-buy">${own ? '<span class="owned">✔ Đã có</span>' : `<b>${money(u.price)}</b><button class="btn ${can ? 'go' : 'ghost'}" data-up="${u.id}" ${can ? '' : 'disabled'}>Mua</button>`}</div>
      </div>`;
    }).join('');
    openModal(`<h2>🛠️ Nâng cấp tiệm</h2><div class="m-sub">Tiền mặt: <b>${money(G.money)}</b></div><div class="up-list">${list}</div>
      ${back ? `<div class="m-acts"><button class="btn go" data-back>← Quay lại tổng kết</button></div>` : ''}`, 'upgrades', { wide: true });
    const m = $('#modal');
    m.querySelectorAll('[data-up]').forEach(b => b.onclick = () => {
      if (buyUpgrade(b.dataset.up)) toast('🎉 Đã mua: ' + UPGRADES.find(u => u.id === b.dataset.up).name);
      openUpgrades(back);
    });
    const bk = m.querySelector('[data-back]'); if (bk) bk.onclick = back;
    if (back) m.querySelector('[data-close]').onclick = back;
  }

  // ---------------- sổ nợ ----------------
  function openDebtBook() {
    if (phase === 'menu') return;
    const names = Object.keys(G.debts);
    const rows = names.length ? names.map(n => {
      const d = G.debts[n], r = REGULARS.find(r => r.name === n);
      const age = G.day - d.day;
      return `<tr><td><b>${esc(n)}</b> <small>${r ? CUSTOMER_TYPES[r.type].label : ''}</small></td><td class="r">${money(d.amt)}</td>
        <td><small>${age ? age + ' ngày trước' : 'hôm nay'}</small></td><td><button class="btn ghost sm" data-forgive="${esc(n)}">Xóa nợ</button></td></tr>`;
    }).join('') : '<tr><td colspan="4" class="empty">Chưa ai nợ. Sổ trắng tinh! ✨</td></tr>';
    openModal(`<div class="notebook"><h2>📒 Sổ Nợ</h2>
      <table class="debts">${rows}</table>
      <p class="m-sub">Khách quen hay xin ghi sổ. Người thật thà sẽ tự trả khi ghé lại — hoặc bấm <b>Nhắc nợ</b> khi họ đứng ở quầy.<br>
      <b>Xóa nợ</b> = coi như cho luôn (+ uy tín, mất tiền).</p></div>`, 'debt');
    $('#modal').querySelectorAll('[data-forgive]').forEach(b => b.onclick = () => {
      const n = b.dataset.forgive;
      ask(`Xóa nợ cho <b>${esc(n)}</b>? Coi như cho luôn <b>${money(G.debts[n].amt)}</b>.`, 'Xóa nợ', () => {
        addRep(Math.min(0.3, G.debts[n].amt / 200000));
        delete G.debts[n]; saveGame(); openDebtBook();
      }, openDebtBook);
    });
  }

  // hộp xác nhận (trang đăng online không hiện được confirm() của trình duyệt)
  function ask(html, yesLabel, onYes, onNo) {
    openModal(`<div class="ask"><p>${html}</p>
      <div class="m-acts"><button class="btn ghost" data-no>Thôi</button><button class="btn go" data-yes>${yesLabel}</button></div></div>`, 'ask', { noClose: true });
    $('#modal [data-yes]').onclick = () => { closeModal(); onYes(); };
    $('#modal [data-no]').onclick = () => { closeModal(); if (onNo) onNo(); };
  }

  // ---------------- trong lúc vắng mặt ----------------
  function fmtDur(ms) {
    const m = Math.round(ms / 60000), h = Math.floor(m / 60);
    return h ? `${h} giờ ${m % 60} phút` : `${m} phút`;
  }
  function showOffline(r, after) {
    if (!after) {
      if (modalKind === 'summary' && lastSummary) after = () => showSummary(lastSummary);
      else if (modalKind === 'menu' || modalKind === 'help' || modalKind === 'ask' && phase === 'menu') after = () => showMenu(true);
    }
    const top = Object.entries(r.sold).sort((a, b) => b[1] - a[1]).slice(0, 8);
    openModal(`<div class="offline">
      <h2>🌙 Trong lúc bạn đi vắng...</h2>
      <p class="off-line">Bạn vắng <b>${fmtDur(r.ms)}</b>${r.capped ? ` (tính tối đa ${OFFLINE_MAX_H} tiếng)` : ''}. Cô Hoa vẫn mở tiệm bán giùm:</p>
      ${r.count ? `<div class="off-items">${top.map(([id, n]) => `<div class="off-it">${icon(id)}<b>×${n}</b></div>`).join('')}</div>
        <p class="off-line">Bán được <b>${r.count}</b> món</p>` : '<p class="off-line">Không bán được món nào...</p>'}
      ${r.repaid.map(([n, a]) => `<p class="off-line">📒 <b>${esc(n)}</b> ghé trả nợ <b class="green">${money(a)}</b></p>`).join('')}
      <div class="off-total">+${money(r.earned)}</div>
      ${r.ranOut ? '<p class="off-warn">⚠️ Kệ trống trơn rồi! Nhập đầy hàng trước khi đi để Cô Hoa bán được nhiều hơn.</p>' : '<p class="m-sub">Mẹo: uy tín càng cao, kệ càng đầy thì vắng mặt càng kiếm được nhiều.</p>'}
      <div class="m-acts"><button class="btn go big" data-off>💰 Nhận tiền</button></div></div>`, 'offline', { noClose: true });
    $('#modal [data-off]').onclick = () => { SFX.unlock(); SFX.ching(); closeModal(); if (after) after(); };
  }

  // ---------------- tổng kết ngày ----------------
  let lastSummary = null;
  function showSummary(s) {
    lastSummary = s;
    const profit = s.sales - s.cost - s.elec - s.lostChange;
    const html = `<div class="summary">
      <h2>🌙 Hết ngày ${s.day}</h2>
      <div class="sum-grid">
        <div><span>Khách vui vẻ</span><b>${s.served} 😊</b></div>
        <div><span>Khách bỏ về</span><b class="${s.angry ? 'red' : ''}">${s.angry} 😠</b></div>
        <div><span>Doanh thu</span><b>${money(s.sales)}</b></div>
        <div><span>Giá vốn hàng bán</span><b>−${money(s.cost)}</b></div>
        <div><span>Tiền điện</span><b>−${money(s.elec)}</b></div>
        ${s.lostChange ? `<div><span>Thối dư mất</span><b class="red">−${money(s.lostChange)}</b></div>` : ''}
        <div class="big"><span>Lời hôm nay</span><b class="${profit >= 0 ? 'green' : 'red'}">${money(profit)}</b></div>
        <div><span>Cho ghi sổ</span><b>${money(s.credit)}</b></div>
        <div><span>Thu nợ</span><b class="green">${money(s.collected)}</b></div>
        <div class="big"><span>Tiền mặt cuối ngày</span><b>${money(s.endMoney)}</b></div>
      </div>
      <p class="m-sub">Uy tín: <span class="stars">${stars(G.rep)}</span> ${G.rep.toFixed(1)} • Ngày mai: ${G.weather === 'mua' ? '🌧️ mưa' : '☀️ nắng'} • Đã tự động lưu</p>
      <div class="m-acts">
        <button class="btn ghost" data-s="stock">📦 Nhập hàng</button>
        <button class="btn ghost" data-s="up">🛠️ Nâng cấp</button>
        <button class="btn go" data-s="next">🌅 Mở cửa ngày ${G.day}</button>
      </div></div>`;
    openModal(html, 'summary', { noClose: true });
    const m = $('#modal');
    m.querySelector('[data-s=stock]').onclick = () => openRestock(() => showSummary(lastSummary));
    m.querySelector('[data-s=up]').onclick = () => openUpgrades(() => showSummary(lastSummary));
    m.querySelector('[data-s=next]').onclick = () => { closeModal(); startDay(); };
    refreshBar();
  }

  // ---------------- menu & hướng dẫn ----------------
  function portrait() {
    const cv = document.createElement('canvas'); cv.width = 760; cv.height = 300;
    const c = cv.getContext('2d'); c.scale(2, 2);
    const looks = [makeLook('hocsinh', 'Bé Na', { girl: true }), makeLook('hangxom', 'Bà Năm', { hat: true }), makeLook('shipper', 'Anh Hùng'), makeLook('ongcu', 'Ông Sáu')];
    drawChibi(c, 190, 140, LOOK_HOA, { t: 0.5, pose: 'wave', mood: 'happy', scale: 0.85 });
    looks.forEach((L, i) => drawChibi(c, [45, 110, 270, 335][i], 145, L, { t: i, pose: 'stand', mood: 'happy', scale: 0.72 }));
    return cv.toDataURL();
  }
  function showMenu(hasSave) {
    phase = 'menu';
    openModal(`<div class="menu">
      <div class="logo"><span class="l1">TIỆM TẠP HÓA</span> <span class="l2">MỘNG MƠ</span></div>
      <div class="tag">Bà chủ Cô Hoa • Có bán thẻ cào, nước đá, đồ gia dụng</div>
      <img class="portrait" src="${portrait()}" alt="">
      <div class="m-acts col">
        ${hasSave ? `<button class="btn go big" data-m="cont">▶ Chơi tiếp (Ngày ${G.day})</button>` : ''}
        <button class="btn ${hasSave ? 'ghost' : 'go big'}" data-m="new">🌅 ${hasSave ? 'Chơi lại từ đầu' : 'Mở cửa tiệm'}</button>
        <button class="btn ghost" data-m="help">❓ Cách chơi</button>
      </div></div>`, 'menu', { noClose: true });
    const m = $('#modal');
    const c = m.querySelector('[data-m=cont]');
    if (c) c.onclick = () => { SFX.unlock(); closeModal(); startDay(true); };
    const fresh = () => { G = newState(); rebuildLayers(); saveGame(); showHelp(true); };
    m.querySelector('[data-m=new]').onclick = () => {
      SFX.unlock();
      if (hasSave) ask('Xóa tiệm cũ và chơi lại từ đầu? Tiền, hàng và nâng cấp sẽ mất hết.', 'Chơi lại', fresh, () => showMenu(hasSave));
      else fresh();
    };
    m.querySelector('[data-m=help]').onclick = () => showHelp(false, hasSave);
  }
  function showHelp(thenStart, hasSave) {
    openModal(`<div class="help"><h2>❓ Cách chơi</h2>
      <ol>
        <li><b>Khách tới quầy</b> và nói muốn mua gì trong bong bóng thoại. Thanh màu là <b>độ kiên nhẫn</b>.</li>
        <li><b>Bấm vào hàng trên kệ</b> để bỏ vào bịch. Bấm vào món trong thanh "Bịch hàng" để bỏ ra.</li>
        <li>Đủ hàng thì bấm <b>✔ Giao hàng</b> (hoặc phím Enter).</li>
        <li><b>Thối tiền</b>: khách đưa tiền chẵn, bạn tự tính và bấm tiền trong ngăn kéo. Bí quá thì bấm 🧮 máy tính (khách chờ lâu hơn).</li>
        <li>Món nào hết thì bấm <b>🚫 Báo hết hàng</b>. Nhớ <b>📦 Nhập hàng</b> khi kệ vơi.</li>
        <li>Khách quen hay xin <b>📒 ghi sổ nợ</b>. Cho nợ thì họ vui, nhưng có người... quên trả 😅</li>
        <li>Cuối ngày (21:00) xem lời lỗ, dùng tiền <b>🛠️ nâng cấp</b> tiệm để bán thêm nhiều món.</li>
      </ol>
      <p class="m-sub">Phím tắt: <b>Space</b> tạm dừng • <b>Enter</b> giao hàng • Nút <b>×2</b> tua nhanh</p>
      <div class="m-acts"><button class="btn go" data-h>${thenStart ? '🌅 Mở cửa ngày 1' : '← Quay lại'}</button></div></div>`, 'help', { noClose: true });
    $('#modal [data-h]').onclick = () => {
      closeModal();
      if (thenStart) { G.seenTutorial = true; startDay(); }
      else showMenu(hasSave);
    };
  }

  // ---------------- toast ----------------
  function toast(msg) {
    const el = document.createElement('div'); el.className = 'toast'; el.textContent = msg;
    $('#toasts').appendChild(el);
    setTimeout(() => el.classList.add('out'), 2600);
    setTimeout(() => el.remove(), 3100);
  }

  return { init, updateHUD, tick, refreshBar, openChange, updateChange, closeChange, shakeChange, openRestock, openUpgrades, openDebtBook, showSummary, showMenu, showOffline, ask, toast, modalOpen, closeModal };
})();
