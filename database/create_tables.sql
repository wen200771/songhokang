-- 送齁康優惠券平台資料庫結構
-- 建立日期: 2024年
-- 編碼: UTF8MB4 (支援 emoji 和中文)

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- 1. 用戶表 (所有用戶的基本資料)
-- ----------------------------
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL COMMENT '用戶名',
  `email` varchar(100) NOT NULL COMMENT '電子郵件',
  `password` varchar(255) NOT NULL COMMENT '密碼 (加密)',
  `phone` varchar(20) DEFAULT NULL COMMENT '手機號碼',
  `role` enum('admin','vendor','customer') NOT NULL DEFAULT 'customer' COMMENT '角色: 管理員/廠商/一般用戶',
  `status` enum('active','inactive','pending','suspended') NOT NULL DEFAULT 'pending' COMMENT '狀態',
  `avatar` varchar(255) DEFAULT NULL COMMENT '頭像路徑',
  `last_login` datetime DEFAULT NULL COMMENT '最後登入時間',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `role` (`role`),
  KEY `status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用戶基本資料表';

-- ----------------------------
-- 2. 廠商資料表 (廠商詳細資訊)
-- ----------------------------
CREATE TABLE `vendors` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL COMMENT '關聯用戶ID',
  `company_name` varchar(100) NOT NULL COMMENT '公司名稱',
  `business_license` varchar(50) DEFAULT NULL COMMENT '營業登記證號',
  `tax_id` varchar(20) DEFAULT NULL COMMENT '統一編號',
  `address` text DEFAULT NULL COMMENT '公司地址',
  `phone` varchar(20) DEFAULT NULL COMMENT '公司電話',
  `contact_person` varchar(50) DEFAULT NULL COMMENT '聯絡人',
  `description` text DEFAULT NULL COMMENT '公司簡介',
  `logo` varchar(255) DEFAULT NULL COMMENT 'Logo 路徑',
  `website` varchar(255) DEFAULT NULL COMMENT '官方網站',
  `category` varchar(50) DEFAULT NULL COMMENT '行業分類',
  `verification_status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending' COMMENT '驗證狀態',
  `verification_note` text DEFAULT NULL COMMENT '審核備註',
  `verified_by` int(11) DEFAULT NULL COMMENT '審核管理員ID',
  `verified_at` datetime DEFAULT NULL COMMENT '審核時間',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  KEY `verification_status` (`verification_status`),
  KEY `category` (`category`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`verified_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='廠商資料表';

-- ----------------------------
-- 3. 優惠券/活動表
-- ----------------------------
CREATE TABLE `coupons` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `vendor_id` int(11) NOT NULL COMMENT '廠商ID',
  `title` varchar(200) NOT NULL COMMENT '活動標題',
  `description` text NOT NULL COMMENT '活動描述',
  `terms` text DEFAULT NULL COMMENT '使用條款',
  `image` varchar(255) DEFAULT NULL COMMENT '文宣圖片路徑',
  `category` varchar(50) NOT NULL COMMENT '分類',
  `discount_type` enum('percentage','fixed','bogo','free') NOT NULL COMMENT '折扣類型: 百分比/固定金額/買一送一/免費',
  `discount_value` decimal(10,2) DEFAULT NULL COMMENT '折扣數值',
  `original_price` decimal(10,2) DEFAULT NULL COMMENT '原價',
  `discounted_price` decimal(10,2) DEFAULT NULL COMMENT '優惠價',
  `start_date` date NOT NULL COMMENT '開始日期',
  `end_date` date NOT NULL COMMENT '結束日期',
  `usage_limit_per_user` int(11) DEFAULT 1 COMMENT '每人使用次數限制',
  `total_usage_limit` int(11) DEFAULT NULL COMMENT '總使用次數限制',
  `used_count` int(11) NOT NULL DEFAULT 0 COMMENT '已使用次數',
  `view_count` int(11) NOT NULL DEFAULT 0 COMMENT '瀏覽次數',
  `favorite_count` int(11) NOT NULL DEFAULT 0 COMMENT '收藏次數',
  `status` enum('draft','pending','active','expired','suspended') NOT NULL DEFAULT 'draft' COMMENT '狀態',
  `approval_status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending' COMMENT '審核狀態',
  `approval_note` text DEFAULT NULL COMMENT '審核備註',
  `approved_by` int(11) DEFAULT NULL COMMENT '審核管理員ID',
  `approved_at` datetime DEFAULT NULL COMMENT '審核時間',
  `featured` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否精選',
  `priority` int(11) NOT NULL DEFAULT 0 COMMENT '排序優先級',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `vendor_id` (`vendor_id`),
  KEY `category` (`category`),
  KEY `status` (`status`),
  KEY `approval_status` (`approval_status`),
  KEY `start_date` (`start_date`),
  KEY `end_date` (`end_date`),
  KEY `featured` (`featured`),
  FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='優惠券/活動表';

-- ----------------------------
-- 4. 用戶收藏表
-- ----------------------------
CREATE TABLE `user_favorites` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL COMMENT '用戶ID',
  `coupon_id` int(11) NOT NULL COMMENT '優惠券ID',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_coupon` (`user_id`, `coupon_id`),
  KEY `user_id` (`user_id`),
  KEY `coupon_id` (`coupon_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`coupon_id`) REFERENCES `coupons`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用戶收藏表';

