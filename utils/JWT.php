<?php
/**
 * JWT 工具類
 * 處理 JWT Token 的生成和驗證
 */

class JWT {
    
    /**
     * 生成 JWT Token
     */
    public static function encode($payload, $secret = null) {
        $secret = $secret ?: JWT_SECRET;
        
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload = json_encode($payload);
        
        $base64Header = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $base64Payload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
        
        $signature = hash_hmac('sha256', $base64Header . "." . $base64Payload, $secret, true);
        $base64Signature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
        
        return $base64Header . "." . $base64Payload . "." . $base64Signature;
    }
    
    /**
     * 解析 JWT Token
     */
    public static function decode($token, $secret = null) {
        $secret = $secret ?: JWT_SECRET;
        
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return false;
        }
        
        list($base64Header, $base64Payload, $base64Signature) = $parts;
        
        // 驗證簽名
        $signature = hash_hmac('sha256', $base64Header . "." . $base64Payload, $secret, true);
        $expectedSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
        
        if (!hash_equals($base64Signature, $expectedSignature)) {
            return false;
        }
        
        // 解碼 payload
        $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $base64Payload)), true);
        
        // 檢查過期時間
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            return false;
        }
        
        return $payload;
    }
    
    /**
     * 從 HTTP 請求頭獲取 Token
     */
    public static function getTokenFromHeader() {
        $headers = getallheaders();
        
        if (isset($headers['Authorization'])) {
            $authHeader = $headers['Authorization'];
            if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
                return $matches[1];
            }
        }
        
        return null;
    }
    
    /**
     * 生成用戶 Token
     */
    public static function generateUserToken($user) {
        $payload = [
            'user_id' => $user['id'],
            'username' => $user['username'],
            'email' => $user['email'],
            'role' => $user['role'],
            'iat' => time(),
            'exp' => time() + JWT_EXPIRE_TIME
        ];
        
        return self::encode($payload);
    }
    
    /**
     * 驗證並獲取當前用戶
     */
    public static function getCurrentUser() {
        $token = self::getTokenFromHeader();
        
        if (!$token) {
            return null;
        }
        
        $payload = self::decode($token);
        
        if (!$payload) {
            return null;
        }
        
        return $payload;
    }
    
    /**
     * 檢查用戶是否有指定角色
     */
    public static function hasRole($requiredRole) {
        $user = self::getCurrentUser();
        
        if (!$user) {
            return false;
        }
        
        // 管理員有所有權限
        if ($user['role'] === UserRole::ADMIN) {
            return true;
        }
        
        return $user['role'] === $requiredRole;
    }
    
    /**
     * 檢查用戶是否為資源擁有者
     */
    public static function isOwner($resourceUserId) {
        $user = self::getCurrentUser();
        
        if (!$user) {
            return false;
        }
        
        // 管理員可以訪問所有資源
        if ($user['role'] === UserRole::ADMIN) {
            return true;
        }
        
        return $user['user_id'] == $resourceUserId;
    }
}
?>
