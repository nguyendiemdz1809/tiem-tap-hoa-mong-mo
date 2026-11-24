'use strict';
// ============================================================
//  DỮ LIỆU GAME — sửa giá, tên hàng, khách, nâng cấp ở đây
// ============================================================

const VW = 1280, VH = 720;
const FONT_HAND = '"Patrick Hand", "Segoe Print", "Comic Sans MS", cursive';

const SEC_PER_MIN = 0.4;          // 1 phút trong game = 0.4 giây thật
const OPEN_MIN = 6 * 60;          // mở cửa 6:00
const CLOSE_MIN = 21 * 60;        // đóng cửa 21:00
const START_MONEY = 500000;
const MAX_STOCK = 20;
const CREDIT_LIMIT = 300000;      // nợ tối đa mỗi người

// Mệnh giá tiền dùng để thối
const BILLS = [1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000];
const BILL_COLORS = {
  1000: '#c9b27c', 2000: '#a8977f', 5000: '#8f86c4', 10000: '#d9a441',
  20000: '#5a8fd0', 50000: '#d9709b', 100000: '#5fae6b', 200000: '#e0774a', 500000: '#4cb5c9',
};

// icon.k = kiểu hình vẽ (xem ICON_DRAW trong art.js)
// lock = id nâng cấp cần mua để mở bán (null = có sẵn)
const ITEMS = {
  // --- Đồ ăn vặt (kệ sắt) ---
  snacktom:   { name: 'Snack tôm cay',  unit: 'gói',  price: 6000,  cost: 4000,  start: 8, icon: { k: 'bag', c: '#f07a2a', c2: '#ffd23f', t: ['SNACK', 'TÔM'], pic: 'shrimp' } },
  bimbim:     { name: 'Bim bim que',    unit: 'gói',  price: 5000,  cost: 3500,  start: 8, icon: { k: 'bag', c: '#3fae4a', c2: '#c8e64a', t: ['BIM', 'BIM'], pic: 'stick' } },
  mitom:      { name: 'Mì tôm chua cay',unit: 'gói',  price: 5000,  cost: 3800,  start: 10, icon: { k: 'noodle', c: '#e8559a', t: ['MÌ TÔM', 'chua cay'] } },
  phogoi:     { name: 'Phở gói',        unit: 'gói',  price: 8000,  cost: 6000,  start: 6, icon: { k: 'noodle', c: '#e9473b', t: ['PHỞ', 'bò'] } },
  banhgau:    { name: 'Bánh gấu',       unit: 'gói',  price: 10000, cost: 7500,  start: 6, icon: { k: 'bag', c: '#f3c74a', c2: '#fff0b0', t: ['BÁNH', 'GẤU'], pic: 'bear' } },
  hatdua:     { name: 'Hạt hướng dương',unit: 'gói',  price: 12000, cost: 8500,  start: 5, icon: { k: 'bag', c: '#2f63b5', c2: '#7fb2ff', t: ['HẠT', 'H.DƯƠNG'], pic: 'sun' } },

  // --- Đồ khô & gia vị (kệ gỗ) ---
  nuocmam:    { name: 'Nước mắm',       unit: 'chai', price: 38000, cost: 30000, start: 5, icon: { k: 'bottle', c: '#9b3b1e', lab: '#f4d35e', cap: '#c0392b', t: ['NƯỚC', 'MẮM'] } },
  nuoctuong:  { name: 'Nước tương',     unit: 'chai', price: 18000, cost: 14000, start: 5, icon: { k: 'bottle', c: '#3a1d12', lab: '#e74c3c', cap: '#d4a017', t: ['NƯỚC', 'TƯƠNG'] } },
  tuongot:    { name: 'Tương ớt',       unit: 'chai', price: 15000, cost: 11000, start: 5, icon: { k: 'squeeze', c: '#d9302a', lab: '#fff3c4', cap: '#2e8b3d', t: ['TƯƠNG', 'ỚT'] } },
  dauan:      { name: 'Dầu ăn',         unit: 'chai', price: 48000, cost: 40000, start: 4, icon: { k: 'oil', c: '#f6c431', lab: '#2e8b57', cap: '#d63a2f', t: ['DẦU ĂN'] } },
  botngot:    { name: 'Bột ngọt',       unit: 'gói',  price: 14000, cost: 10000, start: 5, icon: { k: 'packet', c: '#ffffff', c2: '#e63b3b', t: ['BỘT', 'NGỌT'] } },
  hatnem:     { name: 'Hạt nêm',        unit: 'gói',  price: 28000, cost: 22000, start: 4, icon: { k: 'packet', c: '#3fa34d', c2: '#fff1a8', t: ['HẠT', 'NÊM'] } },
  duong:      { name: 'Đường',          unit: 'bịch', price: 25000, cost: 20000, start: 4, icon: { k: 'packet', c: '#dff0ff', c2: '#3c7fd1', t: ['ĐƯỜNG'] } },
  caphe:      { name: 'Cà phê gói',     unit: 'bịch', price: 55000, cost: 45000, start: 3, icon: { k: 'coffee', c: '#7a1f1f', c2: '#e5b84b', t: ['CÀ', 'PHÊ'] } },
  suadac:     { name: 'Sữa đặc',        unit: 'lon',  price: 26000, cost: 21000, start: 4, icon: { k: 'condensed', c: '#2b5fb4', c2: '#ffffff', t: ['SỮA ĐẶC'] } },
  suahop:     { name: 'Sữa hộp',        unit: 'hộp',  price: 8000,  cost: 6000,  start: 8, icon: { k: 'milkbox', c: '#2f9e5a', t: ['SỮA'] } },
  botgiat:    { name: 'Bột giặt',       unit: 'bịch', price: 35000, cost: 28000, start: 4, icon: { k: 'detergent', c: '#3157c9', t: ['BỘT', 'GIẶT'] } },

  // --- Gia dụng (cần nâng cấp "Góc gia dụng") ---
  nhangmuoi:  { name: 'Nhang muỗi',     unit: 'hộp',  price: 18000, cost: 13000, start: 4, lock: 'giadung', icon: { k: 'coil', c: '#3c9a52' } },
  xo:         { name: 'Xô nhựa',        unit: 'cái',  price: 40000, cost: 30000, start: 3, lock: 'giadung', icon: { k: 'bucket', c: '#d9362b' } },
  choi:       { name: 'Chổi đót',       unit: 'cây',  price: 35000, cost: 25000, start: 3, lock: 'giadung', icon: { k: 'broom' } },

  // --- Tủ kính bánh kẹo (cần nâng cấp) ---
  keome:      { name: 'Kẹo me',         unit: 'bịch', price: 3000,  cost: 1800,  start: 10, lock: 'tukinh', icon: { k: 'jar', c: '#9a5a2a', c2: '#c98a4a', t: ['KẸO ME'] } },
  banhtrang:  { name: 'Bánh tráng trộn',unit: 'bịch', price: 10000, cost: 6000,  start: 8, lock: 'tukinh', icon: { k: 'jar', c: '#ead9a6', c2: '#e2602a', t: ['B.TRÁNG'] } },
  keomut:     { name: 'Kẹo mút',        unit: 'cây',  price: 2000,  cost: 1200,  start: 12, lock: 'tukinh', icon: { k: 'lolli' } },
  banhbonglan:{ name: 'Bánh bông lan',  unit: 'cái',  price: 6000,  cost: 4000,  start: 8, lock: 'tukinh', icon: { k: 'cake', c: '#f5d76e', t: ['BÔNG LAN'] } },

  // --- Tủ mát ---
  nuocsuoi:   { name: 'Nước suối',      unit: 'chai', price: 6000,  cost: 4000,  start: 10, icon: { k: 'water' } },
  nuocngot:   { name: 'Nước ngọt',      unit: 'lon',  price: 10000, cost: 7500,  start: 10, icon: { k: 'can', c: '#d7262b', c2: '#ffffff', t: 'NƯỚC NGỌT' } },
  suachua:    { name: 'Sữa chua',       unit: 'hũ',   price: 7000,  cost: 5000,  start: 6, icon: { k: 'yogurt', c: '#ef6f9a' } },
  tangluc:    { name: 'Nước tăng lực',  unit: 'lon',  price: 12000, cost: 9000,  start: 8, lock: 'tulanh', icon: { k: 'can', c: '#f08a1c', c2: '#d7262b', t: 'TĂNG LỰC' } },
  bia:        { name: 'Bia lon',        unit: 'lon',  price: 16000, cost: 12500, start: 10, lock: 'tulanh', icon: { k: 'can', c: '#e9c33b', c2: '#1f6b3a', t: 'BIA' } },
  nuocda:     { name: 'Nước đá',        unit: 'bịch', price: 5000,  cost: 2000,  start: 10, lock: 'tulanh', icon: { k: 'ice' } },

  // --- Treo tường & quầy ---
  daugoi:     { name: 'Dầu gội (gói)',  unit: 'gói',  price: 2000,  cost: 1200,  start: 15, icon: { k: 'sachet', cs: ['#e85d9c', '#f4c542', '#9b59b6', '#e85d9c'] } },
  nhang:      { name: 'Nhang thơm',     unit: 'bó',   price: 15000, cost: 10000, start: 5, icon: { k: 'incense' } },
  batlua:     { name: 'Bật lửa',        unit: 'cái',  price: 5000,  cost: 3000,  start: 8, icon: { k: 'lighter', c: '#e63946' } },
  thecao10:   { name: 'Thẻ cào 10k',    unit: 'thẻ',  price: 10000, cost: 9300,  start: 8, lock: 'thecao', icon: { k: 'card', c: '#e2403a', v: '10K' } },
  thecao20:   { name: 'Thẻ cào 20k',    unit: 'thẻ',  price: 20000, cost: 18800, start: 6, lock: 'thecao', icon: { k: 'card', c: '#1f8fb8', v: '20K' } },
  thecao50:   { name: 'Thẻ cào 50k',    unit: 'thẻ',  price: 50000, cost: 47500, start: 4, lock: 'thecao', icon: { k: 'card', c: '#e9a21a', v: '50K' } },
};

