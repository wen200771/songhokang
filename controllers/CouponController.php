<?php
/**
 * 優惠券控制器（最小可用）
 * 目前支援：
 * - GET /api/coupons
 * - GET /api/coupons/{id}
 */

class CouponController {
    private $couponModel;

    public function __construct() {
        $this->couponModel = new Coupon();
    }

    public function middleware() {
        return [
            'create' => ['Auth'],
            'update' => ['Auth'],
            'delete' => ['Auth'],
            'updateStatus' => ['Auth', 'Admin'],
            'addNote' => ['Auth', 'Admin'],
            'use' => ['Auth', 'RateLimit'],
            'verify' => ['RateLimit'],
        ];
    }

    /**
     * GET /coupons 列表
     */
    public function index() {
        $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
        $pageSize = isset($_GET['pageSize']) ? min(MAX_PAGE_SIZE, max(1, (int)$_GET['pageSize'])) : DEFAULT_PAGE_SIZE;
        $filters = [
            'search' => $_GET['search'] ?? null,
            'category' => $_GET['category'] ?? null,
            'status' => $_GET['status'] ?? null,
            'vendor_id' => $_GET['vendor_id'] ?? null,
        ];

        $data = $this->couponModel->getList($page, $pageSize, $filters);
        successResponse($data);
    }

