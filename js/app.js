        // 搜尋紀錄管理
        let searchHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');

        function saveSearchHistory(query) {
            if (!query.trim()) return;

            // 移除重複項目
            searchHistory = searchHistory.filter(item => item !== query);
            // 添加到開頭
            searchHistory.unshift(query);
            // 限制最多保存10筆紀錄
            searchHistory = searchHistory.slice(0, 10);

            localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
            renderSearchHistory();
        }

        function removeSearchHistory(query) {
            searchHistory = searchHistory.filter(item => item !== query);
            localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
            renderSearchHistory();
        }

        function renderSearchHistory() {
            const historyContainer = document.getElementById('searchHistory');
            const historySection = document.getElementById('searchHistorySection');

            if (searchHistory.length === 0) {
                historySection.style.display = 'none';
                return;
            }

            historySection.style.display = 'block';
            historyContainer.innerHTML = '';

            searchHistory.forEach(query => {
                const historyItem = document.createElement('div');
                historyItem.className = 'search-history-item';
                historyItem.innerHTML = `
                    <div class="search-history-content" onclick="selectSearchHistory('${query}')">
                        <span class="search-history-icon">🕒</span>
                        <span class="search-history-text">${query}</span>
                    </div>
                    <div class="search-history-delete" onclick="event.stopPropagation(); removeSearchHistory('${query}')" title="刪除">
                        ×
                    </div>
                `;
                historyContainer.appendChild(historyItem);
            });
        }

        function selectSearchHistory(query) {
            const searchInput = document.getElementById('searchInput');
            searchInput.value = query;
            saveSearchHistory(query);
            performSearch();
            closeSearchDropdown();
        }

        // 選中的標籤陣列
        let selectedTags = [];
        let currentCoupon = null;
        let currentView = 'home';

        // 本地儲存鍵名
        // 前台使用獨立的 token key，避免與管理員後台衝突
        const LS_TOKEN = 'authToken_customer';
        const LS_USER = 'authUser';
        // 額外為測試階段提供三個角色專屬 token，允許同裝置同時登入
        const ROLE_TOKENS = {
            admin: 'authToken_admin',
            vendor: 'authToken_vendor',
            customer: 'authToken_customer'
        };
        const LS_FAVORITES = 'favorites';
        const LS_HISTORY = 'viewHistory';

        // 視圖狀態與判斷
        function setView(mode) {
            currentView = mode === 'favorites' ? 'favorites' : 'home';
            const url = new URL(location.href);
            if (currentView === 'favorites') url.searchParams.set('view', 'favorites');
            else url.searchParams.delete('view');
            history.replaceState({}, '', url);
            document.body.classList.toggle('view-favorites', currentView === 'favorites');
        }
        function isFavoritesView() {
            return currentView === 'favorites' || document.body.classList.contains('view-favorites');
        }

        // Auth helpers
        const getToken = () => localStorage.getItem(LS_TOKEN) || '';
        const getUser = () => { try { return JSON.parse(localStorage.getItem(LS_USER) || 'null'); } catch { return null; } };
        function setAuth(token, user) { localStorage.setItem(LS_TOKEN, token); localStorage.setItem(LS_USER, JSON.stringify(user || {})); updateLoginUI(); }
        function clearAuth() { localStorage.removeItem(LS_TOKEN); localStorage.removeItem(LS_USER); updateLoginUI(); }
        function isLoggedIn() { return !!getToken(); }

        // 優惠券資料（將由 API 填充；若 API 無資料則使用本地假資料）
        let coupons = [];
        let currentUser = null;

        // 生成假資料（作為 API 無資料時的後備）
        function buildDummyCoupons() {
            coupons = [];
            const categories = ['美食餐飲', '購物商城', '美容保養', '休閒娛樂', '旅遊住宿', '健康醫療'];
            const storeTypes = {
                '美食餐飲': ['餐廳', '咖啡廳', '小吃店', '火鍋店', '燒烤店'],
                '購物商城': ['服飾店', '3C賣場', '書店', '超市', '百貨'],
                '美容保養': ['美髮沙龍', '美甲店', 'SPA會館', '美容院', '按摩店'],
                '休閒娛樂': ['KTV', '電影院', '遊戲場', '網咖', '保齡球館'],
                '旅遊住宿': ['飯店', '民宿', '旅行社', '租車行', '景點'],
                '健康醫療': ['診所', '藥局', '健身房', '瑜珈教室', '物理治療']
            };
            for (let i = 1; i <= 50; i++) {
                const category = categories[Math.floor(Math.random() * categories.length)];
                const storeType = storeTypes[category][Math.floor(Math.random() * storeTypes[category].length)];

                coupons.push({
                    id: i,
                    image: `img/送好康文宣素材 (${i}).jpg`,
                    storeName: `${storeType}${i}`,
                    category: category,
                    title: `限時優惠活動 ${i}`,
                    description: `這是第${i}個優惠券的詳細說明，包含各種使用條件和限制。`,
                    expiry: '2024/12/31',
                    usage: '每人限用一次',
                    address: `台北市信義區信義路五段${i}號`,
                    phone: `02-2${String(i).padStart(3, '0')}-${String(i * 10).padStart(4, '0')}`
                });
            }
        }

        // 從 API 載入資料
        async function loadCouponsFromApi() {
            try {
                const res = await fetch('api/coupons?page=1&pageSize=50');
                const json = await res.json();
                const items = json?.data?.coupons || [];
                if (Array.isArray(items) && items.length > 0) {
                    coupons = items.map((item, idx) => ({
                        id: item.id || idx + 1,
                        image: item.image && item.image.trim() !== '' ? item.image : `img/送好康文宣素材 (${(idx % 50) + 1}).jpg`,
                        storeName: item.storeName || '合作店家',
                        category: item.category || '一般優惠',
                        title: item.title || '優惠活動',
                        description: item.description || '詳情請見活動說明。',
                        expiry: item.expiry || '',
                        usage: item.usage || '每人限用一次',
                        address: item.address || '',
                        phone: item.phone || ''
                    }));
                    renderCoupons(coupons);
                } else {
                    buildDummyCoupons();
                    renderCoupons(coupons);
                }
            } catch (e) {
                buildDummyCoupons();
                renderCoupons(coupons);
            }
        }

        // 從 API 載入分類並渲染到搜尋下拉與進階篩選
        async function loadCategories() {
            try {
                const res = await fetch('api/categories?active=1');
                const json = await res.json();
                const items = Array.isArray(json?.data) ? json.data : json?.data?.items || [];
                const categories = items.length > 0 ? items : [
                    { name: '美食餐飲', icon: '🍽️' },
                    { name: '購物商城', icon: '🛍️' },
                    { name: '美容保養', icon: '💄' },
                    { name: '休閒娛樂', icon: '🎮' },
                    { name: '旅遊住宿', icon: '✈️' },
                    { name: '健康醫療', icon: '🏥' }
                ];

                // 搜尋下拉：分類瀏覽 chips
                const grid = document.getElementById('searchCategoryGrid');
                if (grid) {
                    grid.innerHTML = categories.map(cat => `
                        <div class="category-chip" data-category="${cat.slug || cat.name}">
                            <span class="category-chip-icon">${cat.icon || ''}</span>
                            <span class="category-chip-text">${cat.name}</span>
                        </div>
                    `).join('');

                    // 綁定點擊事件
                    grid.querySelectorAll('.category-chip').forEach(item => {
                        item.addEventListener('click', () => {
                            const categoryText = item.querySelector('.category-chip-text').textContent;
                            const isSelected = selectedTags.some(tag => tag.text === categoryText);
                            if (isSelected) { removeTag(categoryText); }
                            else { addTag(categoryText, 'category'); saveSearchHistory(categoryText); }
                            updateDropdownSelection();
                        });
                    });
                }

                // 進階篩選：checkbox 列表
                const filters = document.getElementById('categoryFilters');
                if (filters) {
                    filters.innerHTML = categories.map(cat => `
                        <label class="filter-checkbox">
                            <input type="checkbox" value="${cat.name}"> ${cat.name}
                        </label>
                    `).join('');
                }
            } catch (e) {
                // 靜默失敗即可，仍可用預設假資料
            }
        }

        // 渲染優惠券卡片 - Pinterest 風格
        function renderCoupons(couponsToRender = coupons) {
            const container = document.getElementById('masonryContainer');
            container.classList.remove('empty');
            container.innerHTML = '';

            // 如果是收藏視圖，只顯示收藏的優惠券
            if (isFavoritesView()) {
                const favoriteIds = new Set(getFavorites());
                couponsToRender = couponsToRender.filter(coupon => favoriteIds.has(coupon.id));

                // 如果沒有收藏的優惠券，顯示空狀態
                if (couponsToRender.length === 0) {
                    renderEmptyFavorites();
                    return;
                }
            }

            couponsToRender.forEach((coupon, index) => {
                const card = document.createElement('div');
                card.className = 'coupon-card';
                card.setAttribute('data-id', String(coupon.id));
                card.addEventListener('click', (ev) => {
                    const t = ev.target;
                    if (t.closest('[data-action="quick-fav"]') || t.closest('[data-action="remove-fav"]')) {
                        // 點擊愛心或移除收藏不開啟詳情
                        return;
                    }
                    openModal(coupon);
                });

                // 添加載入動畫
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';

                const webp = coupon.image.replace(/\.jpg$/i, '.webp');
                const favIdsSet = new Set(getFavorites());
                const isFav = favIdsSet.has(coupon.id);
                card.innerHTML = `
                    <picture>
                        <source srcset="${webp}" type="image/webp">
                        <img src="${coupon.image}" alt="${coupon.title}" class="coupon-image" loading="lazy" decoding="async" width="800" height="1200">
                    </picture>
                    <button class="fav-btn ${isFav ? 'active' : ''}" data-action="quick-fav" data-id="${coupon.id}">${isFav ? '❤' : '♡'}</button>
                    <div class="coupon-overlay">
                        <button class="view-btn">查看優惠</button>
                    </div>
                `;

                container.appendChild(card);

                // 延遲顯示動畫
                setTimeout(() => {
                    card.style.transition = 'all 0.4s ease';
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, index * 50);
            });
        }

        // 我的收藏為空時的畫面
        function renderEmptyFavorites() {
            const container = document.getElementById('masonryContainer');
            container.classList.add('empty');
            container.innerHTML = `
                <div style="display:flex;align-items:center;justify-content:center;width:100%;min-height:40vh;">
                    <div style="max-width:640px;width:90%;background:rgba(248,247,246,0.85);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(252,163,17,0.2);border-radius:24px;padding:32px;box-shadow:0 12px 40px rgba(252,163,17,0.15), inset 0 1px 0 rgba(255,255,255,0.9);text-align:center;">
                        <div style="font-size:20px;color:#333;font-weight:700;margin-bottom:8px;">目前沒有收藏</div>
                        <div style="font-size:14px;color:#666;margin-bottom:18px;">可以在卡片右上角點 <span style=\"color:#e60023\">❤</span> 加入收藏</div>
                        <button class="btn-primary" id="backToHomeBtn">回到首頁</button>
                    </div>
                </div>`;
            const btn = document.getElementById('backToHomeBtn');
            if (btn) btn.addEventListener('click', () => { resetToHomepage(); });
        }

        // 瀏覽記錄為空時的畫面
        function renderEmptyHistory() {
            const container = document.getElementById('masonryContainer');
            container.classList.add('empty');
            container.innerHTML = `
                <div style="display:flex;align-items:center;justify-content:center;width:100%;min-height:40vh;">
                    <div style="max-width:640px;width:90%;background:rgba(248,247,246,0.85);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(252,163,17,0.2);border-radius:24px;padding:32px;box-shadow:0 12px 40px rgba(252,163,17,0.15), inset 0 1px 0 rgba(255,255,255,0.9);text-align:center;">
                        <div style="font-size:20px;color:#333;font-weight:700;margin-bottom:8px;">目前沒有瀏覽記錄</div>
                        <div style="font-size:14px;color:#666;margin-bottom:18px;">點擊優惠券卡片查看詳情後會自動記錄</div>
                        <button class="btn-primary" id="backToHomeFromHistory">回到首頁</button>
                    </div>
                </div>`;
            const btn = document.getElementById('backToHomeFromHistory');
            if (btn) btn.addEventListener('click', () => { resetToHomepage(); });
        }

        // 添加瀏覽記錄清除按鈕
        function addHistoryClearButton() {
            // 移除已存在的按鈕
            const existingButton = document.getElementById('historyClearButton');
            if (existingButton) {
                existingButton.remove();
            }

            // 創建清除按鈕
            const clearButton = document.createElement('div');
            clearButton.id = 'historyClearButton';
            clearButton.style.cssText = `
                position: fixed;
                top: 120px;
                right: 24px;
                z-index: 1000;
                background: rgba(220, 38, 38, 0.9);
                backdrop-filter: blur(10px);
                color: white;
                border: none;
                padding: 12px 20px;
                border-radius: 12px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 600;
                box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 8px;
            `;

            clearButton.innerHTML = `
                <span>🗑️</span>
                <span>清除所有記錄</span>
            `;

            // 添加hover效果
            clearButton.addEventListener('mouseenter', () => {
                clearButton.style.background = 'rgba(220, 38, 38, 1)';
                clearButton.style.transform = 'translateY(-2px)';
                clearButton.style.boxShadow = '0 6px 20px rgba(220, 38, 38, 0.4)';
            });

            clearButton.addEventListener('mouseleave', () => {
                clearButton.style.background = 'rgba(220, 38, 38, 0.9)';
                clearButton.style.transform = 'translateY(0)';
                clearButton.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.3)';
            });

            // 添加點擊事件
            clearButton.addEventListener('click', () => {
                if (confirm('確定要清除所有瀏覽記錄嗎？此操作無法復原。')) {
                    clearAllHistory();
                }
            });

            document.body.appendChild(clearButton);
        }

        // 清除所有瀏覽記錄
        function clearAllHistory() {
            historyData = [];
            localStorage.removeItem('viewHistory');
            updateSidebarCounts();

            // 移除清除按鈕
            removeHistoryClearButton();

            // 顯示空狀態
            renderEmptyHistory();
            showSuccessMessage('所有瀏覽記錄已清除');
        }

        // 移除瀏覽記錄清除按鈕
        function removeHistoryClearButton() {
            const clearButton = document.getElementById('historyClearButton');
            if (clearButton) {
                clearButton.remove();
            }
        }

        // 開啟彈窗
        async function openModal(coupon) {
            try {
                // 添加到瀏覽記錄
                addToHistory(coupon);

                // 先顯示基本資訊
                const webp = coupon.image.replace(/\.jpg$/i, '.webp');
                document.getElementById('modalSourceWebp').srcset = webp;
                const modalImg = document.getElementById('modalImage');
                modalImg.src = coupon.image;
                currentCoupon = coupon;
                document.getElementById('storeName').textContent = coupon.storeName;
                document.getElementById('storeCategory').textContent = coupon.category;
                document.getElementById('offerTitle').textContent = coupon.title;
                document.getElementById('offerDescription').textContent = coupon.description;
                document.getElementById('offerExpiry').textContent = coupon.expiry;
                document.getElementById('offerUsage').textContent = coupon.usage;
                document.getElementById('storeAddress').textContent = coupon.address;
                document.getElementById('storePhone').textContent = coupon.phone;

                // 從API獲取更詳細的資訊
                const res = await fetch(`api/coupons/${coupon.id}`);
                if (res.ok) {
                    const data = await res.json();
                    const detailedCoupon = data.data || data;

                    // 更新詳細資訊
                    if (detailedCoupon.terms) {
                        document.getElementById('offerDescription').textContent = detailedCoupon.terms;
                    }
                    if (detailedCoupon.discount_type && detailedCoupon.discount_value) {
                        const discountText = getDiscountText(detailedCoupon.discount_type, detailedCoupon.discount_value);
                        document.getElementById('offerUsage').textContent = discountText;
                    }

                    // 更新瀏覽數（如果有的話）
                    if (detailedCoupon.view_count !== undefined) {
                        incrementViewCount(coupon.id);
                    }
                }
            } catch (e) {
                console.warn('無法載入詳細優惠券資訊:', e);
            }

            // 同步彈窗收藏按鈕文字
            syncModalFavoriteButton();

            document.getElementById('modalOverlay').classList.add('active');
            document.body.style.overflow = 'hidden';

            // 綁定燈箱開啟
            modalImg.onclick = () => openLightbox(modalImg.currentSrc || modalImg.src);
            // 記錄瀏覽歷史
            addHistory(coupon.id);
        }

        // 輔助函數：格式化折扣文字
        function getDiscountText(type, value) {
            switch (type) {
                case 'percentage': return `${value}% 折扣`;
                case 'fixed': return `折扣 NT$${value}`;
                case 'bogo': return '買一送一';
                case 'free': return '免費體驗';
                default: return '每人限用一次';
            }
        }

        // 增加瀏覽數（靜默更新）
        async function incrementViewCount(couponId) {
            try {
                await fetch(`api/coupons/${couponId}/view`, { method: 'POST' });
            } catch (e) {
                // 靜默失敗
            }
        }

        function syncModalFavoriteButton() {
            const favs = new Set(getFavorites());
            const isFav = currentCoupon ? favs.has(currentCoupon.id) : false;
            const btn = document.querySelector('#modalOverlay .btn-secondary');
            if (btn) {
                btn.textContent = isFav ? '取消收藏' : '收藏優惠';
            }
        }

        function toggleFavoriteFromModal() {
            if (currentCoupon) {
                toggleFavorite(currentCoupon);
                syncModalFavoriteButton();
            }
        }

        // 優惠券使用功能
        async function useCoupon(coupon) {
            if (!coupon) return;

            if (!isLoggedIn()) {
                showSuccessMessage('請先登入才能使用優惠券');
                closeModal();
                // 可以開啟登入視窗
                return;
            }

            // 檢查是否已經使用過
            const usedCoupons = getUsedCoupons();
            if (usedCoupons.includes(coupon.id)) {
                showSuccessMessage('您已經使用過這張優惠券了');
                return;
            }

            // 確認使用優惠券
            const confirmModal = document.createElement('div');
            confirmModal.className = 'modal-overlay';
            confirmModal.style.cssText = 'display: flex; z-index: 10001;';

            confirmModal.innerHTML = `
                <div class="modal-content" style="max-width: 400px;">
                    <div style="padding: 28px; text-align: center;">
                        <h3 style="margin-bottom: 16px; color: #374151;">🎫 使用優惠券</h3>
                        <p style="margin-bottom: 20px; color: #6b7280;">
                            確定要使用「${coupon.title}」嗎？<br>
                            使用後將無法再次使用此優惠券。
                        </p>
                        <div style="display: flex; gap: 12px;">
                            <button onclick="cancelUseCoupon()" class="btn-secondary" style="flex: 1;">取消</button>
                            <button onclick="confirmUseCoupon(${coupon.id})" class="btn-primary" style="flex: 1;">確認使用</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(confirmModal);
            document.body.style.overflow = 'hidden';

            // 添加點擊背景關閉功能
            addClickOutsideToClose(confirmModal, cancelUseCoupon);
        }

        function cancelUseCoupon() {
            const modal = document.querySelector('.modal-overlay:last-child');
            if (modal) {
                modal.remove();
                document.body.style.overflow = 'auto';
            }
        }

        async function confirmUseCoupon(couponId) {
            try {
                // 調用API記錄使用
                const response = await fetch(`api/coupons/${couponId}/use`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${getToken()}`
                    }
                });

                if (response.ok) {
                    const result = await response.json();

                    // 記錄到本地存儲
                    const usedCoupons = getUsedCoupons();
                    usedCoupons.push(couponId);
                    setUsedCoupons(usedCoupons);

                    // 關閉所有彈窗
                    cancelUseCoupon();
                    closeModal();

                    // 顯示成功訊息
                    showSuccessMessage('🎉 優惠券使用成功！請向店家出示此憑證');

                    // 生成使用憑證（包含QR Code）
                    generateUsageProof(currentCoupon, result);
                } else {
                    throw new Error('使用優惠券失敗');
                }
            } catch (e) {
                console.error('使用優惠券失敗:', e);
                showSuccessMessage('使用失敗：' + e.message);
            }
        }

        function generateUsageProof(coupon, usageResult = {}) {
            const proofModal = document.createElement('div');
            proofModal.className = 'modal-overlay';
            proofModal.style.cssText = 'display: flex; z-index: 10002; background: rgba(0,0,0,0.8);';

            const verificationCode = usageResult.verification_code || `SHK-${coupon.id}-${Date.now().toString().slice(-6)}`;
            const qrCodeUrl = usageResult.qr_code_url || '';
            const expiresAt = usageResult.expires_at || '';

            proofModal.innerHTML = `
                <div class="modal-content" style="max-width: 450px; background: linear-gradient(135deg, #FCA311, #F79009); color: white; border: none;">
                    <button onclick="closeUsageProof()" style="position: absolute; top: 10px; right: 15px; background: none; border: none; color: white; font-size: 24px; cursor: pointer;">×</button>
                    <div style="padding: 40px 28px; text-align: center;">
                        <div style="font-size: 48px; margin-bottom: 16px;">🎫</div>
                        <h3 style="margin-bottom: 12px;">優惠券使用憑證</h3>
                        
                        <div style="background: rgba(255,255,255,0.2); padding: 16px; border-radius: 12px; margin-bottom: 16px;">
                            <div style="font-size: 18px; font-weight: 700; margin-bottom: 8px;">${coupon.title}</div>
                            <div style="font-size: 14px; opacity: 0.9;">${coupon.storeName || coupon.vendor_name || '店家名稱'}</div>
                        </div>
                        
                        ${qrCodeUrl ? `
                        <div style="background: white; padding: 16px; border-radius: 12px; margin-bottom: 16px;">
                            <img src="${qrCodeUrl}" alt="QR Code" style="width: 200px; height: 200px; display: block; margin: 0 auto;">
                            <div style="font-size: 12px; color: #666; margin-top: 8px;">請向店家出示此QR Code</div>
                        </div>
                        ` : ''}
                        
                        <div style="background: rgba(255,255,255,0.2); padding: 12px; border-radius: 8px; margin-bottom: 16px;">
                            <div style="font-size: 12px; opacity: 0.8; margin-bottom: 4px;">驗證碼</div>
                            <div style="font-size: 18px; font-weight: 700; letter-spacing: 1px;">${verificationCode}</div>
                        </div>
                        
                        ${expiresAt ? `
                        <div style="font-size: 12px; opacity: 0.8; margin-bottom: 16px;">
                            憑證有效期至：${new Date(expiresAt).toLocaleString('zh-TW')}
                        </div>
                        ` : ''}
                        <div style="font-size: 12px; opacity: 0.8;">
                            使用時間：${now.toLocaleString('zh-TW')}<br>
                            請向店家出示此憑證
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(proofModal);

            // 添加點擊背景關閉功能
            addClickOutsideToClose(proofModal, closeUsageProof);
        }

        function closeUsageProof() {
            const modal = document.querySelector('.modal-overlay:last-child');
            if (modal) {
                modal.remove();
                document.body.style.overflow = 'auto';
            }
        }

        // 使用記錄管理
        function getUsedCoupons() {
            try {
                return JSON.parse(localStorage.getItem('usedCoupons') || '[]');
            } catch {
                return [];
            }
        }

        function setUsedCoupons(list) {
            localStorage.setItem('usedCoupons', JSON.stringify(list));
        }

        // 關閉彈窗
        function closeModal() {
            document.getElementById('modalOverlay').classList.remove('active');
            document.body.style.overflow = 'auto';
        }

        // 燈箱功能
        function openLightbox(src) {
            const overlay = document.getElementById('lightboxOverlay');
            const img = document.getElementById('lightboxImage');
            img.src = src;
            overlay.style.display = 'flex';
        }
        function closeLightbox() {
            const overlay = document.getElementById('lightboxOverlay');
            overlay.style.display = 'none';
        }

        // 收藏與歷史（本地）
        function getFavorites() { try { return JSON.parse(localStorage.getItem(LS_FAVORITES) || '[]'); } catch { return []; } }
        function setFavorites(list) { localStorage.setItem(LS_FAVORITES, JSON.stringify(list)); }
        function isFav(id) { return getFavorites().includes(id); }
        async function toggleFavorite(coupon) {
            if (isLoggedIn()) {
                try {
                    const token = getToken();
                    const favIds = new Set(getFavorites());
                    const isFavNow = favIds.has(coupon.id);
                    if (isFavNow) {
                        await fetch(`api/favorites/${coupon.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
                        favIds.delete(coupon.id);
                    } else {
                        await fetch('api/favorites', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ coupon_id: coupon.id }) });
                        favIds.add(coupon.id);
                    }
                    setFavorites(Array.from(favIds));
                    // 更新側邊欄計數
                    updateSidebarCounts();
                    // 不再跳出 alert，使用靜默更新與愛心切換
                } catch (e) {
                    console.warn('同步收藏失敗');
                }
            } else {
                const favs = getFavorites();
                const idx = favs.indexOf(coupon.id);
                if (idx >= 0) { favs.splice(idx, 1); } else { favs.unshift(coupon.id); }
                setFavorites(favs.slice(0, 200));
                // 更新側邊欄計數
                updateSidebarCounts();
                // 不再跳出 alert
            }
            // 同步所有愛心、收藏數與收藏視圖
            const nowActive = isFav(coupon.id);
            document.querySelectorAll(`[data-action="quick-fav"][data-id="${coupon.id}"]`).forEach(btn => {
                btn.classList.toggle('active', nowActive);
                btn.textContent = nowActive ? '❤' : '♡';
            });
            updateFavCount();
            syncModalFavoriteButton();
            if (isFavoritesView() && !nowActive) {
                const card = document.querySelector(`.coupon-card[data-id="${coupon.id}"]`);
                if (card) card.remove();
                if (document.querySelectorAll('.coupon-card').length === 0) renderEmptyFavorites();
            }
        }

        function getHistory() { try { return JSON.parse(localStorage.getItem(LS_HISTORY) || '[]'); } catch { return []; } }
        function setHistory(list) { localStorage.setItem(LS_HISTORY, JSON.stringify(list)); }
        function addHistory(id) { const h = getHistory().filter(x => x !== id); h.unshift(id); setHistory(h.slice(0, 200)); }

        // 添加標籤
        function addTag(tagText, tagType = 'search') {
            // 檢查是否已存在
            if (selectedTags.some(tag => tag.text === tagText)) {
                return;
            }

            selectedTags.push({ text: tagText, type: tagType });
            renderSelectedTags();
            performSearch();
        }

        // 移除標籤
        function removeTag(tagText) {
            selectedTags = selectedTags.filter(tag => tag.text !== tagText);
            renderSelectedTags();
            performSearch();

            // 更新下拉選單中的選中狀態
            updateDropdownSelection();
        }

        // 渲染選中的標籤
        function renderSelectedTags() {
            const container = document.getElementById('selectedTags');
            container.innerHTML = '';

            selectedTags.forEach(tag => {
                const tagElement = document.createElement('div');
                tagElement.className = 'selected-tag';
                tagElement.innerHTML = `
                     <span>${tag.text}</span>
                     <button class="selected-tag-remove" onclick="removeTag('${tag.text}')">×</button>
                 `;
                container.appendChild(tagElement);
            });

            // 更新搜尋框 placeholder
            const searchInput = document.getElementById('searchInput');
            if (selectedTags.length > 0) {
                searchInput.placeholder = '繼續搜尋...';
            } else {
                searchInput.placeholder = '搜尋優惠券、店家或分類...';
            }
        }

        // 更新下拉選單中的選中狀態
        function updateDropdownSelection() {
            // 更新分類標籤選中狀態
            document.querySelectorAll('.category-chip').forEach(chip => {
                const category = chip.getAttribute('data-category');
                const isSelected = selectedTags.some(tag => tag.text.includes(category));
                chip.classList.toggle('selected', isSelected);
            });

            // 更新熱門標籤選中狀態
            document.querySelectorAll('.trending-tag').forEach(tag => {
                const tagText = tag.getAttribute('data-tag');
                const isSelected = selectedTags.some(tag => tag.text === tagText);
                tag.classList.toggle('selected', isSelected);
            });
        }

        // 執行搜尋 (結合標籤和輸入框)
        async function performSearch() {
            const searchInput = document.getElementById('searchInput');
            const searchTerm = searchInput.value.toLowerCase().trim();

            // 如果有搜尋詞，嘗試從API搜尋
            if (searchTerm !== '') {
                try {
                    const res = await fetch(`api/coupons?search=${encodeURIComponent(searchTerm)}&page=1&pageSize=50`);
                    const json = await res.json();
                    const items = json?.data?.coupons || [];

                    if (Array.isArray(items) && items.length > 0) {
                        // 轉換API資料格式
                        const searchResults = items.map((item, idx) => ({
                            id: item.id || idx + 1,
                            image: item.image && item.image.trim() !== '' ? item.image : `img/送好康文宣素材 (${(idx % 50) + 1}).jpg`,
                            storeName: item.storeName || '合作店家',
                            category: item.category || '一般優惠',
                            title: item.title || '優惠活動',
                            discount: item.discount_value ? `${item.discount_value}${item.discount_type === 'percentage' ? '%' : '元'} OFF` : '特價優惠',
                            expiry: item.end_date ? new Date(item.end_date).toLocaleDateString('zh-TW') : '',
                            usage: item.usage_rules || '每人限用一次',
                            description: item.description || '詳情請見活動說明。',
                            address: item.address || '',
                            phone: item.phone || ''
                        }));

                        renderCoupons(searchResults);
                        return;
                    }
                } catch (e) {
                    console.warn('API搜尋失敗，使用本地搜尋:', e);
                }
            }

            // 回退到本地搜尋
            let filteredCoupons = coupons;

            // 根據選中的標籤篩選
            if (selectedTags.length > 0) {
                filteredCoupons = coupons.filter(coupon => {
                    return selectedTags.some(tag => {
                        if (tag.type === 'category') {
                            return coupon.category.includes(tag.text);
                        } else {
                            return coupon.storeName.toLowerCase().includes(tag.text.toLowerCase()) ||
                                coupon.title.toLowerCase().includes(tag.text.toLowerCase()) ||
                                coupon.category.toLowerCase().includes(tag.text.toLowerCase());
                        }
                    });
                });
            }

            // 再根據搜尋框內容進一步篩選
            if (searchTerm !== '') {
                filteredCoupons = filteredCoupons.filter(coupon =>
                    coupon.storeName.toLowerCase().includes(searchTerm) ||
                    coupon.title.toLowerCase().includes(searchTerm) ||
                    coupon.category.toLowerCase().includes(searchTerm)
                );
            }

            renderCoupons(filteredCoupons);
        }

        // 搜尋功能 (保留原有功能，但改為調用 performSearch)
        function handleSearch() {
            performSearch();
        }

        // 分類篩選
        function filterByCategory(category) {
            const filteredCoupons = coupons.filter(coupon =>
                coupon.category.includes(category)
            );
            renderCoupons(filteredCoupons);
            document.getElementById('searchDropdown').classList.remove('active');

            // 更新側邊欄選中狀態
            updateSidebarSelection(category);
        }

        // 重置回首頁
        function resetToHomepage() {
            setView('home');
            // 清空搜尋框
            document.getElementById('searchInput').value = '';

            // 清空所有選中的標籤
            selectedTags = [];
            renderSelectedTags();

            // 關閉搜尋下拉選單
            document.getElementById('searchDropdown').classList.remove('active');

            // 更新下拉選單選中狀態
            updateDropdownSelection();

            // 重新渲染所有優惠券
            renderCoupons(coupons);

            // 重置側邊欄選中狀態為首頁
            updateSidebarSelection('首頁');

            // 滾動到頂部
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        // 更新側邊欄選中狀態
        function updateSidebarSelection(activeItem) {
            // 移除所有active狀態
            document.querySelectorAll('.sidebar-item').forEach(item => {
                item.classList.remove('active');
            });

            // 根據activeItem設定新的active狀態
            let targetItem = null;

            document.querySelectorAll('.sidebar-item').forEach(item => {
                const text = item.querySelector('.sidebar-text')?.textContent;

                if (activeItem === '首頁' && text === '首頁') {
                    targetItem = item;
                }
            });

            if (targetItem) {
                targetItem.classList.add('active');
            }
        }

        // 側邊欄展開/收起功能
        function toggleSidebar() {
            const sidebar = document.querySelector('.sidebar');
            sidebar.classList.toggle('expanded');
        }

        // 自動展開/收起側邊欄
        function setupSidebarToggle() {
            const sidebar = document.querySelector('.sidebar');
            const header = document.querySelector('.header');
            const mainContent = document.querySelector('.main-content');
            let hoverTimer;

            function expandSidebar() {
                sidebar.classList.add('expanded');
                header.classList.add('pushed');
                mainContent.classList.add('pushed');
            }

            function collapseSidebar() {
                sidebar.classList.remove('expanded');
                header.classList.remove('pushed');
                mainContent.classList.remove('pushed');
            }

            // 滑鼠進入時展開
            sidebar.addEventListener('mouseenter', () => {
                clearTimeout(hoverTimer);
                expandSidebar();
            });

            // 滑鼠離開時收起（延遲300ms）
            sidebar.addEventListener('mouseleave', () => {
                hoverTimer = setTimeout(() => {
                    collapseSidebar();
                }, 300);
            });

            // 點擊項目時保持展開狀態一段時間
            sidebar.addEventListener('click', () => {
                clearTimeout(hoverTimer);
                expandSidebar();

                // 3秒後自動收起
                hoverTimer = setTimeout(() => {
                    collapseSidebar();
                }, 3000);
            });
        }

        // 側邊欄功能實現
        let currentSidebarView = 'home';
        let historyData = JSON.parse(localStorage.getItem('viewHistory') || '[]');

        // 更新側邊欄計數
        function updateSidebarCounts() {
            // 重新從 localStorage 載入瀏覽記錄，確保數據同步
            historyData = JSON.parse(localStorage.getItem('viewHistory') || '[]');

            // 清理無效的瀏覽記錄
            if (coupons && coupons.length > 0) {
                const validHistoryData = historyData.filter(item =>
                    coupons.some(coupon => coupon.id === item.id)
                );

                if (validHistoryData.length !== historyData.length) {
                    historyData = validHistoryData;
                    localStorage.setItem('viewHistory', JSON.stringify(historyData));
                }
            }

            // 收藏數量
            const favCount = getFavorites().length;
            const favCountEl = document.getElementById('favCount');
            if (favCount > 0) {
                favCountEl.textContent = favCount;
                favCountEl.style.display = 'inline-block';
            } else {
                favCountEl.style.display = 'none';
            }

            // 瀏覽記錄數量
            const historyCountEl = document.getElementById('historyCount');
            console.log('瀏覽記錄數據:', historyData); // 調試用

            if (historyData.length > 0) {
                historyCountEl.textContent = historyData.length > 99 ? '99+' : historyData.length;
                historyCountEl.style.display = 'inline-block';
            } else {
                historyCountEl.style.display = 'none';
            }

            // 同時更新會員選單的徽章
            if (isLoggedIn()) {
                updateSimpleMemberMenuBadges();
            }
        }

        // 設定側邊欄活動狀態
        function setSidebarActive(action) {
            document.querySelectorAll('.sidebar-item').forEach(item => {
                item.classList.remove('active');
            });
            const activeItem = document.querySelector(`[data-action="${action}"]`);
            if (activeItem) {
                activeItem.classList.add('active');
            }
            currentSidebarView = action;
        }

        // 側邊欄功能處理
        function handleSidebarAction(action) {
            setSidebarActive(action);

            switch (action) {
                case 'home':
                    showAllCoupons();
                    break;
                case 'favorites':
                    showFavorites();
                    break;
                case 'history':
                    showHistory();
                    break;
                case 'hot':
                    showHotCoupons();
                    break;
                case 'nearby':
                    showNearbyCoupons();
                    break;
                case 'limited':
                    showLimitedCoupons();
                    break;
                case 'settings':
                    showSettings();
                    break;
                case 'help':
                    showHelp();
                    break;
            }
        }

        // 顯示所有優惠券（首頁）
        function showAllCoupons() {
            setView('home');
            removeHistoryClearButton(); // 移除清除按鈕
            renderCoupons(coupons);
            showSuccessMessage('回到首頁');
        }

        // 顯示收藏列表
        async function showFavorites() {
            removeHistoryClearButton(); // 移除清除按鈕
            await viewFavorites(); // 使用現有的收藏功能
        }

        // 顯示瀏覽記錄
        function showHistory() {
            const historyIds = historyData.map(item => item.id);
            const historyCoupons = coupons.filter(coupon => historyIds.includes(coupon.id));

            // 清理無效的瀏覽記錄（優惠券已不存在）
            const validHistoryData = historyData.filter(item =>
                coupons.some(coupon => coupon.id === item.id)
            );

            // 如果有無效記錄被清理，更新 localStorage
            if (validHistoryData.length !== historyData.length) {
                historyData = validHistoryData;
                localStorage.setItem('viewHistory', JSON.stringify(historyData));
                updateSidebarCounts(); // 更新計數
            }

            // 如果沒有瀏覽記錄，顯示空狀態
            if (historyData.length === 0) {
                renderEmptyHistory();
                showSuccessMessage('目前沒有瀏覽記錄');
                return;
            }

            // 按瀏覽時間排序（最新的在前）
            const sortedHistory = historyCoupons.sort((a, b) => {
                const aTime = historyData.find(h => h.id === a.id)?.timestamp || 0;
                const bTime = historyData.find(h => h.id === b.id)?.timestamp || 0;
                return bTime - aTime;
            });

            // 在頁面頂部添加清除按鈕
            addHistoryClearButton();
            renderCoupons(sortedHistory);
            showSuccessMessage(`顯示 ${sortedHistory.length} 個瀏覽記錄`);
        }

        // 顯示熱門優惠
        function showHotCoupons() {
            removeHistoryClearButton(); // 移除清除按鈕
            // 按瀏覽次數排序
            const hotCoupons = [...coupons].sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
            renderCoupons(hotCoupons);

            // 更新計數
            const hotCountEl = document.getElementById('hotCount');
            hotCountEl.textContent = hotCoupons.length;
            hotCountEl.style.display = 'inline-block';

            showSuccessMessage('顯示熱門優惠');
        }

        // 顯示附近優惠（模擬地理位置）
        function showNearbyCoupons() {
            removeHistoryClearButton(); // 移除清除按鈕
            // 模擬附近優惠（隨機選擇一些優惠券）
            const nearbyCount = Math.min(10, coupons.length);
            const shuffled = [...coupons].sort(() => 0.5 - Math.random());
            const nearbyCoupons = shuffled.slice(0, nearbyCount);

            renderCoupons(nearbyCoupons);

            // 更新計數
            const nearbyCountEl = document.getElementById('nearbyCount');
            nearbyCountEl.textContent = nearbyCount;
            nearbyCountEl.style.display = 'inline-block';

            showSuccessMessage(`找到 ${nearbyCount} 個附近優惠`);
        }

        // 顯示限時活動
        function showLimitedCoupons() {
            removeHistoryClearButton(); // 移除清除按鈕
            const now = new Date();
            const oneWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

            const limitedCoupons = coupons.filter(coupon => {
                if (!coupon.expiry) return false;
                const expiryDate = new Date(coupon.expiry);
                return expiryDate <= oneWeek && expiryDate > now;
            });

            renderCoupons(limitedCoupons);

            // 更新計數
            const limitedCountEl = document.getElementById('limitedCount');
            limitedCountEl.textContent = limitedCoupons.length;
            limitedCountEl.style.display = 'inline-block';

            showSuccessMessage(`找到 ${limitedCoupons.length} 個限時活動`);
        }

        // 顯示設定面板
        function showSettings() {
            const settingsModal = document.createElement('div');
            settingsModal.className = 'modal-overlay';
            settingsModal.style.cssText = 'display: flex; z-index: 10000;';

            settingsModal.innerHTML = `
                <div class="modal-content profile-modal-content">
                    <button class="modal-close" onclick="closeSettings()">×</button>
                    <div class="profile-modal-body">
                        <div class="profile-header">
                            <div class="profile-avatar">⚙️</div>
                            <h2 class="profile-title">系統設定</h2>
                        </div>
                        
                        <!-- 顯示設定 -->
                        <div class="profile-section">
                            <h3 class="section-title">顯示設定</h3>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label class="form-label">
                                        <input type="checkbox" id="showCounts" style="margin-right: 8px;">
                                        顯示側邊欄計數
                                    </label>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">
                                        <input type="checkbox" id="autoExpand" style="margin-right: 8px;">
                                        自動展開側邊欄
                                    </label>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 數據設定 -->
                        <div class="profile-section">
                            <h3 class="section-title">數據管理</h3>
                            <div class="form-grid">
                                <button class="btn-secondary" onclick="clearHistory()" style="margin-bottom: 10px;">
                                    清除瀏覽記錄
                                </button>
                                <button class="btn-secondary" onclick="clearSearchHistory()" style="margin-bottom: 10px;">
                                    清除搜尋記錄
                                </button>
                                <button class="btn-secondary" onclick="exportData()">
                                    匯出我的資料
                                </button>
                            </div>
                        </div>
                        
                        <div class="profile-actions">
                            <button onclick="closeSettings()" class="btn-secondary">關閉</button>
                            <button onclick="saveSettings()" class="btn-primary">儲存設定</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(settingsModal);
            document.body.style.overflow = 'hidden';

            // 添加點擊背景關閉功能
            addClickOutsideToClose(settingsModal, closeSettings);

            // 載入當前設定
            loadCurrentSettings();
        }

        function closeSettings() {
            const modal = document.querySelector('.modal-overlay:last-child');
            if (modal) {
                modal.remove();
                document.body.style.overflow = 'auto';
            }
        }

        function loadCurrentSettings() {
            const settings = JSON.parse(localStorage.getItem('userSettings') || '{}');
            document.getElementById('showCounts').checked = settings.showCounts !== false;
            document.getElementById('autoExpand').checked = settings.autoExpand === true;
        }

        function saveSettings() {
            const settings = {
                showCounts: document.getElementById('showCounts').checked,
                autoExpand: document.getElementById('autoExpand').checked
            };

            localStorage.setItem('userSettings', JSON.stringify(settings));
            applySettings(settings);
            showSuccessMessage('設定已儲存');
            closeSettings();
        }

        function applySettings(settings) {
            // 應用顯示設定
            const countElements = document.querySelectorAll('.sidebar-count');
            countElements.forEach(el => {
                if (settings.showCounts === false) {
                    el.style.display = 'none';
                } else {
                    // 恢復原本的顯示邏輯
                    const count = parseInt(el.textContent) || 0;
                    el.style.display = count > 0 ? 'inline-block' : 'none';
                }
            });
        }

        function clearHistory() {
            if (confirm('確定要清除所有瀏覽記錄嗎？')) {
                historyData = [];
                localStorage.removeItem('viewHistory');
                updateSidebarCounts();
                showSuccessMessage('瀏覽記錄已清除');
            }
        }

        function clearSearchHistory() {
            if (confirm('確定要清除所有搜尋記錄嗎？')) {
                searchHistory = [];
                localStorage.removeItem('searchHistory');
                renderSearchHistory();
                showSuccessMessage('搜尋記錄已清除');
            }
        }

        function exportData() {
            const data = {
                favorites: getFavorites(),
                history: historyData,
                searchHistory: searchHistory,
                settings: JSON.parse(localStorage.getItem('userSettings') || '{}')
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = '送齁康_我的資料.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showSuccessMessage('資料匯出完成');
        }

        // 顯示幫助中心
        function showHelp() {
            const helpModal = document.createElement('div');
            helpModal.className = 'modal-overlay';
            helpModal.style.cssText = 'display: flex; z-index: 10000;';

            helpModal.innerHTML = `
                <div class="modal-content profile-modal-content">
                    <button class="modal-close" onclick="closeHelp()">×</button>
                    <div class="profile-modal-body">
                        <div class="profile-header">
                            <div class="profile-avatar">❓</div>
                            <h2 class="profile-title">幫助中心</h2>
                        </div>
                        
                        <!-- 常見問題 -->
                        <div class="profile-section">
                            <h3 class="section-title">常見問題</h3>
                            <div class="help-item">
                                <h4>如何使用優惠券？</h4>
                                <p>1. 點擊優惠券卡片查看詳情<br>
                                2. 點擊「立即使用」按鈕<br>
                                3. 確認使用後會生成使用證明<br>
                                4. 向店家出示證明即可享受優惠</p>
                            </div>
                            <div class="help-item">
                                <h4>如何收藏優惠券？</h4>
                                <p>點擊優惠券卡片右上角的愛心圖標，或在詳情頁面點擊「收藏優惠」按鈕。</p>
                            </div>
                            <div class="help-item">
                                <h4>如何查看我的收藏？</h4>
                                <p>點擊左側邊欄的「我的收藏」，或點擊右上角會員選單中的「我的收藏」。</p>
                            </div>
                        </div>
                        
                        <!-- 功能說明 -->
                        <div class="profile-section">
                            <h3 class="section-title">功能說明</h3>
                            <div class="help-item">
                                <h4>🏠 首頁</h4>
                                <p>顯示所有可用的優惠券</p>
                            </div>
                            <div class="help-item">
                                <h4>❤️ 我的收藏</h4>
                                <p>查看已收藏的優惠券</p>
                            </div>
                            <div class="help-item">
                                <h4>🕒 瀏覽記錄</h4>
                                <p>查看最近瀏覽過的優惠券</p>
                            </div>
                            <div class="help-item">
                                <h4>🔥 熱門優惠</h4>
                                <p>按瀏覽次數排序的熱門優惠券</p>
                            </div>
                            <div class="help-item">
                                <h4>📍 附近優惠</h4>
                                <p>基於地理位置的附近優惠（模擬功能）</p>
                            </div>
                            <div class="help-item">
                                <h4>⏰ 限時活動</h4>
                                <p>即將到期的限時優惠券</p>
                            </div>
                        </div>
                        
                        <!-- 聯絡資訊 -->
                        <div class="profile-section">
                            <h3 class="section-title">聯絡我們</h3>
                            <div class="help-item">
                                <p><strong>客服信箱：</strong> support@songhokang.com</p>
                                <p><strong>客服電話：</strong> 0800-123-456</p>
                                <p><strong>服務時間：</strong> 週一至週五 09:00-18:00</p>
                            </div>
                        </div>
                        
                        <div class="profile-actions">
                            <button onclick="closeHelp()" class="btn-primary">關閉</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(helpModal);
            document.body.style.overflow = 'hidden';

            // 添加點擊背景關閉功能
            addClickOutsideToClose(helpModal, closeHelp);
        }

        function closeHelp() {
            const modal = document.querySelector('.modal-overlay:last-child');
            if (modal) {
                modal.remove();
                document.body.style.overflow = 'auto';
            }
        }

        // 通用函數：為模態視窗添加點擊背景關閉功能
        function addClickOutsideToClose(modalElement, closeFunction) {
            modalElement.addEventListener('click', (e) => {
                if (e.target === e.currentTarget) {
                    closeFunction();
                }
            });
        }

        // 添加到瀏覽記錄
        function addToHistory(coupon) {
            const existingIndex = historyData.findIndex(item => item.id === coupon.id);
            if (existingIndex !== -1) {
                historyData.splice(existingIndex, 1);
            }

            historyData.unshift({
                id: coupon.id,
                timestamp: Date.now()
            });

            // 限制記錄數量
            if (historyData.length > 50) {
                historyData = historyData.slice(0, 50);
            }

            localStorage.setItem('viewHistory', JSON.stringify(historyData));
            updateSidebarCounts();
        }

        // 獲取頁面特定的切換狀態鍵值
        function getPageSwitchKey() {
            // 根據當前頁面路徑生成唯一的切換狀態鍵值
            const path = window.location.pathname;
            if (path.includes('vendor')) return 'switched_from_admin_vendor';
            if (path.includes('admin')) return 'switched_from_admin_admin';
            return 'switched_from_admin_customer'; // 前台頁面
        }

        // 處理管理員切換會話
        function handleAdminSwitch() {
            const urlParams = new URLSearchParams(window.location.search);
            const switchSessionId = urlParams.get('switch_session');

            if (switchSessionId) {
                try {
                    // 從 sessionStorage 獲取切換數據
                    const switchDataStr = sessionStorage.getItem(switchSessionId);
                    if (switchDataStr) {
                        const switchData = JSON.parse(switchDataStr);

                        // 檢查是否為隔離會話模式
                        if (switchData.isolatedSession) {
                            console.log('處理隔離會話切換:', switchData);

                            // 保存當前頁面的原始會話狀態（如果有的話）
                            const currentPageSession = {
                                token: localStorage.getItem(LS_TOKEN),
                                user: localStorage.getItem(LS_USER),
                                timestamp: Date.now()
                            };

                            // 如果當前頁面有會話，保存到臨時位置
                            const tempSessionKey = `temp_original_session_${switchData.user.role}`;
                            if (currentPageSession.token) {
                                localStorage.setItem(tempSessionKey, JSON.stringify(currentPageSession));
                            }

                            // 使用角色專屬的鍵值設置會話，避免影響其他角色
                            const targetTokenKey = switchData.targetTokenKey || LS_TOKEN;
                            const targetUserKey = switchData.targetUserKey || LS_USER;

                            localStorage.setItem(targetTokenKey, switchData.token);
                            localStorage.setItem(targetUserKey, JSON.stringify(switchData.user));

                            // 為了兼容現有代碼，也設置通用鍵值（但這只影響當前分頁）
                            localStorage.setItem(LS_TOKEN, switchData.token);
                            localStorage.setItem(LS_USER, JSON.stringify(switchData.user));

                            currentUser = switchData.user;

                            // 使用頁面特定的鍵值儲存管理員切換資訊
                            const pageSwitchKey = getPageSwitchKey();
                            const switchInfo = {
                                ...switchData.switched_from_admin,
                                isolatedSession: true,
                                targetRole: switchData.user.role,
                                originalSession: switchData.originalSession,
                                tempSession: currentPageSession,
                                pageType: pageSwitchKey // 記錄頁面類型
                            };
                            localStorage.setItem(pageSwitchKey, JSON.stringify(switchInfo));

                        } else {
                            // 舊版非隔離模式（向後兼容）
                            localStorage.setItem(LS_TOKEN, switchData.token);
                            localStorage.setItem(LS_USER, JSON.stringify(switchData.user));
                            currentUser = switchData.user;
                            const pageSwitchKey = getPageSwitchKey();
                            localStorage.setItem(pageSwitchKey, JSON.stringify(switchData.switched_from_admin));
                        }

                        // 清理 sessionStorage
                        sessionStorage.removeItem(switchSessionId);

                        // 移除 URL 參數
                        window.history.replaceState({}, document.title, window.location.pathname);

                        // 強制更新登入UI，確保會員選單正確顯示
                        setTimeout(() => {
                            updateLoginUI();
                        }, 100);

                        // 顯示切換成功消息
                        setTimeout(() => {
                            showSuccessMessage(`🔄 已切換到用戶「${switchData.user.username}」\n✅ 頁面隔離模式：其他頁面會話不受影響\n\n點擊右上角👤圖標可進入個人中心`);
                        }, 500);

                        console.log('管理員切換會話處理完成:', switchData.user);
                    }
                } catch (error) {
                    console.error('處理管理員切換會話失敗:', error);
                }
            }
        }

        // 檢查是否為管理員切換的會話
        function isAdminSwitchedSession() {
            const pageSwitchKey = getPageSwitchKey();
            return localStorage.getItem(pageSwitchKey) !== null;
        }

        // 顯示管理員切換狀態
        function showAdminSwitchStatus() {
            if (isAdminSwitchedSession()) {
                try {
                    const pageSwitchKey = getPageSwitchKey();
                    const switchInfo = JSON.parse(localStorage.getItem(pageSwitchKey));

                    // 檢查是否已經顯示狀態列
                    if (document.getElementById('admin-switch-status')) {
                        return;
                    }

                    const statusDiv = document.createElement('div');
                    statusDiv.id = 'admin-switch-status';
                    statusDiv.style.cssText = `
                        position: fixed;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        background: linear-gradient(135deg, #f59e0b, #d97706);
                        color: white;
                        padding: 12px 16px;
                        text-align: center;
                        font-size: 14px;
                        font-weight: 600;
                        z-index: 9999;
                        box-shadow: 0 -2px 10px rgba(245, 158, 11, 0.3);
                        backdrop-filter: blur(10px);
                    `;

                    const switchTime = switchInfo.switched_at ? new Date(switchInfo.switched_at).toLocaleString() : '未知';
                    statusDiv.innerHTML = `
                        🔄 管理員切換模式 | 目前身份: ${getUser()?.username || currentUser?.username || '未知'} | 
                        頁面: 前台 | 切換時間: ${switchTime} | 
                        <button onclick="clearAdminSwitch()" style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 6px 12px; border-radius: 6px; margin-left: 8px; cursor: pointer; font-size: 13px; transition: all 0.2s ease;">結束切換</button>
                    `;

                    document.body.appendChild(statusDiv);

                    // 調整頁面底部邊距，避免內容被遮擋
                    document.body.style.paddingBottom = '60px';
                } catch (error) {
                    console.error('顯示管理員切換狀態失敗:', error);
                }
            }
        }

        // 清除管理員切換狀態
        function clearAdminSwitch() {
            if (confirm('確定要結束管理員切換模式嗎？這將清除當前頁面的會話。')) {
                try {
                    // 獲取頁面特定的切換資訊
                    const pageSwitchKey = getPageSwitchKey();
                    const switchInfoStr = localStorage.getItem(pageSwitchKey);
                    let switchInfo = null;

                    if (switchInfoStr) {
                        switchInfo = JSON.parse(switchInfoStr);
                    }

                    // 清除當前頁面的切換相關資訊
                    localStorage.removeItem(pageSwitchKey);

                    // 如果是隔離會話模式，嘗試恢復原始會話
                    if (switchInfo && switchInfo.isolatedSession) {
                        console.log('恢復頁面隔離會話模式的原始狀態');

                        // 清除當前切換的會話
                        if (switchInfo.targetRole) {
                            const targetTokenKey = `authToken_${switchInfo.targetRole}`;
                            const targetUserKey = `user_${switchInfo.targetRole}`;
                            localStorage.removeItem(targetTokenKey);
                            localStorage.removeItem(targetUserKey);
                        }

                        // 恢復原始頁面會話（如果有的話）
                        const tempSessionKey = `temp_original_session_${switchInfo.targetRole}`;
                        const tempSessionStr = localStorage.getItem(tempSessionKey);
                        if (tempSessionStr) {
                            try {
                                const tempSession = JSON.parse(tempSessionStr);
                                if (tempSession.token) {
                                    localStorage.setItem(LS_TOKEN, tempSession.token);
                                    localStorage.setItem(LS_USER, tempSession.user);
                                }
                                localStorage.removeItem(tempSessionKey);
                            } catch (e) {
                                console.error('恢復原始會話失敗:', e);
                            }
                        } else {
                            // 沒有原始會話，清除通用鍵值
                            localStorage.removeItem(LS_TOKEN);
                            localStorage.removeItem(LS_USER);
                        }
                    } else {
                        // 非隔離模式，清除通用會話
                        localStorage.removeItem(LS_TOKEN);
                        localStorage.removeItem(LS_USER);
                    }

                    currentUser = null;

                    // 移除狀態列
                    const statusDiv = document.getElementById('admin-switch-status');
                    if (statusDiv) {
                        statusDiv.remove();
                    }

                    // 恢復頁面邊距
                    document.body.style.paddingBottom = '';

                    // 重新載入頁面
                    window.location.reload();

                } catch (error) {
                    console.error('清除切換狀態失敗:', error);
                    // 發生錯誤時，強制清理所有相關數據
                    const pageSwitchKey = getPageSwitchKey();
                    localStorage.removeItem(pageSwitchKey);
                    localStorage.removeItem('temp_original_session_customer');
                    localStorage.removeItem('temp_original_session_vendor');
                    localStorage.removeItem(LS_TOKEN);
                    localStorage.removeItem(LS_USER);
                    window.location.reload();
                }
            }
        }

        // 事件監聽器
        document.addEventListener('DOMContentLoaded', function () {
            // 初始化當前用戶
            currentUser = getUser();

            // 處理管理員切換會話
            handleAdminSwitch();

            // 檢查認證並顯示切換狀態
            setTimeout(() => {
                showAdminSwitchStatus();
            }, 100);

            loadCouponsFromApi();
            loadCategories();
            setupSidebarToggle();
            renderSearchHistory();

            // 清理無效的瀏覽記錄
            setTimeout(() => {
                const validHistoryData = historyData.filter(item =>
                    coupons.some(coupon => coupon.id === item.id)
                );

                if (validHistoryData.length !== historyData.length) {
                    historyData = validHistoryData;
                    localStorage.setItem('viewHistory', JSON.stringify(historyData));
                }

                updateSidebarCounts();
            }, 1000); // 等待優惠券數據載入完成

            updateSidebarCounts();

            // 應用用戶設定
            const settings = JSON.parse(localStorage.getItem('userSettings') || '{}');
            applySettings(settings);

            // 行動版側欄切換
            const hamburgerBtn = document.getElementById('hamburgerBtn');
            const sidebar = document.querySelector('.sidebar');
            const backdrop = document.getElementById('backdrop');
            const closeMobileMenu = () => { sidebar.classList.remove('open'); backdrop.style.display = 'none'; hamburgerBtn.setAttribute('aria-expanded', 'false'); };
            const openMobileMenu = () => { sidebar.classList.add('open'); backdrop.style.display = 'block'; hamburgerBtn.setAttribute('aria-expanded', 'true'); };
            hamburgerBtn.addEventListener('click', () => {
                if (sidebar.classList.contains('open')) { closeMobileMenu(); } else { openMobileMenu(); }
            });
            backdrop.addEventListener('click', closeMobileMenu);
            // 側邊欄項目點擊事件
            document.querySelectorAll('.sidebar-item[data-action]').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    const action = item.getAttribute('data-action');
                    if (action) {
                        handleSidebarAction(action);
                        // 行動版自動關閉側邊欄
                        if (window.innerWidth <= 768) {
                            closeMobileMenu();
                        }
                    }
                });
            });

            // 登入按鈕與狀態
            const loginBtn = document.querySelector('.login-btn');
            updateLoginUI();
            const roleMenu = document.getElementById('roleMenu');
            const toggleRoleMenu = () => { roleMenu.classList.toggle('active'); };
            loginBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleRoleMenu(); });
            document.addEventListener('click', (e) => { if (!e.target.closest('#roleMenu')) roleMenu.classList.remove('active'); });
            // 點角色項目（僅對有data-role屬性的元素生效）
            document.querySelectorAll('#roleMenu .role-item[data-role]').forEach(btn => btn.addEventListener('click', (e) => {
                const role = e.currentTarget.getAttribute('data-role');
                if (!role) return; // 如果沒有data-role屬性，不執行
                roleMenu.classList.remove('active');
                window.__selectedRole = role; // 設定預選角色，供 openAuth 使用
                if (role === 'admin') { openAuth('login'); }
                else if (role === 'vendor') { openAuth('register'); }
                else { openAuth('register'); }
            }));

            // Auth modal 事件
            document.getElementById('authClose').addEventListener('click', (e) => { e.stopPropagation(); closeAuth(); });
            document.getElementById('authOverlay').addEventListener('click', (e) => {
                if (e.target === e.currentTarget) {
                    closeAuth();
                }
            });
            document.getElementById('tabLogin').addEventListener('click', () => openAuth('login'));
            document.getElementById('tabRegister').addEventListener('click', () => openAuth('register'));
            document.getElementById('loginForm').addEventListener('submit', onLoginSubmit);
            document.getElementById('registerForm').addEventListener('submit', onRegisterSubmit);

            // 註冊角色切換時顯示/隱藏廠商欄位
            // 已移除角色切換，保留欄位顯示由 openAuth 控制

            // 搜尋框事件
            const searchInput = document.getElementById('searchInput');
            const searchDropdown = document.getElementById('searchDropdown');
            const searchWrapper = document.getElementById('searchWrapper');

            // 點擊搜尋框容器時聚焦到輸入框
            searchWrapper.addEventListener('click', (e) => {
                if (e.target !== searchInput) {
                    searchInput.focus();
                }
            });

            searchInput.addEventListener('focus', () => {
                searchDropdown.classList.add('active');
                updateDropdownSelection(); // 更新選中狀態
            });

            // 按 Enter 鍵時執行搜尋
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const searchTerm = searchInput.value.trim();
                    if (searchTerm) {
                        saveSearchHistory(searchTerm);
                        performSearch();
                        searchDropdown.classList.remove('active');
                    }
                }
            });

            // 輸入時即時篩選（不記錄搜尋紀錄）
            searchInput.addEventListener('input', () => {
                performSearch();
            });

            // 點擊搜尋框外部關閉下拉選單
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.search-container')) {
                    searchDropdown.classList.remove('active');
                    closeFilterPanel();
                }
            });

            // 進階篩選按鈕事件
            document.getElementById('filterToggleBtn').addEventListener('click', (e) => {
                e.stopPropagation();
                toggleFilterPanel();
            });

            // Logo 點擊回首頁事件
            document.querySelector('.logo').addEventListener('click', (e) => {
                e.preventDefault();
                resetToHomepage();
            });

            // 舊的側邊欄事件監聽器已移除，使用新的data-action屬性處理

            // 最近搜尋項目點擊事件
            document.querySelectorAll('.recent-item').forEach(item => {
                item.addEventListener('click', () => {
                    const searchTerm = item.getAttribute('data-search');
                    addTag(searchTerm, 'search');
                    document.getElementById('searchDropdown').classList.remove('active');
                });
            });

            // 分類標籤點擊事件 (支援複選)
            document.querySelectorAll('.category-chip').forEach(item => {
                item.addEventListener('click', () => {
                    const category = item.getAttribute('data-category');
                    const categoryText = item.querySelector('.category-chip-text').textContent;

                    // 檢查是否已選中
                    const isSelected = selectedTags.some(tag => tag.text === categoryText);

                    if (isSelected) {
                        // 如果已選中，則移除
                        removeTag(categoryText);
                    } else {
                        // 如果未選中，則添加並保存搜尋紀錄
                        addTag(categoryText, 'category');
                        saveSearchHistory(categoryText);
                    }

                    updateDropdownSelection();
                });
            });

            // 熱門標籤點擊事件 (支援複選)
            document.querySelectorAll('.trending-tag').forEach(item => {
                item.addEventListener('click', () => {
                    const tag = item.getAttribute('data-tag');

                    // 檢查是否已選中
                    const isSelected = selectedTags.some(selectedTag => selectedTag.text === tag);

                    if (isSelected) {
                        // 如果已選中，則移除
                        removeTag(tag);
                    } else {
                        // 如果未選中，則添加並保存搜尋紀錄
                        addTag(tag, 'trending');
                        saveSearchHistory(tag);
                    }

                    updateDropdownSelection();
                });
            });

            // 彈窗關閉事件
            document.getElementById('modalClose').addEventListener('click', (e) => { e.stopPropagation(); closeModal(); });
            document.getElementById('modalOverlay').addEventListener('click', (e) => {
                if (e.target === e.currentTarget) {
                    closeModal();
                }
            });
            // 燈箱關閉事件
            const lightboxOverlay = document.getElementById('lightboxOverlay');
            lightboxOverlay.addEventListener('click', (e) => {
                // 點擊黑色區域或右上角關閉按鈕皆可關閉
                if (e.target === e.currentTarget || e.target.id === 'lightboxClose') {
                    closeLightbox();
                }
            });
            document.getElementById('lightboxClose').addEventListener('click', closeLightbox);

            // ESC 鍵關閉彈窗
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    closeModal();
                    closeLightbox();
                }
            });
        });

        // 登入 UI 控制
        function updateLoginUI() {
            const btn = document.querySelector('.login-btn');
            const roleMenu = document.getElementById('roleMenu');
            if (!btn) return;

            if (isLoggedIn()) {
                const user = getUser();
                const role = (user?.role || '').toLowerCase();

                const avatarUrl = user?.avatar ? (user.avatar.startsWith('http') ? user.avatar : (user.avatar.startsWith('/') ? user.avatar : '/' + user.avatar)) : '';

                if (role === 'customer') {
                    // 一般會員：顯示頭像（有則用圖，無則顯示圖示）
                    btn.innerHTML = avatarUrl
                        ? `<img src="${avatarUrl}" alt="avatar" style="width:24px;height:24px;border-radius:50%;object-fit:cover;">`
                        : `<span style="color: #FCA311;">👤</span>`;
                    btn.title = `會員：${user?.username || user?.email || '未知'}`;

                    // 更新角色選單為簡化的會員選單
                    roleMenu.innerHTML = `
                        <div style="padding: 8px 12px; border-bottom: 1px solid rgba(0,0,0,0.1); margin-bottom: 4px;">
                            <div style="font-size: 12px; color: #666; margin-bottom: 2px;">會員</div>
                            <div style="font-size: 14px; font-weight: 600; color: #333;">${user?.username || user?.email || '未知用戶'}</div>
                        </div>
                        <button class="role-item member-action" onclick="goToProfile()">
                            <span style="margin-right: 8px;">👤</span>個人中心
                        </button>
                        <button class="role-item member-action" onclick="viewFavorites()">
                            <span style="margin-right: 8px;">❤️</span>我的收藏 <span class="menu-badge" id="menuFavCount"></span>
                        </button>
                        <div style="border-top: 1px solid rgba(0,0,0,0.1); margin-top: 4px; padding-top: 4px;">
                            <button class="role-item member-action" onclick="logout()" style="color: #dc2626;">
                                <span style="margin-right: 8px;">🚪</span>登出
                            </button>
                        </div>
                    `;

                    // 移除所有舊的data-role屬性，避免事件監聽器衝突
                    document.querySelectorAll('#roleMenu .role-item').forEach(item => {
                        item.removeAttribute('data-role');
                    });

                    // 更新會員選單中的徽章計數
                    updateSimpleMemberMenuBadges();
                } else {
                    // 管理員或廠商：顯示頭像或登出圖示
                    if (avatarUrl) {
                        btn.innerHTML = `<img src="${avatarUrl}" alt="avatar" style="width:24px;height:24px;border-radius:50%;object-fit:cover;">`;
                    } else {
                        btn.textContent = '⎋';
                    }
                    btn.title = '登出';
                    roleMenu.innerHTML = `
                        <button class="role-item" onclick="logout()" style="color: #dc2626;">
                            <span style="margin-right: 8px;">🚪</span>登出
                        </button>
                    `;
                }
            } else {
                // 未登入：顯示角色選擇
                btn.textContent = '👤';
                btn.title = '登入';
                roleMenu.innerHTML = `
                    <button class="role-item" data-role="customer">一般用戶</button>
                    <button class="role-item" data-role="vendor">廠商後台</button>
                    <button class="role-item" data-role="admin">管理後台</button>
                `;

                // 重新綁定角色選擇事件（僅適用於未登入狀態的角色選單）
                setTimeout(() => {
                    document.querySelectorAll('#roleMenu .role-item[data-role]').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            const role = e.currentTarget.getAttribute('data-role');
                            if (!role) return; // 如果沒有data-role屬性，不執行
                            roleMenu.classList.remove('active');
                            window.__selectedRole = role;
                            if (role === 'admin') { openAuth('login'); }
                            else if (role === 'vendor') { openAuth('register'); }
                            else { openAuth('register'); }
                        });
                    });
                }, 100);
            }
        }

        // 會員功能已整合到獨立的個人頁面 (profile.html)






        async function viewFavorites() {
            document.getElementById('roleMenu').classList.remove('active');

            // 如果已登入，從API載入收藏列表
            if (isLoggedIn()) {
                try {
                    const res = await fetch('api/favorites', {
                        headers: { 'Authorization': `Bearer ${getToken()}` }
                    });
                    const json = await res.json();
                    if (json.success && json.data?.favorites) {
                        // 更新本地收藏列表
                        const favoriteIds = json.data.favorites.map(fav => fav.id);
                        setFavorites(favoriteIds);
                    }
                } catch (e) {
                    console.warn('載入收藏列表失敗:', e);
                }
            }

            // 設置側邊欄活動狀態
            setSidebarActive('favorites');
            setView('favorites');
            renderCoupons(); // 重新渲染優惠券以顯示收藏內容
            showSuccessMessage('切換到收藏頁面');
        }

        function viewHistory() {
            document.getElementById('roleMenu').classList.remove('active');

            // 直接使用側邊欄的歷史記錄功能
            setSidebarActive('history');
            showHistory();
            showSuccessMessage(`已顯示 ${historyData.length} 筆瀏覽記錄`);
        }

        function logout() {
            document.getElementById('roleMenu').classList.remove('active');
            clearAuth();
            setView('home');
            showSuccessMessage('已成功登出');
        }

        // 更新簡化會員選單徽章計數
        function updateSimpleMemberMenuBadges() {
            setTimeout(() => {
                // 收藏數量
                const favCount = getFavorites().length;
                const menuFavBadge = document.getElementById('menuFavCount');
                if (menuFavBadge) {
                    if (favCount > 0) {
                        menuFavBadge.textContent = favCount;
                        menuFavBadge.classList.add('show');
                    } else {
                        menuFavBadge.classList.remove('show');
                    }
                }
            }, 100);
        }

        // 跳轉到個人中心頁面
        function goToProfile() {
            document.getElementById('roleMenu').classList.remove('active');
            window.location.href = 'profile.html';
        }

        // 移除複雜的會員功能，統一到個人頁面處理

        // 進階篩選功能
        function toggleFilterPanel() {
            const panel = document.getElementById('filterPanel');
            const btn = document.getElementById('filterToggleBtn');
            const isVisible = panel.style.display === 'block';

            if (isVisible) {
                closeFilterPanel();
            } else {
                openFilterPanel();
            }
        }

        function openFilterPanel() {
            const panel = document.getElementById('filterPanel');
            const btn = document.getElementById('filterToggleBtn');
            const dropdown = document.getElementById('searchDropdown');

            // 關閉搜尋下拉選單
            dropdown.classList.remove('active');

            // 開啟篩選面板
            panel.style.display = 'block';
            btn.classList.add('active');
        }

        function closeFilterPanel() {
            const panel = document.getElementById('filterPanel');
            const btn = document.getElementById('filterToggleBtn');

            panel.style.display = 'none';
            btn.classList.remove('active');
        }

        function clearAllFilters() {
            // 清除分類篩選
            document.querySelectorAll('#categoryFilters input[type="checkbox"]').forEach(cb => {
                cb.checked = false;
            });

            // 重置到期時間篩選
            document.querySelector('input[name="expiry"][value="all"]').checked = true;

            // 重置排序選項
            document.getElementById('sortSelect').value = 'default';

            // 重新載入所有優惠券
            renderCoupons(coupons);
            showSuccessMessage('已清除所有篩選條件');
        }

        function applyAdvancedFilters() {
            let filteredCoupons = [...coupons];

            // 分類篩選
            const selectedCategories = Array.from(document.querySelectorAll('#categoryFilters input[type="checkbox"]:checked'))
                .map(cb => cb.value);

            if (selectedCategories.length > 0) {
                filteredCoupons = filteredCoupons.filter(coupon =>
                    selectedCategories.some(category => coupon.category.includes(category))
                );
            }

            // 到期時間篩選
            const expiryFilter = document.querySelector('input[name="expiry"]:checked').value;
            if (expiryFilter !== 'all') {
                const now = new Date();
                filteredCoupons = filteredCoupons.filter(coupon => {
                    if (!coupon.expiry) return expiryFilter === 'future';

                    const expiryDate = new Date(coupon.expiry.replace(/\//g, '-'));
                    const diffDays = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

                    switch (expiryFilter) {
                        case 'week': return diffDays <= 7 && diffDays > 0;
                        case 'month': return diffDays <= 30 && diffDays > 0;
                        case 'future': return diffDays > 30;
                        default: return true;
                    }
                });
            }

            // 排序
            const sortBy = document.getElementById('sortSelect').value;
            switch (sortBy) {
                case 'newest':
                    filteredCoupons.sort((a, b) => b.id - a.id);
                    break;
                case 'expiry':
                    filteredCoupons.sort((a, b) => {
                        const dateA = a.expiry ? new Date(a.expiry.replace(/\//g, '-')) : new Date('2099-12-31');
                        const dateB = b.expiry ? new Date(b.expiry.replace(/\//g, '-')) : new Date('2099-12-31');
                        return dateA - dateB;
                    });
                    break;
                case 'popular':
                    filteredCoupons.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
                    break;
                case 'category':
                    filteredCoupons.sort((a, b) => a.category.localeCompare(b.category));
                    break;
            }

            renderCoupons(filteredCoupons);
            closeFilterPanel();

            const count = filteredCoupons.length;
            showSuccessMessage(`已套用篩選條件，找到 ${count} 張優惠券`);
        }

        function openAuth(mode) {
            const overlay = document.getElementById('authOverlay');
            overlay.style.display = 'flex';
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            const loginF = document.getElementById('loginForm');
            const regF = document.getElementById('registerForm');
            if (mode === 'register') { loginF.style.display = 'none'; regF.style.display = 'block'; }
            else { loginF.style.display = 'block'; regF.style.display = 'none'; }
            // 根據從角色選單點擊的預設角色調整表單（隱藏或顯示廠商選項與欄位）
            const preselected = window.__selectedRole || 'customer';
            const loginRoleRow = document.getElementById('loginRoleRow');
            const regRoleRow = document.getElementById('regRoleRow');
            const vendorFields = document.getElementById('vendorFields');
            if (preselected === 'customer') {
                if (vendorFields) vendorFields.style.display = 'none';
            } else if (preselected === 'vendor') {
                if (vendorFields) vendorFields.style.display = '';
            }
        }
        function closeAuth() {
            const overlay = document.getElementById('authOverlay');
            overlay.style.display = 'none';
            overlay.classList.remove('active');
            document.body.style.overflow = 'auto';
        }

        // 顯示成功訊息
        function showSuccessMessage(message) {
            // 創建成功提示
            const successDiv = document.createElement('div');
            successDiv.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #FCA311, #F79009);
                color: white;
                padding: 16px 24px;
                border-radius: 12px;
                box-shadow: 0 8px 25px rgba(252, 163, 17, 0.3);
                z-index: 9999;
                font-weight: 600;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                transform: translateX(400px);
                transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                max-width: 300px;
            `;
            successDiv.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 18px;">✅</span>
                    <span>${message}</span>
                </div>
            `;

            document.body.appendChild(successDiv);

            // 動畫顯示
            setTimeout(() => {
                successDiv.style.transform = 'translateX(0)';
            }, 100);

            // 3秒後自動消失
            setTimeout(() => {
                successDiv.style.transform = 'translateX(400px)';
                setTimeout(() => {
                    if (successDiv.parentNode) {
                        successDiv.parentNode.removeChild(successDiv);
                    }
                }, 400);
            }, 3000);
        }

        async function onLoginSubmit(e) {
            e.preventDefault();
            const username = document.getElementById('loginUsername').value.trim();
            const password = document.getElementById('loginPassword').value;
            if (!username || !password) { showSuccessMessage('請填寫帳號和密碼'); return; }
            try {
                const res = await fetch('api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
                const json = await res.json();
                if (json.success) {
                    setAuth(json.data.token, json.data.user);
                    const role = (json.data.user?.role || '').toLowerCase();
                    // 額外存一份到角色專屬 token，方便同裝置多會話
                    const roleKey = ROLE_TOKENS[role];
                    if (roleKey) localStorage.setItem(roleKey, json.data.token);
                    if (role === 'admin') {
                        showSuccessMessage('登入成功，前往管理後台');
                        window.open('admin/', '_blank');
                        closeAuth();
                        return;
                    }
                    if (role === 'vendor') {
                        showSuccessMessage('登入成功，前往廠商中心');
                        window.open('vendor/', '_blank');
                        closeAuth();
                        return;
                    }
                    if (role === 'customer') {
                        showSuccessMessage(`歡迎回來，${json.data.user?.username || '會員'}！`);
                        closeAuth();
                        // 一般會員留在前台，不跳轉
                        return;
                    }
                    closeAuth();
                    showSuccessMessage('登入成功');
                }
                else { showSuccessMessage(json.message || '登入失敗'); }
            } catch (err) {
                console.error('登入錯誤:', err);
                showSuccessMessage('網路錯誤，請稍後再試');
            }
        }

        async function onRegisterSubmit(e) {
            e.preventDefault();
            const username = document.getElementById('regUsername').value.trim();
            const email = document.getElementById('regEmail').value.trim();
            const password = document.getElementById('regPassword').value;
            const password2 = document.getElementById('regPassword2').value;
            const phone = document.getElementById('regPhone').value.trim();
            // 角色固定由 openAuth 設定
            const role = (window.__selectedRole === 'vendor') ? 'vendor' : 'customer';
            const company_name = document.getElementById('regCompany').value.trim();
            if (!username || !email || !password) { showSuccessMessage('請完整填寫用戶名、電子郵件和密碼'); return; }
            if (password !== password2) { showSuccessMessage('兩次密碼不一致'); return; }
            if (role === 'vendor' && !company_name) { showSuccessMessage('廠商註冊請填寫公司名稱'); return; }
            try {
                const body = { username, email, password, confirm_password: password2, phone, role };
                if (role === 'vendor') { body.company_name = company_name; }
                const res = await fetch('api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
                let json;
                try { json = await res.clone().json(); }
                catch { const txt = await res.text(); showSuccessMessage('註冊失敗：' + txt); return; }
                if (json.success) {
                    showSuccessMessage('註冊成功，請使用帳密登入');
                    setTimeout(() => openAuth('login'), 1500);
                } else {
                    const details = json.details ? (typeof json.details === 'string' ? json.details : JSON.stringify(json.details)) : '';
                    showSuccessMessage((json.message || '註冊失敗') + (details ? ('：' + details) : ''));
                }
            } catch (err) {
                console.error('註冊錯誤:', err);
                showSuccessMessage('網路錯誤，請稍後再試');
            }
        }

        // 收藏鈕：使用彈窗右側的次要按鈕
        document.addEventListener('click', (e) => {
            if (e.target && e.target.classList.contains('btn-secondary') && currentCoupon) {
                e.preventDefault();
                toggleFavorite(currentCoupon).then(() => { syncModalFavoriteButton(); updateFavCount(); });
            }
            // 收藏列表中的刪除按鈕（事件代理）
            if (e.target && e.target.matches('[data-action="remove-fav"]')) {
                const id = Number(e.target.getAttribute('data-id'));
                const c = coupons.find(x => x.id === id);
                if (c) {
                    e.stopPropagation();
                    toggleFavorite(c).then(() => {
                        const card = e.target.closest('.coupon-card');
                        if (card) card.remove();
                        setView('favorites');
                        updateFavCount();
                    });
                }
            }
            // 卡片右上角快速收藏
            if (e.target && e.target.matches('[data-action="quick-fav"]')) {
                e.stopPropagation();
                const id = Number(e.target.getAttribute('data-id'));
                const c = coupons.find(x => x.id === id);
                if (c) {
                    toggleFavorite(c).then(() => {
                        // 切換愛心樣式與符號
                        const btn = e.target;
                        const nowFavs = new Set(getFavorites());
                        const active = nowFavs.has(id);
                        btn.classList.toggle('active', active);
                        btn.textContent = active ? '❤' : '♡';
                        updateFavCount();
                        // 若在收藏視圖且已取消收藏，直接移除該卡片
                        if (isFavoritesView() && !active) {
                            const card = btn.closest('.coupon-card');
                            if (card) card.remove();
                            // 若刪光後顯示空畫面
                            const remain = document.querySelectorAll('.coupon-card').length;
                            if (remain === 0) renderEmptyFavorites();
                        }
                    });
                }
            }
        });

        // 更新側邊欄收藏數
        function updateFavCount() {
            const el = document.getElementById('favCount');
            if (!el) return;
            const count = getFavorites().length;
            if (count > 0) { el.textContent = String(count); el.style.display = ''; }
            else { el.textContent = ''; el.style.display = 'none'; }
        }
    
