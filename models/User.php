<?php
/**
 * 用戶模型
 * 處理用戶相關的資料庫操作
 */

class User {
    private $conn;
    
    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }
    
    /**
     * 創建新用戶
     */
    public function create($data) {
        $sql = "INSERT INTO users (username, email, password, phone, role, status) 
                VALUES (:username, :email, :password, :phone, :role, :status)";
        
        $stmt = $this->conn->prepare($sql);
        
        // 密碼加密
        $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT, ['cost' => PASSWORD_COST]);
        
        // bindValue 不需要傳參考，避免 "cannot be passed by reference" 錯誤
        $stmt->bindValue(':username', $data['username']);
        $stmt->bindValue(':email', $data['email']);
        $stmt->bindValue(':password', $hashedPassword);
        $stmt->bindValue(':phone', $data['phone'] ?? null);
        $stmt->bindValue(':role', $data['role'] ?? UserRole::CUSTOMER);
        $stmt->bindValue(':status', $data['status'] ?? UserStatus::PENDING);
        
        try {
            if ($stmt->execute()) {
                return $this->conn->lastInsertId();
            }
            $err = $stmt->errorInfo();
            throw new Exception('新增使用者失敗: ' . ($err[2] ?? '未知錯誤'));
        } catch (PDOException $e) {
            throw new Exception('新增使用者例外: ' . $e->getMessage());
        }
    }
    
    /**
     * 根據 ID 獲取用戶
     */
    public function findById($id) {
        $sql = "SELECT id, username, email, phone, role, status, avatar, last_login, created_at, updated_at 
                FROM users WHERE id = :id";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        
        return $stmt->fetch();
    }
    
    /**
     * 根據用戶名獲取用戶
     */
    public function findByUsername($username) {
        $sql = "SELECT * FROM users WHERE username = :username";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':username', $username);
        $stmt->execute();
        
        return $stmt->fetch();
    }
    
    /**
     * 根據郵箱獲取用戶
     */
    public function findByEmail($email) {
        $sql = "SELECT * FROM users WHERE email = :email";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':email', $email);
        $stmt->execute();
        
        return $stmt->fetch();
    }
    
    /**
     * 驗證用戶密碼
     */
    public function verifyPassword($password, $hashedPassword) {
        return password_verify($password, $hashedPassword);
    }
    
    /**
     * 更新用戶資料
     */
    public function update($id, $data) {
        $fields = [];
        $params = [':id' => $id];
        
        $allowedFields = ['username', 'email', 'phone', 'avatar', 'status'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = :$field";
                $params[":$field"] = $data[$field];
            }
        }
        
        if (isset($data['password'])) {
            $fields[] = "password = :password";
            $params[':password'] = password_hash($data['password'], PASSWORD_DEFAULT, ['cost' => PASSWORD_COST]);
        }
        
        if (empty($fields)) {
            return false;
        }
        
        $sql = "UPDATE users SET " . implode(', ', $fields) . ", updated_at = NOW() WHERE id = :id";
        
        $stmt = $this->conn->prepare($sql);
        
        return $stmt->execute($params);
    }
    
    /**
     * 更新最後登入時間
     */
    public function updateLastLogin($id) {
        $sql = "UPDATE users SET last_login = NOW() WHERE id = :id";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':id', $id);
        
        return $stmt->execute();
    }
    
    /**
     * 獲取用戶列表
     */
    public function getList($page = 1, $pageSize = DEFAULT_PAGE_SIZE, $filters = []) {
        $offset = ($page - 1) * $pageSize;
        
        $where = [];
        $params = [];
        
        if (isset($filters['role'])) {
            $where[] = "role = :role";
            $params[':role'] = $filters['role'];
        }
        
        if (isset($filters['status'])) {
            $where[] = "status = :status";
            $params[':status'] = $filters['status'];
        }
        
        if (isset($filters['search']) && $filters['search'] !== '') {
            // 注意：在原生 prepared statements 下，MySQL 不允許同名參數重複使用
            // 因此改成使用兩個不同的參數名稱
            $where[] = "(username LIKE :search1 OR email LIKE :search2)";
            $params[':search1'] = '%' . $filters['search'] . '%';
            $params[':search2'] = '%' . $filters['search'] . '%';
        }
        
        $whereClause = empty($where) ? '' : 'WHERE ' . implode(' AND ', $where);
        
        // 獲取總數
        $countSql = "SELECT COUNT(*) as total FROM users $whereClause";
        $countStmt = $this->conn->prepare($countSql);
        $countStmt->execute($params);
        $total = $countStmt->fetch()['total'];
        
        // 獲取數據
        $sql = "SELECT id, username, email, phone, role, status, avatar, last_login, created_at 
                FROM users $whereClause 
                ORDER BY created_at DESC 
                LIMIT :offset, :pageSize";
        
        $params[':offset'] = $offset;
        $params[':pageSize'] = $pageSize;
        
        $stmt = $this->conn->prepare($sql);
        
        foreach ($params as $key => $value) {
            if (in_array($key, [':offset', ':pageSize'])) {
                $stmt->bindValue($key, (int)$value, PDO::PARAM_INT);
            } else {
                $stmt->bindValue($key, $value);
            }
        }
        
        $stmt->execute();
        $users = $stmt->fetchAll();
        
        return [
            'items' => $users,
            'total' => $total,
            'page' => $page,
            'pageSize' => $pageSize,
            'totalPages' => ceil($total / $pageSize)
        ];
    }
    
    /**
     * 刪除用戶
     */
    public function delete($id) {
        $sql = "DELETE FROM users WHERE id = :id";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':id', $id);
        
        return $stmt->execute();
    }
    
    /**
     * 檢查用戶名是否存在
     */
    public function usernameExists($username, $excludeId = null) {
        $sql = "SELECT COUNT(*) as count FROM users WHERE username = :username";
        $params = [':username' => $username];
        
        if ($excludeId) {
            $sql .= " AND id != :id";
            $params[':id'] = $excludeId;
        }
        
        $stmt = $this->conn->prepare($sql);
        $stmt->execute($params);
        
        return $stmt->fetch()['count'] > 0;
    }
    
    /**
     * 檢查郵箱是否存在
     */
    public function emailExists($email, $excludeId = null) {
        $sql = "SELECT COUNT(*) as count FROM users WHERE email = :email";
        $params = [':email' => $email];
        
        if ($excludeId) {
            $sql .= " AND id != :id";
            $params[':id'] = $excludeId;
        }
        
        $stmt = $this->conn->prepare($sql);
        $stmt->execute($params);
        
        return $stmt->fetch()['count'] > 0;
    }
}
?>
