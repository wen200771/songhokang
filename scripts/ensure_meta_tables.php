<?php
// 建立缺少的關聯表：coupon_tags 與 coupon_regions
// 用法： php scripts/ensure_meta_tables.php

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

    // 檢查 coupons/tags/regions 是否存在（避免外鍵失敗）
    $required = ['coupons','tags','regions'];
    foreach ($required as $tbl) {
        $stmt = $pdo->prepare("SHOW TABLES LIKE ?");
        $stmt->execute([$tbl]);
        if (!$stmt->fetch()) {
            throw new RuntimeException("資料表缺少：{$tbl}，請先建立主表");
        }
    }

    // 建立 coupon_tags
    $sqlCouponTags = "CREATE TABLE IF NOT EXISTS `coupon_tags` (
        `coupon_id` INT(11) NOT NULL,
        `tag_id` INT(11) NOT NULL,
        PRIMARY KEY (`coupon_id`,`tag_id`),
        KEY `tag_id` (`tag_id`),
        CONSTRAINT `fk_ct_coupon` FOREIGN KEY (`coupon_id`) REFERENCES `coupons`(`id`) ON DELETE CASCADE,
        CONSTRAINT `fk_ct_tag` FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='優惠券標籤關聯'";
    $pdo->exec($sqlCouponTags);
    println('coupon_tags 檢查/建立完成');

    // 建立 coupon_regions
    $sqlCouponRegions = "CREATE TABLE IF NOT EXISTS `coupon_regions` (
        `coupon_id` INT(11) NOT NULL,
        `region_id` INT(11) NOT NULL,
        PRIMARY KEY (`coupon_id`,`region_id`),
        KEY `region_id` (`region_id`),
        CONSTRAINT `fk_cr_coupon` FOREIGN KEY (`coupon_id`) REFERENCES `coupons`(`id`) ON DELETE CASCADE,
        CONSTRAINT `fk_cr_region` FOREIGN KEY (`region_id`) REFERENCES `regions`(`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='優惠券地區關聯'";
    $pdo->exec($sqlCouponRegions);
    println('coupon_regions 檢查/建立完成');

    println('所有關聯表已就緒');

} catch (Exception $e) {
    http_response_code(500);
    println('建立失敗：' . $e->getMessage());
}

?>


