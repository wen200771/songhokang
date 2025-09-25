<?php
/**
 * 地區管理控制器
 * 支援：
 * - GET /regions         列出啟用中的地區（前台用）
 * - POST /regions        新增地區（管理員）
 * - PUT /regions/{id}    更新地區（管理員）
 * - DELETE /regions/{id} 刪除地區（管理員）
 */

class RegionController {
    private $db;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    public function middleware() {
        return [
            'create' => ['Auth', 'Admin'],
            'update' => ['Auth', 'Admin'],
            'delete' => ['Auth', 'Admin'],
        ];
    }

    // GET /regions
    public function index() {
        $onlyActive = isset($_GET['active']) ? (int)$_GET['active'] : 1;
        $sql = "SELECT id, name, slug, parent_id, level, sort_order, is_active FROM regions";
        if ($onlyActive === 1) {
            $sql .= " WHERE is_active = 1";
        }
        $sql .= " ORDER BY sort_order ASC, id ASC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        $rows = $stmt->fetchAll();
        successResponse($rows);
    }

    // POST /regions
    public function create() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') errorResponse('方法不允許', 405);
        $input = json_decode(file_get_contents('php://input'), true);
        $errors = $this->validate($input, true);
        if (!empty($errors)) errorResponse('資料驗證失敗', 400, $errors);

        // slug 唯一
        $check = $this->db->prepare('SELECT id FROM regions WHERE slug = ? LIMIT 1');
        $check->execute([$input['slug']]);
        if ($check->fetch()) errorResponse('slug 已存在，請更換');

        $stmt = $this->db->prepare('INSERT INTO regions (name, slug, parent_id, level, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?)');
        $ok = $stmt->execute([
            trim($input['name']),
            trim($input['slug']),
            isset($input['parent_id']) ? (int)$input['parent_id'] : null,
            isset($input['level']) ? (int)$input['level'] : 1,
            (int)($input['sort_order'] ?? 0),
            isset($input['is_active']) ? (int)$input['is_active'] : 1,
        ]);
        if (!$ok) errorResponse('建立失敗', 500);
        successResponse(['id' => (int)$this->db->lastInsertId()], '地區已建立');
    }

    // PUT /regions/{id}
    public function update($id) {
        if ($_SERVER['REQUEST_METHOD'] !== 'PUT') errorResponse('方法不允許', 405);
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) errorResponse('請提供更新資料');

        $exist = $this->findById($id);
        if (!$exist) errorResponse('地區不存在', 404);

        if (isset($input['slug']) && $input['slug'] !== $exist['slug']) {
            $check = $this->db->prepare('SELECT id FROM regions WHERE slug = ? AND id <> ? LIMIT 1');
            $check->execute([$input['slug'], $id]);
            if ($check->fetch()) errorResponse('slug 已存在，請更換');
        }

        $errors = $this->validate($input, false);
        if (!empty($errors)) errorResponse('資料驗證失敗', 400, $errors);

        $fields = [];
        $params = [];
        $allowed = ['name','slug','parent_id','level','sort_order','is_active'];
        foreach ($allowed as $key) {
            if (array_key_exists($key, $input)) {
                $fields[] = "$key = ?";
                if (in_array($key, ['parent_id','level','sort_order','is_active'], true)) $params[] = $input[$key] !== null ? (int)$input[$key] : null;
                else $params[] = $input[$key];
            }
        }
        if (empty($fields)) errorResponse('沒有要更新的欄位');
        $params[] = (int)$id;
        $sql = 'UPDATE regions SET ' . implode(', ', $fields) . ' WHERE id = ?';
        $stmt = $this->db->prepare($sql);
        $ok = $stmt->execute($params);
        if ($ok) successResponse(null, '更新成功');
        errorResponse('更新失敗', 500);
    }

    // DELETE /regions/{id}
    public function delete($id) {
        if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') errorResponse('方法不允許', 405);
        $exist = $this->findById($id);
        if (!$exist) errorResponse('地區不存在', 404);
        $stmt = $this->db->prepare('DELETE FROM regions WHERE id = ?');
        $ok = $stmt->execute([(int)$id]);
        if ($ok) successResponse(null, '刪除成功');
        errorResponse('刪除失敗', 500);
    }

    private function findById($id) {
        $stmt = $this->db->prepare('SELECT * FROM regions WHERE id = ? LIMIT 1');
        $stmt->execute([(int)$id]);
        return $stmt->fetch();
    }

    private function validate($input, $isCreate = false) {
        $errors = [];
        if ($isCreate) {
            if (empty($input['name'])) $errors['name'] = 'name 必填';
            if (empty($input['slug'])) $errors['slug'] = 'slug 必填';
        }
        if (isset($input['name'])) {
            $name = trim((string)$input['name']);
            if ($name === '') $errors['name'] = 'name 不可為空白';
            if (mb_strlen($name, 'UTF-8') > 50) $errors['name'] = 'name 最長 50 字';
        }
        if (isset($input['slug'])) {
            $slug = (string)$input['slug'];
            if (!preg_match('/^[a-z0-9\-]+$/', $slug)) $errors['slug'] = 'slug 僅能包含小寫英數與 -';
            if (strlen($slug) > 50) $errors['slug'] = 'slug 最長 50 字元';
        }
        if (isset($input['level']) && !in_array((int)$input['level'], [1,2,3], true)) $errors['level'] = 'level 僅能為 1/2/3';
        if (isset($input['sort_order']) && !is_numeric($input['sort_order'])) $errors['sort_order'] = 'sort_order 必須為數字';
        if (isset($input['is_active']) && !in_array((int)$input['is_active'], [0,1], true)) $errors['is_active'] = 'is_active 僅能為 0 或 1';
        return $errors;
    }
}
?>


