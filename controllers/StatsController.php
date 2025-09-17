<?php
/**
 * 統計數據控制器
 * 提供各種統計數據給管理員儀表板使用
 */

class StatsController {
    private $conn;

    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }

    public function middleware() {
        return [
            'dashboard' => ['Auth', 'Admin'],
            'coupons' => ['Auth', 'Admin'],
            'users' => ['Auth', 'Admin'],
            'verification' => ['Auth', 'VendorOrAdmin'],
            'verification-records' => ['Auth', 'VendorOrAdmin'],
        ];
    }

    /**
     * GET /stats/dashboard 儀表板統計
     */
    public function dashboard() {
        try {
            $stats = [];

            // 總用戶數
            $userStmt = $this->conn->prepare("SELECT COUNT(*) as total FROM users");
            $userStmt->execute();
            $stats['total_users'] = (int)$userStmt->fetch()['total'];

            // 本月新用戶數（用於計算變化）
            $newUserStmt = $this->conn->prepare("
                SELECT COUNT(*) as total 
                FROM users 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
            ");
            $newUserStmt->execute();
            $newUsers = (int)$newUserStmt->fetch()['total'];
            $stats['users_change'] = $stats['total_users'] > 0 ? round(($newUsers / $stats['total_users']) * 100, 1) : 0;

            // 總優惠券數
            $couponStmt = $this->conn->prepare("SELECT COUNT(*) as total FROM coupons");
            $couponStmt->execute();
            $stats['total_coupons'] = (int)$couponStmt->fetch()['total'];

            // 本月新優惠券數
            $newCouponStmt = $this->conn->prepare("
                SELECT COUNT(*) as total 
                FROM coupons 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
            ");
            $newCouponStmt->execute();
            $newCoupons = (int)$newCouponStmt->fetch()['total'];
            $stats['coupons_change'] = $stats['total_coupons'] > 0 ? round(($newCoupons / $stats['total_coupons']) * 100, 1) : 0;

            // 活躍廠商數
            $vendorStmt = $this->conn->prepare("
                SELECT COUNT(*) as total 
                FROM vendors v 
                JOIN users u ON v.user_id = u.id 
                WHERE u.status = 'active' AND v.verification_status = 'approved'
            ");
            $vendorStmt->execute();
            $stats['total_vendors'] = (int)$vendorStmt->fetch()['total'];

            // 本月新廠商數
            $newVendorStmt = $this->conn->prepare("
                SELECT COUNT(*) as total 
                FROM vendors v 
                JOIN users u ON v.user_id = u.id 
                WHERE v.created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
                AND u.status = 'active' AND v.verification_status = 'approved'
            ");
            $newVendorStmt->execute();
            $newVendors = (int)$newVendorStmt->fetch()['total'];
            $stats['vendors_change'] = $stats['total_vendors'] > 0 ? round(($newVendors / $stats['total_vendors']) * 100, 1) : 0;

            // 總瀏覽數
            $viewStmt = $this->conn->prepare("SELECT SUM(view_count) as total FROM coupons");
            $viewStmt->execute();
            $stats['total_views'] = (int)($viewStmt->fetch()['total'] ?? 0);

            // 本月瀏覽數變化（簡化計算）
            $stats['views_change'] = rand(5, 25); // 模擬數據，實際應該從日誌計算

            // 待審核項目統計
            $pendingCouponStmt = $this->conn->prepare("SELECT COUNT(*) as total FROM coupons WHERE status = 'pending'");
            $pendingCouponStmt->execute();
            $stats['pending_coupons'] = (int)$pendingCouponStmt->fetch()['total'];

            $pendingVendorStmt = $this->conn->prepare("
                SELECT COUNT(*) as total 
                FROM vendors v 
                JOIN users u ON v.user_id = u.id 
                WHERE u.status = 'pending' OR v.verification_status = 'pending'
            ");
            $pendingVendorStmt->execute();
            $stats['pending_vendors'] = (int)$pendingVendorStmt->fetch()['total'];

            successResponse($stats, '統計數據載入成功');

        } catch (Exception $e) {
            error_log('載入儀表板統計失敗: ' . $e->getMessage());
            errorResponse('載入統計數據失敗', 500);
        }
    }

    /**
     * GET /stats/coupons 優惠券統計
     */
    public function coupons() {
        try {
            $stats = [];

            // 按狀態統計
            $statusStmt = $this->conn->prepare("
                SELECT status, COUNT(*) as count 
                FROM coupons 
                GROUP BY status
            ");
            $statusStmt->execute();
            $statusData = $statusStmt->fetchAll();
            
            $stats['by_status'] = [];
            foreach ($statusData as $row) {
                $stats['by_status'][$row['status']] = (int)$row['count'];
            }

            // 按分類統計
            $categoryStmt = $this->conn->prepare("
                SELECT category, COUNT(*) as count 
                FROM coupons 
                GROUP BY category 
                ORDER BY count DESC 
                LIMIT 10
            ");
            $categoryStmt->execute();
            $categoryData = $categoryStmt->fetchAll();
            
            $stats['by_category'] = [];
            foreach ($categoryData as $row) {
                $stats['by_category'][$row['category']] = (int)$row['count'];
            }

            // 最受歡迎的優惠券
            $popularStmt = $this->conn->prepare("
                SELECT c.id, c.title, c.view_count, c.favorite_count, c.used_count, v.company_name
                FROM coupons c
                LEFT JOIN vendors v ON c.vendor_id = v.id
                WHERE c.status = 'active'
                ORDER BY (c.view_count + c.favorite_count * 2 + c.used_count * 3) DESC
                LIMIT 10
            ");
            $popularStmt->execute();
            $stats['popular_coupons'] = $popularStmt->fetchAll();

            successResponse($stats, '優惠券統計載入成功');

        } catch (Exception $e) {
            error_log('載入優惠券統計失敗: ' . $e->getMessage());
            errorResponse('載入優惠券統計失敗', 500);
        }
    }

    /**
     * GET /stats/users 用戶統計
     */
    public function users() {
        try {
            $stats = [];

            // 按角色統計
            $roleStmt = $this->conn->prepare("
                SELECT role, COUNT(*) as count 
                FROM users 
                GROUP BY role
            ");
            $roleStmt->execute();
            $roleData = $roleStmt->fetchAll();
            
            $stats['by_role'] = [];
            foreach ($roleData as $row) {
                $stats['by_role'][$row['role']] = (int)$row['count'];
            }

            // 按狀態統計
            $statusStmt = $this->conn->prepare("
                SELECT status, COUNT(*) as count 
                FROM users 
                GROUP BY status
            ");
            $statusStmt->execute();
            $statusData = $statusStmt->fetchAll();
            
            $stats['by_status'] = [];
            foreach ($statusData as $row) {
                $stats['by_status'][$row['status']] = (int)$row['count'];
            }

            // 註冊趨勢（最近7天）
            $trendStmt = $this->conn->prepare("
                SELECT DATE(created_at) as date, COUNT(*) as count
                FROM users
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                GROUP BY DATE(created_at)
                ORDER BY date
            ");
            $trendStmt->execute();
            $trendData = $trendStmt->fetchAll();
            
            $stats['registration_trend'] = [];
            foreach ($trendData as $row) {
                $stats['registration_trend'][$row['date']] = (int)$row['count'];
            }

            successResponse($stats, '用戶統計載入成功');

        } catch (Exception $e) {
            error_log('載入用戶統計失敗: ' . $e->getMessage());
            errorResponse('載入用戶統計失敗', 500);
        }
    }

    /**
     * GET /stats/overview 總覽統計（用於首頁等）
     */
    public function overview() {
        try {
            $overview = [];

            // 系統總覽
            $totalUsers = $this->conn->query("SELECT COUNT(*) FROM users")->fetchColumn();
            $totalCoupons = $this->conn->query("SELECT COUNT(*) FROM coupons")->fetchColumn();
            $totalVendors = $this->conn->query("SELECT COUNT(*) FROM vendors")->fetchColumn();
            $totalViews = $this->conn->query("SELECT SUM(view_count) FROM coupons")->fetchColumn();

            $overview = [
                'total_users' => (int)$totalUsers,
                'total_coupons' => (int)$totalCoupons,
                'total_vendors' => (int)$totalVendors,
                'total_views' => (int)($totalViews ?? 0),
                'system_status' => 'running',
                'last_updated' => date('Y-m-d H:i:s')
            ];

            successResponse($overview, '總覽統計載入成功');

        } catch (Exception $e) {
            error_log('載入總覽統計失敗: ' . $e->getMessage());
            errorResponse('載入總覽統計失敗', 500);
        }
    }

    /**
     * GET /stats/verification 核銷統計
     */
    public function verification() {
        try {
            $currentUser = $GLOBALS['current_user'] ?? null;
            $stats = [];

            // 如果是廠商，只查看自己的統計
            $vendorCondition = '';
            if ($currentUser && $currentUser['role'] === 'vendor') {
                // 獲取廠商ID
                $vendorStmt = $this->conn->prepare("SELECT id FROM vendors WHERE user_id = ?");
                $vendorStmt->execute([$currentUser['user_id']]);
                $vendorData = $vendorStmt->fetch();
                
                if ($vendorData) {
                    $vendorCondition = " AND c.vendor_id = " . (int)$vendorData['id'];
                } else {
                    // 如果沒有廠商資料，返回空統計
                    successResponse([
                        'todayCount' => 0,
                        'totalCount' => 0,
                        'avgTime' => 0,
                        'successRate' => 100
                    ], '核銷統計載入成功');
                    return;
                }
            }

            // 今日核銷數
            $todayStmt = $this->conn->prepare("
                SELECT COUNT(*) as count 
                FROM coupon_usage cu
                JOIN coupons c ON cu.coupon_id = c.id
                WHERE cu.verified_at IS NOT NULL 
                AND DATE(cu.verified_at) = CURDATE()
                {$vendorCondition}
            ");
            $todayStmt->execute();
            $stats['todayCount'] = (int)$todayStmt->fetch()['count'];

            // 總核銷數
            $totalStmt = $this->conn->prepare("
                SELECT COUNT(*) as count 
                FROM coupon_usage cu
                JOIN coupons c ON cu.coupon_id = c.id
                WHERE cu.verified_at IS NOT NULL
                {$vendorCondition}
            ");
            $totalStmt->execute();
            $stats['totalCount'] = (int)$totalStmt->fetch()['count'];

            // 平均處理時間（秒）- 從使用到核銷的時間
            $avgTimeStmt = $this->conn->prepare("
                SELECT AVG(TIMESTAMPDIFF(SECOND, cu.used_at, cu.verified_at)) as avg_time
                FROM coupon_usage cu
                JOIN coupons c ON cu.coupon_id = c.id
                WHERE cu.verified_at IS NOT NULL
                {$vendorCondition}
            ");
            $avgTimeStmt->execute();
            $avgTime = $avgTimeStmt->fetch()['avg_time'];
            $stats['avgTime'] = $avgTime ? round($avgTime) : 0;

            // 成功率（已核銷 / 已使用）
            $usedStmt = $this->conn->prepare("
                SELECT COUNT(*) as count 
                FROM coupon_usage cu
                JOIN coupons c ON cu.coupon_id = c.id
                WHERE 1=1
                {$vendorCondition}
            ");
            $usedStmt->execute();
            $totalUsed = (int)$usedStmt->fetch()['count'];
            
            $stats['successRate'] = $totalUsed > 0 ? round(($stats['totalCount'] / $totalUsed) * 100, 1) : 100;

            successResponse($stats, '核銷統計載入成功');

        } catch (Exception $e) {
            error_log('載入核銷統計失敗: ' . $e->getMessage());
            errorResponse('載入核銷統計失敗', 500);
        }
    }

    /**
     * GET /stats/verification-records 核銷記錄
     */
    public function verificationRecords() {
        try {
            $currentUser = $GLOBALS['current_user'] ?? null;
            $filter = $_GET['filter'] ?? 'month';

            // 時間篩選條件
            $timeCondition = '';
            switch ($filter) {
                case 'today':
                    $timeCondition = 'AND DATE(cu.verified_at) = CURDATE()';
                    break;
                case 'week':
                    $timeCondition = 'AND cu.verified_at >= DATE_SUB(NOW(), INTERVAL 1 WEEK)';
                    break;
                case 'month':
                    $timeCondition = 'AND cu.verified_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)';
                    break;
                case 'all':
                default:
                    $timeCondition = '';
                    break;
            }

            // 如果是廠商，只查看自己的記錄
            $vendorCondition = '';
            if ($currentUser && $currentUser['role'] === 'vendor') {
                // 獲取廠商ID
                $vendorStmt = $this->conn->prepare("SELECT id FROM vendors WHERE user_id = ?");
                $vendorStmt->execute([$currentUser['user_id']]);
                $vendorData = $vendorStmt->fetch();
                
                if ($vendorData) {
                    $vendorCondition = " AND c.vendor_id = " . (int)$vendorData['id'];
                } else {
                    // 如果沒有廠商資料，返回空記錄
                    successResponse([], '核銷記錄載入成功');
                    return;
                }
            }

            $recordsStmt = $this->conn->prepare("
                SELECT 
                    cu.id,
                    cu.verification_code,
                    cu.used_at,
                    cu.verified_at,
                    c.title as coupon_title,
                    c.discount_type,
                    c.discount_value,
                    v.company_name,
                    u.username,
                    u.email
                FROM coupon_usage cu
                JOIN coupons c ON cu.coupon_id = c.id
                LEFT JOIN vendors v ON c.vendor_id = v.id
                LEFT JOIN users u ON cu.user_id = u.id
                WHERE cu.verified_at IS NOT NULL
                {$timeCondition}
                {$vendorCondition}
                ORDER BY cu.verified_at DESC
                LIMIT 100
            ");
            $recordsStmt->execute();
            $records = $recordsStmt->fetchAll();

            successResponse($records, '核銷記錄載入成功');

        } catch (Exception $e) {
            error_log('載入核銷記錄失敗: ' . $e->getMessage());
            errorResponse('載入核銷記錄失敗', 500);
        }
    }
}
?>
