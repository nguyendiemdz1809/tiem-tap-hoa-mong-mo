'use strict';
// ============================================================
//  (Tùy chọn) Thay hình vẽ bằng ảnh PNG của bạn
// ------------------------------------------------------------
//  Mặc định mọi món hàng được vẽ bằng code. Nếu bạn có ảnh
//  (ví dụ tạo từ AI bằng các prompt sprite sheet), cắt từng món
//  thành PNG nền trong suốt, tỉ lệ khoảng 64x84 (dọc), đặt vào
//  thư mục assets/items/ rồi khai báo ở đây:
//
//    const SPRITE_OVERRIDES = {
//      mitom:   'assets/items/mitom.png',
//      nuocmam: 'assets/items/nuocmam.png',
//    };
//
//  Khóa (mitom, nuocmam...) là id món hàng trong js/data.js.
// ============================================================
const SPRITE_OVERRIDES = {};
