'use strict';
// ============================================================
//  ART — mọi hình ảnh đều được vẽ bằng code (Canvas 2D)
// ============================================================

const OUTLINE = '#3b2a20';

// ---------- tiện ích ----------
function rrPath(c, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}
function fs(c, fill, lw = 2.5, stroke = OUTLINE) {
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (lw) { c.lineWidth = lw; c.strokeStyle = stroke; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); }
}
function rr(c, x, y, w, h, r, fill, lw = 2.5, stroke) { rrPath(c, x, y, w, h, r); fs(c, fill, lw, stroke); }
function ell(c, x, y, rx, ry, fill, lw = 2.5, stroke) { c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2); fs(c, fill, lw, stroke); }
function circ(c, x, y, r, fill, lw = 2.5, stroke) { ell(c, x, y, r, r, fill, lw, stroke); }
function line(c, x1, y1, x2, y2, color = OUTLINE, lw = 2.5) {
  c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.strokeStyle = color; c.lineWidth = lw; c.lineCap = 'round'; c.stroke();
}
function txt(c, s, x, y, size, color, o = {}) {
  c.font = `${o.weight || 'bold'} ${size}px ${o.font || FONT_HAND}`;
  c.textAlign = o.align || 'center';
  c.textBaseline = o.base || 'middle';
  if (o.stroke) { c.lineWidth = o.sw || 3; c.strokeStyle = o.stroke; c.lineJoin = 'round'; c.strokeText(s, x, y); }
  c.fillStyle = color; c.fillText(s, x, y);
}
function fitTxt(c, s, x, y, size, maxW, color, o = {}) {
  c.font = `${o.weight || 'bold'} ${size}px ${o.font || FONT_HAND}`;
  const w = c.measureText(s).width;
  if (w > maxW) size = Math.max(6, size * maxW / w);
  txt(c, s, x, y, size, color, o);
}
function hexToRgb(h) { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(x => x + x).join(''); const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function rgbToHex(r, g, b) { return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join(''); }
function shade(hex, amt) { const [r, g, b] = hexToRgb(hex); return amt >= 0 ? rgbToHex(r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt) : rgbToHex(r * (1 + amt), g * (1 + amt), b * (1 + amt)); }
function mix(a, b, t) { const A = hexToRgb(a), B = hexToRgb(b); return rgbToHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); }
function mulberry(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hashStr(s) { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }

// đường viền răng cưa (bao bì snack)
function crimpPath(c, x, y, w, h, top = true, bottom = true, bulge = 3) {
  const n = Math.max(3, Math.round(w / 6));
  c.beginPath();
  c.moveTo(x, y);
  if (top) for (let i = 0; i < n; i++) { c.lineTo(x + (i + 0.5) * w / n, y - 3); c.lineTo(x + (i + 1) * w / n, y); }
  else c.lineTo(x + w, y);
  c.quadraticCurveTo(x + w + bulge, y + h / 2, x + w, y + h);
  if (bottom) for (let i = n - 1; i >= 0; i--) { c.lineTo(x + (i + 0.5) * w / n, y + h + 3); c.lineTo(x + i * w / n, y + h); }
  else c.lineTo(x, y + h);
  c.quadraticCurveTo(x - bulge, y + h / 2, x, y);
  c.closePath();
}
function crimpPathV(c, x, y, w, h) {
  const n = Math.max(3, Math.round(h / 6));
  c.beginPath();
  c.moveTo(x, y);
  c.quadraticCurveTo(x + w / 2, y - 3, x + w, y);
  for (let i = 0; i < n; i++) { c.lineTo(x + w + 3, y + (i + 0.5) * h / n); c.lineTo(x + w, y + (i + 1) * h / n); }
  c.quadraticCurveTo(x + w / 2, y + h + 3, x, y + h);
  for (let i = n - 1; i >= 0; i--) { c.lineTo(x - 3, y + (i + 0.5) * h / n); c.lineTo(x, y + i * h / n); }
  c.closePath();
}
function shine(c, x1, y1, x2, y2, lw = 3) { c.save(); c.globalAlpha = 0.45; line(c, x1, y1, x2, y2, '#ffffff', lw); c.restore(); }

// ============================================================
//  ICON VẬT PHẨM — khung logic 64 x 84, đáy ở y = 82
// ============================================================
const ICON_W = 64, ICON_H = 84, ICON_RES = 3;

function picto(c, kind, x, y) {
  if (kind === 'shrimp') {
    c.beginPath(); c.arc(x, y, 7, Math.PI * 0.1, Math.PI * 1.4); c.strokeStyle = '#e8502a'; c.lineWidth = 5; c.lineCap = 'round'; c.stroke();
    c.beginPath(); c.arc(x, y, 7, Math.PI * 0.1, Math.PI * 1.4); c.strokeStyle = OUTLINE; c.lineWidth = 1; c.stroke();
    circ(c, x + 5, y - 5, 1.2, OUTLINE, 0);
  } else if (kind === 'bear') {
    circ(c, x - 6, y - 7, 3.5, '#8a5a2b', 1.5); circ(c, x + 6, y - 7, 3.5, '#8a5a2b', 1.5);
    circ(c, x, y, 8, '#a86d34', 1.5); ell(c, x, y + 3, 4, 3, '#e6c08a', 1);
    circ(c, x - 3, y - 2, 1.1, OUTLINE, 0); circ(c, x + 3, y - 2, 1.1, OUTLINE, 0);
  } else if (kind === 'sun') {
    for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; ell(c, x + Math.cos(a) * 7, y + Math.sin(a) * 7, 3, 3, '#ffd23f', 1); }
    circ(c, x, y, 5, '#5a3a1a', 1.5);
  } else if (kind === 'stick') {
    for (let i = -2; i <= 2; i++) { c.save(); c.translate(x + i * 4, y); c.rotate(i * 0.15); rr(c, -1.8, -9, 3.6, 18, 1.5, '#f2b43a', 1); c.restore(); }
  }
}

