<?php
/**
 * 添加測試數據 - 用戶和廠商
 */

// 直接連接數據庫
$host = 'localhost';
$dbname = 'songhokang_db';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<h2>添加測試數據</h2>";
    
    // 檢查是否已有數據
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM users");
    $userCount = $stmt->fetch()['count'];
    
    if ($userCount > 0) {
        echo "<p>數據庫中已有 $userCount 個用戶，跳過用戶創建</p>";
    } else {
        // 創建管理員
        echo "<h3>創建管理員用戶</h3>";
        $adminPassword = password_hash('admin123', PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO users (username, email, password, role, status, created_at) VALUES (?, ?, ?, ?, ?, NOW())");
        $stmt->execute(['admin', 'admin@songhokang.com', $adminPassword, 'admin', 'active']);
        echo "<p>✅ 管理員用戶創建成功 (用戶名: admin, 密碼: admin123)</p>";
        
        // 創建測試一般用戶
        echo "<h3>創建一般用戶</h3>";
        $generalUsers = [
            ['張小明', 'zhang@example.com'],
            ['李美華', 'li@example.com'],
            ['王大偉', 'wang@example.com'],
            ['陳小芳', 'chen@example.com'],
            ['林志明', 'lin@example.com']
        ];
        
        foreach ($generalUsers as $user) {
            $password = password_hash('123456', PASSWORD_DEFAULT);
            $stmt->execute([$user[0], $user[1], $password, 'customer', 'active']);
            echo "<p>✅ 一般用戶: {$user[0]} ({$user[1]})</p>";
        }
        
        // 創建廠商用戶
        echo "<h3>創建廠商用戶</h3>";
        $vendorUsers = [
            ['美食天堂', 'meishi@example.com', '美食天堂股份有限公司', '02-12345678'],
            ['時尚購物', 'fashion@example.com', '時尚購物有限公司', '02-23456789'],
            ['健身中心', 'fitness@example.com', '健身中心企業社', '02-34567890'],
            ['美容SPA', 'beauty@example.com', '美容SPA館', '02-45678901'],
            ['3C電子', 'tech@example.com', '3C電子專賣店', '02-56789012']
        ];
        
        foreach ($vendorUsers as $vendor) {
            $password = password_hash('vendor123', PASSWORD_DEFAULT);
            $stmt->execute([$vendor[0], $vendor[1], $password, 'vendor', 'active']);
            $vendorUserId = $pdo->lastInsertId();
            
            // 創建對應的廠商資料
            $stmt2 = $pdo->prepare("INSERT INTO vendors (user_id, company_name, phone, verification_status, created_at) VALUES (?, ?, ?, ?, NOW())");
            $stmt2->execute([$vendorUserId, $vendor[2], $vendor[3], 'approved']);
            
            echo "<p>✅ 廠商用戶: {$vendor[0]} - {$vendor[2]}</p>";
        }
    }
    
    // 檢查優惠券數據
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM coupons");
    $couponCount = $stmt->fetch()['count'];
    
    if ($couponCount > 0) {
        echo "<p>數據庫中已有 $couponCount 個優惠券</p>";
    } else {
        echo "<p>⚠️ 數據庫中沒有優惠券數據，請使用優惠券導入工具添加優惠券</p>";
        echo "<p><a href='import_coupons_web.php' target='_blank'>點擊這裡導入優惠券</a></p>";
    }
    
    echo "<h3>數據統計</h3>";
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM users");
    $userCount = $stmt->fetch()['count'];
    echo "<p>總用戶數: $userCount</p>";
    
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM vendors");
    $vendorCount = $stmt->fetch()['count'];
    echo "<p>總廠商數: $vendorCount</p>";
    
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM coupons");
    $couponCount = $stmt->fetch()['count'];
    echo "<p>總優惠券數: $couponCount</p>";
    
    echo "<p><strong>測試數據添加完成！</strong></p>";
    echo "<p><a href='../admin/index.html' target='_blank'>進入管理員後台測試</a></p>";
    
} catch (Exception $e) {
    echo "<p style='color: red;'>錯誤: " . $e->getMessage() . "</p>";
}
?>
