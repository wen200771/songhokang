<?php
/**
 * 清空優惠券與相關資料
 */

require_once __DIR__ . '/../config/Env.php';
Env::load(__DIR__ . '/../.env');

header('Content-Type: application/json; charset=utf-8');
ob_clean();

try {
    $dsn = sprintf(
        'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
        env('DB_HOST', '127.0.0.1'),
        env('DB_PORT', '3306'),
        env('DB_NAME', 'songhokang_db')
    );
    $pdo = new PDO($dsn, env('DB_USER', 'root'), env('DB_PASS', ''), [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

    // 清空相關表格
    ->exec('DELETE FROM coupon_usage');
    ->exec('DELETE FROM user_favorites');
    ->exec('DELETE FROM coupons');

    // 重置自增 ID
    ->exec('ALTER TABLE coupons AUTO_INCREMENT = 1');
    ->exec('ALTER TABLE coupon_usage AUTO_INCREMENT = 1');
    ->exec('ALTER TABLE user_favorites AUTO_INCREMENT = 1');
    $pdo->exec('DELETE FROM coupon_usage');
    $pdo->exec('DELETE FROM user_favorites');
    $pdo->exec('DELETE FROM coupons');

    echo json_encode([
        'success' => true,
        'message' => '優惠券資料已清除'
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => '清除失敗',
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
