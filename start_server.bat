@echo off
echo 啟動送好康本地開發伺服器...
echo.
echo 請確保已完成以下設置:
echo 1. 安裝 PHP 7.4+
echo 2. 安裝 MySQL
echo 3. 創建資料庫並導入 database/create_tables.sql
echo 4. 修改 config/database.php 中的資料庫連接設定
echo.
echo 啟動中...
echo.

"C:\xampp\php\php.exe" -S localhost:8000

echo.
echo 伺服器已停止
pause
