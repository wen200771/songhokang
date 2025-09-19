<?php
/**
 * 簡易稽核工具：將關鍵操作寫入 logs/audit/YYYY-MM-DD.log
 */

class Audit {
    public static function log($action, $data = []) {
        $dir = 'logs/audit/';
        if (!is_dir($dir)) {
            @mkdir($dir, 0755, true);
        }
        $file = $dir . date('Y-m-d') . '.log';
        $record = [
            'timestamp' => date('c'),
            'request_id' => $_SERVER['HTTP_X_REQUEST_ID'] ?? null,
            'ip' => $_SERVER['REMOTE_ADDR'] ?? null,
            'user' => $GLOBALS['current_user'] ?? null,
            'route' => $GLOBALS['current_route'] ?? null,
            'method' => $_SERVER['REQUEST_METHOD'] ?? null,
            'action' => $action,
            'data' => $data,
        ];
        @file_put_contents($file, json_encode($record, JSON_UNESCAPED_UNICODE) . PHP_EOL, FILE_APPEND);
    }
}
?>


