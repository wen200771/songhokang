<?php
// 列出目前資料庫的管理員帳號（users.role = 'admin'）
// 用法： php scripts/list_admins.php

require_once __DIR__ . '/../config/Env.php';
Env::load(__DIR__ . '/../.env');

$host = env('DB_HOST', '127.0.0.1');
$port = env('DB_PORT', '3306');
$dbname = env('DB_NAME', 'songhokang_db');
$username = env('DB_USER', 'root');
$password = env('DB_PASS', '');

function println($s){ echo $s . (PHP_SAPI === 'cli' ? PHP_EOL : "<br>\n"); }

try {
    $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', $host, $port, $dbname);
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    $sql = "SELECT id, username, email, role, status, created_at, last_login FROM users WHERE role = 'admin' ORDER BY id ASC";
    $rows = $pdo->query($sql)->fetchAll();

    if (!$rows) {
        println('目前沒有 admin 帳號');
        exit(0);
    }

    println(str_pad('ID', 5) . str_pad('USERNAME', 20) . str_pad('EMAIL', 30) . str_pad('STATUS', 12) . 'LAST_LOGIN');
    println(str_repeat('-', 90));
    foreach ($rows as $r) {
        println(str_pad($r['id'], 5) . str_pad($r['username'], 20) . str_pad($r['email'], 30) . str_pad($r['status'], 12) . ($r['last_login'] ?: 'NULL'));
    }

} catch (Exception $e) {
    http_response_code(500);
    println('查詢失敗：' . $e->getMessage());
}

?>


