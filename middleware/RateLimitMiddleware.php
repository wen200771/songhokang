<?php
/**
 * 速率限制中間件（簡易檔案型）
 * 以 IP + 路由 為 key，限制每段時間的請求數
 */

class RateLimitMiddleware {

    private $storageDir = 'logs/ratelimit/';

    public function handle() {
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $route = $GLOBALS['current_route'] ?? '';
        $method = $GLOBALS['current_method'] ?? ($_SERVER['REQUEST_METHOD'] ?? 'GET');
        $path = $GLOBALS['current_path'] ?? parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);

        // 規則：依路由決定限制，預設 60/分鐘
        $rules = [
            'AuthController@login' => ['limit' => 10, 'window' => 60],
            'AuthController@register' => ['limit' => 5, 'window' => 60],
            'UploadController@image' => ['limit' => 20, 'window' => 60],
            'CouponController@verify' => ['limit' => 60, 'window' => 60],
            'CouponController@use' => ['limit' => 20, 'window' => 60],
        ];

        $defaultLimit = (int) (getenv('RATE_LIMIT_DEFAULT') ?: 60);
        $defaultWindow = (int) (getenv('RATE_LIMIT_WINDOW') ?: 60);

        $key = $route ?: ($method . ' ' . $path);
        $rule = $rules[$route] ?? ['limit' => $defaultLimit, 'window' => $defaultWindow];

        $this->ensureDir($this->storageDir);
        $bucket = $this->storageDir . hash('sha256', $ip . '|' . $key) . '.json';

        $now = time();
        $windowStart = $now - ($now % $rule['window']);

        $data = ['window' => $windowStart, 'count' => 0];
        if (is_file($bucket)) {
            $raw = file_get_contents($bucket);
            if ($raw !== false) {
                $parsed = json_decode($raw, true);
                if (is_array($parsed)) {
                    $data = array_merge($data, $parsed);
                }
            }
        }

        if ((int)$data['window'] !== $windowStart) {
            $data['window'] = $windowStart;
            $data['count'] = 0;
        }

        $remaining = $rule['limit'] - (int)$data['count'];
        if ($remaining <= 0) {
            $retryAfter = ($data['window'] + $rule['window']) - $now;
            header('X-RateLimit-Limit: ' . $rule['limit']);
            header('X-RateLimit-Remaining: 0');
            header('Retry-After: ' . max(1, $retryAfter));
            errorResponse('請求過於頻繁，請稍後再試', 429);
            return false;
        }

        // 計數 +1
        $data['count'] = (int)$data['count'] + 1;
        @file_put_contents($bucket, json_encode($data));

        header('X-RateLimit-Limit: ' . $rule['limit']);
        header('X-RateLimit-Remaining: ' . max(0, $rule['limit'] - (int)$data['count']));

        return true;
    }

    private function ensureDir($dir) {
        if (!is_dir($dir)) {
            @mkdir($dir, 0755, true);
        }
    }
}
?>


