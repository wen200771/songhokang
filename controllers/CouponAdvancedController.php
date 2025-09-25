<?php
/**
 * 進階優惠券查詢（不影響既有 /coupons）
 * GET /coupons/advanced?search=&category=&tags=a,b&regions=x,y&page=1&pageSize=20
 */

class CouponAdvancedController {
    private $db;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    public function index() {
        $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
        $pageSize = isset($_GET['pageSize']) ? min(MAX_PAGE_SIZE, max(1, (int)$_GET['pageSize'])) : DEFAULT_PAGE_SIZE;
        $offset = ($page - 1) * $pageSize;

        $search   = isset($_GET['search']) ? trim($_GET['search']) : null;
        $category = isset($_GET['category']) ? trim($_GET['category']) : null;
        $tags     = !empty($_GET['tags']) ? array_filter(array_map(function($s){return strtolower(trim($s));}, explode(',', $_GET['tags']))) : [];
        $regions  = !empty($_GET['regions']) ? array_filter(array_map(function($s){return strtolower(trim($s));}, explode(',', $_GET['regions']))) : [];

        $where = [];
        $params = [];
        $join = '';

        if ($search !== null && $search !== '') {
            $where[] = '(c.title LIKE :search OR c.description LIKE :search OR c.category LIKE :search OR v.company_name LIKE :search)';
            $params[':search'] = '%' . $search . '%';
        }
        if ($category !== null && $category !== '') {
            $where[] = 'c.category = :category';
            $params[':category'] = $category;
        }
        if (!empty($tags)) {
            $join .= ' LEFT JOIN coupon_tags ct ON ct.coupon_id = c.id LEFT JOIN tags t ON t.id = ct.tag_id ';
            $ph = [];
            foreach ($tags as $i => $slug) { $k = ":t$i"; $ph[] = $k; $params[$k] = $slug; }
            $where[] = 't.slug IN (' . implode(',', $ph) . ')';
        }
        if (!empty($regions)) {
            $join .= ' LEFT JOIN coupon_regions cr ON cr.coupon_id = c.id LEFT JOIN regions r ON r.id = cr.region_id ';
            $ph = [];
            foreach ($regions as $i => $slug) { $k = ":r$i"; $ph[] = $k; $params[$k] = $slug; }
            $where[] = 'r.slug IN (' . implode(',', $ph) . ')';
        }

        $whereSql = empty($where) ? '' : ('WHERE ' . implode(' AND ', $where));

        // count
        $sqlCount = "SELECT COUNT(DISTINCT c.id) AS total FROM coupons c LEFT JOIN vendors v ON v.id = c.vendor_id $join $whereSql";
        $stmtCount = $this->db->prepare($sqlCount);
        foreach ($params as $k => $v) { $stmtCount->bindValue($k, $v); }
        $stmtCount->execute();
        $total = (int)($stmtCount->fetch()['total'] ?? 0);

        // list
        $sql = "SELECT DISTINCT c.id, c.title, c.description, c.image, c.category, c.status, c.view_count, c.favorite_count, c.used_count, c.end_date,
                        v.company_name, v.address, v.phone
                FROM coupons c
                LEFT JOIN vendors v ON v.id = c.vendor_id
                $join
                $whereSql
                ORDER BY c.created_at DESC
                LIMIT :offset, :limit";
        $stmt = $this->db->prepare($sql);
        foreach ($params as $k => $v) { $stmt->bindValue($k, $v); }
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
        $stmt->bindValue(':limit', (int)$pageSize, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll();

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

        successResponse([
            'coupons' => $items,
            'total' => $total,
            'page' => $page,
            'pageSize' => $pageSize,
            'totalPages' => $pageSize > 0 ? (int)ceil($total / $pageSize) : 1
        ]);
    }
}
?>