const UPGRADES = [
  { id: 'quat',     name: 'Quạt điện',         price: 250000, desc: 'Mát mẻ hơn — khách mất kiên nhẫn chậm hơn 25%.' },
  { id: 'giadung',  name: 'Góc đồ gia dụng',   price: 300000, desc: 'Mở bán chổi đót, xô nhựa, nhang muỗi. Các chị hàng xóm khoái.' },
  { id: 'tukinh',   name: 'Tủ kính bánh kẹo',  price: 400000, desc: 'Mở bán kẹo mút, kẹo me, bánh tráng trộn, bánh bông lan. Học sinh ghé nhiều hơn.' },
  { id: 'thecao',   name: 'Đại lý thẻ cào',    price: 300000, desc: 'Bán thẻ cào điện thoại. Anh shipper ghé thường xuyên.' },
  { id: 'tulanh',   name: 'Nâng cấp tủ mát',   price: 600000, desc: 'Bán bia, nước tăng lực, nước đá. Ngày nắng bán đắt như tôm tươi. (+10k tiền điện/ngày)' },
  { id: 'banghe',   name: 'Bàn ghế nhựa',      price: 350000, desc: 'Khách xếp hàng có chỗ ngồi, đỡ sốt ruột. Các ông ghé ngồi chơi.' },
  { id: 'bienhieu', name: 'Bảng hiệu mới',     price: 500000, desc: 'Tiệm sáng sủa: +0.5 uy tín, đông khách hơn 10%.' },
];

