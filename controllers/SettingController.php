<?php
/**
 * 系統設定控制器
 * 支援：
 * - GET /settings         讀取全部設定（或指定 keys）
 * - PUT /settings         批次更新
 * 僅管理員可用
 */

class SettingController {
    private $db;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    public function middleware() {
        return [
            'index' => ['Auth', 'Admin'],
            'update' => ['Auth', 'Admin'],
        ];
    }

    /**
     * GET /settings
     * ?keys=site_name,max_upload_size  可選，逗號分隔
     */
    public function index() {
        $keysParam = $_GET['keys'] ?? null;
        if ($keysParam) {
            $keys = array_filter(array_map('trim', explode(',', $keysParam)));
            if (empty($keys)) {
                successResponse([]);
            }
            $placeholders = implode(',', array_fill(0, count($keys), '?'));
            $stmt = $this->db->prepare("SELECT setting_key, setting_value, setting_type FROM system_settings WHERE setting_key IN ($placeholders)");
            $stmt->execute($keys);
        } else {
            $stmt = $this->db->prepare("SELECT setting_key, setting_value, setting_type FROM system_settings");
            $stmt->execute();
        }

        $rows = $stmt->fetchAll();
        $result = [];
        foreach ($rows as $row) {
            $result[$row['setting_key']] = $this->castValue($row['setting_value'], $row['setting_type']);
        }
        successResponse($result);
    }

    /**
     * PUT /settings
     * JSON 物件，key=>value，會依現有 setting_type 做型別轉換
     * 若 key 不存在，預設以 string 類型寫入
     */
    public function update() {
        if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
            errorResponse('方法不允許', 405);
        }

        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input || !is_array($input)) {
            errorResponse('請提供要更新的設定');
        }

        $this->db->beginTransaction();
        try {
            foreach ($input as $key => $value) {
                if (!is_string($key) || $key === '') {
                    continue;
                }

                // 取得既有類型
                $stmt = $this->db->prepare('SELECT setting_type FROM system_settings WHERE setting_key = ? LIMIT 1');
                $stmt->execute([$key]);
                $row = $stmt->fetch();

                $type = $row ? $row['setting_type'] : $this->detectType($value);
                $storeValue = $this->stringifyValue($value, $type);

                if ($row) {
                    // 更新
                    $u = $this->db->prepare('UPDATE system_settings SET setting_value = ?, setting_type = ? WHERE setting_key = ?');
                    $u->execute([$storeValue, $type, $key]);
                } else {
                    // 新增
                    $i = $this->db->prepare('INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES (?, ?, ?, NULL)');
                    $i->execute([$key, $storeValue, $type]);
                }
            }
            $this->db->commit();
        } catch (Exception $e) {
            $this->db->rollBack();
            errorResponse('更新失敗', 500, $e->getMessage());
        }

        successResponse(null, '設定已更新');
    }

    private function castValue($value, $type) {
        switch ($type) {
            case 'integer':
                return (int)$value;
            case 'boolean':
                return in_array(strtolower((string)$value), ['1','true','yes','on'], true);
            case 'json':
                $decoded = json_decode($value, true);
                return $decoded === null ? $value : $decoded;
            default:
                return (string)$value;
        }
    }

    private function stringifyValue($value, $type) {
        switch ($type) {
            case 'integer':
                return (string)(int)$value;
            case 'boolean':
                return $value ? '1' : '0';
            case 'json':
                return json_encode($value, JSON_UNESCAPED_UNICODE);
            default:
                return (string)$value;
        }
    }

    private function detectType($value) {
        if (is_bool($value)) return 'boolean';
        if (is_int($value)) return 'integer';
        if (is_array($value)) return 'json';
        return 'string';
    }
}
?>


