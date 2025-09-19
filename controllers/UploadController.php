<?php
/**
 * 上傳控制器
 * 支援：
 * - POST /upload/image  上傳圖片（需登入；依 type 控制權限）
 */

class UploadController {
    public function middleware() {
        return [
            'image' => ['Auth', 'RateLimit']
        ];
    }

    /**
     * POST /upload/image
     * multipart/form-data
     * 欄位：file, type=avatar|logo|coupon
     */
    public function image() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            errorResponse('方法不允許', 405);
        }

        $currentUser = $GLOBALS['current_user'];

        if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
            errorResponse('請提供有效的檔案');
        }

        $type = $_POST['type'] ?? 'avatar';
        if (!in_array($type, ['avatar','logo','coupon'])) {
            errorResponse('不支援的上傳類型');
        }

        // 角色權限：
        // - avatar：任何登入用戶
        // - logo、coupon：僅廠商或管理員
        if (in_array($type, ['logo','coupon']) && !in_array($currentUser['role'], [UserRole::ADMIN, UserRole::VENDOR])) {
            errorResponse('權限不足', 403);
        }

        $file = $_FILES['file'];

        // 檔案大小限制：優先讀取 DB 設定，否則用常數 MAX_FILE_SIZE
        $maxSize = $this->getMaxUploadSize() ?? MAX_FILE_SIZE;
        if ($file['size'] > $maxSize) {
            errorResponse('檔案過大，上限為 ' . $maxSize . ' bytes');
        }

        // MIME/副檔名檢查
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if (!in_array($ext, ALLOWED_IMAGE_TYPES)) {
            errorResponse('不支援的圖片格式（允許：' . implode(',', ALLOWED_IMAGE_TYPES) . '）');
        }

        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);
        if (strpos($mime, 'image/') !== 0) {
            errorResponse('檔案不是圖片');
        }

        // 目的資料夾
        $subdir = $type === 'avatar' ? 'avatars' : ($type === 'logo' ? 'logos' : 'coupons');
        $targetDir = __DIR__ . '/../' . rtrim(UPLOAD_PATH, '/') . '/' . $subdir . '/';
        if (!is_dir($targetDir)) {
            mkdir($targetDir, 0755, true);
        }

        // 重新命名（日期 + 雜湊）
        $safeBase = preg_replace('/[^a-zA-Z0-9_\.-]/', '_', pathinfo($file['name'], PATHINFO_FILENAME));
        $filename = date('Ymd_His') . '_' . substr(sha1($safeBase . uniqid('', true)), 0, 8) . '.' . $ext;
        $targetPath = $targetDir . $filename;

        if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
            errorResponse('檔案儲存失敗', 500);
        }

        // 產生可供前端使用的相對 URL（以 /uploads/ 為起點）
        $publicUrl = '/' . trim(UPLOAD_PATH, '/') . '/' . $subdir . '/' . $filename;

        if (class_exists('Audit')) {
            Audit::log('upload.image', [
                'type' => $type,
                'size' => (int)$file['size'],
                'mime' => $mime,
            ]);
        }

        successResponse([
            'url' => $publicUrl,
            'size' => (int)$file['size'],
            'mime' => $mime,
            'type' => $type
        ], '上傳成功');
    }

    private function getMaxUploadSize() {
        try {
            $database = new Database();
            $db = $database->getConnection();
            $stmt = $db->prepare("SELECT setting_value, setting_type FROM system_settings WHERE setting_key = 'max_upload_size' LIMIT 1");
            $stmt->execute();
            $row = $stmt->fetch();
            if ($row) {
                if ($row['setting_type'] === 'integer') {
                    return (int)$row['setting_value'];
                }
                return (int)$row['setting_value'];
            }
        } catch (Exception $e) {
            // 忽略錯誤，回退到常數
        }
        return null;
    }
}
?>


