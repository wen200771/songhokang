<?php
/**
 * 用戶控制器（最小可用：列表）
 */

class UserController {
    private $userModel;

    public function __construct() {
        $this->userModel = new User();
    }

    public function middleware() {
        return [
            'index' => ['Auth', 'Admin'],
            'show' => ['Auth', 'Admin'],
            'update' => ['Auth', 'Admin'],
            'activate' => ['Auth', 'Admin'],
            'deactivate' => ['Auth', 'Admin'],
            'delete' => ['Auth', 'Admin']
        ];
    }

    // GET /users?role=&status=&search=&page=&pageSize=
    public function index() {
        $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
        $pageSize = isset($_GET['pageSize']) ? min(MAX_PAGE_SIZE, max(1, (int)$_GET['pageSize'])) : DEFAULT_PAGE_SIZE;
        $filters = [
            'role' => $_GET['role'] ?? null,
            'status' => $_GET['status'] ?? null,
            'search' => $_GET['search'] ?? null,
        ];

        $data = $this->userModel->getList($page, $pageSize, $filters);
        successResponse($data);
    }

    // GET /users/{id}
    public function show($id) {
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            errorResponse('方法不允許', 405);
        }
        
        $user = $this->userModel->findById((int)$id);
        if (!$user) {
            errorResponse('用戶不存在', 404);
        }
        
        // 移除敏感資訊
        unset($user['password']);
        
        successResponse(['user' => $user]);
    }

    // PUT /users/{id}/activate
    public function activate($id) {
        if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
            errorResponse('方法不允許', 405);
        }
        
        $ok = $this->userModel->update($id, ['status' => UserStatus::ACTIVE]);
        if ($ok) { successResponse(null, '已啟用'); } else { errorResponse('啟用失敗', 500); }
    }

    // PUT /users/{id}/deactivate
    public function deactivate($id) {
        if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
            errorResponse('方法不允許', 405);
        }

        try {
            // 先取得用戶資訊
            $user = $this->userModel->findById($id);
            if (!$user) {
                errorResponse('用戶不存在', 404);
                return;
            }

            // 如果是廠商用戶，設為待審核；一般用戶設為停用
            if ($user['role'] === UserRole::VENDOR) {
                $ok = $this->userModel->update($id, ['status' => UserStatus::PENDING]);
                if ($ok) { 
                    successResponse(null, '廠商已回到待審核狀態'); 
                } else { 
                    errorResponse('操作失敗', 500); 
                }
            } else {
                // 一般用戶直接停用
                $ok = $this->userModel->update($id, ['status' => UserStatus::INACTIVE]);
                if ($ok) { 
                    successResponse(null, '已停用'); 
                } else { 
                    errorResponse('停用失敗', 500); 
                }
            }
        } catch (Exception $e) {
            error_log("Deactivate user error: " . $e->getMessage());
            errorResponse('系統錯誤：' . $e->getMessage(), 500);
        }
    }

    // PUT /users/{id}
    public function update($id) {
        if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
            errorResponse('方法不允許', 405);
        }

        $input = json_decode(file_get_contents('php://input'), true);
        
        // 檢查用戶是否存在
        $user = $this->userModel->findById($id);
        if (!$user) {
            errorResponse('用戶不存在', 404);
        }

        // 準備更新資料
        $updateData = [];
        
        // 允許更新的欄位
        if (isset($input['email'])) {
            if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
                errorResponse('郵箱格式不正確');
            }
            if ($this->userModel->emailExists($input['email'], $id)) {
                errorResponse('郵箱已存在');
            }
            $updateData['email'] = $input['email'];
        }
        
        if (isset($input['phone'])) {
            $updateData['phone'] = $input['phone'];
        }
        
        if (isset($input['status'])) {
            $validStatuses = ['active', 'inactive', 'pending', 'suspended'];
            if (!in_array($input['status'], $validStatuses)) {
                errorResponse('無效的狀態值');
            }
            $updateData['status'] = $input['status'];
        }

        if (empty($updateData)) {
            errorResponse('沒有要更新的資料');
        }

        // 更新用戶
        if ($this->userModel->update($id, $updateData)) {
            successResponse(null, '用戶資料更新成功');
        } else {
            errorResponse('更新失敗', 500);
        }
    }

    // DELETE /users/{id}
    public function delete($id) {
        if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
            errorResponse('方法不允許', 405);
        }

        // 檢查用戶是否存在
        $user = $this->userModel->findById($id);
        if (!$user) {
            errorResponse('用戶不存在', 404);
        }

        // 檢查是否為管理員（防止刪除管理員）
        if ($user['role'] === 'admin') {
            errorResponse('不能刪除管理員帳號', 403);
        }

        // 檢查是否為當前登入的用戶（防止自己刪除自己）
        $currentUser = $GLOBALS['current_user'];
        if ($currentUser['user_id'] == $id) {
            errorResponse('不能刪除自己的帳號', 403);
        }

        try {
            // 如果是廠商，先刪除相關的廠商資料
            if ($user['role'] === 'vendor') {
                // 這裡可以加入刪除廠商相關資料的邏輯
                // 例如：將廠商的優惠券設為無效等
            }

            // 刪除用戶
            if ($this->userModel->delete($id)) {
                successResponse(null, '用戶已成功刪除');
            } else {
                errorResponse('刪除失敗', 500);
            }
        } catch (Exception $e) {
            error_log("Delete user error: " . $e->getMessage());
            errorResponse('刪除用戶時發生錯誤：' . $e->getMessage(), 500);
        }
    }
}
?>


