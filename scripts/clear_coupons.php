<?php
/**
 * 清空現有優惠券資料
 */

require_once __DIR__ . '/../config/config.php';

header('Content-Type: application/json; charset=utf-8');
ob_clean();

try {
    $pdo = new PDO("mysql:host=localhost;dbname=songhokang_db;charset=utf8mb4", 'root', '', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

    // 清空優惠券相關表
    $pdo->exec("DELETE FROM coupon_usage");
    $pdo->exec("DELETE FROM user_favorites");
    $pdo->exec("DELETE FROM coupons");
    
    // 重置自增 ID
    $pdo->exec("ALTER TABLE coupons AUTO_INCREMENT = 1");
    $pdo->exec("ALTER TABLE coupon_usage AUTO_INCREMENT = 1");
    $pdo->exec("ALTER TABLE user_favorites AUTO_INCREMENT = 1");

    echo json_encode([
        'success' => true,
        'message' => '已清空所有優惠券資料'
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => '清空失敗：' . $e->getMessage()
    ]);
}
?>