const ICON_DRAW = {
  bag(c, s) {
    crimpPath(c, 12, 12, 40, 66);
    c.save(); c.clip();
    c.fillStyle = s.c; c.fillRect(0, 0, 64, 84);
    c.fillStyle = s.c2; c.beginPath(); c.moveTo(0, 54); c.lineTo(64, 40); c.lineTo(64, 60); c.lineTo(0, 74); c.fill();
    c.globalAlpha = 0.35; c.fillStyle = '#fff'; c.fillRect(15, 12, 5, 66); c.globalAlpha = 1;
    c.restore();
    crimpPath(c, 12, 12, 40, 66); fs(c, null, 2.5);
    fitTxt(c, s.t[0], 32, 25, 13, 36, '#fff', { stroke: OUTLINE, sw: 3 });
    fitTxt(c, s.t[1], 32, 38, 12, 36, '#fff', { stroke: OUTLINE, sw: 3 });
    picto(c, s.pic, 32, 59);
  },
  noodle(c, s) {
    crimpPathV(c, 6, 30, 52, 50);
    c.save(); c.clip(); c.fillStyle = s.c; c.fillRect(0, 0, 64, 84);
    c.fillStyle = shade(s.c, 0.35); c.fillRect(0, 30, 64, 8);
    c.restore();
    crimpPathV(c, 6, 30, 52, 50); fs(c, null, 2.5);
    fitTxt(c, s.t[0], 32, 44, 13, 46, '#fff', { stroke: OUTLINE, sw: 3 });
    txt(c, s.t[1], 20, 64, 8, '#fff8c8', { weight: 'normal' });
    // tô mì
    c.beginPath(); c.arc(43, 64, 9, 0, Math.PI); c.closePath(); fs(c, '#fff', 1.5);
    c.strokeStyle = '#f3c63c'; c.lineWidth = 1.6;
    for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(36 + i * 4, 64); c.quadraticCurveTo(38 + i * 4, 58, 40 + i * 4, 64); c.stroke(); }
    line(c, 46, 52, 52, 66, '#8a5a2b', 1.5); line(c, 49, 52, 54, 65, '#8a5a2b', 1.5);
  },
  bottle(c, s) {
    c.beginPath(); c.moveTo(27, 8); c.lineTo(37, 8); c.lineTo(37, 22); c.quadraticCurveTo(47, 28, 47, 38); c.lineTo(47, 76);
    c.quadraticCurveTo(47, 81, 42, 81); c.lineTo(22, 81); c.quadraticCurveTo(17, 81, 17, 76); c.lineTo(17, 38); c.quadraticCurveTo(17, 28, 27, 22); c.closePath();
    fs(c, s.c);
    rr(c, 25.5, 2, 13, 9, 2, s.cap, 2);
    rr(c, 17, 44, 30, 24, 3, s.lab, 2);
    fitTxt(c, s.t[0], 32, 51, 9, 26, OUTLINE);
    fitTxt(c, s.t[1], 32, 61, 9, 26, '#b02a1a');
    shine(c, 21, 36, 21, 74);
  },
  squeeze(c, s) {
    c.beginPath(); c.moveTo(18, 81); c.lineTo(18, 42); c.quadraticCurveTo(18, 30, 28, 26); c.lineTo(28, 18); c.lineTo(36, 18); c.lineTo(36, 26);
    c.quadraticCurveTo(46, 30, 46, 42); c.lineTo(46, 81); c.closePath(); fs(c, s.c);
    c.beginPath(); c.moveTo(27, 19); c.lineTo(37, 19); c.lineTo(32, 3); c.closePath(); fs(c, s.cap, 2);
    rr(c, 18, 46, 28, 22, 3, s.lab, 2);
    fitTxt(c, s.t[0], 32, 52, 8, 24, '#c0392b');
    fitTxt(c, s.t[1], 32, 62, 10, 24, '#c0392b');
    shine(c, 22, 38, 22, 76);
  },
  oil(c, s) {
    c.beginPath(); c.moveTo(25, 12); c.lineTo(39, 12); c.lineTo(39, 18); c.lineTo(50, 26); c.quadraticCurveTo(55, 30, 55, 38); c.lineTo(55, 77);
    c.quadraticCurveTo(55, 81, 51, 81); c.lineTo(13, 81); c.quadraticCurveTo(9, 81, 9, 77); c.lineTo(9, 38); c.quadraticCurveTo(9, 26, 25, 18); c.closePath();
    fs(c, s.c);
    ell(c, 46, 35, 3.5, 6, shade(s.c, 0.5), 1.5);
    rr(c, 23, 4, 18, 10, 3, s.cap, 2);
    rr(c, 9, 48, 46, 20, 3, s.lab, 2);
    fitTxt(c, s.t[0], 32, 58, 11, 40, '#fff', { stroke: OUTLINE, sw: 2 });
    shine(c, 14, 40, 14, 76);
  },
  packet(c, s) {
    crimpPath(c, 12, 18, 40, 62, true, false, 4);
    c.save(); c.clip(); c.fillStyle = s.c; c.fillRect(0, 0, 64, 84);
    c.fillStyle = s.c2; c.fillRect(0, 48, 64, 34); c.restore();
    crimpPath(c, 12, 18, 40, 62, true, false, 4); fs(c, null, 2.5);
    const tc = s.c === '#ffffff' || s.c === '#dff0ff' ? s.c2 : '#fff';
    const st = tc === '#fff' ? OUTLINE : null;
    fitTxt(c, s.t[0], 32, s.t[1] ? 30 : 36, 12, 34, tc, st ? { stroke: st, sw: 2.5 } : {});
    if (s.t[1]) fitTxt(c, s.t[1], 32, 42, 12, 34, tc, st ? { stroke: st, sw: 2.5 } : {});
    ell(c, 32, 64, 10, 6, '#ffffff', 1.5);
    ell(c, 32, 63, 6, 3, shade(s.c2, 0.4), 0);
  },
  coffee(c, s) {
    c.beginPath(); c.moveTo(14, 16); c.lineTo(50, 16); c.lineTo(54, 81); c.lineTo(10, 81); c.closePath(); fs(c, s.c);
    line(c, 14, 22, 50, 22, shade(s.c, 0.3), 2);
    circ(c, 32, 50, 15, s.c2, 2);
    txt(c, s.t[0], 32, 45, 11, '#5a1010'); txt(c, s.t[1], 32, 56, 11, '#5a1010');
    ell(c, 32, 73, 6, 3.5, '#5a3418', 1.2); line(c, 32, 70, 32, 76, '#c99a5a', 1);
  },
  condensed(c, s) {
    rr(c, 12, 44, 40, 37, 4, s.c);
    rr(c, 12, 54, 40, 16, 0, s.c2, 2);
    fitTxt(c, s.t[0], 32, 62, 10, 36, s.c);
    ell(c, 32, 44, 20, 4.5, '#d6dde3');
    ell(c, 32, 44, 14, 2.5, null, 1.2, '#9aa4ac');
  },
  milkbox(c, s) {
    c.beginPath(); c.moveTo(44, 36); c.lineTo(52, 30); c.lineTo(52, 74); c.lineTo(44, 81); c.closePath(); fs(c, shade(s.c, -0.25), 2);
    c.beginPath(); c.moveTo(18, 36); c.lineTo(26, 30); c.lineTo(52, 30); c.lineTo(44, 36); c.closePath(); fs(c, '#f4f4f4', 2);
    rr(c, 18, 36, 26, 45, 2, '#ffffff');
    c.save(); rrPath(c, 18, 36, 26, 45, 2); c.clip(); c.fillStyle = s.c; c.fillRect(18, 58, 26, 23);
    ell(c, 24, 46, 3, 2, OUTLINE, 0); ell(c, 37, 50, 2.5, 2, OUTLINE, 0); c.restore();
    rrPath(c, 18, 36, 26, 45, 2); fs(c, null, 2.5);
    txt(c, s.t[0], 31, 69, 11, '#fff', { stroke: OUTLINE, sw: 2 });
    line(c, 46, 32, 49, 14, '#f2f2f2', 3); line(c, 49, 14, 53, 10, '#f2f2f2', 3);
  },
  detergent(c, s) {
    rr(c, 8, 16, 48, 65, 7, s.c);
    rr(c, 22, 10, 20, 9, 3, shade(s.c, -0.2), 2);
    circ(c, 18, 66, 5, '#e9f5ff', 1.2); circ(c, 27, 72, 4, '#e9f5ff', 1.2); circ(c, 46, 66, 6, '#e9f5ff', 1.2);
    txt(c, s.t[0], 32, 34, 14, '#ffe14d', { stroke: OUTLINE, sw: 3 });
    txt(c, s.t[1], 32, 50, 14, '#ffe14d', { stroke: OUTLINE, sw: 3 });
    shine(c, 13, 24, 13, 72);
  },
  coil(c, s) {
    rr(c, 10, 36, 44, 45, 3, s.c);
    c.beginPath(); for (let a = 0; a < Math.PI * 7; a += 0.2) { const r = 1 + a * 0.75; const px = 32 + Math.cos(a) * r, py = 56 + Math.sin(a) * r * 0.8; a === 0 ? c.moveTo(px, py) : c.lineTo(px, py); }
    c.strokeStyle = '#1f5a2e'; c.lineWidth = 2; c.stroke();
    txt(c, 'MUỖI', 32, 75, 9, '#fff', { stroke: OUTLINE, sw: 2 });
  },
  bucket(c, s) {
    c.beginPath(); c.arc(32, 40, 20, Math.PI, 0); c.strokeStyle = OUTLINE; c.lineWidth = 2; c.stroke();
    c.beginPath(); c.moveTo(12, 40); c.lineTo(52, 40); c.lineTo(47, 81); c.lineTo(17, 81); c.closePath(); fs(c, s.c);
    rr(c, 10, 36, 44, 7, 3, shade(s.c, 0.15), 2);
    shine(c, 18, 48, 20, 76, 3);
  },
  broom(c) {
    line(c, 32, 3, 32, 50, OUTLINE, 6); line(c, 32, 3, 32, 50, '#b4783f', 3.5);
    c.beginPath(); c.moveTo(25, 46); c.lineTo(39, 46); c.lineTo(56, 81); c.lineTo(8, 81); c.closePath(); fs(c, '#dcb45c');
    c.strokeStyle = '#a77f2e'; c.lineWidth = 1;
    for (let i = 0; i < 9; i++) { c.beginPath(); c.moveTo(27 + i * 1.3, 50); c.lineTo(11 + i * 5.2, 80); c.stroke(); }
    rr(c, 24, 44, 16, 7, 2, '#c0392b', 2);
  },
  jar(c, s) {
    rr(c, 12, 22, 40, 59, 10, 'rgba(225,242,255,0.55)');
    c.save(); rrPath(c, 12, 22, 40, 59, 10); c.clip();
    c.fillStyle = s.c; c.fillRect(12, 40, 40, 45);
    const R = mulberry(hashStr(s.t[0]));
    for (let i = 0; i < 18; i++) circ(c, 14 + R() * 36, 42 + R() * 38, 2 + R() * 2.5, i % 3 ? shade(s.c, -0.2) : s.c2, 0.8);
    c.restore();
    rrPath(c, 12, 22, 40, 59, 10); fs(c, null, 2.5);
    rr(c, 13, 13, 38, 11, 3, '#d63a2f');
    rr(c, 18, 52, 28, 13, 2, '#fffbe6', 1.5);
    fitTxt(c, s.t[0], 32, 58.5, 9, 25, '#b02a1a');
    shine(c, 17, 30, 17, 74);
  },
  lolli(c) {
    const cols = ['#e74c3c', '#f1c40f', '#3498db'];
    [[-12, -0.35], [0, 0], [12, 0.35]].forEach(([dx, a], i) => {
      c.save(); c.translate(32, 82); c.rotate(a);
      line(c, 0, 0, 0, -50, OUTLINE, 4); line(c, 0, 0, 0, -50, '#fff', 2);
      circ(c, 0, -58, 11, cols[i]);
      c.beginPath(); for (let t = 0; t < Math.PI * 4; t += 0.3) { const r = t * 0.8; c.lineTo(Math.cos(t) * r, -58 + Math.sin(t) * r); }
      c.strokeStyle = '#fff'; c.lineWidth = 1.8; c.stroke();
      c.restore();
    });
  },
  cake(c, s) {
    crimpPath(c, 8, 34, 48, 46, false, false, 2);
    c.save(); c.clip(); c.fillStyle = 'rgba(255,250,235,0.85)'; c.fillRect(0, 0, 64, 84); c.restore();
    rr(c, 14, 48, 36, 26, 4, s.c, 1.5);
    rr(c, 14, 48, 36, 8, 4, '#b5651d', 1.5);
    crimpPath(c, 8, 34, 48, 46, false, false, 2); fs(c, null, 2.5);
    rr(c, 14, 37, 36, 10, 2, '#e74c3c', 1.2);
    fitTxt(c, s.t[0], 32, 42, 8, 33, '#fff');
  },
  water(c) {
    c.beginPath(); c.moveTo(27, 16); c.lineTo(37, 16); c.quadraticCurveTo(44, 22, 44, 32); c.lineTo(44, 78); c.quadraticCurveTo(44, 81, 40, 81);
    c.lineTo(24, 81); c.quadraticCurveTo(20, 81, 20, 78); c.lineTo(20, 32); c.quadraticCurveTo(20, 22, 27, 16); c.closePath();
    fs(c, 'rgba(170,220,250,0.75)');
    rr(c, 26, 7, 12, 10, 2, '#2d7fd3', 2);
    rr(c, 20, 44, 24, 14, 0, '#2d7fd3', 2);
    txt(c, 'NƯỚC', 32, 51, 8, '#fff');
    line(c, 21, 66, 43, 66, 'rgba(60,120,180,0.5)', 1.2); line(c, 21, 72, 43, 72, 'rgba(60,120,180,0.5)', 1.2);
    shine(c, 24, 28, 24, 76);
  },
  can(c, s) {
    rr(c, 18, 28, 28, 53, 4, s.c);
    c.save(); rrPath(c, 18, 28, 28, 53, 4); c.clip();
    c.fillStyle = s.c2; c.beginPath(); c.moveTo(18, 62); c.quadraticCurveTo(32, 52, 46, 60); c.lineTo(46, 68); c.quadraticCurveTo(32, 60, 18, 70); c.fill();
    c.restore();
    rrPath(c, 18, 28, 28, 53, 4); fs(c, null, 2.5);
    c.save(); c.translate(32, 46); c.rotate(-Math.PI / 2);
    fitTxt(c, s.t, 0, 0, 10, 30, '#fff', { stroke: OUTLINE, sw: 2.5 }); c.restore();
    ell(c, 32, 28, 14, 3.5, '#d6dde3', 2);
    rr(c, 28, 26, 8, 3, 1, '#aab3ba', 1);
    shine(c, 22, 34, 22, 76);
  },
  yogurt(c, s) {
    [[10, 0], [34, 0]].forEach(([x]) => {
      c.beginPath(); c.moveTo(x, 50); c.lineTo(x + 20, 50); c.lineTo(x + 17, 81); c.lineTo(x + 3, 81); c.closePath(); fs(c, '#ffffff');
      c.save(); c.beginPath(); c.moveTo(x, 50); c.lineTo(x + 20, 50); c.lineTo(x + 17, 81); c.lineTo(x + 3, 81); c.closePath(); c.clip();
      c.fillStyle = s.c; c.fillRect(x, 60, 22, 9); c.restore();
      ell(c, x + 10, 50, 11, 3.5, '#e8e8e8', 2);
    });
    txt(c, 'SỮA CHUA', 32, 40, 9, s.c, { stroke: '#fff', sw: 3 });
  },
  ice(c) {
    c.beginPath(); c.moveTo(28, 22); c.quadraticCurveTo(10, 40, 12, 66); c.quadraticCurveTo(14, 82, 32, 82); c.quadraticCurveTo(50, 82, 52, 66);
    c.quadraticCurveTo(54, 40, 36, 22); c.closePath(); fs(c, 'rgba(215,238,255,0.85)');
    const cubes = [[18, 52], [30, 48], [40, 56], [22, 66], [34, 64], [42, 70], [28, 74]];
    cubes.forEach(([x, y], i) => { c.save(); c.translate(x, y); c.rotate(i * 0.4); rr(c, -5, -5, 10, 10, 2, 'rgba(255,255,255,0.9)', 1.2, '#7fb8e0'); c.restore(); });
    c.beginPath(); c.moveTo(26, 22); c.lineTo(32, 12); c.lineTo(38, 22); fs(c, null, 2.5);
    ell(c, 27, 10, 5, 3, 'rgba(215,238,255,0.9)', 1.5); ell(c, 37, 10, 5, 3, 'rgba(215,238,255,0.9)', 1.5);
  },
  sachet(c, s) {
    line(c, 32, 2, 32, 8, OUTLINE, 2);
    for (let i = 0; i < 4; i++) {
      const y = 8 + i * 18.5;
      rr(c, 21, y, 22, 17, 2, s.cs[i % s.cs.length], 2);
      c.save(); c.globalAlpha = 0.5; rr(c, 24, y + 4, 16, 9, 4, '#fff', 0); c.restore();
      if (i < 3) { c.save(); c.setLineDash([2, 2]); line(c, 21, y + 17.5, 43, y + 17.5, OUTLINE, 1); c.restore(); }
    }
  },
  incense(c) {
    for (let i = 0; i < 14; i++) {
      const x = 22 + i * 1.5 + Math.sin(i) * 1;
      line(c, x, 10 + (i % 3) * 2, x + (i - 7) * 0.4, 66, '#b8432f', 1.6);
      circ(c, x, 9 + (i % 3) * 2, 1.2, '#666', 0);
    }
    rr(c, 19, 58, 26, 23, 3, '#f4d03f');
    rr(c, 19, 64, 26, 9, 0, '#c0392b', 1.5);
    txt(c, 'NHANG', 32, 69, 7, '#fff');
  },
  lighter(c, s) {
    rr(c, 23, 30, 18, 51, 4, s.c);
    rr(c, 23, 20, 18, 12, 2, '#cfd6dc', 2);
    circ(c, 36, 20, 4, '#8a949c', 1.5);
    shine(c, 27, 36, 27, 76);
  },
  card(c, s) {
    rr(c, 10, 22, 44, 59, 5, s.c);
    txt(c, 'THẺ CÀO', 32, 32, 9, '#fff');
    txt(c, s.v, 32, 50, 17, '#fff', { stroke: OUTLINE, sw: 3 });
    rr(c, 15, 62, 34, 12, 2, '#c9ced2', 1.5);
    c.save(); c.globalAlpha = 0.6; for (let i = 0; i < 6; i++) line(c, 18 + i * 5, 65, 21 + i * 5, 71, '#ffffff', 1); c.restore();
  },
  box(c) {
    rr(c, 8, 36, 48, 45, 2, '#c99a5c');
    line(c, 8, 50, 56, 50, '#a67a40', 2);
    rr(c, 26, 36, 12, 45, 0, 'rgba(230,210,160,0.9)', 1.2);
    txt(c, 'HÀNG', 32, 64, 10, '#6b4a22', { weight: 'normal' });
  },
};

