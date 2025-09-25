<?php
// 重設管理員密碼為 admin123（帳號：admin）
// 用法： php scripts/reset_admin_password.php

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

    // 確認是否存在 admin 帳號
    $check = $pdo->prepare("SELECT id FROM users WHERE username = 'admin' LIMIT 1");
    $check->execute();
    $row = $check->fetch();

    $hash = password_hash('admin123', PASSWORD_DEFAULT);

    if ($row) {
        $upd = $pdo->prepare("UPDATE users SET password = :pwd, status = 'active', updated_at = NOW() WHERE id = :id");
        $ok = $upd->execute([':pwd' => $hash, ':id' => (int)$row['id']]);
        if ($ok) {
            println('已重設 admin 密碼為 admin123，並確保狀態為 active');
        } else {
            println('重設失敗');
        }
    } else {
        // 若不存在則建立一個
        $ins = $pdo->prepare("INSERT INTO users (username, email, password, role, status, created_at, updated_at) VALUES ('admin', 'admin@songhokang.com', :pwd, 'admin', 'active', NOW(), NOW())");
        $ok = $ins->execute([':pwd' => $hash]);
        if ($ok) {
            println('資料庫不存在 admin，已建立並設定密碼為 admin123');
        } else {
            println('建立 admin 失敗');
        }
    }

} catch (Exception $e) {
    http_response_code(500);
    println('操作失敗：' . $e->getMessage());
}

?>


