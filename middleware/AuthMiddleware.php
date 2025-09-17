<?php
/**
 * 認證中間件
 * 驗證用戶是否已登入
 */

class AuthMiddleware {
    
    public function handle() {
        $user = JWT::getCurrentUser();
        
        if (!$user) {
            errorResponse('請先登入', 401);
            return false;
        }
        
        // 將用戶資訊存儲到全域變數中供控制器使用
        $GLOBALS['current_user'] = $user;
        
        return true;
    }
}
?>