const ICONS = {}, ICON_URLS = {};
function buildIcons() {
  const all = Object.assign({}, ITEMS, { _box: { icon: { k: 'box' } } });
  for (const id in all) {
    const cv = document.createElement('canvas');
    cv.width = ICON_W * ICON_RES; cv.height = ICON_H * ICON_RES;
    const c = cv.getContext('2d');
    c.scale(ICON_RES, ICON_RES);
    try { ICON_DRAW[all[id].icon.k](c, all[id].icon); } catch (e) { console.error('icon', id, e); }
    ICONS[id] = cv;
    try { ICON_URLS[id] = cv.toDataURL(); } catch (e) { ICON_URLS[id] = ''; }
  }
  // Ghi đè bằng ảnh PNG nếu có khai báo trong SPRITE_OVERRIDES (xem README)
  if (typeof SPRITE_OVERRIDES === 'object') {
    for (const id in SPRITE_OVERRIDES) {
      const img = new Image();
      img.onload = () => { ICONS[id] = img; ICON_URLS[id] = SPRITE_OVERRIDES[id]; };
      img.src = SPRITE_OVERRIDES[id];
    }
  }
}

// ============================================================
//  BỐ CỤC — vị trí các ô hàng trên kệ (đáy ô = y + h)
// ============================================================
const SLOTS = {};
(function layout() {
  const wood = [
    ['nuocmam', 'nuoctuong', 'tuongot', 'dauan'],
    ['botngot', 'hatnem', 'duong', 'caphe'],
    ['suadac', 'suahop', 'botgiat', '_box'],
    ['nhangmuoi', 'xo', 'choi', '_box'],
  ];
  const woodBottoms = [250, 355, 460, 565];
  wood.forEach((row, r) => row.forEach((id, i) => {
    if (id === '_box') return;
    SLOTS[id] = { x: 602 + i * 60, y: woodBottoms[r] - 88, w: 58, h: 86, show: 3 };
  }));
  const rack = [['snacktom', 'bimbim'], ['mitom', 'phogoi'], ['banhgau', 'hatdua']];
  const rackB = [330, 445, 560];
  rack.forEach((row, r) => row.forEach((id, i) => { SLOTS[id] = { x: 864 + i * 62, y: rackB[r] - 86, w: 60, h: 80, show: 3 }; }));
  SLOTS.keome = { x: 1012, y: 312, w: 58, h: 68, show: 1 };
  SLOTS.banhtrang = { x: 1074, y: 312, w: 58, h: 68, show: 1 };
  SLOTS.keomut = { x: 1014, y: 400, w: 118, h: 76, show: 4 };
  SLOTS.banhbonglan = { x: 1014, y: 505, w: 118, h: 74, show: 4 };
  const fr = [['nuocsuoi', 'nuocngot'], ['tangluc', 'bia'], ['suachua', 'nuocda']];
  const frB = [335, 450, 565];
  fr.forEach((row, r) => row.forEach((id, i) => { SLOTS[id] = { x: 1158 + i * 52, y: frB[r] - 88, w: 50, h: 84, show: 3 }; }));
  SLOTS.daugoi = { x: 372, y: 152, w: 92, h: 98, show: 3, hang: true };
  SLOTS.nhang = { x: 484, y: 160, w: 56, h: 70, show: 2 };
  SLOTS.thecao10 = { x: 500, y: 270, w: 29, h: 54, show: 1 };
  SLOTS.thecao20 = { x: 529, y: 270, w: 29, h: 54, show: 1 };
  SLOTS.thecao50 = { x: 558, y: 270, w: 29, h: 54, show: 1 };
  SLOTS.batlua = { x: 408, y: 420, w: 28, h: 42, show: 3, counter: true };
})();
const DECOR_BOXES = [{ x: 782, y: 372, w: 58, h: 86 }, { x: 782, y: 477, w: 58, h: 86 }];
const RECT_SONO = { x: 432, y: 444, w: 58, h: 22 };
const RECT_CALC = { x: 496, y: 436, w: 46, h: 28 };
const RECT_BAG = { x: 330, y: 380, w: 80, h: 84 };
const QUEUE_X = [215, 140, 68, -4];
const CUST_FEET = 655;
const HOA_X = 468, HOA_FEET = 477;

// vẽ hàng trong 1 ô kệ
function drawSlot(c, id, slot, stock, locked, hover, t) {
  const icon = ICONS[id];
  if (locked) {
    c.save(); c.globalAlpha = 0.35; c.setLineDash([4, 4]);
    rrPath(c, slot.x + 3, slot.y + 6, slot.w - 6, slot.h - 8, 6); fs(c, 'rgba(255,255,255,0.25)', 1.5, '#6b4a22');
    c.restore();
    drawLock(c, slot.x + slot.w / 2, slot.y + slot.h / 2 + 4, Math.min(1, slot.w / 50));
    return;
  }
  const n = Math.min(stock, slot.show);
  if (n === 0) {
    rr(c, slot.x + slot.w / 2 - 15, slot.y + slot.h - 22, 30, 16, 4, '#fff3e0', 1.5, '#b33');
    txt(c, 'Hết', slot.x + slot.w / 2, slot.y + slot.h - 14, 11, '#b33');
  } else {
    let ih = slot.h, iw = ih * ICON_W / ICON_H;
    if (n > 1) { const maxW = slot.w * 0.72; if (iw > maxW) { iw = maxW; ih = iw * ICON_H / ICON_W; } }
    else if (iw > slot.w) { iw = slot.w; ih = iw * ICON_H / ICON_W; }
    const span = slot.w - iw;
    for (let i = 0; i < n; i++) {
      const x = n === 1 ? slot.x + span / 2 : slot.x + span * (i / (n - 1));
      const dy = slot.hang ? Math.sin(t * 1.5 + i) * 1.5 : 0;
      c.drawImage(icon, x, slot.y + slot.h - ih + dy, iw, ih);
    }
  }
  // nhãn số lượng
  if (!slot.counter || hover) {
    const bx = slot.x + slot.w - 9, by = slot.y + slot.h - 6;
    circ(c, bx, by, 8, stock <= 2 ? '#ffd7d2' : '#fffbea', 1.5, stock <= 2 ? '#c0392b' : '#8a6a3a');
    txt(c, String(stock), bx, by + 0.5, 10, stock <= 2 ? '#c0392b' : '#5a3a1a');
  }
  if (hover) {
    c.save(); c.shadowColor = '#fff6a0'; c.shadowBlur = 12;
    rrPath(c, slot.x - 2, slot.y - 2, slot.w + 4, slot.h + 6, 8); fs(c, null, 3, '#ffcf33'); c.restore();
  }
}
function drawLock(c, x, y, s = 1) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.beginPath(); c.arc(0, -8, 7, Math.PI, 0); c.strokeStyle = OUTLINE; c.lineWidth = 3.5; c.stroke();
  c.strokeStyle = '#c9ced2'; c.lineWidth = 2; c.stroke();
  rr(c, -10, -8, 20, 16, 3, '#e8b730', 2);
  circ(c, 0, -1, 2.2, OUTLINE, 0);
  c.restore();
}

// ============================================================
//  NHÂN VẬT CHIBI
// ============================================================
function drawFloral(c, base, flower, seed, x, y, w, h) {
  c.fillStyle = base; c.fillRect(x, y, w, h);
  const R = mulberry(seed);
  for (let i = 0; i < w * h / 150; i++) {
    const fx = x + R() * w, fy = y + R() * h, r = 2 + R() * 1.5;
    c.fillStyle = flower;
    for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; c.beginPath(); c.arc(fx + Math.cos(a) * r, fy + Math.sin(a) * r, r * 0.7, 0, 7); c.fill(); }
    c.fillStyle = '#ffe680'; c.beginPath(); c.arc(fx, fy, r * 0.5, 0, 7); c.fill();
  }
}
function fillPattern(c, L, part, x, y, w, h) {
  const col = part === 'top' ? L.top : L.bottom;
  const pat = part === 'top' ? L.topPat : L.bottomPat;
  if (pat === 'floral') drawFloral(c, col, L.flower || '#f7a1c4', L.seed || 1, x, y, w, h);
  else if (pat === 'stripe') { c.fillStyle = col; c.fillRect(x, y, w, h); c.fillStyle = shade(col, -0.18); for (let yy = y; yy < y + h; yy += 8) c.fillRect(x, yy, w, 3.5); }
  else if (pat === 'check') { c.fillStyle = col; c.fillRect(x, y, w, h); c.fillStyle = 'rgba(0,0,0,0.12)'; for (let xx = x; xx < x + w; xx += 10) c.fillRect(xx, y, 4, h); for (let yy = y; yy < y + h; yy += 10) c.fillRect(x, yy, w, 4); }
  else { c.fillStyle = col; c.fillRect(x, y, w, h); }
}

