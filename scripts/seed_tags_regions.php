<?php
/**
 * 種子：標籤（快速篩選）與地區
 * 用法： php scripts/seed_tags_regions.php
 */

require_once __DIR__ . '/../config/Env.php';
Env::load(__DIR__ . '/../.env');

$host = env('DB_HOST', '127.0.0.1');
$port = env('DB_PORT', '3306');
$dbname = env('DB_NAME', 'songhokang_db');
$username = env('DB_USER', 'root');
$password = env('DB_PASS', '');

function println($msg) { echo $msg . (PHP_SAPI === 'cli' ? PHP_EOL : '<br>'); }

$quickTags = [
    ['name' => '熱門', 'slug' => 'hot', 'icon' => '🔥', 'color' => '#ff4757', 'sort_order' => 10],
    ['name' => '即將到期', 'slug' => 'expiring-soon', 'icon' => '⏰', 'color' => '#ffa502', 'sort_order' => 20],
    ['name' => '新上架', 'slug' => 'new', 'icon' => '✨', 'color' => '#a29bfe', 'sort_order' => 30],
    ['name' => '買一送一', 'slug' => 'bogo', 'icon' => '🤑', 'color' => '#2ed573', 'sort_order' => 40],
    ['name' => '線上限定', 'slug' => 'online-only', 'icon' => '🌐', 'color' => '#1e90ff', 'sort_order' => 50],
    ['name' => '門市限定', 'slug' => 'in-store', 'icon' => '🏬', 'color' => '#747d8c', 'sort_order' => 60],
    ['name' => '學生優惠', 'slug' => 'student', 'icon' => '🎓', 'color' => '#70a1ff', 'sort_order' => 70],
    ['name' => '新戶優惠', 'slug' => 'new-user', 'icon' => '🆕', 'color' => '#2ed573', 'sort_order' => 80],
];

$regionsLv1 = [
    ['name' => '台北市', 'slug' => 'taipei'],
    ['name' => '新北市', 'slug' => 'new-taipei'],
    ['name' => '桃園市', 'slug' => 'taoyuan'],
    ['name' => '台中市', 'slug' => 'taichung'],
    ['name' => '台南市', 'slug' => 'tainan'],
    ['name' => '高雄市', 'slug' => 'kaohsiung'],
];

try {
    $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', $host, $port, $dbname);
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    // 建表（若尚未建立） - 簡易確保
    $pdo->exec("CREATE TABLE IF NOT EXISTS tags (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        slug VARCHAR(50) NOT NULL UNIQUE,
        type ENUM('quick','topic','benefit') NOT NULL DEFAULT 'quick',
        description TEXT NULL,
        icon VARCHAR(100) NULL,
        color VARCHAR(7) NULL,
        sort_order INT NOT NULL DEFAULT 0,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $pdo->exec("CREATE TABLE IF NOT EXISTS regions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        slug VARCHAR(50) NOT NULL UNIQUE,
        parent_id INT NULL,
        level TINYINT(1) NOT NULL DEFAULT 1,
        sort_order INT NOT NULL DEFAULT 0,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY parent_id (parent_id),
        KEY level (level)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    // upsert tags
    $stmt = $pdo->prepare("INSERT INTO tags (name, slug, type, icon, color, sort_order, is_active)
        VALUES (:name, :slug, 'quick', :icon, :color, :sort_order, 1)
        ON DUPLICATE KEY UPDATE name = VALUES(name), icon = VALUES(icon), color = VALUES(color), sort_order = VALUES(sort_order), is_active = VALUES(is_active)");
    foreach ($quickTags as $i => $t) {
        $stmt->execute([
            ':name' => $t['name'],
            ':slug' => $t['slug'],
            ':icon' => $t['icon'],
            ':color' => $t['color'],
            ':sort_order' => (int)($t['sort_order'] ?? (($i + 1) * 10)),
        ]);
    }
    println('Tags 種子完成');

    // upsert regions
    $stmtR = $pdo->prepare("INSERT INTO regions (name, slug, level, sort_order, is_active)
        VALUES (:name, :slug, 1, :sort_order, 1)
        ON DUPLICATE KEY UPDATE name = VALUES(name), level = VALUES(level), sort_order = VALUES(sort_order), is_active = VALUES(is_active)");
    foreach ($regionsLv1 as $i => $r) {
        $stmtR->execute([
            ':name' => $r['name'],
            ':slug' => $r['slug'],
            ':sort_order' => ($i + 1) * 10,
        ]);
    }
    println('Regions 種子完成');

} catch (Exception $e) {
    http_response_code(500);
    println('執行失敗：' . $e->getMessage());
}

?>


