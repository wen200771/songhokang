# 📁 送齁康優惠券平台 - 文件結構

```
送好康網站/
│
├── 🏠 前台頁面
│   ├── index.html              # 主頁面 (優惠券展示)
│   ├── profile.html            # 用戶個人資料
│   └── verify.html             # QR Code 驗證頁面
│
├── 👨‍💼 管理後台
│   └── admin/
│       ├── index.html          # 管理員主控台
│       └── login.html          # 管理員登入頁
│
├── 👤 用戶中心
│   └── user/
│       ├── index.html          # 用戶中心首頁
│       ├── login.html          # 用戶登入頁
│       └── profile.html        # 用戶資料編輯
│
├── 🏪 廠商中心
│   └── vendor/
│       ├── index.html          # 廠商後台主頁
│       ├── login.html          # 廠商登入頁
│       └── profile.html        # 廠商資料編輯
│
├── 🔌 API 系統
│   └── api/
│       ├── index.php           # API 路由入口
│       └── uploads/            # 文件上傳目錄
│           ├── avatars/        # 用戶頭像
│           ├── coupons/        # 優惠券圖片
│           └── logos/          # 廠商 Logo
│
├── ⚙️ 配置文件
│   └── config/
│       ├── config.php          # 系統主配置
│       └── database.php        # 資料庫配置
│
├── 🎛️ 控制器
│   └── controllers/
│       ├── AuthController.php      # 認證控制器
│       ├── UserController.php      # 用戶管理
│       ├── VendorController.php    # 廠商管理
│       ├── CouponController.php    # 優惠券管理
│       ├── FavoriteController.php  # 收藏功能
│       └── StatsController.php     # 統計數據
│
├── 📊 數據模型
│   └── models/
│       ├── User.php            # 用戶模型
│       ├── Vendor.php          # 廠商模型
│       ├── Coupon.php          # 優惠券模型
│       └── Favorite.php        # 收藏模型
│
├── 🛡️ 中間件
│   └── middleware/
│       ├── AuthMiddleware.php      # 認證中間件
│       ├── AdminMiddleware.php     # 管理員權限
│       └── VendorMiddleware.php    # 廠商權限
│
├── 🔧 工具類
│   └── utils/
│       ├── JWT.php             # JWT Token 處理
│       └── QRCode.php          # QR Code 生成與驗證
│
├── 🗄️ 資料庫
│   └── database/
│       └── create_tables.sql   # 資料庫結構
│
├── 📜 腳本工具
│   └── scripts/
│       ├── add_test_data.php       # 測試數據生成
│       ├── clear_coupons.php       # 清理優惠券數據
│       └── import_coupons.php      # 批量導入優惠券
│
├── 🖼️ 靜態資源
│   ├── img/                    # 文宣圖片素材 (50張)
│   └── uploads/                # 用戶上傳文件
│       ├── avatars/            # 用戶頭像
│       ├── coupons/            # 優惠券圖片
│       └── logos/              # 廠商 Logo
│
├── 📚 文檔說明
│   ├── README.md               # 項目說明
│   ├── PROJECT_SUMMARY.md      # 項目總結報告
│   ├── DEPLOYMENT_CHECKLIST.md # 部署檢查清單
│   ├── FILE_STRUCTURE.md       # 文件結構 (本文件)
│   └── TESTING_GUIDE.md        # 測試指南
│
├── 🔧 配置文件
│   ├── .htaccess               # URL 重寫規則
│   ├── start_server.bat        # Windows 啟動腳本
│   ├── start_server.sh         # Linux 啟動腳本
│   └── cleanup_project.php     # 項目清理腳本
│
└── 📝 日誌目錄
    └── logs/                   # 系統日誌 (自動創建)
```

## 🎯 核心文件說明

### 🔥 必須文件 (不可刪除)

- `index.html` - 主頁面，用戶看到的第一個頁面
- `api/index.php` - API 核心，所有後端功能的入口
- `config/config.php` - 系統配置，包含重要設定
- `config/database.php` - 資料庫連接配置
- `database/create_tables.sql` - 資料庫結構，部署必需

### ⚡ 重要文件 (建議保留)

- `admin/index.html` - 管理員後台
- `vendor/index.html` - 廠商後台
- `user/index.html` - 用戶中心
- `controllers/` - 所有控制器文件
- `models/` - 所有數據模型
- `middleware/` - 權限控制文件

### 🔧 輔助文件 (可選)

- `scripts/` - 維護腳本，可根據需要保留
- `cleanup_project.php` - 清理腳本，部署後可刪除
- 測試文件 - 開發完成後可刪除

### 📊 統計數據

- **總文件數**: ~80+ 個文件
- **核心 PHP 文件**: 20 個
- **前端 HTML 文件**: 15 個
- **配置和工具**: 10 個
- **文檔文件**: 5 個
- **靜態資源**: 50+ 張圖片

---

**建議**: 部署前執行 `php cleanup_project.php` 清理不必要的測試文件！
