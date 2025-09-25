# 送齁康優惠券平台

## 本地開發環境需求

- PHP 7.4 以上版本
- MySQL 5.7 以上版本
- Web 伺服器 (建議 Apache / Nginx) 或使用 PHP 內建開發伺服器

## 快速上手

1. **複製環境設定範本並調整**
   ```bash
   cp .env.example .env
   ```
   打開 `.env` 檔案，設定 `APP_URL`、`JWT_SECRET` 及資料庫連線 (`DB_HOST`、`DB_NAME`、`DB_USER`、`DB_PASS`) 等資訊。

2. **建立資料庫與資料表**
   ```bash
   mysql -u root -p
   CREATE DATABASE songhokang_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   mysql -u root -p songhokang_db < database/create_tables.sql
   ```

3. **啟動本機開發伺服器**
   ```bash
   php -S localhost:8000
   ```
   或將專案部署到 XAMPP/MAMP/WAMP 的 `htdocs` 目錄中。

4. **訪問入口**
   - 前台首頁：http://localhost:8000/index.html
   - API 健康檢查：http://localhost:8000/api/

## 預設帳號
- 管理員：`admin / admin123`

## 主要模組
1. **前台** (`index.html`)：提供使用者瀏覽與收藏優惠券的介面。
2. **後端 API** (`api/`)：負責認證、優惠券、收藏與統計等業務邏輯。
3. **管理後台** (`admin/`、`vendor/`、`user/`)：對應不同角色的管理介面。

## 專案結構
```
送齁康網站
├── index.html              # 前台主頁面
├── .env.example            # 環境設定範本
├── config/                 # 系統設定、資料庫連線
├── api/                    # PHP API 入口與控制器
├── controllers/            # 後端控制器
├── models/                 # 資料庫模型
├── middleware/             # 權限中介層
├── utils/                  # 共用工具 (JWT、QRCode 等)
├── css/                    # 前端樣式
├── js/                     # 前端腳本
├── database/               # 資料庫 schema
└── scripts/                # 維運腳本 (匯入測試資料等)
```

## API 摘要
- 認證：`POST /api/auth/login`、`POST /api/auth/register`、`GET /api/auth/me`
- 優惠券：`GET /api/coupons`、`GET /api/coupons/{id}`、`POST /api/coupons`
- 收藏：`GET /api/favorites`、`POST /api/favorites`、`DELETE /api/favorites/{id}`

## 其他說明
- 部署前請務必替換 `.env` 中的 `JWT_SECRET`，並確認檔案權限與 HTTPS 設定。
- `scripts/` 目錄提供匯入測試資料與清理工具，可依需求執行。
