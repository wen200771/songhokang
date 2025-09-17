<?php
/**
 * 認證控制器
 * 處理用戶登入、註冊、登出等認證相關功能
 */

class AuthController {
    private $userModel;
    
    public function __construct() {
        $this->userModel = new User();
    }
    
    /**
     * 定義需要的中間件
     */
    public function middleware() {
        // 依方法指定需要認證的動作
        return [
            'logout' => ['Auth'],
            'me' => ['Auth'],
            'profile' => ['Auth'],
            'changePassword' => ['Auth'],
            'switchAccount' => ['Auth', 'Admin'],
            'switchBack' => ['Auth']
        ];
    }
    
    /**
     * 用戶登入
     */
    public function login() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            errorResponse('方法不允許', 405);
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        // 驗證輸入
        if (empty($input['username']) || empty($input['password'])) {
            errorResponse('用戶名和密碼不能為空');
        }
        
        // 查找用戶 (支援用戶名或郵箱登入)
        $user = $this->userModel->findByUsername($input['username']);
        if (!$user) {
            $user = $this->userModel->findByEmail($input['username']);
        }
        
        if (!$user) {
            errorResponse('用戶名或密碼錯誤');
        }
        
        // 驗證密碼
        if (!$this->userModel->verifyPassword($input['password'], $user['password'])) {
            errorResponse('用戶名或密碼錯誤');
        }
        
        // 檢查用戶狀態
        if ($user['status'] !== UserStatus::ACTIVE) {
            $statusMessages = [
                UserStatus::PENDING => '帳號待審核，請等待管理員審核',
                UserStatus::INACTIVE => '帳號已停用',
                UserStatus::SUSPENDED => '帳號已被暫停'
            ];
            errorResponse($statusMessages[$user['status']] ?? '帳號狀態異常');
        }
        
        // 生成 JWT Token
        $token = JWT::generateUserToken($user);
        
        // 更新最後登入時間
        $this->userModel->updateLastLogin($user['id']);
        
        // 移除敏感資訊
        unset($user['password']);
        
