<?php
/**
 * 資料庫設定檔
 * 送齁康優惠券平台
 */

if (!function_exists('env')) {
    require_once __DIR__ . '/Env.php';
    Env::load(__DIR__ . '/../.env');
}

class Database {
    private $host;
    private $port;
    private $db_name;
    private $username;
    private $password;
    private $charset = 'utf8mb4';
    public $conn;

    public function __construct() {
        // 從環境變數讀取資料庫設定，若無則使用預設值
        $this->host = env('DB_HOST', '127.0.0.1');
        $this->port = env('DB_PORT', '3306');
        $this->db_name = env('DB_NAME', 'songhokang_db');
        $this->username = env('DB_USER', 'root');
        $this->password = env('DB_PASS', '');
    }

    /**
     * 建立資料庫連線
     */
    public function getConnection() {
        $this->conn = null;

        try {
            $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=%s',
                $this->host,
                $this->port,
                $this->db_name,
                $this->charset
            );

            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES {$this->charset}"
            ];

            $this->conn = new PDO($dsn, $this->username, $this->password, $options);

        } catch(PDOException $exception) {
            error_log("資料庫連線錯誤: " . $exception->getMessage());
            throw new Exception("資料庫連線失敗");
        }

        return $this->conn;
    }

    /**
     * 關閉資料庫連線
     */
    public function closeConnection() {
        $this->conn = null;
    }

    /**
     * 測試資料庫連線
     */
    public function testConnection() {
        try {
            $conn = $this->getConnection();
            if ($conn) {
                return ['success' => true, 'message' => '資料庫連線正常'];
            }
        } catch (Exception $e) {
            return ['success' => false, 'message' => $e->getMessage()];
        }
        return ['success' => false, 'message' => '未知錯誤'];
    }
}
?>
