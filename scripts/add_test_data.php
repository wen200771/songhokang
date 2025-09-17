<?php
/**
 * 添增測試資料 - 使用者與廠商帳號
 */

require_once __DIR__ . '/../config/Env.php';
Env::load(__DIR__ . '/../.env');

$host = env('DB_HOST', '127.0.0.1');
$port = env('DB_PORT', '3306');
$dbname = env('DB_NAME', 'songhokang_db');
$username = env('DB_USER', 'root');
$password = env('DB_PASS', '');

try {
    $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', $host, $port, $dbname);
    $pdo = new PDO($dsn, $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "<h2>添增測試資料</h2>";

    // 檢查是否已存在資料
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM users");
    $userCount = (int)($stmt->fetch()['count'] ?? 0);

    if ($userCount > 0) {
        echo "<p>資料庫中已有 $userCount 筆使用者，略過建立使用者流程。</p>";
    } else {
        // 建立管理員
        echo "<h3>建立管理員帳號</h3>";
        $adminPassword = password_hash('admin123', PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO users (username, email, password, role, status, created_at) VALUES (?, ?, ?, ?, ?, NOW())");
        $stmt->execute(['admin', 'admin@songhokang.com', $adminPassword, 'admin', 'active']);
        echo "<p>新增管理員帳號 (admin / admin123)</p>";

        // 建立一般使用者
        echo "<h3>建立一般使用者</h3>";
        $generalUsers = [
            ['張小美', 'zhang@example.com'],
            ['李小華', 'li@example.com'],
            ['王大明', 'wang@example.com'],
            ['陳雅琪', 'chen@example.com'],
            ['林怡君', 'lin@example.com']
        ];

        foreach ($generalUsers as $user) {
            $password = password_hash('123456', PASSWORD_DEFAULT);
            $stmt->execute([$user[0], $user[1], $password, 'customer', 'active']);
            echo "<p>新增一般使用者：{$user[0]} ({$user[1]})</p>";
        }

        // 建立廠商使用者
        echo "<h3>建立廠商使用者</h3>";
        $vendorUsers = [
            ['美食天地', 'meishi@example.com', '美食天地股份有限公司', '02-12345678'],
            ['流行購物', 'fashion@example.com', '流行購物事業有限公司', '02-23456789'],
            ['健康健身', 'fitness@example.com', '健康健身事業', '02-34567890'],
            ['美容SPA', 'beauty@example.com', '美容SPA企業', '02-45678901'],
            ['3C市集', 'tech@example.com', '3C市集專賣店', '02-56789012']
        ];

        foreach ($vendorUsers as $vendor) {
            $password = password_hash('vendor123', PASSWORD_DEFAULT);
            $stmt->execute([$vendor[0], $vendor[1], $password, 'vendor', 'active']);
            $vendorUserId = $pdo->lastInsertId();

            $stmt2 = $pdo->prepare("INSERT INTO vendors (user_id, company_name, phone, verification_status, created_at) VALUES (?, ?, ?, ?, NOW())");
            $stmt2->execute([$vendorUserId, $vendor[2], $vendor[3], 'approved']);

            echo "<p>新增廠商帳號：{$vendor[0]} - {$vendor[2]}</p>";
        }
    }

    // 檢查優惠券資料
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM coupons");
    $couponCount = (int)($stmt->fetch()['count'] ?? 0);

    if ($couponCount > 0) {
        echo "<p>資料庫中已有 $couponCount 張優惠券。</p>";
    } else {
        echo "<p>目前沒有優惠券資料，可使用 scripts/import_coupons.php 導入。</p>";
    }

    echo "<p><strong>測試資料處理完成。</strong></p>";

} catch (Exception $e) {
    echo "<p style='color: red;'>發生錯誤：" . htmlspecialchars($e->getMessage(), ENT_QUOTES, 'UTF-8') . "</p>";
}
