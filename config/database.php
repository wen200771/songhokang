<?php
/**
 * 資料庫配置文件
 * 送齁康優惠券平台
 */

class Database {
    private $host;
    private $db_name;
    private $username;
    private $password;
    private $charset = 'utf8mb4';
    public $conn;

    public function __construct() {
        // 從環境變數讀取資料庫配置，或使用預設值
        $this->host = $_ENV['DB_HOST'] ?? '127.0.0.1';
        $this->db_name = $_ENV['DB_NAME'] ?? 'songhokang_db';
        $this->username = $_ENV['DB_USER'] ?? 'root';
        $this->password = $_ENV['DB_PASS'] ?? '';
    }

    /**
     * 建立資料庫連接
     */
    public function getConnection() {
        $this->conn = null;
        
        try {
            $dsn = "mysql:host={$this->host};dbname={$this->db_name};charset={$this->charset}";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES {$this->charset}"
            ];
            
            $this->conn = new PDO($dsn, $this->username, $this->password, $options);
            
        } catch(PDOException $exception) {
            error_log("資料庫連接錯誤: " . $exception->getMessage());
            throw new Exception("資料庫連接失敗");
        }

        return $this->conn;
    }

    /**
     * 關閉資料庫連接
     */
    public function closeConnection() {
        $this->conn = null;
    }

    /**
     * 測試資料庫連接
     */
    public function testConnection() {
        try {
            $conn = $this->getConnection();
            if ($conn) {
                return ['success' => true, 'message' => '資料庫連接成功'];
            }
        } catch (Exception $e) {
            return ['success' => false, 'message' => $e->getMessage()];
        }
        return ['success' => false, 'message' => '未知錯誤'];
    }
}
?>
