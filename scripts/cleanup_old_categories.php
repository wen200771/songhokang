<?php
/**
 * 清理舊分類：停用不再使用的 slug
 * 用法： php scripts/cleanup_old_categories.php
 */

require_once __DIR__ . '/../config/Env.php';
Env::load(__DIR__ . '/../.env');

$host = env('DB_HOST', '127.0.0.1');
$port = env('DB_PORT', '3306');
$dbname = env('DB_NAME', 'songhokang_db');
$username = env('DB_USER', 'root');
$password = env('DB_PASS', '');

function println($msg) { echo $msg . (PHP_SAPI === 'cli' ? PHP_EOL : '<br>'); }

$deprecated = [
    'shopping', // 舊的「購物商城」，改以 fashion / electronics / grocery 分拆
];

try {
    $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', $host, $port, $dbname);
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    $stmt = $pdo->prepare('UPDATE categories SET is_active = 0 WHERE slug = ?');
    $count = 0;
    foreach ($deprecated as $slug) {
        $stmt->execute([$slug]);
        $count += $stmt->rowCount();
    }
    println("已停用舊分類筆數：{$count}");

    $rows = $pdo->query("SELECT id, name, slug, is_active FROM categories ORDER BY sort_order, id")->fetchAll();
    foreach ($rows as $r) {
        println(sprintf("- %s (%s) => %s", $r['name'], $r['slug'], $r['is_active'] ? '啟用' : '停用'));
    }
} catch (Exception $e) {
    http_response_code(500);
    println('清理失敗：' . $e->getMessage());
}

?>