-- ----------------------------
-- 5. 用戶使用記錄表
-- ----------------------------
CREATE TABLE `coupon_usage` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL COMMENT '用戶ID',
  `coupon_id` int(11) NOT NULL COMMENT '優惠券ID',
  `used_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '使用時間',
  `verification_code` varchar(50) DEFAULT NULL COMMENT '驗證碼',
  `verified_at` datetime DEFAULT NULL COMMENT '核銷時間',
  `verified_by` int(11) DEFAULT NULL COMMENT '核銷人員ID',
  `notes` text DEFAULT NULL COMMENT '使用備註',
  PRIMARY KEY (`id`),
  UNIQUE KEY `verification_code` (`verification_code`),
  KEY `user_id` (`user_id`),
  KEY `coupon_id` (`coupon_id`),
  KEY `used_at` (`used_at`),
  KEY `verified_at` (`verified_at`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`coupon_id`) REFERENCES `coupons`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`verified_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='優惠券使用記錄';

-- ----------------------------
-- 6. 分類管理表
-- ----------------------------
CREATE TABLE `categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL COMMENT '分類名稱',
  `slug` varchar(50) NOT NULL COMMENT '分類標識',
  `description` text DEFAULT NULL COMMENT '分類描述',
  `icon` varchar(100) DEFAULT NULL COMMENT '分類圖示',
  `color` varchar(7) DEFAULT NULL COMMENT '分類顏色',
  `sort_order` int(11) NOT NULL DEFAULT 0 COMMENT '排序',
  `is_active` tinyint(1) NOT NULL DEFAULT 1 COMMENT '是否啟用',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `sort_order` (`sort_order`),
  KEY `is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='分類管理表';

-- ----------------------------
-- 7. 系統設定表
-- ----------------------------
CREATE TABLE `system_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL COMMENT '設定鍵',
  `setting_value` text DEFAULT NULL COMMENT '設定值',
  `setting_type` enum('string','integer','boolean','json') NOT NULL DEFAULT 'string' COMMENT '數據類型',
  `description` varchar(255) DEFAULT NULL COMMENT '設定說明',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系統設定表';

-- ----------------------------
-- 8. 操作日誌表
-- ----------------------------
CREATE TABLE `admin_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_id` int(11) NOT NULL COMMENT '管理員ID',
  `action` varchar(100) NOT NULL COMMENT '操作動作',
  `target_type` varchar(50) DEFAULT NULL COMMENT '操作對象類型',
  `target_id` int(11) DEFAULT NULL COMMENT '操作對象ID',
  `details` text DEFAULT NULL COMMENT '操作詳情',
  `ip_address` varchar(45) DEFAULT NULL COMMENT 'IP地址',
  `user_agent` text DEFAULT NULL COMMENT '瀏覽器信息',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `admin_id` (`admin_id`),
  KEY `action` (`action`),
  KEY `created_at` (`created_at`),
  FOREIGN KEY (`admin_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理員操作日誌';

-- ----------------------------
-- 初始化基本數據
-- ----------------------------

-- 插入預設分類
INSERT INTO `categories` (`name`, `slug`, `description`, `icon`, `color`, `sort_order`) VALUES
('美食餐飲', 'food', '餐廳、咖啡廳、小吃等美食相關優惠', '🍽️', '#ff6b6b', 1),
('購物商城', 'shopping', '服飾、3C、生活用品等購物優惠', '🛍️', '#4ecdc4', 2),
('美容保養', 'beauty', '美髮、美甲、SPA等美容相關優惠', '💄', '#45b7d1', 3),
('休閒娛樂', 'entertainment', '電影、KTV、遊戲等娛樂優惠', '🎮', '#f9ca24', 4),
('旅遊住宿', 'travel', '飯店、民宿、景點等旅遊優惠', '✈️', '#6c5ce7', 5),
('健康醫療', 'health', '診所、藥局、健身等健康相關優惠', '🏥', '#a29bfe', 6);

-- 插入系統管理員帳號 (密碼: admin123)
INSERT INTO `users` (`username`, `email`, `password`, `role`, `status`) VALUES
('admin', 'admin@songhokang.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'active');

-- 插入基本系統設定
INSERT INTO `system_settings` (`setting_key`, `setting_value`, `setting_type`, `description`) VALUES
('site_name', '送齁康', 'string', '網站名稱'),
('site_description', '台灣最大優惠券折價券平台', 'string', '網站描述'),
('admin_email', 'admin@songhokang.com', 'string', '管理員郵箱'),
('max_upload_size', '5242880', 'integer', '最大上傳文件大小(bytes)'),
('coupon_auto_approve', '0', 'boolean', '優惠券是否自動審核'),
('vendor_auto_approve', '0', 'boolean', '廠商是否自動審核');

-- 建議索引（可重複執行，存在則略過由 DBA 覆核）
-- Users
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users (username);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users (status);

-- Vendors
CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON vendors (user_id);
CREATE INDEX IF NOT EXISTS idx_vendors_status ON vendors (verification_status);

-- Coupons
CREATE INDEX IF NOT EXISTS idx_coupons_status ON coupons (status);
CREATE INDEX IF NOT EXISTS idx_coupons_category ON coupons (category);
CREATE INDEX IF NOT EXISTS idx_coupons_vendor ON coupons (vendor_id);
CREATE INDEX IF NOT EXISTS idx_coupons_expiry ON coupons (end_date);

-- Favorites
CREATE UNIQUE INDEX IF NOT EXISTS idx_favorites_user_coupon ON user_favorites (user_id, coupon_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON user_favorites (user_id);

-- Coupon usage
CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon ON coupon_usage (coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_user ON coupon_usage (user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_verified ON coupon_usage (verified_at);

SET FOREIGN_KEY_CHECKS = 1;
