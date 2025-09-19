# 整合測試：登入→發券→收藏→使用→核銷
param(
  [string]$BaseUrl = "http://localhost:8000",
  [string]$AdminUser = "admin",
  [string]$AdminPass = "admin123"
)

$ErrorActionPreference = 'Stop'

function Invoke-Api($Method, $Path, $Body = $null, $Token = $null) {
  $uri = "$BaseUrl/api$Path"
  $headers = @{ 'Content-Type' = 'application/json' }
  if ($Token) { $headers['Authorization'] = "Bearer $Token" }
  if ($Body -is [string]) { $json = $Body } elseif ($Body) { $json = ($Body | ConvertTo-Json -Depth 8) } else { $json = $null }
  if ($json) {
    return Invoke-RestMethod -Method $Method -Uri $uri -Headers $headers -Body $json
  } else {
    return Invoke-RestMethod -Method $Method -Uri $uri -Headers $headers
  }
}

Write-Host "[1/6] 管理員登入..."
$login = Invoke-Api POST "/auth/login" @{ username = $AdminUser; password = $AdminPass }
$adminToken = $login.data.token

Write-Host "[2/6] 以管理員切換到測試用戶(如不存在將先註冊)..."
# 嘗試註冊測試用戶
try {
  $reg = Invoke-Api POST "/auth/register" @{ username = "itest_user"; email = "itest_user@example.com"; password = "p@ssw0rd" }
} catch {}

# 查詢當前登入管理員資訊
$me = Invoke-Api GET "/auth/me" $null $adminToken

# 切換到測試用戶（假設 ID=2；若不確定，可在你的環境替換為實際 ID）
try {
  $switch = Invoke-Api POST "/auth/switch-account" @{ user_id = 2 } $adminToken
  $userToken = $switch.data.token
} catch {
  throw "切換測試用戶失敗，請確認 user_id。可改腳本內 user_id。"
}

Write-Host "[3/6] 新增優惠券 (以 vendor/admin 身份才可)..."
# 若測試用戶非廠商，改用管理員操作 vendor 發券流程（此處示意用 GET/POST 表單簡化）
# 這裡示範最小流程：略過圖片，上傳僅測邏輯
try {
  $couponCreate = Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/coupons" -Headers @{ Authorization = "Bearer $adminToken" } -Form @{ \
    title = "整合測試券"; \
    category = "測試"; \
    description = "自動化測試"; \
    discount_type = "percentage"; \
    discount_value = 10 \
  }
} catch {
  Write-Host "以管理員直接發券可能被權限限制，請於 vendor 帳號測試發券。嘗試繼續後續流程。" -ForegroundColor Yellow
}

Write-Host "[4/6] 收藏一張優惠券..."
# 先取得列表，取第一張
$couponList = Invoke-Api GET "/coupons" $null $userToken
$couponId = $couponList.data.items[0].id
$addFav = Invoke-Api POST "/favorites" @{ coupon_id = $couponId } $userToken

Write-Host "[5/6] 使用優惠券，取得核銷碼..."
$use = Invoke-Api POST "/coupons/$couponId/use" $null $userToken
$verificationCode = $use.data.verification_code

Write-Host "[6/6] 店家核銷..."
$verify = Invoke-Api POST "/coupons/verify" @{ verification_code = $verificationCode }

Write-Host "完成。結果摘要："
[PSCustomObject]@{
  request_id_login = $login.request_id
  coupon_id        = $couponId
  verification_code= $verificationCode
  verify_message   = $verify.data.message
} | Format-List