    /**
     * POST /coupons 新增優惠券
     */
    public function create() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            errorResponse('方法不允許', 405);
        }

        // 獲取當前用戶
        $currentUser = $GLOBALS['current_user'] ?? null;
        if (!$currentUser) {
            errorResponse('請先登入', 401);
        }

        // 檢查用戶是否為廠商
        if ($currentUser['role'] !== 'vendor' && $currentUser['role'] !== 'admin') {
            errorResponse('只有廠商可以新增優惠券', 403);
        }

        // 獲取廠商資訊
        $vendorModel = new Vendor();
        $vendor = $vendorModel->findByUserId($currentUser['user_id']);
        if (!$vendor && $currentUser['role'] !== 'admin') {
            errorResponse('找不到廠商資料', 404);
        }

        // 處理表單資料和檔案上傳
        $input = $_POST;
        $imageUrl = null;

        // 處理圖片上傳
        if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
            $imageUrl = $this->handleImageUpload($_FILES['image']);
            if (!$imageUrl) {
                errorResponse('圖片上傳失敗', 400);
            }
        }

        // 驗證必填欄位
        $errors = $this->validateCouponData($input);
        if (!empty($errors)) {
            errorResponse('資料驗證失敗', 400, $errors);
        }

        // 準備優惠券資料
        $couponData = [
            'vendor_id' => $vendor ? $vendor['id'] : null,
            'title' => trim($input['title']),
            'category' => $input['category'],
            'description' => trim($input['description'] ?? ''),
            'discount_type' => $input['discount_type'],
            'discount_value' => (float)$input['discount_value'],
            'start_date' => !empty($input['start_date']) ? $input['start_date'] : null,
            'end_date' => !empty($input['end_date']) ? $input['end_date'] : null,
            'usage_rules' => trim($input['usage_rules'] ?? ''),
            'address' => trim($input['address'] ?? ''),
            'phone' => trim($input['phone'] ?? ''),
            'image' => $imageUrl,
            'status' => 'pending' // 新優惠券預設為待審核
        ];

        // 新增優惠券
        $couponId = $this->couponModel->create($couponData);
        if ($couponId) {
            successResponse(['id' => $couponId], '優惠券新增成功');
        } else {
            errorResponse('優惠券新增失敗', 500);
        }
    }

    /**
     * PUT /coupons/{id} 更新優惠券
     */
    public function update($id) {
        if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
            errorResponse('方法不允許', 405);
        }

        // 獲取當前用戶
        $currentUser = $GLOBALS['current_user'] ?? null;
        if (!$currentUser) {
            errorResponse('請先登入', 401);
        }

        // 檢查優惠券是否存在
        $coupon = $this->couponModel->findById($id);
        if (!$coupon) {
            errorResponse('找不到優惠券', 404);
        }

        // 檢查權限（只有優惠券擁有者或管理員可以編輯）
        if ($currentUser['role'] !== 'admin') {
            $vendorModel = new Vendor();
            $vendor = $vendorModel->findByUserId($currentUser['user_id']);
            if (!$vendor || $vendor['id'] !== $coupon['vendor_id']) {
                errorResponse('沒有權限編輯此優惠券', 403);
            }
        }

        // 處理 JSON 輸入或表單資料
        $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $imageUrl = $coupon['image']; // 保持原有圖片

        // 處理圖片上傳（只在表單提交時）
        if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
            $newImageUrl = $this->handleImageUpload($_FILES['image']);
            if ($newImageUrl) {
                // 刪除舊圖片
                if ($imageUrl && file_exists($imageUrl)) {
                    unlink($imageUrl);
                }
                $imageUrl = $newImageUrl;
            }
        }

        // 驗證資料
        $errors = $this->validateCouponData($input);
        if (!empty($errors)) {
            errorResponse('資料驗證失敗', 400, $errors);
        }

        // 準備更新資料
        $updateData = [
            'title' => trim($input['title']),
            'category' => $input['category'],
            'description' => trim($input['description'] ?? ''),
            'discount_type' => $input['discount_type'],
            'discount_value' => (float)$input['discount_value'],
            'start_date' => !empty($input['start_date']) ? $input['start_date'] : null,
            'end_date' => !empty($input['end_date']) ? $input['end_date'] : null,
            'usage_rules' => trim($input['usage_rules'] ?? ''),
            'address' => trim($input['address'] ?? ''),
            'phone' => trim($input['phone'] ?? ''),
            'image' => $imageUrl
        ];

        // 更新優惠券
        if ($this->couponModel->update($id, $updateData)) {
            successResponse(null, '優惠券更新成功');
        } else {
            errorResponse('優惠券更新失敗', 500);
        }
    }

    /**
     * DELETE /coupons/{id} 刪除優惠券
     */
    public function delete($id) {
        if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
            errorResponse('方法不允許', 405);
        }

        // 獲取當前用戶
        $currentUser = $GLOBALS['current_user'] ?? null;
        if (!$currentUser) {
            errorResponse('請先登入', 401);
        }

        // 檢查優惠券是否存在
        $coupon = $this->couponModel->findById($id);
        if (!$coupon) {
            errorResponse('找不到優惠券', 404);
        }

        // 檢查權限（只有優惠券擁有者或管理員可以刪除）
        if ($currentUser['role'] !== 'admin') {
            $vendorModel = new Vendor();
            $vendor = $vendorModel->findByUserId($currentUser['user_id']);
            if (!$vendor || $vendor['id'] !== $coupon['vendor_id']) {
                errorResponse('沒有權限刪除此優惠券', 403);
            }
        }

        // 刪除圖片檔案
        if ($coupon['image'] && file_exists($coupon['image'])) {
            unlink($coupon['image']);
        }

        // 刪除優惠券
        if ($this->couponModel->delete($id)) {
            successResponse(null, '優惠券刪除成功');
        } else {
            errorResponse('優惠券刪除失敗', 500);
        }
    }

    /**
     * GET /coupons/{id}
     */
    public function show($id) {
        $coupon = $this->couponModel->findById($id);
        if (!$coupon) {
            errorResponse('找不到優惠券', 404);
        }
        successResponse($coupon);
    }

    /**
     * POST /coupons/{id}/view
     * 增加瀏覽數
     */
    public function incrementView($id) {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            errorResponse('方法不允許', 405);
        }

        $result = $this->couponModel->incrementViewCount($id);
        if ($result) {
            successResponse(['message' => '瀏覽數已更新']);
        } else {
            errorResponse('更新瀏覽數失敗', 400);
        }
    }

    /**
     * PUT /coupons/{id}/status
     * 更新優惠券狀態（管理員功能）
     */
    public function updateStatus($id) {
        if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
            errorResponse('方法不允許', 405);
        }

        $input = json_decode(file_get_contents('php://input'), true);
        $newStatus = $input['status'] ?? null;

        // 驗證狀態值
        $validStatuses = ['pending', 'approved', 'active', 'expired', 'rejected'];
        if (!in_array($newStatus, $validStatuses)) {
            errorResponse('無效的狀態值', 400);
        }

        // 檢查優惠券是否存在
        $coupon = $this->couponModel->findById($id);
        if (!$coupon) {
            errorResponse('找不到優惠券', 404);
        }

        // 更新狀態
        $success = $this->couponModel->updateStatus($id, $newStatus);
        if ($success) {
            successResponse(['message' => '狀態更新成功']);
        } else {
            errorResponse('狀態更新失敗', 500);
        }
    }

    /**
     * PUT /coupons/{id}/note
     * 添加管理員備註
     */
    public function addNote($id) {
        if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
            errorResponse('方法不允許', 405);
        }

        $input = json_decode(file_get_contents('php://input'), true);
        $note = $input['note'] ?? null;

        if (empty($note)) {
            errorResponse('備註內容不能為空', 400);
        }

        // 檢查優惠券是否存在
        $coupon = $this->couponModel->findById($id);
        if (!$coupon) {
            errorResponse('找不到優惠券', 404);
        }

        // 獲取當前管理員資訊
        $currentUser = $GLOBALS['current_user'];
        $adminNote = "[管理員 #{$currentUser['user_id']}] " . date('Y-m-d H:i:s') . ": " . $note;

        // 添加備註
        $success = $this->couponModel->addAdminNote($id, $adminNote);
        if ($success) {
            successResponse(['message' => '備註添加成功']);
        } else {
            errorResponse('備註添加失敗', 500);
        }
    }

    /**
     * POST /coupons/{id}/use
     * 使用優惠券
     */
    public function use($id) {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            errorResponse('方法不允許', 405);
        }

        // 獲取當前用戶
        $currentUser = $GLOBALS['current_user'] ?? null;
        if (!$currentUser) {
            errorResponse('請先登入', 401);
        }

        // 檢查優惠券是否存在且有效
        $coupon = $this->couponModel->findById($id);
        if (!$coupon) {
            errorResponse('找不到優惠券', 404);
        }

        if ($coupon['status'] !== 'active') {
            errorResponse('優惠券目前不可使用', 400);
        }

        // 檢查是否已經使用過
        if ($this->couponModel->hasUserUsed($id, $currentUser['user_id'])) {
            errorResponse('您已經使用過這張優惠券', 400);
        }

        // 生成驗證碼
        $verificationCode = QRCode::generateVerificationCode($id, $currentUser['user_id']);
        
        // 記錄使用（包含驗證碼）
        $result = $this->couponModel->recordUsage($id, $currentUser['user_id'], $verificationCode);
        
        if ($result) {
            // 生成QR Code URL
            $qrCodeURL = QRCode::generateCouponVoucher($id, $currentUser['user_id'], $verificationCode);
            
            if (class_exists('Audit')) {
                Audit::log('coupon.use', [
                    'coupon_id' => (int)$id,
                    'user_id' => (int)$currentUser['user_id']
                ]);
            }

            successResponse([
                'message' => '優惠券使用成功',
                'coupon_id' => $id,
                'verification_code' => $verificationCode,
                'qr_code_url' => $qrCodeURL,
                'expires_at' => date('Y-m-d H:i:s', time() + 24 * 3600) // 24小時後過期
            ]);
        } else {
            errorResponse('使用優惠券失敗', 500);
        }
    }

    /**
     * POST /coupons/verify
     * 店家驗證優惠券憑證
     */
    public function verify() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            errorResponse('方法不允許', 405);
        }

        $input = json_decode(file_get_contents('php://input'), true);
        
        if (empty($input['verification_code']) && empty($input['qr_data'])) {
            errorResponse('請提供驗證碼或QR Code數據');
        }

        // QR Code驗證
        if (!empty($input['qr_data'])) {
            $qrResult = QRCode::verifyVoucher($input['qr_data']);
            if (!$qrResult['valid']) {
                errorResponse($qrResult['error']);
            }
            
            $verificationCode = $qrResult['data']['verification_code'];
        } else {
            $verificationCode = $input['verification_code'];
        }

        // 查找使用記錄
        $usage = $this->couponModel->findUsageByVerificationCode($verificationCode);
        if (!$usage) {
            errorResponse('找不到對應的使用記錄');
        }

        // 檢查是否已經被核銷
        if ($usage['verified_at']) {
            errorResponse('此憑證已經被核銷過了', 400, [
                'verified_at' => $usage['verified_at'],
                'verified_by' => $usage['verified_by']
            ]);
        }

        // 標記為已核銷
        $result = $this->couponModel->markAsVerified($usage['id']);
        if ($result) {
            // 獲取完整的優惠券和用戶資訊
            $coupon = $this->couponModel->findById($usage['coupon_id']);
            $userModel = new User();
            $user = $userModel->findById($usage['user_id']);
            
            if (class_exists('Audit')) {
                Audit::log('coupon.verify', [
                    'usage_id' => (int)$usage['id'],
                    'coupon_id' => (int)$usage['coupon_id']
                ]);
            }

            successResponse([
                'message' => '憑證驗證成功',
                'coupon' => $coupon,
                'user' => [
                    'id' => $user['id'],
                    'username' => $user['username'],
                    'email' => $user['email']
                ],
                'usage' => $usage,
                'verified_at' => date('Y-m-d H:i:s')
            ]);
        } else {
            errorResponse('核銷失敗', 500);
        }
    }

    /**
     * 處理圖片上傳
     */
    private function handleImageUpload($file) {
        // 檢查檔案類型
        $allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!in_array($file['type'], $allowedTypes)) {
            return false;
        }

        // 檢查檔案大小 (5MB)
        if ($file['size'] > 5 * 1024 * 1024) {
            return false;
        }

        // 創建上傳目錄
        $uploadDir = __DIR__ . '/../' . rtrim(UPLOAD_PATH, '/') . '/coupons/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        // 生成唯一檔名
        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = uniqid() . '_' . time() . '.' . $extension;
        $filepath = $uploadDir . $filename;

        // 移動檔案
        if (move_uploaded_file($file['tmp_name'], $filepath)) {
            // 縮圖：若超過上限，使用 GD 等比例縮小
            try {
                $imageInfo = getimagesize($filepath);
                if ($imageInfo && isset($imageInfo[0], $imageInfo[1])) {
                    $origW = (int)$imageInfo[0];
                    $origH = (int)$imageInfo[1];
                    $maxW = (int)MAX_IMAGE_WIDTH;
                    $maxH = (int)MAX_IMAGE_HEIGHT;
                    if ($origW > 0 && $origH > 0 && ($origW > $maxW || $origH > $maxH)) {
                        $scale = min($maxW / $origW, $maxH / $origH);
                        $newW = max(1, (int)floor($origW * $scale));
                        $newH = max(1, (int)floor($origH * $scale));
                        $extLower = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
                        switch ($extLower) {
                            case 'jpg':
                            case 'jpeg':
                                $src = imagecreatefromjpeg($filepath);
                                break;
                            case 'png':
                                $src = imagecreatefrompng($filepath);
                                break;
                            case 'gif':
                                $src = imagecreatefromgif($filepath);
                                break;
                            case 'webp':
                                $src = function_exists('imagecreatefromwebp') ? imagecreatefromwebp($filepath) : null;
                                break;
                            default:
                                $src = null;
                        }
                        if ($src) {
                            $dst = imagecreatetruecolor($newW, $newH);
                            if (in_array($extLower, ['png','gif','webp'])) {
                                imagealphablending($dst, false);
                                imagesavealpha($dst, true);
                                $transparent = imagecolorallocatealpha($dst, 0, 0, 0, 127);
                                imagefilledrectangle($dst, 0, 0, $newW, $newH, $transparent);
                            }
                            imagecopyresampled($dst, $src, 0, 0, 0, 0, $newW, $newH, $origW, $origH);
                            switch ($extLower) {
                                case 'jpg':
                                case 'jpeg':
                                    imagejpeg($dst, $filepath, 85);
                                    break;
                                case 'png':
                                    imagepng($dst, $filepath, 6);
                                    break;
                                case 'gif':
                                    imagegif($dst, $filepath);
                                    break;
                                case 'webp':
                                    if (function_exists('imagewebp')) imagewebp($dst, $filepath, 85);
                                    break;
                            }
                            imagedestroy($dst);
                            imagedestroy($src);
                        }
                    }
                }
            } catch (Throwable $t) {
                // 忽略縮圖錯誤
            }
            return rtrim(UPLOAD_PATH, '/') . '/coupons/' . $filename; // 返回統一路徑
        }

        return false;
    }

    /**
     * 驗證優惠券資料
     */
    private function validateCouponData($input) {
        $errors = [];

        // 必填欄位驗證
        if (empty(trim($input['title'] ?? ''))) {
            $errors['title'] = '優惠券標題為必填';
        }

        if (empty($input['category'] ?? '')) {
            $errors['category'] = '分類為必填';
        }

        if (empty($input['discount_type'] ?? '')) {
            $errors['discount_type'] = '優惠類型為必填';
        }

        if (empty($input['discount_value'] ?? '')) {
            $errors['discount_value'] = '優惠值為必填';
        } else {
            $discountValue = (float)$input['discount_value'];
            if ($discountValue < 0) {
                $errors['discount_value'] = '優惠值不能為負數';
            }

            // 百分比折扣驗證
            if ($input['discount_type'] === 'percentage' && $discountValue > 100) {
                $errors['discount_value'] = '百分比折扣不能超過 100%';
            }
        }

        // 日期驗證
        if (!empty($input['start_date']) && !empty($input['end_date'])) {
            $startDate = strtotime($input['start_date']);
            $endDate = strtotime($input['end_date']);
            
            if ($startDate && $endDate && $startDate >= $endDate) {
                $errors['end_date'] = '結束日期必須晚於開始日期';
            }
        }

        // 電話號碼驗證
        if (!empty($input['phone']) && !preg_match('/^[\d\-\(\)\s\+]+$/', $input['phone'])) {
            $errors['phone'] = '電話號碼格式不正確';
        }

        return $errors;
    }
}
?>


