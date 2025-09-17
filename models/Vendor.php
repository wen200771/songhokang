<?php
/**
 * 廠商模型
 */

class Vendor {
    private $conn;

    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }

    public function create(array $data) {
        $sql = "INSERT INTO vendors (user_id, company_name, business_license, tax_id, address, phone, contact_person, description, logo, website, category) 
                VALUES (:user_id, :company_name, :business_license, :tax_id, :address, :phone, :contact_person, :description, :logo, :website, :category)";
        $stmt = $this->conn->prepare($sql);
        $stmt->bindValue(':user_id', (int)($data['user_id'] ?? 0), PDO::PARAM_INT);
        $stmt->bindValue(':company_name', $data['company_name'] ?? '');
        $stmt->bindValue(':business_license', $data['business_license'] ?? null);
        $stmt->bindValue(':tax_id', $data['tax_id'] ?? null);
        $stmt->bindValue(':address', $data['address'] ?? null);
        $stmt->bindValue(':phone', $data['phone'] ?? null);
        $stmt->bindValue(':contact_person', $data['contact_person'] ?? null);
        $stmt->bindValue(':description', $data['description'] ?? null);
        $stmt->bindValue(':logo', $data['logo'] ?? null);
        $stmt->bindValue(':website', $data['website'] ?? null);
        $stmt->bindValue(':category', $data['category'] ?? null);
        if ($stmt->execute()) {
            return (int)$this->conn->lastInsertId();
        }
        return false;
    }

    public function findById(int $id) {
        $sql = "SELECT * FROM vendors WHERE id = :id";
        $stmt = $this->conn->prepare($sql);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch();
    }

    public function findByUserId(int $userId) {
        $sql = "SELECT * FROM vendors WHERE user_id = :uid";
        $stmt = $this->conn->prepare($sql);
        $stmt->bindValue(':uid', $userId, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch();
    }

    public function getList(int $page = 1, int $pageSize = DEFAULT_PAGE_SIZE, array $filters = []) {
        $offset = ($page - 1) * $pageSize;
        $where = [];
        $params = [];
        if (!empty($filters['status'])) { $where[] = 'v.verification_status = :status'; $params[':status'] = $filters['status']; }
        if (!empty($filters['search'])) { $where[] = '(v.company_name LIKE :kw OR u.username LIKE :kw OR u.email LIKE :kw)'; $params[':kw'] = '%' . $filters['search'] . '%'; }
        $whereSql = empty($where) ? '' : ('WHERE ' . implode(' AND ', $where));

        $countSql = "SELECT COUNT(*) AS total FROM vendors v LEFT JOIN users u ON u.id = v.user_id $whereSql";
        $cs = $this->conn->prepare($countSql); $cs->execute($params); $total = (int)($cs->fetch()['total'] ?? 0);

        $sql = "SELECT v.*, u.username, u.email FROM vendors v LEFT JOIN users u ON u.id = v.user_id $whereSql ORDER BY v.created_at DESC LIMIT :o,:l";
        $st = $this->conn->prepare($sql);
        foreach ($params as $k=>$v) { $st->bindValue($k,$v); }
        $st->bindValue(':o', (int)$offset, PDO::PARAM_INT);
        $st->bindValue(':l', (int)$pageSize, PDO::PARAM_INT);
        $st->execute();
        $rows = $st->fetchAll();
        return ['items'=>$rows,'total'=>$total,'page'=>$page,'pageSize'=>$pageSize,'totalPages'=>($pageSize>0? (int)ceil($total/$pageSize):1)];
    }

    public function setVerificationStatus(int $id, string $status, int $adminId, ?string $note = null) {
        $sql = "UPDATE vendors SET verification_status = :s, verification_note = :n, verified_by = :aid, verified_at = NOW(), updated_at = NOW() WHERE id = :id";
        $st = $this->conn->prepare($sql);
        $st->bindValue(':s', $status);
        $st->bindValue(':n', $note);
        $st->bindValue(':aid', $adminId, PDO::PARAM_INT);
        $st->bindValue(':id', $id, PDO::PARAM_INT);
        $ok = $st->execute();

        if ($ok) {
            // 同步更新對應用戶狀態：核准→active；駁回→pending（或維持原狀態）
            $uidStmt = $this->conn->prepare('SELECT user_id FROM vendors WHERE id = :id');
            $uidStmt->bindValue(':id', $id, PDO::PARAM_INT);
            $uidStmt->execute();
            $row = $uidStmt->fetch();
            if ($row && isset($row['user_id'])) {
                $userStatus = ($status === 'approved') ? UserStatus::ACTIVE : UserStatus::PENDING;
                $u = $this->conn->prepare('UPDATE users SET status = :st, updated_at = NOW() WHERE id = :uid');
                $u->bindValue(':st', $userStatus);
                $u->bindValue(':uid', (int)$row['user_id'], PDO::PARAM_INT);
                $u->execute();
            }
        }

        return $ok;
    }

    public function update(int $id, array $data) {
        $fields = [];
        $params = [':id' => $id];
        $allowed = ['company_name','business_license','tax_id','address','phone','contact_person','description','logo','website','category','verification_status','verification_note','verified_by','verified_at'];
        foreach ($allowed as $key) {
            if (array_key_exists($key, $data)) {
                $fields[] = "$key = :$key";
                $params[":$key"] = $data[$key];
            }
        }
        if (empty($fields)) { return false; }
        $sql = 'UPDATE vendors SET ' . implode(', ', $fields) . ', updated_at = NOW() WHERE id = :id';
        $st = $this->conn->prepare($sql);
        return $st->execute($params);
    }
}
?>


