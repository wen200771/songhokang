# 🧪 多角色同時登入測試指南

## 📋 測試階段 - 多會話支持

為了方便測試，系統現在支援在同一瀏覽器中同時登入不同角色的帳號，不會互相衝突。

### 🔑 Token 分離機制

每個角色使用不同的 localStorage key：

| 角色     | Token Key            | 頁面                |
| -------- | -------------------- | ------------------- |
| 一般會員 | `authToken_customer` | 前台 (index.html)   |
| 廠商     | `authToken_vendor`   | 廠商後台 (vendor/)  |
| 管理員   | `authToken_admin`    | 管理員後台 (admin/) |

### 🎯 測試步驟

1. **登入一般會員**

   - 前往：http://localhost:8000/
   - 點擊登入，選擇一般會員帳號
   - 成功後會留在前台頁面

2. **登入管理員**

   - 在同一瀏覽器新分頁前往：http://localhost:8000/admin/
   - 或在前台登入管理員帳號（會開新分頁）
   - 管理員登入不會影響前台的一般會員登入狀態

3. **登入廠商**
   - 在同一瀏覽器新分頁前往：http://localhost:8000/vendor/
   - 或在前台登入廠商帳號（會開新分頁）
   - 廠商登入不會影響其他角色的登入狀態

### ✅ 預期行為

- ✅ 一般會員可以在前台正常瀏覽和操作
- ✅ 管理員可以在後台管理用戶、優惠券、廠商
- ✅ 廠商可以在後台管理自己的優惠券
- ✅ 三個角色可以同時保持登入狀態
- ✅ 各自登出只會清除自己的 token，不影響其他角色

### 🔍 檢查方式

在瀏覽器開發者工具的 Application > Local Storage 中，應該可以看到：

```
authToken_customer: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
authToken_admin: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
authToken_vendor: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

### 🚨 注意事項

- 這是**測試階段**的特殊設定
- 正式環境可能需要調整為單一登入模式
- 如果遇到登入衝突，請清除瀏覽器的 localStorage 後重新測試

### 🛠️ 故障排除

如果仍然遇到登入衝突：

1. **清除所有 token**

   ```javascript
   // 在瀏覽器控制台執行
   localStorage.removeItem("authToken_customer");
   localStorage.removeItem("authToken_admin");
   localStorage.removeItem("authToken_vendor");
   localStorage.removeItem("authToken"); // 舊版本殘留
   ```

2. **重新整理所有分頁**

3. **重新登入各角色**

### 📞 技術支援

如果問題持續存在，請檢查：

- 瀏覽器控制台是否有錯誤訊息
- Network 面板中 API 請求的 Authorization header
- localStorage 中的 token 是否正確設定
