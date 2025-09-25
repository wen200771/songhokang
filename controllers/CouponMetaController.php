<?php
/**
 * 優惠券的標籤與地區關聯維護
 * - GET  /coupons/{id}/tags
 * - PUT  /coupons/{id}/tags        body: { tag_slugs: [] }
 * - GET  /coupons/{id}/regions
 * - PUT  /coupons/{id}/regions     body: { region_slugs: [] }
 */

class CouponMetaController {
    private $db;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    public function middleware() {
        return [
            'updateTags' => ['Auth', 'Admin'],
            'updateRegions' => ['Auth', 'Admin'],
        ];
    }

    // GET /coupons/{id}/tags
    public function getTags($couponId) {
        $sql = "SELECT t.id, t.name, t.slug, t.type FROM coupon_tags ct JOIN tags t ON t.id = ct.tag_id WHERE ct.coupon_id = ? ORDER BY t.sort_order, t.id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([(int)$couponId]);
        successResponse($stmt->fetchAll());
    }

    // PUT /coupons/{id}/tags
    public function updateTags($couponId) {
        if ($_SERVER['REQUEST_METHOD'] !== 'PUT') errorResponse('方法不允許', 405);
        $input = json_decode(file_get_contents('php://input'), true);
        $slugs = array_values(array_unique(array_filter(array_map(function($s){return strtolower(trim($s));}, $input['tag_slugs'] ?? []))));

        try {
            $this->db->beginTransaction();

            // 清空既有
            $del = $this->db->prepare('DELETE FROM coupon_tags WHERE coupon_id = ?');
            $del->execute([(int)$couponId]);

            if (!empty($slugs)) {
                // 找出對應的 tag id
                $in = implode(',', array_fill(0, count($slugs), '?'));
                $sel = $this->db->prepare("SELECT id, slug FROM tags WHERE slug IN ($in)");
                $sel->execute($slugs);
                $tagRows = $sel->fetchAll();

                if (!empty($tagRows)) {
                    $ins = $this->db->prepare('INSERT INTO coupon_tags (coupon_id, tag_id) VALUES (?, ?)');
                    foreach ($tagRows as $row) {
                        $ins->execute([(int)$couponId, (int)$row['id']]);
                    }
                }
            }

            $this->db->commit();
            successResponse(['coupon_id' => (int)$couponId, 'tags' => $slugs], '標籤已更新');
        } catch (Exception $e) {
            $this->db->rollBack();
            errorResponse('更新失敗', 500, $e->getMessage());
        }
    }

    // GET /coupons/{id}/regions
    public function getRegions($couponId) {
        $sql = "SELECT r.id, r.name, r.slug, r.level FROM coupon_regions cr JOIN regions r ON r.id = cr.region_id WHERE cr.coupon_id = ? ORDER BY r.sort_order, r.id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([(int)$couponId]);
        successResponse($stmt->fetchAll());
    }

    // PUT /coupons/{id}/regions
    public function updateRegions($couponId) {
        if ($_SERVER['REQUEST_METHOD'] !== 'PUT') errorResponse('方法不允許', 405);
        $input = json_decode(file_get_contents('php://input'), true);
        $slugs = array_values(array_unique(array_filter(array_map(function($s){return strtolower(trim($s));}, $input['region_slugs'] ?? []))));

        try {
            $this->db->beginTransaction();

            $del = $this->db->prepare('DELETE FROM coupon_regions WHERE coupon_id = ?');
            $del->execute([(int)$couponId]);

            if (!empty($slugs)) {
                $in = implode(',', array_fill(0, count($slugs), '?'));
                $sel = $this->db->prepare("SELECT id, slug FROM regions WHERE slug IN ($in)");
                $sel->execute($slugs);
                $rows = $sel->fetchAll();
                if (!empty($rows)) {
                    $ins = $this->db->prepare('INSERT INTO coupon_regions (coupon_id, region_id) VALUES (?, ?)');
                    foreach ($rows as $row) {
                        $ins->execute([(int)$couponId, (int)$row['id']]);
                    }
                }
            }

            $this->db->commit();
            successResponse(['coupon_id' => (int)$couponId, 'regions' => $slugs], '地區已更新');
        } catch (Exception $e) {
            $this->db->rollBack();
            errorResponse('更新失敗', 500, $e->getMessage());
        }
    }
}
?>


