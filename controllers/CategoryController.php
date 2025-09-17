<?php
/**
 * 分類管理控制器
 * 支援：
 * - GET /categories           列出啟用中的分類（前台用）
 * - POST /categories          新增分類（管理員）
 * - PUT /categories/{id}      更新分類（管理員）
 * - DELETE /categories/{id}   刪除分類（管理員）
 */

class CategoryController {
    private $db;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    public function middleware() {
        // 前台讀取開放，其餘操作需管理員
        return [
            'create' => ['Auth', 'Admin'],
            'update' => ['Auth', 'Admin'],
            'delete' => ['Auth', 'Admin'],
        ];
    }

    /**
     * GET /categories
     * 列出分類（可選擇是否只取啟用中的分類）
     */
    public function index() {
        $onlyActive = isset($_GET['active']) ? (int)$_GET['active'] : 1; // 預設只取啟用中的
        $sql = "SELECT id, name, slug, description, icon, color, sort_order, is_active FROM categories";
        if ($onlyActive === 1) {
            $sql .= " WHERE is_active = 1";
        }
        $sql .= " ORDER BY sort_order ASC, id ASC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        $rows = $stmt->fetchAll();

        successResponse($rows);
    }

    /**
     * POST /categories
     * 新增分類（管理員）
     */
    public function create() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            errorResponse('方法不允許', 405);
        }

        $input = json_decode(file_get_contents('php://input'), true);

        $errors = $this->validate($input, true);
        if (!empty($errors)) {
            errorResponse('資料驗證失敗', 400, $errors);
        }

        // 檢查 slug 是否唯一
        $check = $this->db->prepare('SELECT id FROM categories WHERE slug = ? LIMIT 1');
        $check->execute([$input['slug']]);
        if ($check->fetch()) {
            errorResponse('slug 已存在，請更換');
        }

        $stmt = $this->db->prepare('INSERT INTO categories (name, slug, description, icon, color, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)');
        $ok = $stmt->execute([
            trim($input['name']),
            trim($input['slug']),
            $input['description'] ?? null,
            $input['icon'] ?? null,
            $input['color'] ?? null,
            (int)($input['sort_order'] ?? 0),
            isset($input['is_active']) ? (int)$input['is_active'] : 1
        ]);

        if (!$ok) {
            errorResponse('建立失敗', 500);
        }

        $id = (int)$this->db->lastInsertId();
        successResponse(['id' => $id], '分類已建立');
    }

    /**
     * PUT /categories/{id}
     * 更新分類（管理員）
     */
    public function update($id) {
        if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
            errorResponse('方法不允許', 405);
        }

        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) {
            errorResponse('請提供更新資料');
        }

        // 確認存在
        $exist = $this->findById($id);
        if (!$exist) {
            errorResponse('分類不存在', 404);
        }

        // 如果要改 slug，要檢查唯一
        if (isset($input['slug']) && $input['slug'] !== $exist['slug']) {
            $check = $this->db->prepare('SELECT id FROM categories WHERE slug = ? AND id <> ? LIMIT 1');
            $check->execute([$input['slug'], $id]);
            if ($check->fetch()) {
                errorResponse('slug 已存在，請更換');
            }
        }

        $fields = [];
        $params = [];
        $allowed = ['name','slug','description','icon','color','sort_order','is_active'];
        foreach ($allowed as $key) {
            if (array_key_exists($key, $input)) {
                $fields[] = "$key = ?";
                if ($key === 'sort_order' || $key === 'is_active') {
                    $params[] = (int)$input[$key];
                } else {
                    $params[] = $input[$key];
                }
            }
        }

        if (empty($fields)) {
            errorResponse('沒有要更新的欄位');
        }

        $params[] = (int)$id;
        $sql = 'UPDATE categories SET ' . implode(', ', $fields) . ' WHERE id = ?';
        $stmt = $this->db->prepare($sql);
        $ok = $stmt->execute($params);

        if ($ok) {
            successResponse(null, '更新成功');
        }
        errorResponse('更新失敗', 500);
    }

    /**
     * DELETE /categories/{id}
     * 刪除分類（管理員）
     */
    public function delete($id) {
        if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
            errorResponse('方法不允許', 405);
        }

        // 確認存在
        $exist = $this->findById($id);
        if (!$exist) {
            errorResponse('分類不存在', 404);
        }

        // 可依需求改為軟刪除；此處為真刪
        $stmt = $this->db->prepare('DELETE FROM categories WHERE id = ?');
        $ok = $stmt->execute([(int)$id]);

        if ($ok) {
            successResponse(null, '刪除成功');
        }
        errorResponse('刪除失敗', 500);
    }

    private function findById($id) {
        $stmt = $this->db->prepare('SELECT * FROM categories WHERE id = ? LIMIT 1');
        $stmt->execute([(int)$id]);
        return $stmt->fetch();
    }

    private function validate($input, $isCreate = false) {
        $errors = [];
        if ($isCreate) {
            if (empty($input['name'])) $errors['name'] = 'name 必填';
            if (empty($input['slug'])) $errors['slug'] = 'slug 必填';
        }
        if (isset($input['slug']) && !preg_match('/^[a-z0-9\-]+$/', $input['slug'])) {
            $errors['slug'] = 'slug 僅能包含小寫英數與 -';
        }
        if (isset($input['color']) && !preg_match('/^#?[0-9a-fA-F]{6}$/', $input['color'])) {
            $errors['color'] = 'color 必須為 6 碼十六進位色碼';
        }
        return $errors;
    }
}
?>


