- 新增 .env 設定流程：請由 .env.example 複製並填入環境變數。
# 送齁康優惠券平台 - 項目總結報告

## 📋 項目概述

**項目名稱**：送齁康優惠券平台  
**項目類型**：免費優惠券聚合平台  
**開發狀態**：核心功能完成，可正常運行  
**技術棧**：PHP + MySQL + HTML/CSS/JavaScript

## 🎯 核心功能

### 1. 用戶系統

- ✅ **多角色認證**：一般會員、廠商、管理員
- ✅ **用戶註冊登入**：支援用戶名/郵箱登入
- ✅ **會話管理**：JWT Token 認證
- ✅ **帳號切換**：管理員可切換至任意用戶帳號測試
- ✅ **個人資料管理**：頭像、聯絡資訊編輯

### 2. 優惠券系統

- ✅ **優惠券展示**：Pinterest 風格瀑布流佈局
- ✅ **分類篩選**：美食餐飲、購物商城、美容保養等
- ✅ **搜尋功能**：關鍵字搜尋、搜尋歷史
- ✅ **優惠券使用**：QR Code 憑證生成
- ✅ **收藏功能**：用戶可收藏喜愛的優惠券
- ✅ **瀏覽統計**：點擊數、收藏數、使用數追蹤

### 3. 廠商管理

- ✅ **廠商註冊**：公司資料、聯絡人資訊
- ✅ **優惠券發布**：廠商可自行發布優惠券
- ✅ **廠商後台**：優惠券管理、數據統計
- ✅ **審核機制**：管理員審核廠商申請

### 4. 管理員後台

- ✅ **用戶管理**：查看、編輯、停用、刪除用戶
- ✅ **優惠券管理**：審核、編輯、下架優惠券
- ✅ **廠商管理**：審核廠商申請、管理廠商狀態
- ✅ **數據分析**：用戶統計、優惠券使用分析
- ✅ **系統設定**：平台基本設定管理

### 5. QR Code 憑證系統

- ✅ **憑證生成**：用戶使用優惠券後生成 QR Code
- ✅ **店家驗證**：店家可掃描或輸入驗證碼核銷
- ✅ **防偽機制**：HMAC 簽名防止憑證偽造
- ✅ **使用追蹤**：記錄使用時間、核銷狀態

## 🗂️ 文件結構

### 📁 核心文件

```
送齁康網站/
├── index.html                 # 前台主頁面
├── profile.html              # 用戶個人資料頁
├── verify.html               # QR Code 驗證頁面
├── .htaccess                 # URL 重寫規則
└── README.md                 # 項目說明文件
```

### 📁 後台管理

```
admin/
├── index.html               # 管理員後台主頁
└── login.html               # 管理員登入頁
```

### 📁 用戶中心

```
user/
├── index.html               # 用戶中心首頁
├── login.html               # 用戶登入頁
└── profile.html             # 用戶資料編輯
```

### 📁 廠商中心

```
vendor/
├── index.html               # 廠商後台主頁
├── login.html               # 廠商登入頁
└── profile.html             # 廠商資料編輯
```

### 📁 API 系統

```
api/
├── index.php                # API 路由入口
├── test.php                 # API 測試文件
└── uploads/                 # 文件上傳目錄
```

### 📁 配置文件

```
config/
├── config.php               # 系統配置
└── database.php             # 資料庫配置
```

### 📁 控制器

```
controllers/
├── AuthController.php       # 認證控制器
├── UserController.php       # 用戶管理
├── VendorController.php     # 廠商管理
├── CouponController.php     # 優惠券管理
├── FavoriteController.php   # 收藏功能
└── StatsController.php      # 統計數據
```

### 📁 數據模型

```
models/
├── User.php                 # 用戶模型
├── Vendor.php               # 廠商模型
├── Coupon.php               # 優惠券模型
└── Favorite.php             # 收藏模型
```

### 📁 中間件

```
middleware/
├── AuthMiddleware.php       # 認證中間件
├── AdminMiddleware.php      # 管理員權限
└── VendorMiddleware.php     # 廠商權限
```

### 📁 工具類

```
utils/
├── JWT.php                  # JWT Token 處理
└── QRCode.php               # QR Code 生成與驗證
```

### 📁 資料庫

```
database/
└── create_tables.sql        # 資料庫結構
```

### 📁 腳本工具

```
scripts/
├── add_test_data.php        # 測試數據生成
├── clear_coupons.php        # 清理優惠券數據
└── import_coupons.php       # 批量導入優惠券
```

## 🗃️ 可清理的文件

### 🧪 測試文件（可刪除）

- `debug_info.php`
- `simple_test.html`
- `test_api.html`
- `test_api_routes.html`
- `test_db.php`
- `test_direct_api.php`
- `test_registration.html`
- `api/register_test.php`
- `api/test.php`

### 📄 備份文件（可刪除）

- `admin/index_backup.html`
- `admin/index_new.html`
- `admin/index_old.html`
- `vendor/index_backup.html`
- `simple_index.html`

### 📝 文檔文件（保留）

- `README.md`
- `TESTING_GUIDE.md`
- `PROJECT_SUMMARY.md` (本文件)

## 💾 資料庫結構

### 主要數據表

1. **users** - 用戶基本資料
2. **vendors** - 廠商資料
3. **coupons** - 優惠券資料
4. **coupon_usage** - 使用記錄
5. **favorites** - 收藏記錄

### 關鍵欄位

- **QR Code 驗證**：verification_code, verified_at, verified_by
- **多角色支援**：role (admin/vendor/customer)
- **狀態管理**：status, approval_status
- **統計數據**：view_count, favorite_count, used_count

## 🚀 部署建議

### 1. 生產環境配置

- 修改 `config/config.php` 中的 JWT_SECRET
- 設定正確的資料庫連接參數
- 配置 Web 服務器（Apache/Nginx）

### 2. 安全設置

- 啟用 HTTPS
- 設定適當的文件權限
- 配置防火牆規則

### 3. 性能優化

- 啟用 OPcache
- 配置資料庫索引
- 實施緩存策略

## 📊 統計數據

### 代碼統計

- **PHP 文件**：~20 個
- **HTML 文件**：~15 個
- **總代碼行數**：~8000+ 行
- **API 端點**：~30 個

### 功能完成度

- **核心功能**：✅ 100% 完成
- **用戶界面**：✅ 100% 完成
- **管理後台**：✅ 100% 完成
- **API 系統**：✅ 100% 完成
- **QR Code 系統**：✅ 100% 完成

## 🎨 UI/UX 特色

### 設計風格

- **現代化設計**：Liquid Glass 效果、漸變色彩
- **響應式佈局**：支援桌面和移動設備
- **中文化界面**：完全中文化的用戶界面
- **直觀操作**：清晰的導航和操作流程

### 用戶體驗

- **快速搜尋**：即時搜尋建議
- **收藏功能**：一鍵收藏/取消收藏
- **QR Code 憑證**：簡化使用流程
- **多重篩選**：分類、狀態、關鍵字篩選

## 🔧 技術亮點

1. **JWT 認證系統**：安全的用戶認證
2. **QR Code 憑證**：防偽的優惠券使用憑證
3. **多角色權限**：細緻的權限控制
4. **RESTful API**：標準化的 API 設計
5. **MVC 架構**：清晰的代碼結構

---

**最後更新**：2025 年 9 月 15 日  
**版本**：v1.0.0  
**狀態**：生產就緒 🚀