function drawArm(c, sx, sy, ang, len, L, hold, t) {
  // ang: radians; 0 = thẳng xuống, + = xoay ngược kim đồng hồ (sang phải)
  const hx = sx + Math.sin(ang) * len, hy = sy + Math.cos(ang) * len;
  line(c, sx, sy, hx, hy, OUTLINE, 12);
  line(c, sx, sy, hx, hy, L.skin, 8.5);
  const slv = L.sleeve === 'long' ? 1 : L.sleeve === 'none' ? 0 : 0.45;
  if (slv > 0) {
    const ex = sx + Math.sin(ang) * len * slv, ey = sy + Math.cos(ang) * len * slv;
    line(c, sx, sy, ex, ey, OUTLINE, 14);
    line(c, sx, sy, ex, ey, L.armColor || L.top, 10.5);
  }
  circ(c, hx, hy, 5.5, L.skin, 2.2);
  if (hold === 'money') {
    c.save(); c.translate(hx, hy); c.rotate(-0.3 + Math.sin(t * 3) * 0.1);
    rr(c, -2, -14, 22, 11, 2, '#5fae6b', 1.8); rr(c, 2, -12, 22, 11, 2, '#d9709b', 1.8); c.restore();
  } else if (hold === 'basket') {
    c.beginPath(); c.arc(hx, hy + 2, 10, Math.PI, 0); c.strokeStyle = '#8a5a2b'; c.lineWidth = 2.5; c.stroke();
    circ(c, hx - 4, hy + 6, 4, '#4caf50', 1.2); circ(c, hx + 5, hy + 5, 4, '#e74c3c', 1.2);
    c.beginPath(); c.moveTo(hx - 14, hy + 8); c.lineTo(hx + 14, hy + 8); c.lineTo(hx + 10, hy + 26); c.lineTo(hx - 10, hy + 26); c.closePath(); fs(c, '#c99a5c', 2);
    c.strokeStyle = '#8a5a2b'; c.lineWidth = 1; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(hx - 12 + i, hy + 13 + i * 5); c.lineTo(hx + 12 - i, hy + 13 + i * 5); c.stroke(); }
  } else if (hold === 'fan') {
    c.save(); c.translate(hx, hy); c.rotate(-1.1 + Math.sin(t * 9) * 0.45);
    c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 26, -Math.PI * 0.85, -Math.PI * 0.15); c.closePath(); fs(c, '#f3d9a4', 2);
    c.strokeStyle = '#b08a4a'; c.lineWidth = 1; for (let i = 1; i < 8; i++) { const a = -Math.PI * 0.85 + i * Math.PI * 0.7 / 8; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * 25, Math.sin(a) * 25); c.stroke(); }
    c.beginPath(); c.arc(0, 0, 26, -Math.PI * 0.85, -Math.PI * 0.15); c.strokeStyle = '#c0392b'; c.lineWidth = 3; c.stroke();
    c.restore();
  } else if (hold === 'pen') {
    line(c, hx - 2, hy + 2, hx + 8, hy - 10, '#2a4d9c', 3);
  } else if (hold === 'note') {
    c.save(); c.translate(hx, hy); c.rotate(-0.2); rr(c, -14, -8, 24, 18, 2, '#fffbe6', 1.8); rr(c, -14, -8, 24, 4, 1, '#c0392b', 1.2);
    for (let i = 0; i < 3; i++) line(c, -11, i * 4 + 0, 7, i * 4 + 0, '#9fb6d6', 1);
    c.restore();
  }
  return [hx, hy];
}

// L: look, o: { pose, t, mood, walking, phase, talk, blinkSeed }
function drawChibi(c, x, fy, L, o) {
  const t = o.t || 0, s = (o.scale || 1) * (L.scale || 1);
  c.save(); c.translate(x, fy); c.scale(s, s);
  const pl = L.plump ? 1.18 : 1;
  const bw = 21 * pl;
  const wk = o.walking ? Math.sin(o.phase || 0) : 0;
  const bob = o.walking ? -Math.abs(Math.sin(o.phase || 0)) * 3 : Math.sin(t * 2.2 + (L.seed || 0)) * 0.8;

  // bóng
  c.save(); c.globalAlpha = 0.18; ell(c, 0, 0, 28 * pl, 6, '#000', 0); c.restore();

  // chân
  const legTop = -30;
  [[-9, wk * 4], [9, -wk * 4]].forEach(([lx, dy]) => {
    const footY = -4 + Math.min(0, dy);
    if (L.bottomType === 'pants') {
      rr(c, lx - 7, legTop, 14, footY - legTop + 2, 5, L.bottom, 2.2);
    } else {
      rr(c, lx - 5.5, legTop, 11, footY - legTop + 2, 5, L.skin, 2.2);
    }
    ell(c, lx + 1, footY + 1, 8, 4.2, L.shoes || '#6b4a2b', 2);
  });
  if (L.bottomType === 'shorts') {
    c.save(); rrPath(c, -bw + 2, legTop - 6, bw * 2 - 4, 20, 5); c.clip(); fillPattern(c, L, 'bottom', -bw, legTop - 8, bw * 2, 24); c.restore();
    rrPath(c, -bw + 2, legTop - 6, bw * 2 - 4, 20, 5); fs(c, null, 2.2);
    line(c, 0, legTop + 2, 0, legTop + 14, OUTLINE, 1.5);
  } else if (L.bottomType === 'skirt') {
    c.beginPath(); c.moveTo(-bw + 3, legTop - 6); c.lineTo(bw - 3, legTop - 6); c.lineTo(bw + 4, legTop + 12); c.lineTo(-bw - 4, legTop + 12); c.closePath();
    fs(c, L.bottom, 2.2);
    for (let i = -2; i <= 2; i++) line(c, i * 6, legTop - 4, i * 8, legTop + 10, shade(L.bottom, -0.3), 1);
  } else if (L.bottomType === 'pants' && L.bottomPat) {
    c.save(); c.beginPath(); c.rect(-bw, legTop - 4, bw * 2, 30); c.clip();
    [[-9], [9]].forEach(([lx]) => { c.save(); rrPath(c, lx - 7, legTop, 14, 26 - 1, 5); c.clip(); fillPattern(c, L, 'bottom', lx - 8, legTop, 16, 30); c.restore(); });
    c.restore();
    [[-9, wk * 4], [9, -wk * 4]].forEach(([lx, dy]) => { rrPath(c, lx - 7, legTop, 14, -4 + Math.min(0, dy) - legTop + 2, 5); fs(c, null, 2.2); });
  }

  c.translate(0, bob);
  // thân
  const shY = -76, hipY = -26;
  const torso = () => rrPath(c, -bw, shY, bw * 2, hipY - shY + 4, 13);
  // tay phía sau (nếu chéo)
  torso();
  c.save(); c.clip(); fillPattern(c, L, 'top', -bw - 2, shY - 2, bw * 2 + 4, hipY - shY + 8); c.restore();
  if (L.tank) { // áo ba lỗ
    c.save(); torso(); c.clip();
    c.beginPath(); c.moveTo(-bw - 2, shY - 2); c.lineTo(-10, shY - 2); c.quadraticCurveTo(0, shY + 18, 10, shY - 2); c.lineTo(bw + 2, shY - 2); c.lineTo(bw + 2, shY + 14); c.quadraticCurveTo(bw - 6, shY + 10, bw - 8, shY - 2); c.lineTo(-bw + 8, shY - 2); c.quadraticCurveTo(-bw + 6, shY + 10, -bw - 2, shY + 14); c.closePath();
    c.fillStyle = L.skin; c.fill(); c.restore();
  }
  torso(); fs(c, null, 2.5);
  if (L.jacket) { line(c, 0, shY + 6, 0, hipY + 2, shade(L.top, -0.35), 2); rr(c, -9, shY - 2, 18, 8, 3, shade(L.top, -0.15), 2); }
  if (L.shirt) { line(c, 0, shY + 4, 0, hipY + 2, '#c8ced6', 1.5); for (let i = 0; i < 3; i++) circ(c, 2.5, shY + 12 + i * 12, 1.3, '#9aa4ac', 0); }
  if (L.apron) {
    rr(c, -bw + 5, shY + 14, bw * 2 - 10, hipY - shY - 4, 6, L.apron, 2.2);
    line(c, -bw + 6, shY + 16, -10, shY + 2, OUTLINE, 2); line(c, bw - 6, shY + 16, 10, shY + 2, OUTLINE, 2);
    rr(c, -12, shY + 32, 24, 14, 3, shade(L.apron, -0.15), 1.8);
    rr(c, -8, shY + 28, 7, 8, 1, '#5fae6b', 1); rr(c, 1, shY + 29, 7, 7, 1, '#d9709b', 1);
  }
  if (L.scarf) {
    c.beginPath(); c.moveTo(-12, shY + 2); c.lineTo(12, shY + 2); c.lineTo(0, shY + 12); c.closePath(); fs(c, L.scarf, 2);
    c.beginPath(); c.moveTo(-2, shY + 10); c.lineTo(-7, shY + 26); c.lineTo(-1, shY + 24); c.closePath(); fs(c, L.scarf, 1.8);
    c.beginPath(); c.moveTo(2, shY + 10); c.lineTo(7, shY + 26); c.lineTo(2, shY + 23); c.closePath(); fs(c, L.scarf, 1.8);
  }

  // tay
  const pose = o.pose || 'stand';
  const sx = bw - 3, sy = shY + 8, alen = 27;
  let la = 0.25, ra = -0.25, lh = null, rh = null;
  if (o.walking) { la = 0.2 + wk * 0.45; ra = -0.2 + wk * 0.45; }
  if (L.hold === 'basket') { lh = 'basket'; la = -0.15; }
  if (L.hold === 'money' && !o.walking) { rh = 'money'; ra = 1.1 + Math.sin(t * 3) * 0.08; }
  if (pose === 'wave') { ra = 2.6 + Math.sin(t * 12) * 0.35; }
  else if (pose === 'fan') { ra = 2.3; rh = 'fan'; la = -0.6; }
  else if (pose === 'pack') { la = -1.2 + Math.sin(t * 14) * 0.35; ra = -0.9 - Math.sin(t * 14) * 0.3; }
  else if (pose === 'write') { la = -0.9; lh = 'note'; ra = -0.65 + Math.sin(t * 16) * 0.12; rh = 'pen'; }
  else if (pose === 'cash') { ra = 0.95 + Math.sin(t * 6) * 0.12; rh = 'money'; }
  else if (pose === 'angry') { la = -0.5; ra = 0.5; }
  // tay trái (phía -x) dùng góc âm = hướng ra ngoài
  drawArm(c, -sx, sy, -la, alen, L, lh, t);
  drawArm(c, sx, sy, -ra, alen, L, rh, t);

  // ĐẦU
  const hy = shY - 28, hr = 31;
  const hairC = L.hair;
  // tóc sau
  if (L.hairStyle === 'bun') { circ(c, 0, hy - 30, 12, hairC, 2.5); circ(c, 0, hy - 2, hr + 3, hairC, 2.5); }
  else if (L.hairStyle === 'ponytail') { ell(c, hr - 2, hy + 10, 9, 18, hairC, 2.5); circ(c, 0, hy - 1, hr + 3, hairC, 2.5); }
  else if (L.hairStyle === 'pigtails') { ell(c, -hr - 3, hy + 6, 8, 13, hairC, 2.5); ell(c, hr + 3, hy + 6, 8, 13, hairC, 2.5); circ(c, -hr + 2, hy - 2, 3.5, '#e74c3c', 1.5); circ(c, hr - 2, hy - 2, 3.5, '#e74c3c', 1.5); circ(c, 0, hy - 1, hr + 2, hairC, 2.5); }
  else if (L.hairStyle === 'long') { rr(c, -hr - 3, hy - 4, hr * 2 + 6, 46, 14, hairC, 2.5); circ(c, 0, hy - 1, hr + 3, hairC, 2.5); }
  else if (L.hairStyle === 'short' || L.hairStyle === 'curly') { circ(c, 0, hy - 2, hr + 2, hairC, 2.5); }
  // mặt
  circ(c, 0, hy, hr, L.skin, 2.5);
  // tai
  ell(c, -hr + 1, hy + 4, 5, 7, L.skin, 2); ell(c, hr - 1, hy + 4, 5, 7, L.skin, 2);
  if (L.earring) { circ(c, -hr + 1, hy + 12, 2.5, '#f1c40f', 1.2); circ(c, hr - 1, hy + 12, 2.5, '#f1c40f', 1.2); }
  // tóc mái
  if (L.hairStyle === 'bald') {
    ell(c, -hr + 4, hy - 4, 6, 9, hairC, 2); ell(c, hr - 4, hy - 4, 6, 9, hairC, 2);
    c.save(); c.globalAlpha = 0.25; ell(c, -8, hy - 18, 8, 4, '#fff', 0); c.restore();
  } else if (L.hairStyle === 'curly') {
    for (let i = 0; i < 9; i++) { const a = Math.PI * (1.05 + i * 0.1); circ(c, Math.cos(a) * (hr - 2), hy - 6 + Math.sin(a) * (hr - 4), 8, hairC, 2); }
  } else if (L.hairStyle !== 'helmet') {
    c.beginPath(); c.arc(0, hy - 1, hr + 1, Math.PI * 1.02, Math.PI * 1.98);
    c.quadraticCurveTo(hr - 6, hy - 6, hr * 0.3, hy - 12);
    c.quadraticCurveTo(0, hy - 6, -hr * 0.3, hy - 13);
    c.quadraticCurveTo(-hr + 6, hy - 6, -hr - 1, hy - 1);
    c.closePath(); fs(c, hairC, 2.5);
  }
  // mặt mũi
  const mood = o.mood || 'neutral';
  const blink = ((t + (L.seed || 0) * 0.37) % 3.4) < 0.13;
  const eyeY = hy + 3;
  if (mood === 'happy' || blink) {
    [-11, 11].forEach(ex => { c.beginPath(); c.arc(ex, eyeY + 1, 4, Math.PI * 1.1, Math.PI * 1.9); c.strokeStyle = OUTLINE; c.lineWidth = 2.4; c.stroke(); });
  } else {
    [-11, 11].forEach(ex => { ell(c, ex, eyeY, 3.6, 4.6, '#2a1c16', 0); circ(c, ex + 1.2, eyeY - 1.6, 1.3, '#fff', 0); });
  }
  if (L.glasses) { circ(c, -11, eyeY, 7.5, 'rgba(255,255,255,0.15)', 1.8); circ(c, 11, eyeY, 7.5, 'rgba(255,255,255,0.15)', 1.8); line(c, -3.5, eyeY, 3.5, eyeY, OUTLINE, 1.8); }
  if (mood === 'angry') { line(c, -16, eyeY - 10, -6, eyeY - 6, OUTLINE, 2.4); line(c, 16, eyeY - 10, 6, eyeY - 6, OUTLINE, 2.4); }
  else if (L.brows) { line(c, -15, eyeY - 9, -7, eyeY - 10, L.brows, 2.5); line(c, 15, eyeY - 9, 7, eyeY - 10, L.brows, 2.5); }
  c.save(); c.globalAlpha = mood === 'angry' ? 0.75 : 0.5; ell(c, -18, hy + 12, 5.5, 3.5, mood === 'angry' ? '#ff5a4a' : '#ff8fa0', 0); ell(c, 18, hy + 12, 5.5, 3.5, mood === 'angry' ? '#ff5a4a' : '#ff8fa0', 0); c.restore();
  const my = hy + 15;
  if (L.mustache) { c.beginPath(); c.moveTo(-9, my - 2); c.quadraticCurveTo(0, my - 7, 9, my - 2); c.quadraticCurveTo(0, my - 1, -9, my - 2); fs(c, L.mustache, 1.5); }
  if (o.talk && Math.sin(t * 18) > 0) { ell(c, 0, my, 4.5, 3.5, '#8a2b2b', 2); }
  else if (mood === 'angry') { c.beginPath(); c.arc(0, my + 5, 5, Math.PI * 1.15, Math.PI * 1.85); c.strokeStyle = OUTLINE; c.lineWidth = 2.4; c.stroke(); }
  else if (mood === 'happy') { c.beginPath(); c.arc(0, my - 2, 6, Math.PI * 0.1, Math.PI * 0.9); c.closePath(); fs(c, '#c0474a', 2); }
  else { c.beginPath(); c.arc(0, my - 2, 4.5, Math.PI * 0.2, Math.PI * 0.8); c.strokeStyle = OUTLINE; c.lineWidth = 2.2; c.stroke(); }

  // mũ / nón
  if (L.helmet) {
    c.beginPath(); c.arc(0, hy - 2, hr + 5, Math.PI * 1.0, Math.PI * 2.0); c.lineTo(hr + 5, hy - 2); c.closePath(); fs(c, L.helmet, 2.5);
    rr(c, -hr - 6, hy - 6, hr * 2 + 12, 7, 3, shade(L.helmet, -0.25), 2.2);
    c.save(); c.globalAlpha = 0.35; ell(c, -12, hy - 22, 10, 5, '#fff', 0); c.restore();
    line(c, -hr + 2, hy + 2, -10, hy + 28, OUTLINE, 1.5); line(c, hr - 2, hy + 2, 10, hy + 28, OUTLINE, 1.5);
  }
  if (L.nonla) {
    c.beginPath(); c.moveTo(-hr - 18, hy - 8); c.lineTo(0, hy - 56); c.lineTo(hr + 18, hy - 8); c.quadraticCurveTo(0, hy - 2, -hr - 18, hy - 8); fs(c, '#ecd59a', 2.5);
    for (let i = 1; i < 4; i++) { const yy = hy - 8 - i * 12; const ww = (hr + 18) * (1 - i * 12 / 48); line(c, -ww, yy + 2, ww, yy + 2, '#c9ad68', 1.2); }
    line(c, -hr + 4, hy - 6, -6, hy + 28, '#c0392b', 1.5); line(c, hr - 4, hy - 6, 6, hy + 28, '#c0392b', 1.5);
  }
  // giận: bốc khói
  if (mood === 'angry') {
    c.save(); c.globalAlpha = 0.8;
    for (let i = 0; i < 2; i++) { const p = (t * 1.5 + i * 0.5) % 1; circ(c, (i ? 20 : -20) + Math.sin(p * 6) * 3, hy - hr - 6 - p * 22, 5 + p * 5, '#ffffff', 1.5, '#999'); }
    c.restore();
  }
  c.restore();
}

