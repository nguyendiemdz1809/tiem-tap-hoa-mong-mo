#!/usr/bin/env bash
# Cập nhật game lên web: build lại, commit, đẩy lên GitHub + GitHub Pages
# Chạy (Git Bash): bash tools/deploy.sh "mô tả thay đổi"
set -e
cd "$(dirname "$0")/.."
node tools/build.js
git add -A
git commit -m "${1:-Cập nhật game}" || echo "(không có gì mới để commit)"
git push origin main
# đưa thư mục web/ lên nhánh gh-pages (nhanh, không cần git subtree)
git fetch -q origin gh-pages || true
tree=$(git rev-parse HEAD:web)
parent=$(git rev-parse -q --verify origin/gh-pages || true)
commit=$(git commit-tree "$tree" ${parent:+-p "$parent"} -m "Deploy $(git rev-parse --short HEAD)")
git push origin "$commit:refs/heads/gh-pages"
echo "Xong! Khoảng 1 phút sau web sẽ có bản mới: https://nguyendiemdz1809.github.io/tiem-tap-hoa-mong-mo/"
