<?php
/**
 * 種子：完整分類 upsert（存在則更新，不存在則新增）
 * 用法：
 *   php scripts/seed_categories.php
 */

require_once __DIR__ . '/../config/Env.php';
Env::load(__DIR__ . '/../.env');

$host = env('DB_HOST', '127.0.0.1');
$port = env('DB_PORT', '3306');
$dbname = env('DB_NAME', 'songhokang_db');
$username = env('DB_USER', 'root');
$password = env('DB_PASS', '');

function println($msg) {
    echo $msg . (PHP_SAPI === 'cli' ? PHP_EOL : '<br>');
}

// 完整分類清單（主分類）
$categories = [
    // 美食餐飲
    ['name' => '美食餐飲', 'slug' => 'food', 'icon' => '🍽️', 'color' => '#ff6b6b', 'sort_order' => 10, 'description' => '餐廳、咖啡廳、小吃等美食相關優惠'],
    // 超市量販/日用
    ['name' => '超市量販', 'slug' => 'grocery', 'icon' => '🛒', 'color' => '#4ecdc4', 'sort_order' => 20, 'description' => '超市、量販、便利商店、生鮮日用'],
    // 服飾鞋包
    ['name' => '服飾鞋包', 'slug' => 'fashion', 'icon' => '👗', 'color' => '#f78fb3', 'sort_order' => 30, 'description' => '男/女/童裝、鞋類、包款、飾品配件'],
    // 3C/家電
    ['name' => '3C數位家電', 'slug' => 'electronics', 'icon' => '💻', 'color' => '#54a0ff', 'sort_order' => 40, 'description' => '手機、電腦、周邊、家電、智慧家居'],
    // 美容保養
    ['name' => '美容保養', 'slug' => 'beauty', 'icon' => '💄', 'color' => '#45b7d1', 'sort_order' => 50, 'description' => '美髮、美甲、SPA、按摩、藥妝/保養'],
    // 休閒娛樂
    ['name' => '休閒娛樂', 'slug' => 'entertainment', 'icon' => '🎮', 'color' => '#f9ca24', 'sort_order' => 60, 'description' => '電影、KTV、桌遊、主題樂園、藝文展演'],
    // 旅遊住宿/交通
    ['name' => '旅遊住宿', 'slug' => 'travel', 'icon' => '✈️', 'color' => '#6c5ce7', 'sort_order' => 70, 'description' => '飯店、民宿、景點門票、旅行社及行程'],
    // 運動健身
    ['name' => '運動健身', 'slug' => 'sports', 'icon' => '🏋️', 'color' => '#10b981', 'sort_order' => 80, 'description' => '健身房、瑜珈、運動用品、球館/場地'],
    // 生活服務
    ['name' => '生活服務', 'slug' => 'services', 'icon' => '🧰', 'color' => '#a3a3a3', 'sort_order' => 90, 'description' => '洗衣清潔、家修/水電、搬家、影印/攝影'],
    // 汽機車/車用
    ['name' => '汽機車車用', 'slug' => 'auto', 'icon' => '🚗', 'color' => '#ffa502', 'sort_order' => 100, 'description' => '保養維修、洗車、輪胎配件、加油/充電'],
    // 教育學習
    ['name' => '教育學習', 'slug' => 'education', 'icon' => '📚', 'color' => '#ff9f43', 'sort_order' => 110, 'description' => '語言證照、線上課程、才藝補習、兒童學習'],
    // 母嬰親子
    ['name' => '母嬰親子', 'slug' => 'parenting', 'icon' => '👶', 'color' => '#f78fb3', 'sort_order' => 120, 'description' => '嬰幼用品、親子餐廳、親子樂園、孕產照護'],
    // 健康醫療
    ['name' => '健康醫療', 'slug' => 'health', 'icon' => '🏥', 'color' => '#a29bfe', 'sort_order' => 130, 'description' => '診所、牙醫、眼科配鏡、藥局、保健食品'],
];

try {
    $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', $host, $port, $dbname);
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    // 建立資料表（若不存在）
    $pdo->exec("CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        slug VARCHAR(50) NOT NULL UNIQUE,
        description TEXT NULL,
        icon VARCHAR(100) NULL,
        color VARCHAR(7) NULL,
        sort_order INT NOT NULL DEFAULT 0,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY sort_order (sort_order),
        KEY is_active (is_active)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    // upsert（MySQL 5.7+ 可使用 ON DUPLICATE KEY UPDATE）
    $stmt = $pdo->prepare("INSERT INTO categories (name, slug, description, icon, color, sort_order, is_active)
        VALUES (:name, :slug, :description, :icon, :color, :sort_order, :is_active)
        ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            description = VALUES(description),
            icon = VALUES(icon),
            color = VALUES(color),
            sort_order = VALUES(sort_order),
            is_active = VALUES(is_active)");

    $count = 0;
    foreach ($categories as $i => $cat) {
        $stmt->execute([
            ':name' => $cat['name'],
            ':slug' => $cat['slug'],
            ':description' => $cat['description'] ?? null,
            ':icon' => $cat['icon'] ?? null,
            ':color' => $cat['color'] ?? null,
            ':sort_order' => (int)($cat['sort_order'] ?? (($i + 1) * 10)),
            ':is_active' => 1,
        ]);
        $count++;
    }

    println("已處理分類筆數：{$count}");

    // 顯示目前啟用中的分類
    $rows = $pdo->query("SELECT id, name, slug, icon, color, sort_order, is_active FROM categories WHERE is_active = 1 ORDER BY sort_order, id")->fetchAll();
    println("當前啟用中的分類：");
    foreach ($rows as $r) {
        println(sprintf("- %s (%s)", $r['name'], $r['slug']));
    }

    println("完成。");
} catch (Exception $e) {
    http_response_code(500);
    println('種子執行失敗：' . $e->getMessage());
}

?>


