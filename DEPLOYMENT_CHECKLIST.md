# 🚀 送齁康優惠券平台 - 部署檢查清單

## 📋 部署前準備

### 🔧 環境需求

- [ ] **PHP 7.4+** 已安裝
- [ ] **MySQL 5.7+** 已安裝
- [ ] **Web 服務器** (Apache/Nginx) 已配置
- [ ] **SSL 證書** 已安裝（生產環境）
- [ ] **域名** 已指向服務器

### 📁 文件準備

- [ ] 清理測試文件（執行 `php cleanup_project.php`）
- [ ] 確認所有核心文件存在
- [ ] 檢查文件權限設定
- [ ] 上傳文件到服務器

## ⚙️ 配置修改

### 🗄️ 資料庫配置

**文件**: `config/database.php`

```php
// 修改為生產環境資料庫設定
$this->host = 'your_db_host';
$this->db_name = 'your_db_name';
$this->username = 'your_db_user';
$this->password = 'your_db_password';
```

### 🔐 系統配置

**文件**: `config/config.php`

```php
// 修改為生產環境設定
define('BASE_URL', 'https://your-domain.com');
define('JWT_SECRET', 'your-secure-secret-key-here');

// 關閉錯誤顯示（生產環境）
error_reporting(0);
ini_set('display_errors', 0);
```

### 🌐 Web 服務器配置

#### Apache (.htaccess)

```apache
# 確認 .htaccess 文件存在並包含以下內容
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^api/(.*)$ api/index.php [QSA,L]

# 安全設定
Header always set X-Frame-Options DENY
Header always set X-Content-Type-Options nosniff
Header always set X-XSS-Protection "1; mode=block"
```

#### Nginx

```nginx
# 在 server 區塊中添加
location /api/ {
    try_files $uri $uri/ /api/index.php?$query_string;
}

location ~ \.php$ {
    fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
    fastcgi_index index.php;
    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    include fastcgi_params;
}
```

## 🗄️ 資料庫部署

### 1. 創建資料庫

```sql
CREATE DATABASE your_db_name CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. 導入表結構

```bash
mysql -u username -p your_db_name < database/create_tables.sql
```

### 3. 創建管理員帳號

```sql
INSERT INTO users (username, email, password, role, status)
VALUES ('admin', 'admin@yourdomain.com', '$2y$12$hash_here', 'admin', 'active');
```

## 🔒 安全設定

### 文件權限

```bash
# 設定適當的文件權限
chmod 755 /path/to/website
chmod 644 /path/to/website/*.html
chmod 644 /path/to/website/*.php
chmod 755 /path/to/website/uploads
chmod 755 /path/to/website/api/uploads
```

### 敏感文件保護

- [ ] 確認 `config/` 目錄不可直接訪問
- [ ] 確認 `.htaccess` 文件生效
- [ ] 測試直接訪問 PHP 文件被阻止

## 🧪 功能測試

### 前台功能

- [ ] 首頁載入正常
- [ ] 優惠券列表顯示
- [ ] 搜尋功能正常
- [ ] 用戶註冊登入
- [ ] 收藏功能
- [ ] QR Code 生成

### 管理後台

- [ ] 管理員登入
- [ ] 用戶管理功能
- [ ] 優惠券管理
- [ ] 廠商管理
- [ ] 數據統計顯示

### 廠商後台

- [ ] 廠商註冊登入
- [ ] 優惠券發布
- [ ] 數據查看

### API 測試

- [ ] 認證 API 正常
- [ ] 優惠券 API 正常
- [ ] 文件上傳功能
- [ ] 錯誤處理正確

## 📊 性能優化

### PHP 優化

- [ ] 啟用 OPcache
- [ ] 調整 PHP 記憶體限制
- [ ] 設定適當的 session 配置

### 資料庫優化

- [ ] 檢查索引是否正確創建
- [ ] 設定查詢緩存
- [ ] 定期備份策略

### 前端優化

- [ ] 壓縮 CSS/JS 文件
- [ ] 優化圖片大小
- [ ] 啟用 Gzip 壓縮
- [ ] 設定瀏覽器緩存

## 🔍 監控設定

### 日誌記錄

- [ ] 設定 PHP 錯誤日誌
- [ ] 設定 Web 服務器訪問日誌
- [ ] 設定資料庫查詢日誌

### 監控指標

- [ ] 服務器資源使用率
- [ ] 資料庫連接數
- [ ] 頁面載入時間
- [ ] API 響應時間

## 🛡️ 備份策略

### 定期備份

- [ ] 設定資料庫自動備份
- [ ] 設定文件系統備份
- [ ] 測試備份恢復流程

### 災難恢復

- [ ] 準備恢復程序文檔
- [ ] 測試完整恢復流程
- [ ] 設定監控告警

## 📝 文檔更新

### 用戶文檔

- [ ] 更新使用說明
- [ ] 準備常見問題解答
- [ ] 創建操作手冊

### 技術文檔

- [ ] 更新 API 文檔
- [ ] 記錄配置參數
- [ ] 維護運營手冊

## ✅ 上線確認

### 最終檢查

- [ ] 所有功能測試通過
- [ ] 性能測試符合要求
- [ ] 安全掃描無問題
- [ ] 備份系統正常運行

### 上線步驟

1. [ ] 設定維護頁面
2. [ ] 部署新版本
3. [ ] 執行資料庫遷移
4. [ ] 功能驗證測試
5. [ ] 移除維護頁面
6. [ ] 監控系統狀態

---

**部署完成後**，請保存此檢查清單作為維護參考！

## 🆘 緊急聯絡

**技術支援**: [您的聯絡方式]  
**服務器管理**: [服務器供應商]  
**域名管理**: [域名註冊商]
