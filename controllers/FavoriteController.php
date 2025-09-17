<?php
/**
 * 收藏控制器
 */

class FavoriteController {
    private $favoriteModel;

    public function __construct() {
        $this->favoriteModel = new Favorite();
    }

    public function middleware() {
        // 需要登入
        return ['Auth'];
    }

    // GET /favorites
    public function index() {
        $current = $GLOBALS['current_user'];
        $list = $this->favoriteModel->listByUser((int)$current['user_id']);
        successResponse(['favorites' => $list]);
    }

    // POST /favorites  body: { coupon_id }
    public function add() {
        $current = $GLOBALS['current_user'];
        $input = json_decode(file_get_contents('php://input'), true) ?: [];
        $couponId = (int)($input['coupon_id'] ?? 0);
        if ($couponId <= 0) errorResponse('coupon_id 缺失');
        $ok = $this->favoriteModel->add((int)$current['user_id'], $couponId);
        $ok ? successResponse(null, '已加入收藏') : errorResponse('加入收藏失敗', 500);
    }

    // DELETE /favorites/{id}
    public function remove($couponId) {
        $current = $GLOBALS['current_user'];
        $ok = $this->favoriteModel->remove((int)$current['user_id'], (int)$couponId);
        $ok ? successResponse(null, '已取消收藏') : errorResponse('取消收藏失敗', 500);
    }
}
?>


