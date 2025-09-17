<?php
/**
 * 廠商控制器（最小可用）
 */

class VendorController {
    private $vendorModel;

    public function __construct() {
        $this->vendorModel = new Vendor();
    }

    public function middleware() {
        return [
            'me' => ['Auth'],
            'updateMe' => ['Auth'],
            'index' => ['Auth', 'Admin'],
            'show' => ['Auth', 'Admin'],
            'approve' => ['Auth', 'Admin'],
            'reject' => ['Auth', 'Admin']
        ];
    }

    // GET /vendors/me 取得當前廠商資料（若帳號為 admin 也可查到自己是否有綁定 vendor）
    public function me() {
        $current = $GLOBALS['current_user'];
        $vendor = $this->vendorModel->findByUserId((int)$current['user_id']);
        if (!$vendor) {
            successResponse(['vendor' => null], '尚未建立廠商資料');
            return;
        }
        successResponse(['vendor' => $vendor]);
    }

    /**
     * GET /vendors?status=pending|approved|rejected&search=kw&page=1&pageSize=20
     */
    public function index() {
        $status = isset($_GET['status']) ? $_GET['status'] : null; // 若不帶則顯示所有狀態
        $search = isset($_GET['search']) ? $_GET['search'] : null;
        $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
        $pageSize = isset($_GET['pageSize']) ? min(MAX_PAGE_SIZE, max(1, (int)$_GET['pageSize'])) : DEFAULT_PAGE_SIZE;
        $data = $this->vendorModel->getList($page, $pageSize, [
            'status' => $status,
            'search' => $search
        ]);
        successResponse($data);
    }

    /**
     * GET /vendors/{id} 取得單一廠商詳情
     */
    public function show($id) {
        $vendor = $this->vendorModel->findById((int)$id);
        if (!$vendor) {
            errorResponse('找不到廠商', 404);
        }
        successResponse($vendor);
    }

    /**
     * PUT /vendors/{id}/approve  body: { note? }
     */
    public function approve($id) {
        $current = $GLOBALS["current_user"];
        $input = json_decode(file_get_contents('php://input'), true) ?: [];
        $ok = $this->vendorModel->setVerificationStatus((int)$id, 'approved', (int)$current['user_id'], $input['note'] ?? null);
        $ok ? successResponse(null, '已核准') : errorResponse('核准失敗', 500);
    }

    /**
     * PUT /vendors/{id}/reject  body: { note? }
     */
    public function reject($id) {
        $current = $GLOBALS["current_user"];
        $input = json_decode(file_get_contents('php://input'), true) ?: [];
        $ok = $this->vendorModel->setVerificationStatus((int)$id, 'rejected', (int)$current['user_id'], $input['note'] ?? null);
        $ok ? successResponse(null, '已駁回') : errorResponse('駁回失敗', 500);
    }
    
    /**
     * PUT /vendors/me 更新當前廠商資料
     */
    public function updateMe() {
        if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
            errorResponse('方法不允許', 405);
        }
        
        $current = $GLOBALS['current_user'];
        $input = json_decode(file_get_contents('php://input'), true);
        
        // 驗證輸入
        $errors = [];
        
        if (isset($input['company_name']) && empty(trim($input['company_name']))) {
            $errors['company_name'] = '公司名稱不能為空';
        }
        
        if (isset($input['tax_id']) && !empty($input['tax_id'])) {
            if (!preg_match('/^\d{8}$/', $input['tax_id'])) {
                $errors['tax_id'] = '統一編號格式不正確 (8位數字)';
            }
        }
        
        if (!empty($errors)) {
            errorResponse('資料驗證失敗', 400, $errors);
        }
        
        // 準備更新資料
        $updateData = [];
        $allowedFields = ['company_name', 'business_license', 'tax_id', 'contact_person', 'address', 'description', 'logo'];
        
        foreach ($allowedFields as $field) {
            if (isset($input[$field])) {
                $updateData[$field] = $input[$field];
            }
        }
        
        if (empty($updateData)) {
            errorResponse('沒有要更新的資料');
        }
        
        // 檢查廠商資料是否存在
        $vendor = $this->vendorModel->findByUserId((int)$current['user_id']);
        if (!$vendor) {
            errorResponse('廠商資料不存在', 404);
        }
        
        // 更新廠商資料
        if ($this->vendorModel->update($vendor['id'], $updateData)) {
            successResponse(null, '公司資料更新成功');
        } else {
            errorResponse('更新失敗，請稍後再試', 500);
        }
    }
}
?>


