<?php
/**
 * 系統配置文件
 * 送好康優惠券平台
 */

// 錯誤報告設定
error_reporting(E_ALL);
ini_set('display_errors', 1);

// 時區設定
date_default_timezone_set('Asia/Taipei');

// 系統常數定義
define('APP_NAME', '送好康');
define('APP_VERSION', '1.0.0');
define('BASE_URL', 'http://localhost:8000'); // 本機開發網址
define('UPLOAD_PATH', 'uploads/');
define('MAX_FILE_SIZE', 5 * 1024 * 1024); // 5MB

// JWT 配置
define('JWT_SECRET', 'your-secret-key-here-change-in-production'); // 生產環境請更換
define('JWT_EXPIRE_TIME', 24 * 60 * 60); // 24小時

// 密碼加密配置
define('PASSWORD_COST', 12);

// 分頁配置
define('DEFAULT_PAGE_SIZE', 20);
define('MAX_PAGE_SIZE', 100);

// 圖片上傳配置
define('ALLOWED_IMAGE_TYPES', ['jpg', 'jpeg', 'png', 'gif', 'webp']);
define('MAX_IMAGE_WIDTH', 1920);
define('MAX_IMAGE_HEIGHT', 1080);

// 系統狀態常數
class UserRole {
    const ADMIN = 'admin';
    const VENDOR = 'vendor';
    const CUSTOMER = 'customer';
}

class UserStatus {
    const ACTIVE = 'active';
    const INACTIVE = 'inactive';
    const PENDING = 'pending';
    const SUSPENDED = 'suspended';
}

class CouponStatus {
    const DRAFT = 'draft';
    const PENDING = 'pending';
    const ACTIVE = 'active';
    const EXPIRED = 'expired';
    const SUSPENDED = 'suspended';
}

class ApprovalStatus {
    const PENDING = 'pending';
    const APPROVED = 'approved';
    const REJECTED = 'rejected';
}

// 自動載入類別
spl_autoload_register(function ($class_name) {
    $directories = [
        'models/',
        'controllers/',
        'middleware/',
        'utils/'
    ];
    
    foreach ($directories as $directory) {
        $file = __DIR__ . '/../' . $directory . $class_name . '.php';
        if (file_exists($file)) {
            require_once $file;
            return;
        }
    }
});

// 載入資料庫配置
require_once 'database.php';

// CORS 設定 (如果需要前後端分離)
function setCorsHeaders() {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}

// JSON 回應函數
function jsonResponse($data, $status_code = 200) {
    http_response_code($status_code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

// 錯誤回應函數
function errorResponse($message, $status_code = 400, $details = null) {
    $response = [
        'success' => false,
        'message' => $message,
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    if ($details) {
        $response['details'] = $details;
    }
    
    jsonResponse($response, $status_code);
}

// 成功回應函數
function successResponse($data = null, $message = 'success') {
    $response = [
        'success' => true,
        'message' => $message,
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    if ($data !== null) {
        $response['data'] = $data;
    }
    
    jsonResponse($response);
}

// 驗證必要目錄
function checkDirectories() {
    $directories = [
        'uploads/',
        'uploads/coupons/',
        'uploads/avatars/',
        'uploads/logos/',
        'logs/'
    ];
    
    foreach ($directories as $dir) {
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
    }
}

// 初始化檢查
checkDirectories();
?>