// ============================================================
//  LOOKS — ngoại hình
// ============================================================
const SKINS = ['#f6d2b0', '#f2c49f', '#e8b48e', '#dca27b', '#f8dcc0'];
const HAIRS = ['#2b1e1a', '#3a2a22', '#1e1614', '#4a3226'];
function pick(R, arr) { return arr[Math.floor(R() * arr.length)]; }

const LOOK_HOA = {
  skin: '#f2c9a0', hair: '#3a2c2a', hairStyle: 'bun', plump: true, earring: true,
  top: '#8e3d7a', topPat: 'floral', bottom: '#8e3d7a', bottomPat: 'floral', bottomType: 'pants', flower: '#f7a8d0',
  apron: '#3f7f5a', sleeve: 'short', shoes: '#7a4a2a', seed: 7, brows: '#3a2c2a',
};

function makeLook(type, name, extra = {}) {
  const R = mulberry(hashStr(name + type));
  const L = { skin: pick(R, SKINS), hair: pick(R, HAIRS), seed: Math.floor(R() * 999), sleeve: 'short', shoes: pick(R, ['#6b4a2b', '#2a2a2a', '#c0392b', '#3a5a9a']) };
  if (type === 'hocsinh') {
    const girl = extra.girl !== undefined ? extra.girl : R() < 0.5;
    Object.assign(L, { top: '#ffffff', shirt: true, bottom: '#24375f', bottomType: girl ? 'skirt' : 'shorts', scarf: '#e0322b',
      hairStyle: girl ? pick(R, ['pigtails', 'ponytail', 'long']) : 'short', shoes: '#f1f1f1', scale: 0.86 });
  } else if (type === 'hangxom') {
    const col = pick(R, ['#3c6fb6', '#d1477a', '#2f9e74', '#8e5bb5', '#e07b39']);
    Object.assign(L, { top: col, topPat: 'floral', bottom: col, bottomPat: 'floral', bottomType: 'pants', flower: pick(R, ['#ffd1e1', '#fff3a0', '#bfe6ff']),
      hairStyle: pick(R, ['bun', 'ponytail', 'curly']), hold: 'basket', plump: R() < 0.5, nonla: extra.hat || R() < 0.25, earring: R() < 0.5 });
  } else if (type === 'ongcu') {
    const tank = R() < 0.55;
    Object.assign(L, { top: tank ? '#f4f4f0' : pick(R, ['#9aa58f', '#b9a88a', '#8fa3b5']), tank, topPat: tank ? null : 'check', sleeve: tank ? 'none' : 'short',
      bottom: pick(R, ['#6b5a46', '#4a5a6a', '#7a6a50']), bottomType: 'shorts', hairStyle: 'bald', hair: '#e8e8e8', mustache: '#e8e8e8', glasses: R() < 0.6, skin: pick(R, ['#e0b08a', '#d9a47c']), brows: '#d0d0d0' });
  } else if (type === 'shipper') {
    const col = pick(R, ['#1f9e5a', '#2b6cc4', '#e86a1c']);
    Object.assign(L, { top: col, jacket: true, sleeve: 'long', bottom: '#2c3440', bottomType: 'pants', hairStyle: 'helmet', helmet: col, hold: 'money', shoes: '#2a2a2a' });
  } else if (type === 'mevabe') {
    Object.assign(L, { top: pick(R, ['#e0605a', '#f0a04b', '#5a9bd6']), bottom: '#5a4636', bottomType: 'pants', hairStyle: pick(R, ['ponytail', 'long']), earring: true });
    L.kid = { skin: L.skin, hair: L.hair, hairStyle: 'short', top: '#f7d24a', bottom: '#3c9a52', bottomType: 'shorts', sleeve: 'short', scale: 0.58, seed: L.seed + 3, shoes: '#e74c3c' };
  }
  return L;
}

