# 測試矩陣（高層）

> 目的：列出關鍵頁面 × 功能 × 角色 × 裝置/瀏覽器 × 邊界情境，作為 E2E 與 API 測試腳本對照表。

## 維度

-   角色：前台使用者、廠商（vendor）、管理員（admin）
-   裝置/瀏覽器：Desktop/Tablet/Mobile × Chrome/Firefox/Edge/Safari iOS
-   網路/環境：良好/慢速/離線、逾時/重試、Token 過期

## 頁面 × 功能

-   前台
    -   首頁/列表：分頁/篩選/排序/搜尋、卡片/燈箱、收藏/歷史
    -   詳情：圖片瀏覽、規則/描述顯示一致、燈箱 ESC/遮罩
    -   會員：登入/註冊/登出、個資修改、密碼變更
-   廠商後台（vendor）
    -   儀表板：統計一致（列表/總覽）、最近優惠券表格
    -   優惠券管理：CRUD、批量（分類/刪除，狀態僅 admin）、上傳、搜尋/篩選/排序/分頁、CSV 導出
    -   核銷管理：驗證碼成功/失敗/重複核銷、記錄/統計更新
-   管理員後台（admin）
    -   各模組導覽、用戶/廠商/優惠券審核、內容/安全/通知/外觀/系統

## API 契約/錯誤碼

-   通用：2xx/4xx/5xx、錯誤格式一致、CORS/Preflight、Rate limit
-   Auth：/auth/login /auth/me /auth/logout、Token 過期/無 Token
-   Coupons：GET/POST/PUT/DELETE、/status、/verify、關聯 tags/regions、進階查詢
-   Stats：/stats/verification /stats/verification-records、儀表板總數

## 安全/資料一致性

-   XSS/CSRF/SQLi/IDOR、檔案上傳惡意內容
-   表單雙擊/重送、交易完整性、唯一/外鍵約束、併發與冪等

## A11y/效能

-   鍵盤可用、焦點管理、ARIA/對比度
-   Lighthouse（LCP/CLS/INP）、圖片 lazy、快取、N+1/索引

---

此矩陣會對應到 tests/\*.spec.js 腳本與報告，並持續補齊邊界案例。
