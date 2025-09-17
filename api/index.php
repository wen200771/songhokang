<?php
/**
 * API 主入口文件
 * 送好康優惠券平台 REST API
 */

require_once '../config/config.php';

// 設定 CORS
setCorsHeaders();

// 取得請求方法和路由
$method = $_SERVER['REQUEST_METHOD'];
$request = $_SERVER['REQUEST_URI'];

// 移除查詢參數
$path = parse_url($request, PHP_URL_PATH);
$path = str_replace('/api', '', $path);

// 如果路徑是 /index.php，則從查詢參數中獲取實際路徑
if ($path === '/index.php' && isset($_GET['path'])) {
    $path = $_GET['path'];
}

// 如果路徑為空或只是 /，設為根路徑
if (empty($path) || $path === '/') {
    $path = '/';
}

// 路由表
$routes = [
    // 認證相關
    'POST /auth/login' => 'AuthController@login',
    'POST /auth/register' => 'AuthController@register',
    'POST /auth/logout' => 'AuthController@logout',
    'GET /auth/me' => 'AuthController@me',
    'PUT /auth/profile' => 'AuthController@profile',
    'PUT /auth/change-password' => 'AuthController@changePassword',
    'POST /auth/switch-account' => 'AuthController@switchAccount',
    'POST /auth/switch-back' => 'AuthController@switchBack',
    
    // 用戶管理
    'GET /users' => 'UserController@index',
    'PUT /users/{id}/activate' => 'UserController@activate',
    'PUT /users/{id}/deactivate' => 'UserController@deactivate',
    'GET /users/{id}' => 'UserController@show',
    'PUT /users/{id}' => 'UserController@update',
    'DELETE /users/{id}' => 'UserController@delete',
    
    // 廠商管理
    'GET /vendors/me' => 'VendorController@me',
    'PUT /vendors/me' => 'VendorController@updateMe',
    'GET /vendors' => 'VendorController@index',
    'GET /vendors/{id}' => 'VendorController@show',
    'PUT /vendors/{id}/approve' => 'VendorController@approve',
    'PUT /vendors/{id}/reject' => 'VendorController@reject',
    
    // 優惠券管理
    'GET /coupons' => 'CouponController@index',
    'POST /coupons' => 'CouponController@create',
    'GET /coupons/{id}' => 'CouponController@show',
    'POST /coupons/{id}/view' => 'CouponController@incrementView',
    'POST /coupons/{id}/use' => 'CouponController@use',
    'POST /coupons/verify' => 'CouponController@verify',
    'PUT /coupons/{id}' => 'CouponController@update',
    'DELETE /coupons/{id}' => 'CouponController@delete',
    'PUT /coupons/{id}/approve' => 'CouponController@approve',
    'PUT /coupons/{id}/reject' => 'CouponController@reject',
    'PUT /coupons/{id}/status' => 'CouponController@updateStatus',
    'PUT /coupons/{id}/note' => 'CouponController@addNote',
    
    // 收藏功能
    'GET /favorites' => 'FavoriteController@index',
    'POST /favorites' => 'FavoriteController@add',
    'DELETE /favorites/{id}' => 'FavoriteController@remove',
    
    // 分類管理
    'GET /categories' => 'CategoryController@index',
    'POST /categories' => 'CategoryController@create',
    'PUT /categories/{id}' => 'CategoryController@update',
    'DELETE /categories/{id}' => 'CategoryController@delete',
    
    // 文件上傳
    'POST /upload/image' => 'UploadController@image',
    
    // 統計數據
    'GET /stats/dashboard' => 'StatsController@dashboard',
    'GET /stats/coupons' => 'StatsController@coupons',
    'GET /stats/users' => 'StatsController@users',
    'GET /stats/verification' => 'StatsController@verification',
    'GET /stats/verification-records' => 'StatsController@verificationRecords',
    
    // 系統設定
    'GET /settings' => 'SettingController@index',
    'PUT /settings' => 'SettingController@update',
];

/**
 * 路由匹配函數
 */
