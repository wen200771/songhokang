<?php
/**
 * 收藏模型
 */

class Favorite {
    private $conn;

    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }

    /**
     * 取得用戶收藏列表（含簡要優惠券資訊）
     */
    public function listByUser(int $userId): array {
        $sql = "SELECT uf.coupon_id as id,
                       c.title,
                       c.description,
                       c.image,
                       c.category,
                       c.end_date,
                       v.company_name,
                       v.address,
                       v.phone
                FROM user_favorites uf
                LEFT JOIN coupons c ON c.id = uf.coupon_id
                LEFT JOIN vendors v ON v.id = c.vendor_id
                WHERE uf.user_id = :uid
                ORDER BY uf.created_at DESC";
        $stmt = $this->conn->prepare($sql);
        $stmt->bindValue(':uid', $userId, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll();

        return array_map(function ($row) {
            return [
                'id' => (int)$row['id'],
                'image' => $row['image'] ?: '',
                'storeName' => $row['company_name'] ?? '合作店家',
                'category' => $row['category'] ?? '一般優惠',
                'title' => $row['title'] ?? '優惠活動',
                'description' => $row['description'] ?? '詳情請見活動說明。',
                'expiry' => !empty($row['end_date']) ? date('Y/m/d', strtotime($row['end_date'])) : '',
                'usage' => '每人限用一次',
                'address' => $row['address'] ?? '',
                'phone' => $row['phone'] ?? ''
            ];
        }, $rows);
    }

    /**
     * 新增收藏（若已存在則無動作）
     */
    public function add(int $userId, int $couponId): bool {
        // 檢查是否存在
        $check = $this->conn->prepare('SELECT 1 FROM user_favorites WHERE user_id = :uid AND coupon_id = :cid');
        $check->execute([':uid' => $userId, ':cid' => $couponId]);
        if ($check->fetch()) return true;

        $stmt = $this->conn->prepare('INSERT INTO user_favorites (user_id, coupon_id) VALUES (:uid, :cid)');
        return $stmt->execute([':uid' => $userId, ':cid' => $couponId]);
    }

    /**
     * 取消收藏（依用戶與優惠券）
     */
    public function remove(int $userId, int $couponId): bool {
        $stmt = $this->conn->prepare('DELETE FROM user_favorites WHERE user_id = :uid AND coupon_id = :cid');
        return $stmt->execute([':uid' => $userId, ':cid' => $couponId]);
    }
}
?>


