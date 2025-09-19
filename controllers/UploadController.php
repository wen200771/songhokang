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

        // 若圖片超出尺寸，使用 GD 等比例縮小
        try {
            $imageInfo = getimagesize($targetPath);
            if ($imageInfo && isset($imageInfo[0], $imageInfo[1])) {
                $origW = (int)$imageInfo[0];
                $origH = (int)$imageInfo[1];
                $maxW = (int)MAX_IMAGE_WIDTH;
                $maxH = (int)MAX_IMAGE_HEIGHT;
                if ($origW > 0 && $origH > 0 && ($origW > $maxW || $origH > $maxH)) {
                    $scale = min($maxW / $origW, $maxH / $origH);
                    $newW = max(1, (int)floor($origW * $scale));
                    $newH = max(1, (int)floor($origH * $scale));

                    switch ($ext) {
                        case 'jpg':
                        case 'jpeg':
                            $src = imagecreatefromjpeg($targetPath);
                            break;
                        case 'png':
                            $src = imagecreatefrompng($targetPath);
                            break;
                        case 'gif':
                            $src = imagecreatefromgif($targetPath);
                            break;
                        case 'webp':
                            if (function_exists('imagecreatefromwebp')) {
                                $src = imagecreatefromwebp($targetPath);
                            } else {
                                $src = null;
                            }
                            break;
                        default:
                            $src = null;
                    }

                    if ($src) {
                        $dst = imagecreatetruecolor($newW, $newH);
                        // 保留透明度（PNG/GIF）
                        if (in_array($ext, ['png','gif','webp'])) {
                            imagealphablending($dst, false);
                            imagesavealpha($dst, true);
                            $transparent = imagecolorallocatealpha($dst, 0, 0, 0, 127);
                            imagefilledrectangle($dst, 0, 0, $newW, $newH, $transparent);
                        }
                        imagecopyresampled($dst, $src, 0, 0, 0, 0, $newW, $newH, $origW, $origH);
                        switch ($ext) {
                            case 'jpg':
                            case 'jpeg':
                                imagejpeg($dst, $targetPath, 85);
                                break;
                            case 'png':
                                imagepng($dst, $targetPath, 6);
                                break;
                            case 'gif':
                                imagegif($dst, $targetPath);
                                break;
                            case 'webp':
                                if (function_exists('imagewebp')) {
                                    imagewebp($dst, $targetPath, 85);
                                }
                                break;
                        }
                        imagedestroy($dst);
                        imagedestroy($src);
                    }
                }
            }
        } catch (Throwable $t) {
            // 忽略縮圖失敗，保留原檔
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


