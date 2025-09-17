<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>匯入優惠券</title>
    <style>
        body { font-family: 'Microsoft JhengHei'; padding: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .btn { background: #007cba; color: white; padding: 12px 24px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; }
        .btn:hover { background: #005a87; }
        .result { margin-top: 20px; padding: 15px; border-radius: 5px; }
        .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .info { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
        pre { background: #f8f9fa; padding: 15px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎫 優惠券素材匯入工具</h1>
        <p>將 50 張優惠券素材分配給已核准的廠商，並設置完整的活動資訊。</p>
        
        <div style="margin-bottom: 20px;">
            <button class="btn" onclick="clearCoupons()" style="background: #dc3545; margin-right: 10px;">清空現有優惠券</button>
            <button class="btn" onclick="importCoupons()">重新匯入優惠券</button>
        </div>
        
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <h4 style="margin: 0 0 10px 0; color: #856404;">📋 分配規則</h4>
            <ul style="margin: 0; color: #856404;">
                <li>每家廠商最多分配 <strong>5個優惠券</strong></li>
                <li>優惠券為廠商專屬，不會重疊使用</li>
                <li>總共分配 <strong>${廠商數量} × 5 = ${總優惠券數}</strong> 張優惠券</li>
                <li>使用前50張素材圖片進行分配</li>
            </ul>
        </div>
        
        <div id="result"></div>
    </div>

    <script>
        async function clearCoupons() {
            if (!confirm('確定要清空所有現有優惠券嗎？此操作無法復原！')) {
                return;
            }
            
            const resultDiv = document.getElementById('result');
            resultDiv.innerHTML = '<div class="info">正在清空優惠券資料，請稍候...</div>';
            
            try {
                const response = await fetch('clear_coupons.php');
                const data = await response.json();
                
                if (data.success) {
                    resultDiv.innerHTML = `
                        <div class="success">
                            <h3>✅ 清空成功！</h3>
                            <p>${data.message}</p>
                        </div>
                    `;
                } else {
                    resultDiv.innerHTML = `
                        <div class="error">
                            <h3>❌ 清空失敗</h3>
                            <p>${data.message}</p>
                        </div>
                    `;
                }
            } catch (error) {
                resultDiv.innerHTML = `
                    <div class="error">
                        <h3>❌ 網路錯誤</h3>
                        <p>無法連接到伺服器：${error.message}</p>
                    </div>
                `;
            }
        }

        async function importCoupons() {
            const resultDiv = document.getElementById('result');
            resultDiv.innerHTML = '<div class="info">正在匯入優惠券，請稍候...</div>';
            
            try {
                const response = await fetch('import_coupons.php');
                const data = await response.json();
                
                if (data.success) {
                    resultDiv.innerHTML = `
                        <div class="success">
                            <h3>✅ 匯入成功！</h3>
                            <p>${data.message}</p>
                            <p>已匯入 <strong>${data.data.inserted_count}</strong> 張優惠券</p>
                            <p>分配給 <strong>${data.data.vendors_count}</strong> 個廠商</p>
                        </div>
                    `;
                } else {
                    resultDiv.innerHTML = `
                        <div class="error">
                            <h3>❌ 匯入失敗</h3>
                            <p>${data.message}</p>
                            <pre>${data.error || ''}</pre>
                        </div>
                    `;
                }
            } catch (error) {
                resultDiv.innerHTML = `
                    <div class="error">
                        <h3>❌ 網路錯誤</h3>
                        <p>無法連接到伺服器：${error.message}</p>
                    </div>
                `;
            }
        }
    </script>
</body>
</html>
