# 狀態快照（自動摘要）
- 時間：2025-09-19 00:00:00
- 最新提交：請見 git log/ GitHub（origin/main）
- 重點完成：結構清理、上傳統一路徑、JWT/RateLimit/Audit、SEO/UX優化、索引補齊、X-Request-ID、整合測試腳本
- 待辦摘要：CORS 正式網域、錯誤碼表、圖片縮圖優化持續、整合測試擴充、CI

# 專案進度與規劃（持續更新）

## 一、目前狀態
- 架構：PHP + MySQL，單一 API 入口（`api/index.php`），MVC 分層完成
- 設定：`.env.example` 已建立；`.gitignore` 忽略敏感與生成檔
- 安全：
  - 目錄保護：`config/`、`database/`、`uploads/`、`api/uploads/`、`scripts/` 皆有 `.htaccess`
  - 上傳：副檔名+MIME 檢查、大小限制、實體與 URL 路徑統一 `/uploads/*`
  - CORS：預設已註解「全開放」，待正式網域決定後設定
  - JWT：標頭解析強化，`Auth/Admin/Vendor` 中介層
  - 速率限制：`login`、`register`、`upload`、`use`、`verify` 已加 `RateLimitMiddleware`
  - 稽核日誌：`utils/Audit.php`（登入/註冊/切換/使用/核銷）
- 觀測：API 回應帶 `X-Request-ID`；logs 目錄保留 `.gitkeep`
- 效能：`.htaccess` 啟用壓縮與快取；`database/create_tables.sql` 補索引與唯一鍵
- SEO/UX：`robots.txt`、`sitemap.xml`、CSS preload、A11y 表單標註、modal lazy
- Favicon：前台/廠商/管理員統一

## 二、尚未完成 / 待決策
- CORS：待正式網域，於 `.env` 與 `.htaccess` 落地（並加 `Vary: Origin`）
- 上傳自動縮圖：建議將長邊壓到 `MAX_IMAGE_WIDTH`
- 統一錯誤碼與回應結構：便於前端處理與監控
- 測試：建立登入→發券→收藏→使用→核銷的整合測試
- CI/CD：基本流水線（lint/test/build/deploy）
- 腳本收斂：`scripts/` 可移至 `scripts/dev_only/` 或限制環境

## 三、環境與啟動
1. 建 `.env`
   - `Copy-Item .env.example .env`（或手動複製），填入 DB 與 JWT_SECRET
2. 建 DB
   - `database/create_tables.sql`（已含索引建議）
3. 啟動
   - PHP 內建伺服器：`php -S localhost:8000`
   - 或放至 Apache/Nginx（已含 `.htaccess`）
4. 入口
   - 前台：`/index.html`
   - API 健康檢查：`/api/`

## 四、操作筆記
- 上傳目錄：`UPLOAD_PATH=uploads/`，對外 URL 走 `/uploads/*`
- 安全標頭：已設置，HSTS 待 HTTPS 上線後啟用
- RateLimit 規則：可調整 `RateLimitMiddleware` 內 `rules`
- 稽核：輸出到 `logs/audit/YYYY-MM-DD.log`

## 五、下一步建議（優先級）
1) 正式網域 CORS、加 `Vary: Origin`（確定網域後立刻執行）
2) 上傳自動縮圖 + 限制解析度
3) 錯誤碼/錯誤結構統一（含錯誤代碼表）
4) 整合測試與簡單 CI

— 本文件由工具維護，遇到變更請同步更新。