// ----- Khách hàng -----
// wants: trọng số món hay mua. hours: [giờ bắt đầu, giờ kết thúc, hệ số]
const CUSTOMER_TYPES = {
  hocsinh: {
    label: 'Học sinh', patience: 38, maxItems: 2, maxQty: 2, exact: 0.45, credit: 0.06,
    bills: [10000, 20000, 50000], speed: 95, scale: 0.86,
    wants: { snacktom: 4, bimbim: 4, keomut: 5, keome: 4, banhtrang: 5, banhbonglan: 3, banhgau: 3, suahop: 3, nuocngot: 2, nuocsuoi: 2, suachua: 2, mitom: 1 },
    hours: [[6, 7.5, 2.5], [10.5, 11.6, 2.2], [16, 17.5, 2.5], [19, 24, 0]],
    greet: ['Cô ơi bán con', 'Cô Hoa ơi, con mua', 'Bán cho con'],
  },
  hangxom: {
    label: 'Hàng xóm', patience: 55, maxItems: 3, maxQty: 2, exact: 0.25, credit: 0.35,
    bills: [50000, 100000, 200000], speed: 70, scale: 1,
    wants: { nuocmam: 4, nuoctuong: 3, tuongot: 2, dauan: 3, botngot: 3, hatnem: 3, duong: 3, mitom: 3, phogoi: 2, botgiat: 3, daugoi: 3, suadac: 2, nhangmuoi: 2, xo: 1, choi: 1, nuocda: 2, nhang: 1 },
    hours: [[6, 9, 2.2], [10, 11.2, 1.8], [16, 18.5, 2.2], [20, 24, 0.4]],
    greet: ['Hoa ơi, bán chị', 'Bà Hoa ơi, lấy giùm', 'Hoa ơi cho chị'],
  },
  ongcu: {
    label: 'Ông cụ', patience: 70, maxItems: 2, maxQty: 3, exact: 0.3, credit: 0.3,
    bills: [20000, 50000, 100000, 200000], speed: 50, scale: 1,
    wants: { bia: 5, nhang: 3, caphe: 2, hatdua: 4, batlua: 3, nuocsuoi: 1, nuocda: 2, nuocngot: 1, suadac: 1 },
    hours: [[6, 8, 1.5], [14, 16.5, 1.8], [18, 21, 1.8]],
    greet: ['Con Hoa ơi, bán bác', 'Hoa à, lấy cho bác', 'Cho ông'],
  },
  shipper: {
    label: 'Shipper', patience: 28, maxItems: 2, maxQty: 2, exact: 0.08, credit: 0.03,
    bills: [100000, 200000, 500000], speed: 120, scale: 1,
    wants: { nuocsuoi: 4, tangluc: 4, nuocngot: 3, mitom: 1, thecao10: 3, thecao20: 3, thecao50: 2, batlua: 1, banhbonglan: 1 },
    hours: [[6, 9.5, 0.6], [10, 14, 1.8], [17, 20, 1.6]],
    greet: ['Chị ơi lấy em', 'Cô ơi nhanh giùm con', 'Bán em lẹ'],
  },
  mevabe: {
    label: 'Mẹ và bé', patience: 42, maxItems: 3, maxQty: 2, exact: 0.3, credit: 0.2,
    bills: [50000, 100000, 200000], speed: 60, scale: 1,
    wants: { suahop: 5, suachua: 4, keomut: 3, banhgau: 4, banhbonglan: 3, snacktom: 2, suadac: 2, daugoi: 2, duong: 1 },
    hours: [[7, 11, 1.6], [16, 19, 1.8], [19.5, 24, 0.2]],
    greet: ['Cô Hoa ơi, bán em', 'Chị Hoa, lấy giùm em', 'Cho em'],
  },
};