// ============================================================
//  CẢNH — lớp tĩnh (cache)
// ============================================================
function lerpColorKeys(keys, m) {
  if (m <= keys[0][0]) return keys[0].slice(1);
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (m <= b[0]) { const t = (m - a[0]) / (b[0] - a[0]); return [mix(a[1], b[1], t), mix(a[2], b[2], t)]; }
  }
  return keys[keys.length - 1].slice(1);
}
const SKY_KEYS = [
  [5 * 60, '#2a2f5c', '#7a6a8c'], [6 * 60, '#f6b994', '#fde2c8'], [8 * 60, '#9fd3f0', '#e3f3fb'],
  [16 * 60, '#8fcdf0', '#e8f4fa'], [17.5 * 60, '#f29a62', '#fcd59e'], [18.6 * 60, '#6a5a8f', '#e08f78'],
  [19.5 * 60, '#2b2f63', '#59527a'], [22 * 60, '#151938', '#2c2f55'],
];
function nightAmount(m) {
  if (m < 6.5 * 60) return Math.max(0, (6.5 * 60 - m) / 60) * 0.5;
  if (m < 17.6 * 60) return 0;
  return Math.min(0.55, (m - 17.6 * 60) / (2 * 60) * 0.55);
}

function drawSky(c, minute, weather, t) {
  let [top, bot] = lerpColorKeys(SKY_KEYS, minute);
  if (weather === 'mua') { top = mix(top, '#7d8a94', 0.6); bot = mix(bot, '#a9b3ba', 0.6); }
  const g = c.createLinearGradient(0, 0, 0, 600); g.addColorStop(0, top); g.addColorStop(1, bot);
  c.fillStyle = g; c.fillRect(0, 0, 300, 620);
  // mặt trời / trăng
  if (weather !== 'mua') {
    const dayP = (minute - 6 * 60) / (12 * 60);
    if (dayP > 0 && dayP < 1) { const sx = 40 + dayP * 200, sy = 230 - Math.sin(dayP * Math.PI) * 150; c.save(); c.globalAlpha = 0.85; circ(c, sx, sy, 20, '#fff2b0', 0); c.restore(); }
    else if (minute > 19 * 60) { circ(c, 200, 120, 13, '#f4f1d0', 0); circ(c, 206, 116, 11, top, 0); }
  }
  // mây
  c.save(); c.globalAlpha = weather === 'mua' ? 0.7 : 0.6;
  const cc = weather === 'mua' ? '#8f98a0' : '#ffffff';
  for (let i = 0; i < 3; i++) {
    const cx = ((t * 6 + i * 130) % 420) - 80, cy = 80 + i * 45;
    ell(c, cx, cy, 30, 12, cc, 0); ell(c, cx + 22, cy - 6, 22, 12, cc, 0); ell(c, cx - 20, cy + 2, 18, 9, cc, 0);
  }
  c.restore();
}

function buildBackLayer(c, st) {
  // --- ngoài phố ---
  // nhà phía xa
  const houses = [[-10, 250, 90, '#e8d9c0'], [78, 200, 80, '#d9c7aa'], [156, 280, 110, '#ead6b8']];
  houses.forEach(([x, y, w, col], i) => {
    rr(c, x, y, w, 600 - y, 0, col, 2, '#8a7a66');
    for (let r = 0; r < 4; r++) for (let k = 0; k < 2; k++) {
      const wx = x + 14 + k * (w / 2 - 4), wy = y + 22 + r * 70;
      if (wy > 540) continue;
      rr(c, wx, wy, 22, 30, 2, i === 1 ? '#a9c6d6' : '#b7cfda', 1.5, '#8a7a66');
      line(c, wx, wy + 15, wx + 22, wy + 15, '#8a7a66', 1);
    }
    rr(c, x - 4, y - 10, w + 8, 12, 2, shade(col, -0.25), 1.5, '#8a7a66');
    if (i === 1) { rr(c, x + 6, y + 90, w - 12, 8, 1, '#7a8a6a', 1.5); for (let k = 0; k < 6; k++) line(c, x + 10 + k * 12, y + 98, x + 10 + k * 12, y + 112, '#7a8a6a', 1.5); line(c, x + 6, y + 112, x + w - 6, y + 112, '#7a8a6a', 2); }
  });
  // cây xanh
  ell(c, 30, 470, 40, 34, '#6fa85a', 2, '#4a7a3a'); ell(c, 10, 440, 28, 24, '#7fb86a', 2, '#4a7a3a');
  rr(c, 24, 490, 10, 110, 3, '#8a5a3a', 2);
  // vỉa hè + đường
  c.fillStyle = '#b9b2a6'; c.fillRect(0, 600, 300, 120);
  c.strokeStyle = 'rgba(90,80,70,0.35)'; c.lineWidth = 1.5;
  for (let x = -20; x < 300; x += 40) { c.beginPath(); c.moveTo(x, 600); c.lineTo(x + 30, 720); c.stroke(); }
  for (let y = 630; y < 720; y += 30) { c.beginPath(); c.moveTo(0, y); c.lineTo(300, y); c.stroke(); }
  line(c, 0, 600, 300, 600, '#7a6a5a', 3);
  // cột điện
  rr(c, 104, 40, 16, 580, 3, '#a7a29a', 2.5);
  for (let y = 80; y < 600; y += 46) line(c, 106, y, 118, y, '#8f8a82', 1.5);
  rr(c, 70, 110, 84, 9, 2, '#8f8a82', 2);
  rr(c, 122, 200, 26, 34, 3, '#d4d8d0', 2); line(c, 128, 208, 142, 208, '#888', 1.5);
  // dây điện chằng chịt
  const wires = [[-20, 60, 300, 100, 40], [-20, 84, 300, 130, 30], [-20, 120, 300, 90, 50], [-20, 150, 300, 160, 25], [-20, 70, 300, 150, 60], [-20, 100, 300, 112, 20]];
  wires.forEach(([x1, y1, x2, y2, sag], i) => {
    c.beginPath(); c.moveTo(x1, y1); c.quadraticCurveTo(112, Math.max(y1, y2) + sag, x2, y2);
    c.strokeStyle = i % 2 ? '#2a2a2a' : '#3a3a3a'; c.lineWidth = 1.6; c.stroke();
  });
  // cuộn dây
  for (let i = 0; i < 5; i++) { c.beginPath(); c.ellipse(112, 150 + i * 3, 18 - i, 8, 0.2, 0, Math.PI * 2); c.strokeStyle = '#2a2a2a'; c.lineWidth = 1.4; c.stroke(); }

  // bàn ghế nhựa (nâng cấp)
  if (st.upgrades.banghe) drawPlasticSet(c);

  // --- trong tiệm ---
  // tường
  c.fillStyle = '#efdcb4'; c.fillRect(276, 40, 1004, 562);
  const R = mulberry(42);
  c.save(); c.globalAlpha = 0.08;
  for (let i = 0; i < 30; i++) ell(c, 280 + R() * 1000, 60 + R() * 520, 20 + R() * 60, 10 + R() * 40, '#8a6a3a', 0);
  c.restore();
  c.fillStyle = '#9cc2a8'; c.fillRect(276, 520, 1004, 82);
  line(c, 276, 520, 1280, 520, '#6f9a80', 3);
  // sàn gạch bông
  drawTiles(c, 276, 600, 1004, 120);
  line(c, 276, 601, 1280, 601, '#6b4a2b', 3);

  // mái tôn
  c.beginPath(); c.moveTo(170, 62); c.lineTo(1280, 26); c.lineTo(1280, 56); c.lineTo(170, 90); c.closePath();
  c.save(); c.clip();
  c.fillStyle = '#9aa3a8'; c.fillRect(150, 0, 1140, 100);
  for (let x = 160; x < 1290; x += 14) { c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(x, 0, 5, 100); c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(x + 8, 0, 4, 100); }
  const R2 = mulberry(9);
  c.globalAlpha = 0.55; for (let i = 0; i < 26; i++) ell(c, 170 + R2() * 1100, 30 + R2() * 60, 8 + R2() * 26, 4 + R2() * 7, R2() < 0.5 ? '#b0603a' : '#8a4a2a', 0);
  c.restore();
  c.beginPath(); c.moveTo(170, 62); c.lineTo(1280, 26); c.lineTo(1280, 56); c.lineTo(170, 90); c.closePath(); fs(c, null, 3);
  // xà ngang
  c.beginPath(); c.moveTo(276, 87); c.lineTo(1280, 55); c.lineTo(1280, 64); c.lineTo(276, 96); c.closePath(); fs(c, '#7a5232', 2);

  // cột cửa + hộp cửa cuốn
  rr(c, 262, 80, 18, 524, 2, '#c9c2b4', 2.5);
  rr(c, 236, 84, 70, 30, 6, '#8d959a', 2.5);
  for (let i = 0; i < 3; i++) line(c, 242, 92 + i * 8, 300, 92 + i * 8, '#6d757a', 1.2);

  // lịch treo tường
  rr(c, 300, 158, 56, 92, 3, '#fff', 2);
  rr(c, 300, 158, 56, 34, 3, '#d63a2f', 2);
  c.save(); rrPath(c, 304, 162, 48, 26, 2); c.clip(); c.fillStyle = '#9fd3f0'; c.fillRect(304, 162, 48, 26);
  ell(c, 320, 190, 22, 10, '#6fae5a', 0); ell(c, 345, 192, 18, 9, '#5f9e4a', 0); c.restore();
  txt(c, 'Tháng ' + (((st.day - 1) >> 3) % 12 + 1), 328, 202, 10, '#d63a2f');
  txt(c, String(((st.day - 1) % 28) + 1), 328, 226, 30, '#d63a2f');
  circ(c, 328, 156, 3, '#888', 1.5);
  // que treo dầu gội
  line(c, 368, 150, 470, 150, '#7a5232', 4);
  // kệ nhang
  rr(c, 478, 230, 68, 7, 2, '#8a5a32', 2);
  // bảng thẻ cào
  rr(c, 494, 250, 98, 82, 5, st.upgrades.thecao ? '#ffffff' : '#ece4d2', 2.5);
  rr(c, 494, 250, 98, 18, 5, st.upgrades.thecao ? '#1f8fb8' : '#b0a890', 2);
  txt(c, 'THẺ CÀO', 543, 259.5, 12, '#fff');

  // kệ gỗ
  rr(c, 596, 146, 250, 456, 3, '#7a4f2c', 3);
  rr(c, 604, 152, 234, 446, 2, '#5c3a20', 1.5);
  [250, 355, 460, 565].forEach(y => { rr(c, 598, y, 246, 9, 2, '#9a6a3f', 2); line(c, 602, y + 3, 840, y + 3, 'rgba(255,255,255,0.2)', 1.5); });
  rr(c, 590, 140, 262, 10, 2, '#9a6a3f', 2.5);
  // thùng giấy trang trí
  DECOR_BOXES.forEach(b => { const iw = b.w, ih = iw * ICON_H / ICON_W; c.drawImage(ICONS._box, b.x, b.y + b.h - ih, iw, ih); });

  // bàn thờ thần tài (trang trí)
  rr(c, 872, 160, 112, 54, 4, '#b8262b', 2.5);
  rr(c, 866, 210, 124, 8, 2, '#8a1a1e', 2);
  rr(c, 880, 168, 96, 38, 3, '#7a1418', 1.5);
  txt(c, '福', 928, 187, 20, '#f1c40f', { font: 'serif' });
  ell(c, 893, 202, 6, 4, '#f1c40f', 1.5); ell(c, 963, 202, 6, 4, '#f1c40f', 1.5);
  circ(c, 893, 194, 4, '#ff6a4a', 1.2); circ(c, 963, 194, 4, '#ff6a4a', 1.2);
  rr(c, 920, 196, 16, 10, 2, '#c99a5c', 1.5);
  for (let i = 0; i < 3; i++) line(c, 924 + i * 4, 196, 924 + i * 4, 178, '#b8432f', 1.4);

  // kệ sắt
  [864, 988].forEach(x => rr(c, x - 6, 226, 8, 376, 2, '#8d969c', 2));
  [330, 445, 560].forEach(y => {
    rr(c, 856, y, 140, 7, 2, '#aab2b8', 2);
    c.beginPath(); c.moveTo(862, y - 34); c.lineTo(990, y - 34); c.lineTo(986, y); c.lineTo(866, y); c.closePath();
    fs(c, y === 445 ? '#d9483b' : '#3a7cc9', 2);
    c.save(); c.globalAlpha = 0.25; for (let k = 0; k < 10; k++) line(c, 870 + k * 12, y - 30, 870 + k * 12, y - 4, '#fff', 2); c.restore();
  });
  rr(c, 856, 222, 140, 7, 2, '#aab2b8', 2);

  // đồng hồ treo tường
  circ(c, 1072, 226, 24, '#fffaf0', 3); circ(c, 1072, 226, 19, null, 1.2, '#c0a070');
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; circ(c, 1072 + Math.cos(a) * 16, 226 + Math.sin(a) * 16, 1, OUTLINE, 0); }

  // tủ kính (khung)
  rr(c, 1004, 380, 134, 222, 4, st.upgrades.tukinh ? '#dfe6ea' : '#d2d0c8', 3);
  rr(c, 1010, 388, 122, 92, 2, 'rgba(255,255,255,0.35)', 2);
  rr(c, 1010, 486, 122, 100, 2, 'rgba(255,255,255,0.35)', 2);
  rr(c, 1004, 374, 134, 9, 2, '#b8c2c8', 2.5);
  if (!st.upgrades.tukinh) txt(c, 'Tủ kính', 1071, 590, 11, '#6b4a22');

  // bóng đèn
  line(c, 1110, 55, 1110, 116, '#333', 2);
  rr(c, 1104, 112, 12, 8, 2, '#777', 1.5);

  // tủ mát (thân)
  rr(c, 1146, 160, 126, 442, 8, '#e8ecee', 3);
  rr(c, 1146, 160, 126, 50, 8, '#d7262b', 3);
  txt(c, 'NƯỚC GIẢI KHÁT', 1209, 180, 14, '#fff');
  txt(c, st.upgrades.tulanh ? '❄ ƯỚP LẠNH ❄' : 'mát lạnh', 1209, 198, 10, '#ffe0e0');
  rr(c, 1153, 218, 112, 368, 4, '#cfe4ef', 2.5);
  [335, 450, 565].forEach(y => rr(c, 1155, y, 108, 5, 1, '#aab8c0', 1.2));
  // thùng giấy trên nóc tủ
  rr(c, 1158, 120, 60, 40, 2, '#c99a5c', 2.5); line(c, 1158, 132, 1218, 132, '#a67a40', 2);
  rr(c, 1222, 132, 44, 28, 2, '#d4a86a', 2.5);

  // bảng hiệu (vẽ sau cùng để không bị kệ che)
  drawSign(c, st.upgrades.bienhieu);
}