function matchRoute($method, $path, $routes) {
    $routeKey = $method . ' ' . $path;
    
    // 直接匹配
    if (isset($routes[$routeKey])) {
        return $routes[$routeKey];
    }
    
    // 參數匹配
    foreach ($routes as $route => $handler) {
        $routeParts = explode(' ', $route, 2);
        if ($routeParts[0] !== $method) {
            continue;
        }
        
        $routePath = $routeParts[1];
        $pattern = preg_replace('/\{[^}]+\}/', '([^/]+)', $routePath);
        $pattern = '#^' . $pattern . '$#';
        
        if (preg_match($pattern, $path, $matches)) {
            array_shift($matches); // 移除完整匹配
            return [$handler, $matches];
        }
    }
    
    return null;
}

/**
 * 執行控制器方法
 */
function executeController($handler, $params = []) {
    if (is_array($handler)) {
        list($controllerAction, $routeParams) = $handler;
        $params = array_merge($params, $routeParams);
    } else {
        $controllerAction = $handler;
    }
    
    list($controllerName, $methodName) = explode('@', $controllerAction);
    
    if (!class_exists($controllerName)) {
        errorResponse('控制器不存在', 404);
    }
    
    $controller = new $controllerName();
    
    if (!method_exists($controller, $methodName)) {
        errorResponse('方法不存在', 404);
    }
    
    // 執行中間件檢查（支援全域或依方法指定）
    if (method_exists($controller, 'middleware')) {
        $middlewareConfig = $controller->middleware();

        $middlewaresToApply = [];

        // 兩種寫法：
        // 1) ['Auth', 'Admin']  → 套用於所有方法
        // 2) ['me' => ['Auth'], 'logout' => ['Auth'], '*' => ['Vendor']]  → 依方法套用
        if (is_array($middlewareConfig)) {
            // 偵測是否為索引式陣列（0 為索引存在）
            if (array_key_exists(0, $middlewareConfig)) {
                $middlewaresToApply = $middlewareConfig;
            } else {
                if (isset($middlewareConfig[$methodName])) {
                    $middlewaresToApply = $middlewareConfig[$methodName];
                } elseif (isset($middlewareConfig['*'])) {
                    $middlewaresToApply = $middlewareConfig['*'];
                }
            }
        } elseif (is_string($middlewareConfig) && $middlewareConfig !== '') {
            $middlewaresToApply = [$middlewareConfig];
        }

        foreach ($middlewaresToApply as $mw) {
            $middlewareClass = (stripos($mw, 'Middleware') !== false) ? $mw : ($mw . 'Middleware');
            if (class_exists($middlewareClass)) {
                $middlewareInstance = new $middlewareClass();
                if (!$middlewareInstance->handle()) {
                    return; // 中間件已處理錯誤回應
                }
            }
        }
    }
    
    // 執行控制器方法
    call_user_func_array([$controller, $methodName], $params);
}

// 根路由 - API 狀態檢查
if ($path === '/' || $path === '') {
    successResponse([
        'name' => APP_NAME,
        'version' => APP_VERSION,
        'status' => 'running',
        'timestamp' => date('Y-m-d H:i:s'),
        'endpoints' => [
            'auth' => '/api/auth/*',
            'coupons' => '/api/coupons/*',
            'users' => '/api/users/*',
            'vendors' => '/api/vendors/*'
        ]
    ], 'API 服務正常運行');
}

try {
    // 調試：顯示請求信息
    error_log("Request: $method $path");
    
    // 路由匹配
    $handler = matchRoute($method, $path, $routes);
    
    if ($handler === null) {
        // 調試信息
        error_log("Route not found: $method $path");
        // 顯示所有可用路由供調試
        $availableRoutes = array_keys($routes);
        $routeList = implode(', ', array_slice($availableRoutes, 0, 10));
        errorResponse("路由不存在: $method $path。可用路由: $routeList", 404);
    }
    
    // 執行控制器
    executeController($handler);
    
} catch (Exception $e) {
    error_log('API Error: ' . $e->getMessage());
    errorResponse('伺服器內部錯誤', 500, $e->getMessage());
}
?>
