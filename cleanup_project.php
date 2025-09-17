<?php
/**
 * 項目文件清理腳本
 * 清理測試文件、備份文件和臨時文件
 */

echo "🧹 開始清理項目文件...\n\n";

// 要刪除的測試文件
$testFiles = [
    'debug_info.php',
    'simple_test.html',
    'test_api.html',
    'test_api_routes.html',
    'test_db.php',
    'test_direct_api.php',
    'test_registration.html',
    'api/register_test.php',
    'api/test.php'
];

// 要刪除的備份文件
$backupFiles = [
    'admin/index_backup.html',
    'admin/index_new.html',
    'admin/index_old.html',
    'vendor/index_backup.html',
    'simple_index.html'
];

// 要清理的空目錄
$emptyDirs = [
    'api/logs',
    'logs',
    'scripts/logs',
    'scripts/uploads/avatars',
    'scripts/uploads/coupons',
    'scripts/uploads/logos'
];

$deletedCount = 0;
$totalSize = 0;

echo "📁 清理測試文件:\n";
foreach ($testFiles as $file) {
    if (file_exists($file)) {
        $size = filesize($file);
        $totalSize += $size;
        
        if (unlink($file)) {
            echo "  ✅ 已刪除: {$file} (" . formatBytes($size) . ")\n";
            $deletedCount++;
        } else {
            echo "  ❌ 刪除失敗: {$file}\n";
        }
    } else {
        echo "  ⚠️  文件不存在: {$file}\n";
    }
}

echo "\n📁 清理備份文件:\n";
foreach ($backupFiles as $file) {
    if (file_exists($file)) {
        $size = filesize($file);
        $totalSize += $size;
        
        if (unlink($file)) {
            echo "  ✅ 已刪除: {$file} (" . formatBytes($size) . ")\n";
            $deletedCount++;
        } else {
            echo "  ❌ 刪除失敗: {$file}\n";
        }
    } else {
        echo "  ⚠️  文件不存在: {$file}\n";
    }
}

echo "\n📁 清理空目錄:\n";
foreach ($emptyDirs as $dir) {
    if (is_dir($dir)) {
        $files = scandir($dir);
        $isEmpty = count($files) <= 2; // 只有 . 和 ..
        
        if ($isEmpty) {
            if (rmdir($dir)) {
                echo "  ✅ 已刪除空目錄: {$dir}\n";
            } else {
                echo "  ❌ 刪除目錄失敗: {$dir}\n";
            }
        } else {
            echo "  ⚠️  目錄不為空: {$dir}\n";
        }
    } else {
        echo "  ⚠️  目錄不存在: {$dir}\n";
    }
}

echo "\n🗂️ 整理上傳目錄:\n";
$uploadDirs = ['uploads/avatars', 'uploads/coupons', 'uploads/logos', 'api/uploads/avatars', 'api/uploads/coupons', 'api/uploads/logos'];
foreach ($uploadDirs as $dir) {
    if (!is_dir($dir)) {
        if (mkdir($dir, 0755, true)) {
            echo "  ✅ 已創建目錄: {$dir}\n";
        } else {
            echo "  ❌ 創建目錄失敗: {$dir}\n";
        }
    } else {
        echo "  ✅ 目錄已存在: {$dir}\n";
    }
}

echo "\n📊 清理統計:\n";
echo "  🗑️  已刪除文件: {$deletedCount} 個\n";
echo "  💾 釋放空間: " . formatBytes($totalSize) . "\n";

echo "\n✨ 清理完成！\n";
echo "\n📋 剩餘重要文件:\n";
echo "  🏠 前台頁面: index.html, profile.html, verify.html\n";
echo "  🛠️  管理後台: admin/index.html, admin/login.html\n";
echo "  🏪 廠商後台: vendor/index.html, vendor/login.html\n";
echo "  👤 用戶中心: user/index.html, user/login.html\n";
echo "  🔌 API 系統: api/index.php\n";
echo "  ⚙️  配置文件: config/config.php, config/database.php\n";
echo "  🗄️  資料庫: database/create_tables.sql\n";
echo "  📚 文檔: README.md, PROJECT_SUMMARY.md\n";

function formatBytes($size, $precision = 2) {
    $units = array('B', 'KB', 'MB', 'GB', 'TB');
    
    for ($i = 0; $size > 1024 && $i < count($units) - 1; $i++) {
        $size /= 1024;
    }
    
    return round($size, $precision) . ' ' . $units[$i];
}
?>