function drawTiles(c, x0, y0, w, h) {
  const s = 40;
  for (let y = y0; y < y0 + h; y += s) for (let x = x0; x < x0 + w; x += s) {
    c.fillStyle = ((x / s + y / s) | 0) % 2 ? '#e9cfa3' : '#e2c595'; c.fillRect(x, y, s, s);
    c.save(); c.globalAlpha = 0.55;
    circ(c, x + s / 2, y + s / 2, 9, '#c4553a', 0);
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4; ell(c, x + s / 2 + Math.cos(a) * 13, y + s / 2 + Math.sin(a) * 13, 4, 4, '#3f7f6a', 0); }
    circ(c, x + s / 2, y + s / 2, 4, '#f1d07a', 0);
    c.restore();
    c.strokeStyle = 'rgba(120,80,40,0.35)'; c.lineWidth = 1; c.strokeRect(x, y, s, s);
  }
}

function drawSign(c, fresh) {
  line(c, 330, 88, 340, 100, '#555', 1.5); line(c, 800, 72, 790, 100, '#555', 1.5);
  rr(c, 300, 98, 530, 58, 6, fresh ? '#fff6cf' : '#efdc9c', 3, '#6b4a22');
  if (!fresh) { c.save(); c.globalAlpha = 0.18; for (let i = 0; i < 8; i++) ell(c, 320 + i * 64, 116 + (i % 2) * 18, 20, 8, '#8a6a3a', 0); c.restore(); }
  c.font = `bold 32px ${FONT_HAND}`;
  const w1 = c.measureText('TIỆM TẠP HÓA ').width, w2 = c.measureText('MỘNG MƠ').width;
  const x0 = 565 - (w1 + w2) / 2;
  txt(c, 'TIỆM TẠP HÓA', x0, 118, 32, fresh ? '#1f4fa0' : '#3a5a8c', { align: 'left' });
  txt(c, 'MỘNG MƠ', x0 + w1, 118, 32, fresh ? '#e0368a' : '#c0407a', { align: 'left' });
  // vài ngôi sao nhỏ "mộng mơ"
  [[x0 + w1 + w2 + 10, 106], [x0 + w1 + w2 + 4, 128], [x0 - 12, 110]].forEach(([sx, sy], i) => {
    c.save(); c.translate(sx, sy); c.rotate(i * 0.4); c.beginPath();
    for (let k = 0; k < 10; k++) { const a = k * Math.PI / 5 - Math.PI / 2, r = k % 2 ? 2.6 : 6.5; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    c.closePath(); fs(c, fresh ? '#ffd23f' : '#e0c060', 1.2); c.restore();
  });
  txt(c, '— Có bán thẻ cào, nước đá, đồ gia dụng —', 565, 144, 14, '#6b4a22', { weight: 'normal' });
  if (fresh) { [312, 818].forEach(x => { for (let i = 0; i < 4; i++) circ(c, x, 112 + i * 10, 2.5, ['#ff5a5a', '#ffd23f', '#5ad1ff', '#7aff7a'][i], 0.8); }); }
}

function drawPlasticSet(c) {
  // bàn tròn xanh + ghế đỏ / xanh
  const stool = (x, y, col) => {
    c.beginPath(); c.moveTo(x - 16, y - 34); c.lineTo(x + 16, y - 34); c.lineTo(x + 20, y); c.lineTo(x - 20, y); c.closePath(); fs(c, col, 2.2);
    rr(c, x - 19, y - 38, 38, 7, 3, shade(col, 0.15), 2.2);
    c.beginPath(); c.moveTo(x - 7, y); c.quadraticCurveTo(x, y - 16, x + 7, y); fs(c, '#b9b2a6', 1.5);
  };
  stool(36, 640, '#d9362b');
  c.beginPath(); c.moveTo(82, 646); c.lineTo(88, 604); c.lineTo(124, 604); c.lineTo(130, 646); fs(c, '#2f78c9', 2.2);
  ell(c, 106, 602, 34, 8, '#3a86d6', 2.4);
  rr(c, 96, 588, 8, 14, 2, '#f4f4f4', 1.5); rr(c, 108, 590, 8, 12, 2, '#e9c33b', 1.5);
  stool(176, 650, '#2f78c9');
}

function buildFrontLayer(c) {
  // bao gạo trước cửa
  const sack = (x, y, w, h, col, label) => {
    c.beginPath(); c.moveTo(x + 4, y + 8); c.quadraticCurveTo(x + w / 2, y - 6, x + w - 4, y + 8); c.quadraticCurveTo(x + w + 4, y + h / 2, x + w - 2, y + h);
    c.lineTo(x + 2, y + h); c.quadraticCurveTo(x - 4, y + h / 2, x + 4, y + 8); c.closePath(); fs(c, col, 2.5);
    c.save(); c.globalAlpha = 0.25; for (let i = 0; i < 6; i++) line(c, x + 6, y + 12 + i * 8, x + w - 6, y + 12 + i * 8, '#8a7a5a', 1); c.restore();
    txt(c, label, x + w / 2, y + h / 2 + 4, 13, '#2e7d4a');
  };
  sack(266, 560, 56, 44, '#f3efe4', 'GẠO');
  sack(272, 522, 48, 40, '#e8d9b0', 'GẠO');

  // quầy gỗ
  rr(c, 322, 476, 256, 126, 3, '#9a6a3f', 3);
  for (let x = 340; x < 578; x += 22) line(c, x, 480, x, 600, '#7a4f2c', 2);
  c.save(); c.globalAlpha = 0.18; const R = mulberry(5); for (let i = 0; i < 20; i++) { const x = 326 + R() * 248, y = 484 + R() * 110; line(c, x, y, x + 4, y + 12, '#3a2210', 1.2); } c.restore();
  rr(c, 312, 460, 276, 18, 4, '#7a4f2c', 3);
  line(c, 318, 464, 582, 464, 'rgba(255,255,255,0.25)', 2);
  // giấy "Sổ nợ" dán quầy
  c.save(); c.translate(540, 540); c.rotate(0.06);
  rr(c, -22, -26, 44, 52, 2, '#fff8e0', 2);
  txt(c, 'Sổ', 0, -8, 16, '#2a2a2a'); txt(c, 'nợ', 0, 10, 16, '#2a2a2a');
  c.restore();
  rr(c, 532, 512, 16, 6, 1, 'rgba(240,240,220,0.7)', 0);
  // giấy "Mua bán vui vẻ"
  c.save(); c.translate(400, 540); c.rotate(-0.04);
  rr(c, -46, -18, 92, 36, 2, '#ffe9a8', 2);
  txt(c, 'Mua bán vui vẻ', 0, -4, 13, '#c0392b'); txt(c, 'Miễn trả giá!', 0, 10, 11, '#2a4d9c');
  c.restore();
}

// ============================================================
//  PHẦN ĐỘNG
// ============================================================
function drawGlassOverlay(c) {
  // cửa kính tủ mát
  c.save(); c.globalAlpha = 0.16; rr(c, 1153, 218, 112, 368, 4, '#bfe6ff', 0); c.restore();
  c.save(); c.globalAlpha = 0.35;
  c.beginPath(); c.moveTo(1160, 560); c.lineTo(1200, 230); c.lineTo(1214, 230); c.lineTo(1174, 560); c.closePath(); c.fillStyle = '#fff'; c.fill(); c.restore();
  rr(c, 1153, 218, 112, 368, 4, null, 2.5);
  rr(c, 1250, 340, 8, 70, 3, '#aab2b8', 2);
  // tủ kính
  c.save(); c.globalAlpha = 0.3;
  c.beginPath(); c.moveTo(1016, 475); c.lineTo(1040, 392); c.lineTo(1050, 392); c.lineTo(1026, 475); c.closePath(); c.fillStyle = '#fff'; c.fill();
  c.beginPath(); c.moveTo(1016, 580); c.lineTo(1044, 490); c.lineTo(1054, 490); c.lineTo(1026, 580); c.closePath(); c.fill();
  c.restore();
}

function drawClockHands(c, minute) {
  const h = (minute / 60) % 12, m = minute % 60;
  const ah = h / 12 * Math.PI * 2 - Math.PI / 2, am = m / 60 * Math.PI * 2 - Math.PI / 2;
  line(c, 1072, 226, 1072 + Math.cos(ah) * 10, 226 + Math.sin(ah) * 10, OUTLINE, 2.5);
  line(c, 1072, 226, 1072 + Math.cos(am) * 15, 226 + Math.sin(am) * 15, OUTLINE, 1.6);
  circ(c, 1072, 226, 2, '#c0392b', 0);
}

function drawFan(c, t) {
  const x = 562, y = 404;
  rr(c, x - 4, y + 18, 8, 34, 2, '#5fb3a8', 2);
  ell(c, x, y + 54, 18, 6, '#4aa093', 2);
  const osc = Math.sin(t * 0.8) * 0.25;
  c.save(); c.translate(x, y); c.scale(Math.cos(osc), 1);
  circ(c, 0, 0, 22, 'rgba(150,220,210,0.25)', 2);
  c.save(); c.rotate(t * 25);
  for (let i = 0; i < 3; i++) { c.rotate(Math.PI * 2 / 3); ell(c, 0, -10, 6, 11, 'rgba(110,200,190,0.75)', 1.2); }
  c.restore();
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; line(c, 0, 0, Math.cos(a) * 22, Math.sin(a) * 22, 'rgba(60,90,90,0.5)', 1); }
  circ(c, 0, 0, 4.5, '#3c8f84', 1.5);
  c.restore();
}

