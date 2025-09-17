<?php
/**
 * 管理員權限中間件
 * 驗證用戶是否為管理員
 */

class AdminMiddleware {
    
    public function handle() {
        $user = JWT::getCurrentUser();
        
        if (!$user) {
            errorResponse('請先登入', 401);
            return false;
        }
        
        if ($user['role'] !== UserRole::ADMIN) {
            errorResponse('權限不足', 403);
            return false;
        }
        
        $GLOBALS['current_user'] = $user;
        
        return true;
    }
}
?>
