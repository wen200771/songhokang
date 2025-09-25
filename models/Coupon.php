<?php
/**
 * 優惠券模型
 * 提供基礎查詢：列表、單筆
 */

class Coupon {
    private $conn;

    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }

    /**
     * 取得優惠券列表
     * 支援分頁與簡易篩選
     */
    public function getList($page = 1, $pageSize = DEFAULT_PAGE_SIZE, $filters = []) {
        $offset = ($page - 1) * $pageSize;

        $where = [];
        $params = [];

        if (!empty($filters['search'])) {
            $where[] = '(c.title LIKE :search OR c.description LIKE :search OR c.category LIKE :search OR v.company_name LIKE :search)';
            $params[':search'] = '%' . $filters['search'] . '%';
        }

        if (!empty($filters['category'])) {
            $where[] = 'c.category = :category';
            $params[':category'] = $filters['category'];
        }

        if (!empty($filters['status'])) {
            $where[] = 'c.status = :status';
            $params[':status'] = $filters['status'];
        }

        if (!empty($filters['vendor_id'])) {
            $where[] = 'c.vendor_id = :vendor_id';
            $params[':vendor_id'] = (int)$filters['vendor_id'];
        }

        $whereSql = empty($where) ? '' : ('WHERE ' . implode(' AND ', $where));

        // 計算總數
        $countSql = "SELECT COUNT(*) AS total FROM coupons c LEFT JOIN vendors v ON v.id = c.vendor_id $whereSql";
        $countStmt = $this->conn->prepare($countSql);
        $countStmt->execute($params);
        $total = (int)($countStmt->fetch()['total'] ?? 0);

        // 主要資料
        $sql = "SELECT 
                    c.id,
                    c.title,
                    c.description,
                    c.image,
                    c.category,
                    c.status,
                    c.view_count,
                    c.favorite_count,
                    c.used_count,
                    c.end_date,
                    v.company_name,
                    v.address,
                    v.phone
                FROM coupons c
                LEFT JOIN vendors v ON v.id = c.vendor_id
                $whereSql
                ORDER BY c.created_at DESC
                LIMIT :offset, :limit";

        $stmt = $this->conn->prepare($sql);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
        $stmt->bindValue(':limit', (int)$pageSize, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll();

        // 格式化成前端需要的字段
        $items = array_map(function ($row) {
            return [
                'id' => (int)$row['id'],
                'image' => $row['image'] ?: '',
                'storeName' => $row['company_name'] ?: '合作店家',
                'category' => $row['category'] ?: '一般優惠',
                'title' => $row['title'] ?: '優惠活動',
                'description' => $row['description'] ?: '詳情請見活動說明。',
                'expiry' => !empty($row['end_date']) ? date('Y/m/d', strtotime($row['end_date'])) : '',
                'usage' => '每人限用一次',
                'address' => $row['address'] ?: '',
                'phone' => $row['phone'] ?: '',
                'status' => $row['status'] ?: 'active',
                'view_count' => (int)($row['view_count'] ?: 0),
                'favorite_count' => (int)($row['favorite_count'] ?: 0),
                'used_count' => (int)($row['used_count'] ?: 0)
            ];
        }, $rows);

        return [
            'coupons' => $items,
            'total' => $total,
            'page' => $page,
            'pageSize' => $pageSize,
            'totalPages' => $pageSize > 0 ? (int)ceil($total / $pageSize) : 1
        ];
    }

    /**
     * 取得單一優惠券（詳細版本，用於管理員）
     */
    public function findById($id) {
        $sql = "SELECT 
                    c.*,
                    v.company_name,
                    v.address,
                    v.phone
                FROM coupons c
                LEFT JOIN vendors v ON v.id = c.vendor_id
                WHERE c.id = :id";
        $stmt = $this->conn->prepare($sql);
        $stmt->bindValue(':id', (int)$id, PDO::PARAM_INT);
        $stmt->execute();
        $row = $stmt->fetch();
        if (!$row) {
            return null;
        }
        return [
            'id' => (int)$row['id'],
            'title' => $row['title'] ?: '優惠活動',
            'description' => $row['description'] ?: '詳情請見活動說明。',
            'image' => $row['image'] ?: '',
            'category' => $row['category'] ?: '一般優惠',
            'discount_type' => $row['discount_type'] ?: 'percentage',
            'discount_value' => (float)$row['discount_value'] ?: 0,
            'start_date' => $row['start_date'],
            'end_date' => $row['end_date'],
            'status' => $row['status'] ?: 'active',
            'usage_rules' => isset($row['terms']) ? $row['terms'] : '每人限用一次',
            'view_count' => (int)$row['view_count'] ?: 0,
            'favorite_count' => (int)$row['favorite_count'] ?: 0,
            'used_count' => (int)$row['used_count'] ?: 0,
            'company_name' => $row['company_name'] ?: '合作店家',
            'address' => $row['address'] ?: '',
            'phone' => $row['phone'] ?: '',
            'admin_note' => $row['admin_note'] ?: '',
            'created_at' => $row['created_at'],
            'updated_at' => $row['updated_at']
        ];
    }

    /**
     * 更新優惠券狀態
     */
    public function updateStatus($id, $status) {
        $sql = "UPDATE coupons SET status = :status, updated_at = NOW() WHERE id = :id";
        $stmt = $this->conn->prepare($sql);
        $stmt->bindValue(':status', $status, PDO::PARAM_STR);
        $stmt->bindValue(':id', (int)$id, PDO::PARAM_INT);
        return $stmt->execute();
    }

    /**
     * 添加管理員備註
     */
    public function addAdminNote($id, $note) {
        $sql = "UPDATE coupons SET admin_note = CONCAT(COALESCE(admin_note, ''), :note, '\n'), updated_at = NOW() WHERE id = :id";
        $stmt = $this->conn->prepare($sql);
        $stmt->bindValue(':note', $note, PDO::PARAM_STR);
        $stmt->bindValue(':id', (int)$id, PDO::PARAM_INT);
        return $stmt->execute();
    }

    public function incrementViewCount($id) {
        $sql = "UPDATE coupons SET view_count = view_count + 1, updated_at = NOW() WHERE id = :id";
        $stmt = $this->conn->prepare($sql);
        $stmt->bindValue(':id', (int)$id, PDO::PARAM_INT);
        return $stmt->execute();
    }

    /**
     * 新增優惠券
     */
    public function create($data) {
        $sql = "INSERT INTO coupons (
                    vendor_id, title, category, description, discount_type, discount_value,
                    start_date, end_date, terms, image, status, created_at, updated_at
                ) VALUES (
                    :vendor_id, :title, :category, :description, :discount_type, :discount_value,
                    :start_date, :end_date, :terms, :image, :status, NOW(), NOW()
                )";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->bindValue(':vendor_id', $data['vendor_id'], PDO::PARAM_INT);
        $stmt->bindValue(':title', $data['title'], PDO::PARAM_STR);
        $stmt->bindValue(':category', $data['category'], PDO::PARAM_STR);
        $stmt->bindValue(':description', $data['description'], PDO::PARAM_STR);
        $stmt->bindValue(':discount_type', $data['discount_type'], PDO::PARAM_STR);
        $stmt->bindValue(':discount_value', $data['discount_value'], PDO::PARAM_STR);
        $stmt->bindValue(':start_date', $data['start_date'], PDO::PARAM_STR);
        $stmt->bindValue(':end_date', $data['end_date'], PDO::PARAM_STR);
        $stmt->bindValue(':terms', $data['usage_rules'], PDO::PARAM_STR);
        $stmt->bindValue(':image', $data['image'], PDO::PARAM_STR);
        $stmt->bindValue(':status', $data['status'], PDO::PARAM_STR);
        
        if ($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }

    /**
     * 更新優惠券
     */
    public function update($id, $data) {
        $sql = "UPDATE coupons SET 
                    title = :title,
                    category = :category,
                    description = :description,
                    discount_type = :discount_type,
                    discount_value = :discount_value,
                    start_date = :start_date,
                    end_date = :end_date,
                    terms = :terms,
                    image = :image,
                    updated_at = NOW()
                WHERE id = :id";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->bindValue(':id', (int)$id, PDO::PARAM_INT);
        $stmt->bindValue(':title', $data['title'], PDO::PARAM_STR);
        $stmt->bindValue(':category', $data['category'], PDO::PARAM_STR);
        $stmt->bindValue(':description', $data['description'], PDO::PARAM_STR);
        $stmt->bindValue(':discount_type', $data['discount_type'], PDO::PARAM_STR);
        $stmt->bindValue(':discount_value', $data['discount_value'], PDO::PARAM_STR);
        $stmt->bindValue(':start_date', $data['start_date'], PDO::PARAM_STR);
        $stmt->bindValue(':end_date', $data['end_date'], PDO::PARAM_STR);
        $stmt->bindValue(':terms', $data['usage_rules'], PDO::PARAM_STR);
        $stmt->bindValue(':image', $data['image'], PDO::PARAM_STR);
        
        return $stmt->execute();
    }

    /**
     * 刪除優惠券
     */
    public function delete($id) {
        try {
            $this->conn->beginTransaction();
            
            // 刪除相關的使用記錄
            $deleteUsageSql = "DELETE FROM coupon_usage WHERE coupon_id = :id";
            $deleteUsageStmt = $this->conn->prepare($deleteUsageSql);
            $deleteUsageStmt->bindValue(':id', (int)$id, PDO::PARAM_INT);
            $deleteUsageStmt->execute();
            
            // 刪除相關的收藏記錄
            $deleteFavSql = "DELETE FROM favorites WHERE coupon_id = :id";
            $deleteFavStmt = $this->conn->prepare($deleteFavSql);
            $deleteFavStmt->bindValue(':id', (int)$id, PDO::PARAM_INT);
            $deleteFavStmt->execute();
            
            // 刪除優惠券
            $deleteCouponSql = "DELETE FROM coupons WHERE id = :id";
            $deleteCouponStmt = $this->conn->prepare($deleteCouponSql);
            $deleteCouponStmt->bindValue(':id', (int)$id, PDO::PARAM_INT);
            $result = $deleteCouponStmt->execute();
            
            $this->conn->commit();
            return $result;
        } catch (Exception $e) {
            $this->conn->rollBack();
            return false;
        }
    }

    /**
     * 檢查用戶是否已經使用過優惠券
     */
    public function hasUserUsed($couponId, $userId) {
        $sql = "SELECT COUNT(*) FROM coupon_usage WHERE coupon_id = :coupon_id AND user_id = :user_id";
        $stmt = $this->conn->prepare($sql);
        $stmt->bindValue(':coupon_id', (int)$couponId, PDO::PARAM_INT);
        $stmt->bindValue(':user_id', (int)$userId, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchColumn() > 0;
    }

    /**
     * 記錄優惠券使用
     */
    public function recordUsage($couponId, $userId, $verificationCode = null) {
        try {
            $this->conn->beginTransaction();
            
            // 插入使用記錄
            $sql = "INSERT INTO coupon_usage (coupon_id, user_id, verification_code, used_at) VALUES (:coupon_id, :user_id, :verification_code, NOW())";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindValue(':coupon_id', (int)$couponId, PDO::PARAM_INT);
            $stmt->bindValue(':user_id', (int)$userId, PDO::PARAM_INT);
            $stmt->bindValue(':verification_code', $verificationCode, PDO::PARAM_STR);
            $stmt->execute();
            
            // 更新優惠券使用次數
            $updateSql = "UPDATE coupons SET used_count = used_count + 1, updated_at = NOW() WHERE id = :id";
            $updateStmt = $this->conn->prepare($updateSql);
            $updateStmt->bindValue(':id', (int)$couponId, PDO::PARAM_INT);
            $updateStmt->execute();
            
            $this->conn->commit();
            return true;
        } catch (Exception $e) {
            $this->conn->rollBack();
            return false;
        }
    }

    /**
     * 獲取用戶使用記錄
     */
    public function getUserUsageHistory($userId) {
        $sql = "SELECT cu.*, c.title, c.image, v.company_name 
                FROM coupon_usage cu 
                JOIN coupons c ON cu.coupon_id = c.id 
                LEFT JOIN vendors v ON c.vendor_id = v.id 
                WHERE cu.user_id = :user_id 
                ORDER BY cu.used_at DESC";
        $stmt = $this->conn->prepare($sql);
        $stmt->bindValue(':user_id', (int)$userId, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    /**
     * 根據驗證碼查找使用記錄
     */
    public function findUsageByVerificationCode($verificationCode) {
        $sql = "SELECT cu.*, c.title, c.vendor_id, v.company_name, u.username, u.email 
                FROM coupon_usage cu 
                JOIN coupons c ON cu.coupon_id = c.id 
                LEFT JOIN vendors v ON c.vendor_id = v.id 
                LEFT JOIN users u ON cu.user_id = u.id 
                WHERE cu.verification_code = :verification_code";
        $stmt = $this->conn->prepare($sql);
        $stmt->bindValue(':verification_code', $verificationCode, PDO::PARAM_STR);
        $stmt->execute();
        return $stmt->fetch();
    }

    /**
     * 標記憑證為已核銷
     */
    public function markAsVerified($usageId, $verifiedBy = null) {
        $sql = "UPDATE coupon_usage 
                SET verified_at = NOW(), verified_by = :verified_by 
                WHERE id = :usage_id";
        $stmt = $this->conn->prepare($sql);
        $stmt->bindValue(':usage_id', (int)$usageId, PDO::PARAM_INT);
        $stmt->bindValue(':verified_by', $verifiedBy, PDO::PARAM_INT);
        return $stmt->execute();
    }
}
?>