function drawCalculator(c, display, flash) {
  const r = RECT_CALC;
  rr(c, r.x, r.y, r.w, r.h, 4, '#2f3b4a', 2.5);
  rr(c, r.x + 4, r.y + 3, r.w - 8, 10, 2, flash ? '#ffe98a' : '#b9c8a0', 1.5);
  fitTxt(c, display, r.x + r.w - 6, r.y + 8.5, 9, r.w - 12, '#1d2a14', { align: 'right', font: 'monospace' });
  for (let i = 0; i < 4; i++) for (let k = 0; k < 2; k++) rr(c, r.x + 5 + i * 9.5, r.y + 16 + k * 5.5, 7, 4, 1, i === 3 ? '#e07b39' : '#cfd6dc', 0);
}

function drawSoNo(c, hover) {
  const r = RECT_SONO;
  c.save(); c.translate(r.x + r.w / 2, r.y + r.h / 2); c.rotate(-0.05);
  rr(c, -r.w / 2, -r.h / 2 + 3, r.w, r.h - 3, 2, '#f4efe0', 2);
  rr(c, -r.w / 2, -r.h / 2, r.w, r.h - 4, 2, '#2a5a9c', 2.2);
  txt(c, 'SỔ NỢ', 0, -2, 11, '#fff');
  if (hover) { c.shadowColor = '#fff6a0'; c.shadowBlur = 10; rrPath(c, -r.w / 2 - 3, -r.h / 2 - 3, r.w + 6, r.h + 6, 4); fs(c, null, 3, '#ffcf33'); }
  c.restore();
}

function drawBag(c, bag, t) {
  const ids = Object.keys(bag).filter(k => bag[k] > 0);
  const r = RECT_BAG;
  const count = ids.reduce((a, k) => a + bag[k], 0);
  if (count === 0) {
    c.save(); c.globalAlpha = 0.9;
    rr(c, r.x + 14, r.y + r.h - 12, 52, 10, 3, '#f5d9e6', 1.8);
    c.restore();
    return;
  }
  const fill = Math.min(1, 0.45 + count * 0.08);
  const bh = 44 + fill * 26, bw = 56 + fill * 14;
  const bx = r.x + r.w / 2, by = r.y + r.h;
  // món thò lên
  const shown = [];
  ids.forEach(k => { for (let i = 0; i < Math.min(bag[k], 2); i++) shown.push(k); });
  shown.slice(0, 6).forEach((k, i) => {
    const ix = bx - bw / 2 + 8 + (i % 3) * (bw - 16) / 2.4, iy = by - bh - 10 + Math.floor(i / 3) * 10 + Math.sin(t * 3 + i) * 0.8;
    c.drawImage(ICONS[k], ix - 4, iy, 26, 34);
  });
  // túi nilon hồng
  c.save(); c.globalAlpha = 0.82;
  c.beginPath(); c.moveTo(bx - bw / 2, by - bh); c.quadraticCurveTo(bx - bw / 2 - 6, by - bh / 2, bx - bw / 2 + 4, by); c.lineTo(bx + bw / 2 - 4, by);
  c.quadraticCurveTo(bx + bw / 2 + 6, by - bh / 2, bx + bw / 2, by - bh); c.quadraticCurveTo(bx, by - bh + 8, bx - bw / 2, by - bh); c.closePath();
  fs(c, '#f7c4d8', 2.2);
  c.restore();
  c.beginPath(); c.arc(bx - bw / 4, by - bh, 9, Math.PI, 0); c.strokeStyle = '#e79bbb'; c.lineWidth = 5; c.stroke();
  c.beginPath(); c.arc(bx + bw / 4, by - bh, 9, Math.PI, 0); c.stroke();
  shine(c, bx - bw / 2 + 8, by - bh + 10, bx - bw / 2 + 6, by - 8, 3);
  circ(c, bx + bw / 2 - 2, by - bh + 6, 11, '#ffcf33', 2);
  txt(c, String(count), bx + bw / 2 - 2, by - bh + 6.5, 13, OUTLINE);
}

function drawBulbGlow(c, amt) {
  if (amt <= 0) return;
  const k = amt / 0.55;
  c.save(); c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(1110, 126, 4, 1110, 126, 300);
  g.addColorStop(0, `rgba(255,190,90,${0.32 * k})`); g.addColorStop(0.5, `rgba(255,170,70,${0.1 * k})`); g.addColorStop(1, 'rgba(255,160,60,0)');
  c.fillStyle = g; c.fillRect(780, 0, 500, 500);
  const g2 = c.createRadialGradient(470, 380, 10, 470, 380, 260);
  g2.addColorStop(0, `rgba(255,190,100,${0.22 * k})`); g2.addColorStop(1, 'rgba(255,160,60,0)');
  c.fillStyle = g2; c.fillRect(200, 100, 560, 560);
  c.restore();
  c.save(); c.shadowColor = '#ffd27a'; c.shadowBlur = 18 * k; circ(c, 1110, 126, 8, '#fff2b0', 1.5); c.restore();
}

function drawRain(c, t) {
  c.save(); c.beginPath(); c.rect(0, 0, 262, 720); c.clip();
  c.strokeStyle = 'rgba(220,235,255,0.55)'; c.lineWidth = 1.4;
  for (let i = 0; i < 70; i++) {
    const x = (i * 37.3 + t * 60) % 300 - 20, y = (i * 91.7 + t * 620) % 720;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x - 5, y + 16); c.stroke();
  }
  c.restore();
  c.save(); c.globalAlpha = 0.15; c.fillStyle = '#5a6a7a'; c.fillRect(0, 600, 262, 120); c.restore();
}

// bong bóng thoại
function drawBubble(c, ax, ay, header, lines, patience, o = {}) {
  c.save();
  const pad = 10, lh = 30;
  c.font = `bold 16px ${FONT_HAND}`;
  let w = c.measureText(header).width + pad * 2 + 4;
  lines.forEach(l => { c.font = `bold 15px ${FONT_HAND}`; w = Math.max(w, c.measureText(l.text).width + (l.icon ? 34 : 0) + 34 + pad * 2); });
  w = Math.min(Math.max(w, 150), 300);
  const h = 32 + lines.length * lh + (patience !== null ? 12 : 0);
  let x = ax - w / 2; x = Math.max(6, Math.min(x, 600 - w));
  const y = ay - h - 14;
  // đuôi
  c.beginPath(); c.moveTo(ax - 10, y + h - 2); c.lineTo(ax + 2, ay); c.lineTo(ax + 12, y + h - 2); c.closePath(); fs(c, '#fffdf5', 2.5);
  rr(c, x, y, w, h, 12, '#fffdf5', 2.5);
  c.beginPath(); c.moveTo(ax - 8, y + h - 2.5); c.lineTo(ax + 10, y + h - 2.5); c.strokeStyle = '#fffdf5'; c.lineWidth = 4; c.stroke();
  fitTxt(c, header, x + pad, y + 16, 16, w - pad * 2, o.headerColor || '#8a3a1a', { align: 'left' });
  let yy = y + 32;
  if (patience !== null) {
    rr(c, x + pad, yy - 4, w - pad * 2, 7, 3, '#eee', 1.2);
    const pc = patience > 0.5 ? '#5fae6b' : patience > 0.25 ? '#f0b429' : '#e0453a';
    if (patience > 0.01) rr(c, x + pad, yy - 4, (w - pad * 2) * patience, 7, 3, pc, 0);
    yy += 10;
  }
  lines.forEach(l => {
    let lx = x + pad;
    if (l.icon) { c.drawImage(ICONS[l.icon], lx, yy + 1, 22, 28); lx += 28; }
    const col = l.oos ? '#aaa' : l.done ? '#2e7d4a' : (l.color || '#3b2a20');
    fitTxt(c, l.text, lx, yy + lh / 2, 15, x + w - pad - 18 - lx, col, { align: 'left' });
    if (l.oos) { c.font = `bold 15px ${FONT_HAND}`; const tw = c.measureText(l.text).width; line(c, lx, yy + lh / 2, lx + tw, yy + lh / 2, '#c0392b', 2); }
    if (l.done) txt(c, '✔', x + w - pad - 6, yy + lh / 2, 16, '#2e7d4a');
    yy += lh;
  });
  c.restore();
  return { x, y, w, h };
}

function drawMiniPatience(c, x, y, p) {
  rr(c, x - 20, y, 40, 6, 3, 'rgba(255,255,255,0.85)', 1.5);
  const pc = p > 0.5 ? '#5fae6b' : p > 0.25 ? '#f0b429' : '#e0453a';
  if (p > 0.01) rr(c, x - 20, y, 40 * p, 6, 3, pc, 0);
}

function drawTooltip(c, x, y, lines) {
  c.save();
  c.font = `bold 15px ${FONT_HAND}`;
  const w = Math.max(...lines.map(l => c.measureText(l).width)) + 20;
  const h = lines.length * 19 + 10;
  let tx = Math.min(x + 14, VW - w - 6), ty = Math.max(46, y - h - 8);
  rr(c, tx, ty, w, h, 8, 'rgba(59,42,32,0.92)', 0);
  lines.forEach((l, i) => txt(c, l, tx + 10, ty + 14 + i * 19, i === 0 ? 15 : 13, i === 0 ? '#ffe9a8' : '#fff', { align: 'left' }));
  c.restore();
}