// Khách quen — có thể ghi sổ nợ. honesty = khả năng trả nợ / trả lại tiền thối dư
const REGULARS = [
  { name: 'Bé Na',     type: 'hocsinh', honesty: 0.9, girl: true },
  { name: 'Bé Tí',     type: 'hocsinh', honesty: 0.8, girl: false },
  { name: 'Cô Tư',     type: 'hangxom', honesty: 0.85 },
  { name: 'Chị Lan',   type: 'hangxom', honesty: 0.6 },
  { name: 'Bà Năm',    type: 'hangxom', honesty: 0.95, hat: true },
  { name: 'Ông Sáu',   type: 'ongcu',   honesty: 0.85 },
  { name: 'Ông Bảy',   type: 'ongcu',   honesty: 0.3 },
  { name: 'Anh Hùng',  type: 'shipper', honesty: 0.9 },
  { name: 'Chị Mai',   type: 'mevabe',  honesty: 0.7 },
];

const LINES = {
  thanks:   ['Cảm ơn cô nha!', 'Mai con ghé nữa!', 'Tiệm Mộng Mơ là nhất!', 'Hay quá, lẹ ghê!', 'Cảm ơn nghen!'],
  angry:    ['Lâu quá, thôi đi chỗ khác!', 'Trời ơi chờ hoài!', 'Thôi khỏi mua!', 'Chậm như rùa!'],
  missing:  ['Còn thiếu {x} nè cô!', 'Ủa {x} đâu cô?', 'Quên {x} rồi kìa!'],
  extra:    ['Ủa con đâu có lấy {x}!', '{x} đâu phải của con!', 'Cô bỏ lộn {x} rồi!'],
  credit: {
    hocsinh: ['Mai con đem tiền trả cô nha!', 'Con quên đem tiền, ghi sổ giùm con!'],
    hangxom: ['Ghi sổ giùm chị nha, cuối tháng chị trả!', 'Ghi sổ đi Hoa, bữa nào lãnh lương chị trả!'],
    ongcu:   ['Bác quên đem tiền, ghi sổ nghen con!', 'Ghi sổ cho bác, mai bác gửi!'],
    shipper: ['Ghi sổ giùm em, chạy xong đơn em trả!'],
    mevabe:  ['Ghi sổ giùm em, chồng em về em trả nha!', 'Bữa nay em quên ví, ghi sổ giùm em!'],
  },
  shortCh:  ['Ủa thối thiếu rồi cô ơi!', 'Thiếu tiền thối nè cô!', 'Cô đếm lại đi, thiếu rồi!'],
  extraCh:  ['Cô thối dư nè, gửi lại cô!', 'Dư tiền rồi cô ơi!'],
  repay:    ['Gửi tiền nợ hôm bữa nè!', 'Trả nợ nè, cảm ơn cô hôm trước!', 'Tiền sổ nợ đây nha!'],
  oosOk:    ['Hết rồi hả? Thôi cũng được.', 'Vậy lấy nhiêu đó thôi.', 'Ờ, để bữa khác.'],
  oosNone:  ['Hết hết vậy thôi về.', 'Tiệc gì mà hết sạch vậy...'],
  oosWrong: ['Còn mà cô, trên kệ kìa!', 'Ủa có mà cô?'],
  keepCh:   ['Khỏi thối nha cô!', 'Lẻ đó cô giữ luôn!'],
  hurry:    ['Lẹ lẹ giùm con cô ơi...', 'Nhanh lên cô ơi!'],
  remindOk: ['Ờ ha, quên mất! Gửi nè.', 'Đây đây, trả liền!'],
  remindNo: ['Mai trả mà, gấp gì!', 'Bữa nay kẹt quá, mai nha!'],
  refuseOk: ['Ờ, thôi trả tiền mặt.', 'Vậy thôi trả liền nè.'],
  refuseNo: ['Vậy thôi để bữa khác...', 'Ờ thôi khỏi lấy.'],
};
