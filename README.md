# 送齁康優惠券平台

## 本地開發環境設置

### 環境需求

- PHP 7.4 或以上版本
- MySQL 5.7 或以上版本
- Web 伺服器 (Apache/Nginx) 或使用 PHP 內建伺服器

### 快速開始

#### 1. 設置資料庫

```bash
# 1. 創建資料庫
mysql -u root -p
CREATE DATABASE songhokang_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 2. 導入資料庫結構
mysql -u root -p songhokang_db < database/create_tables.sql
```

#### 2. 配置資料庫連接

編輯 `config/database.php`，修改資料庫連接參數：

```php
$this->host = 'localhost';
$this->db_name = 'songhokang_db';
$this->username = 'root';
$this->password = 'your_password';
```

#### 3. 啟動本地伺服器

```bash
# 使用 PHP 內建伺服器
php -S localhost:8000

# 或者使用 XAMPP/MAMP/WAMP
# 將項目放在 htdocs 目錄下
```

#### 4. 訪問網站

- 前端頁面: http://localhost:8000/index.html
- API 測試: http://localhost:8000/api/
- 資料庫測試: http://localhost:8000/test_db.php

### 預設帳號

- 管理員: `admin` / `admin123`

### API 端點

#### 認證相關

- `POST /api/auth/login` - 用戶登入
- `POST /api/auth/register` - 用戶註冊
- `GET /api/auth/me` - 獲取當前用戶資訊

#### 優惠券相關

- `GET /api/coupons` - 獲取優惠券列表
- `GET /api/coupons/{id}` - 獲取單個優惠券詳情
- `POST /api/coupons` - 創建優惠券 (廠商)

#### 收藏功能

- `GET /api/favorites` - 獲取用戶收藏
- `POST /api/favorites` - 添加收藏
- `DELETE /api/favorites/{id}` - 移除收藏

### 開發說明

1. **前端** (`index.html`) - 用戶界面，使用原有的 Pinterest 風格設計
2. **後端 API** (`api/`) - 處理業務邏輯和數據管理
3. **管理後台** - 管理員和廠商的後台管理界面 (開發中)

### 文件結構

```
送齁康網站/
├── index.html              # 前端主頁面
├── img/                   # 優惠券文宣圖片
├── database/              # 資料庫相關
├── config/                # 配置文件
├── api/                   # API 入口
├── controllers/           # 控制器
├── models/                # 數據模型
├── middleware/            # 中間件
└── utils/                 # 工具類
```
