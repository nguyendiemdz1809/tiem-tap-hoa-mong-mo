// Đóng gói game:
//   web/   -> trang web hoàn chỉnh (PWA, chơi được khi mất mạng) để đăng lên hosting
//   dist/tiem-tap-hoa-mong-mo.html -> 1 file duy nhất (gửi bạn bè / đăng artifact)
// Chạy: node tools/build.js
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const write = (p, s) => { const f = path.join(root, p); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, s); return f; };

const html = read('index.html');
const css = read('css/style.css');
const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
const js = scripts.map(p => `// ---- ${p} ----\n` + read(p)).join('\n');
if (/<\/script/i.test(js)) throw new Error('JS chứa </script>, không inline được');
const body = html.match(/<body>([\s\S]*?)<script/)[1].trim();
const FONT = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap&subset=vietnamese">';
const VERSION = new Date().toISOString().replace(/\D/g, '').slice(0, 12);

// ---------- 1 file ----------
const single = `<title>Tiệm Tạp Hóa Mộng Mơ</title>\n${FONT}\n<style>\n${css}\n</style>\n${body}\n<script>\n${js}\n</script>\n`;
const f1 = write('dist/tiem-tap-hoa-mong-mo.html', single);

// ---------- web (PWA) ----------
const ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
<rect width="512" height="512" rx="96" fill="#f4e3a1"/>
<path d="M60 190 L256 90 L452 190 Z" fill="#9aa3a8" stroke="#3b2a20" stroke-width="14" stroke-linejoin="round"/>
<rect x="96" y="190" width="320" height="250" fill="#efdcb4" stroke="#3b2a20" stroke-width="14"/>
<rect x="128" y="300" width="256" height="140" fill="#9a6a3f" stroke="#3b2a20" stroke-width="12"/>
<rect x="120" y="205" width="272" height="70" rx="12" fill="#fff6cf" stroke="#3b2a20" stroke-width="10"/>
<text x="256" y="254" font-family="Arial, sans-serif" font-weight="bold" font-size="42" text-anchor="middle" fill="#e0368a">MỘNG MƠ</text>
<circle cx="190" cy="370" r="26" fill="#e8559a" stroke="#3b2a20" stroke-width="8"/>
<circle cx="256" cy="370" r="26" fill="#f6c431" stroke="#3b2a20" stroke-width="8"/>
<circle cx="322" cy="370" r="26" fill="#3fae4a" stroke="#3b2a20" stroke-width="8"/>
</svg>`;
write('web/icon.svg', ICON);
write('web/manifest.webmanifest', JSON.stringify({
  name: 'Tiệm Tạp Hóa Mộng Mơ', short_name: 'Mộng Mơ', start_url: './', scope: './',
  display: 'fullscreen', orientation: 'landscape', background_color: '#2b211b', theme_color: '#3b2a20', lang: 'vi',
  icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
}, null, 2));
write('web/sw.js', `// Service worker: lưu game vào máy để chơi được khi mất mạng
const CACHE = 'mongmo-${VERSION}';
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./', './index.html', './manifest.webmanifest', './icon.svg'])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (req.mode === 'navigate' || url.origin === location.origin) {
    // mạng trước (để có bản mới), mất mạng thì dùng bản đã lưu
    e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return r; })
      .catch(() => caches.match(req).then(r => r || caches.match('./index.html'))));
  } else if (/fonts\\.(googleapis|gstatic)\\.com$/.test(url.hostname)) {
    // font: dùng bản đã lưu, chưa có thì tải rồi lưu
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return res; })));
  }
});
`);
const page = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no">
<title>Tiệm Tạp Hóa Mộng Mơ</title>
<meta name="description" content="Game 2D mô phỏng tiệm tạp hóa Việt Nam: bán hàng, thối tiền, ghi sổ nợ, nâng cấp tiệm. Vắng mặt vẫn có tiền!">
<meta name="theme-color" content="#3b2a20">
<meta property="og:title" content="Tiệm Tạp Hóa Mộng Mơ">
<meta property="og:description" content="Vào làm bà chủ tiệm tạp hóa: bán hàng, thối tiền, ghi sổ nợ!">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="icon.svg">
<meta name="apple-mobile-web-app-capable" content="yes">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
${FONT}
<style>
${css}
</style>
</head>
<body>
${body}
<script>
${js}
</script>
<script>
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
</script>
</body>
</html>
`;
const f2 = write('web/index.html', page);
console.log('OK');
console.log(' 1 file :', f1, (single.length / 1024).toFixed(1) + ' KB');
console.log(' web    :', path.dirname(f2), '(index.html, sw.js, manifest.webmanifest, icon.svg)');
