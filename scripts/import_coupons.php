<?php
/**
 * 匯入優惠券素材並分配給廠商
 */

require_once __DIR__ . '/../config/config.php';

// 設定 JSON 響應
header('Content-Type: application/json; charset=utf-8');
ob_clean();

try {
    // 資料庫連接
    $pdo = new PDO("mysql:host=localhost;dbname=songhokang_db;charset=utf8mb4", 'root', '', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

    // 開始事務
    $pdo->beginTransaction();

    // 獲取所有已核准的廠商
    $vendorStmt = $pdo->prepare("
        SELECT v.*, u.username, u.email 
        FROM vendors v 
        JOIN users u ON v.user_id = u.id 
        WHERE v.verification_status = 'approved' 
        ORDER BY v.id
    ");
    $vendorStmt->execute();
    $vendors = $vendorStmt->fetchAll();

    if (empty($vendors)) {
        throw new Exception('沒有找到已核准的廠商');
    }

    // 輸出調試資訊
    error_log("找到 " . count($vendors) . " 個已核准廠商");

    // 優惠券類別定義
    $categories = [
        '美食餐飲' => ['餐廳', '小吃', '飲料', '甜點', '火鍋', '燒烤', '日式', '中式', '西式', '素食'],
        '購物時尚' => ['服飾', '鞋包', '配件', '化妝品', '香水', '珠寶', '手錶', '眼鏡'],
        '休閒娛樂' => ['電影', 'KTV', '遊戲', '運動', '健身', '按摩', 'SPA', '旅遊'],
        '生活服務' => ['美髮', '美容', '清潔', '維修', '寵物', '教育', '醫療', '金融'],
        '3C電子' => ['手機', '電腦', '家電', '相機', '音響', '配件', '軟體', '遊戲']
    ];

    // 優惠券標籤
    $tags = ['熱門', '限時', '新品', '獨家', '會員專屬', '滿額贈', '買一送一', '折扣', '免運', '現金回饋'];

    // 優惠券模板數據
    $couponTemplates = [
        ['title' => '頂級牛排套餐', 'category' => '美食餐飲', 'discount_type' => 'percentage', 'discount_value' => 20],
        ['title' => '手沖咖啡買一送一', 'category' => '美食餐飲', 'discount_type' => 'bogo', 'discount_value' => 0],
        ['title' => '時尚服飾全館', 'category' => '購物時尚', 'discount_type' => 'percentage', 'discount_value' => 30],
        ['title' => '電影票立即折扣', 'category' => '休閒娛樂', 'discount_type' => 'fixed', 'discount_value' => 50],
        ['title' => '專業美髮造型', 'category' => '生活服務', 'discount_type' => 'percentage', 'discount_value' => 25],
        ['title' => '3C配件特惠', 'category' => '3C電子', 'discount_type' => 'fixed', 'discount_value' => 100],
        ['title' => '道地日式料理', 'category' => '美食餐飲', 'discount_type' => 'percentage', 'discount_value' => 15],
        ['title' => '健身會員體驗', 'category' => '休閒娛樂', 'discount_type' => 'fixed', 'discount_value' => 200],
        ['title' => '美妝保養品', 'category' => '購物時尚', 'discount_type' => 'percentage', 'discount_value' => 40],
        ['title' => '舒壓按摩療程', 'category' => '生活服務', 'discount_type' => 'percentage', 'discount_value' => 35],
        ['title' => '精緻下午茶', 'category' => '美食餐飲', 'discount_type' => 'fixed', 'discount_value' => 80],
        ['title' => 'KTV歡唱優惠', 'category' => '休閒娛樂', 'discount_type' => 'percentage', 'discount_value' => 25],
        ['title' => '居家清潔服務', 'category' => '生活服務', 'discount_type' => 'fixed', 'discount_value' => 150],
        ['title' => '手機殼配件', 'category' => '3C電子', 'discount_type' => 'bogo', 'discount_value' => 0],
        ['title' => '潮流鞋款', 'category' => '購物時尚', 'discount_type' => 'percentage', 'discount_value' => 35],
        ['title' => '火鍋吃到飽', 'category' => '美食餐飲', 'discount_type' => 'fixed', 'discount_value' => 120],
        ['title' => '瑜伽課程體驗', 'category' => '休閒娛樂', 'discount_type' => 'free', 'discount_value' => 0],
        ['title' => '寵物美容服務', 'category' => '生活服務', 'discount_type' => 'percentage', 'discount_value' => 30],
        ['title' => '藍牙耳機特價', 'category' => '3C電子', 'discount_type' => 'fixed', 'discount_value' => 200],
        ['title' => '香水彩妝組合', 'category' => '購物時尚', 'discount_type' => 'percentage', 'discount_value' => 45]
    ];

    $insertedCount = 0;
    $vendorIndex = 0;
    $maxCouponsPerVendor = 5; // 每家廠商最多5個優惠券
    $vendorCouponCounts = []; // 記錄每個廠商已分配的優惠券數量

    // 計算實際要處理的優惠券數量
    $totalCoupons = min(50, count($vendors) * $maxCouponsPerVendor);
    
    // 處理優惠券素材
    for ($i = 1; $i <= $totalCoupons; $i++) {
        $imageFileName = "送齁康文宣素材 ($i).jpg";
        $imagePath = "img/$imageFileName";
        
        // 檢查圖片檔案是否存在
        if (!file_exists(__DIR__ . "/../$imagePath")) {
            continue;
        }

        // 選擇廠商（確保每家廠商不超過5個優惠券）
        $vendor = null;
        $attempts = 0;
        do {
            $currentVendor = $vendors[$vendorIndex % count($vendors)];
            $vendorId = $currentVendor['id'];
            
            if (!isset($vendorCouponCounts[$vendorId])) {
                $vendorCouponCounts[$vendorId] = 0;
            }
            
            if ($vendorCouponCounts[$vendorId] < $maxCouponsPerVendor) {
                $vendor = $currentVendor;
                $vendorCouponCounts[$vendorId]++;
                break;
            }
            
            $vendorIndex++;
            $attempts++;
            
            // 防止無限循環
            if ($attempts >= count($vendors)) {
                break;
            }
        } while (true);
        
        // 如果所有廠商都已達到上限，跳出循環
        if (!$vendor) {
            break;
        }

        // 選擇優惠券模板（循環使用）
        $template = $couponTemplates[($i - 1) % count($couponTemplates)];
        
        // 隨機選擇標籤（1-3個）
        $selectedTags = array_slice($tags, 0, rand(1, 3));
        shuffle($selectedTags);
        
        // 計算價格
        $originalPrice = rand(200, 2000);
        $discountedPrice = $template['discount_type'] === 'percentage' ? 
            $originalPrice * (1 - $template['discount_value'] / 100) :
            ($template['discount_type'] === 'fixed' ? 
                max(0, $originalPrice - $template['discount_value']) : 
                $originalPrice);
        
        // 生成優惠券數據
        $couponData = [
            'vendor_id' => $vendor['id'], // 使用 vendors 表的 id，不是 user_id
            'title' => $template['title'] . ' - ' . $vendor['company_name'],
            'description' => "由 {$vendor['company_name']} 提供的優質服務，" . 
                           ($template['discount_type'] === 'percentage' ? "享受 {$template['discount_value']}% 折扣" :
                            ($template['discount_type'] === 'fixed' ? "立即折抵 NT$ {$template['discount_value']}" :
                             ($template['discount_type'] === 'bogo' ? "買一送一超值優惠" : "免費體驗活動"))),
            'terms' => "1. 本優惠券僅限於 {$vendor['company_name']} 使用\n2. 不得與其他優惠併用\n3. 優惠券使用期限內有效\n4. 遺失恕不補發\n5. 詳細條款請洽詢店家",
            'image' => $imagePath,
            'category' => $template['category'],
            'discount_type' => $template['discount_type'],
            'discount_value' => $template['discount_value'],
            'original_price' => $originalPrice,
            'discounted_price' => $discountedPrice,
            'start_date' => date('Y-m-d'),
            'end_date' => date('Y-m-d', strtotime('+' . rand(30, 90) . ' days')),
            'usage_limit_per_user' => rand(1, 3),
            'total_usage_limit' => rand(50, 200),
            'used_count' => 0,
            'view_count' => rand(0, 100),
            'favorite_count' => rand(0, 20),
            'status' => 'active',
            'approval_status' => 'approved',
            'approved_by' => 1, // 假設管理員 ID 為 1
            'approved_at' => date('Y-m-d H:i:s'),
            'featured' => rand(0, 1) ? 1 : 0,
            'priority' => rand(0, 10)
        ];

        // 插入優惠券
        $insertStmt = $pdo->prepare("
            INSERT INTO coupons (
                vendor_id, title, description, terms, image, category, discount_type, 
                discount_value, original_price, discounted_price, start_date, end_date, 
                usage_limit_per_user, total_usage_limit, used_count, view_count, 
                favorite_count, status, approval_status, approved_by, approved_at, 
                featured, priority, created_at, updated_at
            ) VALUES (
                :vendor_id, :title, :description, :terms, :image, :category, :discount_type,
                :discount_value, :original_price, :discounted_price, :start_date, :end_date,
                :usage_limit_per_user, :total_usage_limit, :used_count, :view_count,
                :favorite_count, :status, :approval_status, :approved_by, :approved_at,
                :featured, :priority, NOW(), NOW()
            )
        ");

        $insertStmt->execute($couponData);
        $insertedCount++;
    }

    // 提交事務
    $pdo->commit();

    echo json_encode([
        'success' => true,
        'message' => "成功匯入 $insertedCount 張優惠券",
        'data' => [
            'inserted_count' => $insertedCount,
            'vendors_count' => count($vendors)
        ]
    ]);

} catch (Exception $e) {
    // 回滾事務
    if (isset($pdo)) {
        $pdo->rollback();
    }
    
    echo json_encode([
        'success' => false,
        'message' => '匯入失敗：' . $e->getMessage(),
        'error' => $e->getTraceAsString()
    ]);
}
?>
