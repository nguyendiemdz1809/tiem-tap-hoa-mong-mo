# Tiệm Tạp Hóa Mộng Mơ — 2D Simulator

Game mô phỏng bán hàng ở tiệm tạp hóa Việt Nam (bà chủ: Cô Hoa). Chạy thẳng trên trình duyệt, không cần cài đặt.

**Chơi online:** https://nguyendiemdz1809.github.io/tiem-tap-hoa-mong-mo/

Trên điện thoại: mở link → menu trình duyệt → "Thêm vào màn hình chính" để chơi như app, kể cả khi mất mạng.

## Chạy game
Mở `index.html` bằng Chrome / Edge (bấm đúp là được). Tiến trình tự lưu vào trình duyệt mỗi 5 giây (tắt giữa ngày vẫn chơi tiếp được).

## Cách chơi
- Khách tới quầy nói muốn mua gì → **bấm hàng trên kệ** để bỏ vào bịch → **✔ Giao hàng** (Enter).
- **Thối tiền**: tự tính và bấm tiền trong ngăn kéo. Bấm 🧮 máy tính để được nhắc (khách chờ lâu hơn).
- **🚫 Báo hết hàng** khi kệ trống món khách cần. **📦 Nhập hàng** để bổ sung.
- Khách quen có thể xin **📒 ghi sổ nợ** — có người trả, có người... quên.
- 21:00 đóng cửa → xem lời lỗ → **🛠️ Nâng cấp** (quạt, tủ kính, tủ mát, thẻ cào, bàn ghế nhựa, bảng hiệu...).
- 🎵 **Nhạc nền** ngũ cung tự tạo (đàn tranh, đàn bầu, mõ) — đổi giai điệu khi trời tối / mưa. Nút 🎵 để bật/tắt.
- 🌙 **Offline vẫn có tiền**: đóng game hoặc chuyển tab ≥ 1 phút, Cô Hoa bán giùm (tối đa 8 tiếng, ~8 món/giờ, chỉ bán hàng còn trên kệ). Khách nợ có thể ghé trả.
- Phím tắt: `Space` tạm dừng, `Enter` giao hàng, nút `×2` tua nhanh.

## Cập nhật lên web
Sửa code xong, chạy trong Git Bash:
```bash
bash tools/deploy.sh "mô tả thay đổi"
```
Khoảng 1 phút sau trang web có bản mới.

## Cấu trúc
| File | Nội dung |
|---|---|
| `js/data.js` | **Chỉnh game ở đây**: giá hàng, món, khách, câu thoại, nâng cấp, tốc độ thời gian |
| `js/art.js` | Toàn bộ hình vẽ (vẽ bằng code Canvas): món hàng, nhân vật chibi, cảnh tiệm |
| `js/game.js` | Logic: khách, xếp hàng, kiên nhẫn, thanh toán, sổ nợ, ngày/đêm, lưu game |
| `js/ui.js` | Giao diện: HUD, thanh hành động, bảng thối tiền / nhập hàng / nâng cấp / sổ nợ |
| `js/music.js` | Nhạc nền (WebAudio) |
| `tools/build.js` | Gộp thành 1 file `dist/tiem-tap-hoa-mong-mo.html` (để đăng online / gửi bạn bè): `node tools/build.js` |
| `js/sprites.js` | (Tùy chọn) thay hình món hàng bằng ảnh PNG của bạn |

## Dùng ảnh tự tạo (AI sprite sheet)
Cắt từng món thành PNG nền trong suốt (tỉ lệ dọc ~64×84), bỏ vào `assets/items/`, rồi khai báo trong `js/sprites.js`:
```js
const SPRITE_OVERRIDES = { mitom: 'assets/items/mitom.png' };
```

Tên hàng đang dùng tên chung (mì tôm, nước mắm, nước ngọt...) thay vì nhãn hiệu thật để tránh vấn đề bản quyền nếu phát hành.
