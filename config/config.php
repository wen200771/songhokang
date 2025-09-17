<?php
/**
 * 系統設定檔
 * 送齁康優惠券平台
 */

require_once __DIR__ . '/Env.php';
Env::load(__DIR__ . '/../.env');

// 錯誤設定
error_reporting(E_ALL);
ini_set('display_errors', env_bool('APP_DEBUG', true) ? '1' : '0');

// 時區設定
$timezone = env('APP_TIMEZONE', 'Asia/Taipei');
date_default_timezone_set($timezone);

// 系統常數定義
if (!defined('APP_NAME')) {
    define('APP_NAME', env('APP_NAME', '送齁康'));
}
if (!defined('APP_ENV')) {
    define('APP_ENV', env('APP_ENV', 'local'));
}
if (!defined('APP_VERSION')) {
    define('APP_VERSION', env('APP_VERSION', '1.0.0'));
}
if (!defined('BASE_URL')) {
    $baseUrl = rtrim(env('APP_URL', 'http://localhost:8000'), '/');
    define('BASE_URL', $baseUrl);
}
if (!defined('UPLOAD_PATH')) {
    define('UPLOAD_PATH', rtrim(env('UPLOAD_PATH', 'uploads/'), '/') . '/');
}
if (!defined('MAX_FILE_SIZE')) {
    define('MAX_FILE_SIZE', (int)env('MAX_FILE_SIZE', 5 * 1024 * 1024));
}

// JWT 設定
if (!defined('JWT_SECRET')) {
    define('JWT_SECRET', env('JWT_SECRET', 'change-me'));
}
if (!defined('JWT_EXPIRE_TIME')) {
    define('JWT_EXPIRE_TIME', (int)env('JWT_EXPIRE_TIME', 24 * 60 * 60));
}

// 密碼雜湊設定
if (!defined('PASSWORD_COST')) {
    define('PASSWORD_COST', (int)env('PASSWORD_COST', 12));
}

// 分頁設定
if (!defined('DEFAULT_PAGE_SIZE')) {
    define('DEFAULT_PAGE_SIZE', (int)env('DEFAULT_PAGE_SIZE', 20));
}
if (!defined('MAX_PAGE_SIZE')) {
    define('MAX_PAGE_SIZE', (int)env('MAX_PAGE_SIZE', 100));
}

// 圖片上傳設定
if (!defined('ALLOWED_IMAGE_TYPES')) {
    define('ALLOWED_IMAGE_TYPES', ['jpg', 'jpeg', 'png', 'gif', 'webp']);
}
if (!defined('MAX_IMAGE_WIDTH')) {
    define('MAX_IMAGE_WIDTH', (int)env('MAX_IMAGE_WIDTH', 1920));
}
if (!defined('MAX_IMAGE_HEIGHT')) {
    define('MAX_IMAGE_HEIGHT', (int)env('MAX_IMAGE_HEIGHT', 1080));
}

// 系統枚舉常數
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

// 載入資料庫設定
require_once 'database.php';

// CORS 設定 (如需單獨部署前端)
function setCorsHeaders() {
    $origin = env('CORS_ALLOW_ORIGIN', '*');
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}

// JSON 輸出函數
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

// 驗證必備資料夾
function checkDirectories() {
    $directories = [
        UPLOAD_PATH,
        UPLOAD_PATH . 'coupons/',
        UPLOAD_PATH . 'avatars/',
        UPLOAD_PATH . 'logos/',
        'logs/'
    ];

    foreach ($directories as $dir) {
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
    }
}

// 啟動檢查
checkDirectories();
?>