        successResponse([
            'user' => $user,
            'token' => $token,
            'expires_in' => JWT_EXPIRE_TIME
        ], '登入成功');
    }
    
    /**
     * 用戶註冊
     */
    public function register() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            errorResponse('方法不允許', 405);
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        // 驗證輸入
        $errors = $this->validateRegistration($input);
        if (!empty($errors)) {
            errorResponse('註冊資料驗證失敗', 400, $errors);
        }
        
        // 檢查用戶名是否已存在
        if ($this->userModel->usernameExists($input['username'])) {
            errorResponse('用戶名已存在');
        }
        
        // 檢查郵箱是否已存在
        if ($this->userModel->emailExists($input['email'])) {
            errorResponse('郵箱已存在');
        }
        
        // 創建用戶
        $userData = [
            'username' => $input['username'],
            'email' => $input['email'],
            'password' => $input['password'],
            'phone' => $input['phone'] ?? null,
            'role' => $input['role'] ?? UserRole::CUSTOMER,
            'status' => UserStatus::ACTIVE // 一般用戶直接啟用
        ];
        
        // 廠商註冊需要審核
        if ($userData['role'] === UserRole::VENDOR) {
            $userData['status'] = UserStatus::PENDING;
        }
        
        $userId = $this->userModel->create($userData);
        
        if (!$userId) {
            errorResponse('註冊失敗', 500);
        }
        
        // 如果是廠商，創建廠商資料
        if ($userData['role'] === UserRole::VENDOR) {
            $this->createVendorProfile($userId, $input);
        }
        
        successResponse([
            'user_id' => $userId,
            'status' => $userData['status']
        ], '註冊成功' . ($userData['status'] === UserStatus::PENDING ? '，請等待管理員審核' : ''));
    }
    
    /**
     * 用戶登出
     */
    public function logout() {
        // JWT 是無狀態的，客戶端刪除 token 即可
        // 這裡可以記錄登出日誌
        successResponse(null, '登出成功');
    }
    
    /**
     * 獲取當前用戶資訊
     */
    public function me() {
        $currentUser = $GLOBALS['current_user'];
        $user = $this->userModel->findById($currentUser['user_id']);
        
        if (!$user) {
            errorResponse('用戶不存在', 404);
        }
        
        successResponse($user);
    }
    
    /**
     * 驗證註冊資料
     */
    private function validateRegistration($input) {
        $errors = [];
        
        // 用戶名驗證
        if (empty($input['username'])) {
            $errors['username'] = '用戶名不能為空';
        } elseif (strlen($input['username']) < 3 || strlen($input['username']) > 50) {
            $errors['username'] = '用戶名長度必須在 3-50 字符之間';
        } elseif (!preg_match('/^[a-zA-Z0-9_]+$/', $input['username'])) {
            $errors['username'] = '用戶名只能包含字母、數字和下劃線';
        }
        
        // 郵箱驗證
        if (empty($input['email'])) {
            $errors['email'] = '郵箱不能為空';
        } elseif (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = '郵箱格式不正確';
        }
        
        // 密碼驗證
        if (empty($input['password'])) {
            $errors['password'] = '密碼不能為空';
        } elseif (strlen($input['password']) < 6) {
            $errors['password'] = '密碼長度不能少於 6 位';
        }
        
        // 確認密碼
        if (isset($input['confirm_password']) && $input['password'] !== $input['confirm_password']) {
            $errors['confirm_password'] = '確認密碼不一致';
        }
        
        // 手機號驗證 (可選)
        if (!empty($input['phone']) && !preg_match('/^09\d{8}$/', $input['phone'])) {
            $errors['phone'] = '手機號格式不正確';
        }
        
        // 角色驗證
        if (isset($input['role']) && !in_array($input['role'], [UserRole::CUSTOMER, UserRole::VENDOR])) {
            $errors['role'] = '角色選擇不正確';
        }
        
        return $errors;
    }
    
    /**
     * 創建廠商檔案
     */
    private function createVendorProfile($userId, $input) {
        // 這裡會在 VendorController 中實現
        // 暫時先創建基本記錄
        $vendorModel = new Vendor();
        $vendorData = [
            'user_id' => $userId,
            'company_name' => $input['company_name'] ?? '',
            'business_license' => $input['business_license'] ?? null,
            'tax_id' => $input['tax_id'] ?? null,
            'address' => $input['address'] ?? null,
            'phone' => $input['phone'] ?? null,
            'contact_person' => $input['contact_person'] ?? null,
            'description' => $input['description'] ?? null,
            'category' => $input['category'] ?? null
        ];
        
        return $vendorModel->create($vendorData);
    }
    
    /**
     * 更新個人資料
     */
    public function profile() {
        if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
            errorResponse('方法不允許', 405);
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        $currentUser = $GLOBALS['current_user'];
        
        // 驗證輸入
        $errors = [];
        
        if (isset($input['email'])) {
            if (empty($input['email'])) {
                $errors['email'] = '電子郵件不能為空';
            } elseif (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
                $errors['email'] = '電子郵件格式不正確';
            } elseif ($this->userModel->emailExists($input['email'], $currentUser['user_id'])) {
                $errors['email'] = '電子郵件已被使用';
            }
        }
        
        if (isset($input['phone']) && !empty($input['phone'])) {
            if (!preg_match('/^09\d{8}$/', $input['phone'])) {
                $errors['phone'] = '手機號格式不正確 (格式：09xxxxxxxx)';
            }
        }
        
        if (!empty($errors)) {
            errorResponse('資料驗證失敗', 400, $errors);
        }
        
        // 準備更新資料
        $updateData = [];
        if (isset($input['email'])) $updateData['email'] = $input['email'];
        if (isset($input['phone'])) $updateData['phone'] = $input['phone'];
        // 新增：允許更新頭像 URL
        if (isset($input['avatar'])) $updateData['avatar'] = $input['avatar'];
        
        if (empty($updateData)) {
            errorResponse('沒有要更新的資料');
        }
        
        // 更新用戶資料
        if ($this->userModel->update($currentUser['user_id'], $updateData)) {
            successResponse(null, '個人資料更新成功');
        } else {
            errorResponse('更新失敗，請稍後再試', 500);
        }
    }
    
    /**
     * 修改密碼
     */
    public function changePassword() {
        if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
            errorResponse('方法不允許', 405);
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        $currentUser = $GLOBALS['current_user'];
        
        // 驗證輸入
        if (empty($input['current_password'])) {
            errorResponse('請輸入目前密碼');
        }
        
        if (empty($input['new_password'])) {
            errorResponse('請輸入新密碼');
        }
        
        if (strlen($input['new_password']) < 6) {
            errorResponse('新密碼長度不能少於 6 位');
        }
        
        // 驗證目前密碼
        $user = $this->userModel->findById($currentUser['user_id']);
        if (!$user || !password_verify($input['current_password'], $user['password'])) {
            errorResponse('目前密碼不正確');
        }
        
        // 更新密碼
        $hashedPassword = password_hash($input['new_password'], PASSWORD_DEFAULT);
        if ($this->userModel->update($currentUser['user_id'], ['password' => $hashedPassword])) {
            successResponse(null, '密碼修改成功');
        } else {
            errorResponse('密碼修改失敗，請稍後再試', 500);
        }
    }
    
    /**
     * 管理員切換帳號
     */
    public function switchAccount() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            errorResponse('方法不允許', 405);
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        $currentUser = $GLOBALS['current_user'];
        
        // 驗證輸入
        if (empty($input['user_id'])) {
            errorResponse('請提供要切換的用戶ID');
        }
        
        $targetUserId = (int)$input['user_id'];
        
        // 檢查目標用戶是否存在
        $targetUser = $this->userModel->findById($targetUserId);
        if (!$targetUser) {
            errorResponse('目標用戶不存在', 404);
        }
        
        // 生成新的 JWT Token，但保留管理員資訊
        $payload = [
            'user_id' => $targetUser['id'],
            'username' => $targetUser['username'],
            'email' => $targetUser['email'],
            'role' => $targetUser['role'],
            'status' => $targetUser['status'],
            'admin_user_id' => $currentUser['user_id'], // 保存原管理員ID
            'admin_username' => $currentUser['username'], // 保存原管理員用戶名
            'is_switched' => true, // 標記為切換狀態
            'iat' => time(),
            'exp' => time() + JWT_EXPIRE_TIME
        ];
        
        $token = JWT::encode($payload, JWT_SECRET, 'HS256');
        
        // 移除敏感資訊
        unset($targetUser['password']);
        
        successResponse([
            'user' => $targetUser,
            'token' => $token,
            'is_switched' => true,
            'admin_info' => [
                'user_id' => $currentUser['user_id'],
                'username' => $currentUser['username']
            ],
            'expires_in' => JWT_EXPIRE_TIME
        ], '已切換到用戶：' . $targetUser['username']);
    }
    
    /**
     * 切換回管理員帳號
     */
    public function switchBack() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            errorResponse('方法不允許', 405);
        }
        
        $currentUser = $GLOBALS['current_user'];
        
        // 檢查是否處於切換狀態
        if (!isset($currentUser['is_switched']) || !$currentUser['is_switched']) {
            errorResponse('目前不在切換狀態');
        }
        
        if (!isset($currentUser['admin_user_id'])) {
            errorResponse('無法找到原管理員資訊');
        }
        
        // 獲取原管理員資訊
        $adminUser = $this->userModel->findById($currentUser['admin_user_id']);
        if (!$adminUser) {
            errorResponse('原管理員帳號不存在', 404);
        }
        
        // 生成管理員 Token
        $payload = [
            'user_id' => $adminUser['id'],
            'username' => $adminUser['username'],
            'email' => $adminUser['email'],
            'role' => $adminUser['role'],
            'status' => $adminUser['status'],
            'iat' => time(),
            'exp' => time() + JWT_EXPIRE_TIME
        ];
        
        $token = JWT::encode($payload, JWT_SECRET, 'HS256');
        
        // 移除敏感資訊
        unset($adminUser['password']);
        
        successResponse([
            'user' => $adminUser,
            'token' => $token,
            'is_switched' => false,
            'expires_in' => JWT_EXPIRE_TIME
        ], '已切換回管理員帳號');
    }
}
?>
