#!/usr/bin/env bash
# Cập nhật game lên web: build lại, commit, đẩy lên GitHub + GitHub Pages
# Chạy (Git Bash): bash tools/deploy.sh "mô tả thay đổi"
set -e
cd "$(dirname "$0")/.."
node tools/build.js
git add -A
git commit -m "${1:-Cập nhật game}" || echo "(không có gì mới để commit)"
git push origin main
git subtree push --prefix web origin gh-pages
echo "Xong! Khoảng 1 phút sau web sẽ có bản mới: https://nguyendiemdz1809.github.io/tiem-tap-hoa-mong-mo/"
