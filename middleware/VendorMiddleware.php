<?php
/**
 * 廠商權限中間件
 * 驗證用戶是否為廠商或管理員
 */

class VendorMiddleware {
    
    public function handle() {
        $user = JWT::getCurrentUser();
        
        if (!$user) {
            errorResponse('請先登入', 401);
            return false;
        }
        
        if (!in_array($user['role'], [UserRole::ADMIN, UserRole::VENDOR])) {
            errorResponse('權限不足', 403);
            return false;
        }
        
        $GLOBALS['current_user'] = $user;
        
        return true;
    }
}
?>
