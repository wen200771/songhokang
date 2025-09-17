        // ?��?紀?�管??        let searchHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');

        function saveSearchHistory(query) {
            if (!query.trim()) return;

            // 移除?��??�目
            searchHistory = searchHistory.filter(item => item !== query);
            // 添�??��???            searchHistory.unshift(query);
            // ?�制?�多�?�?0筆�???            searchHistory = searchHistory.slice(0, 10);

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
                        <span class="search-history-icon">??</span>
                        <span class="search-history-text">${query}</span>
                    </div>
                    <div class="search-history-delete" onclick="event.stopPropagation(); removeSearchHistory('${query}')" title="?�除">
                        ?
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

        // ?�中?��?籤陣??        let selectedTags = [];
        let currentCoupon = null;
        let currentView = 'home';

        // ?�地?��??��?
        // ?�台使用?��???token key，避?��?管�??��??��?�?        const LS_TOKEN = 'authToken_customer';
        const LS_USER = 'authUser';
        // 額�??�測試�?段�?供�??��??��?�?token，�?許�?裝置?��??�入
        const ROLE_TOKENS = {
            admin: 'authToken_admin',
            vendor: 'authToken_vendor',
            customer: 'authToken_customer'
        };
        const LS_FAVORITES = 'favorites';
        const LS_HISTORY = 'viewHistory';

        // 視�??�?��??�斷
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

        // ?��??��??��?將由 API 填�?；若 API ?��??��?使用?�地?��??��?
        let coupons = [];
        let currentUser = null;

        // ?��??��??��?作為 API ?��??��??��??��?
        function buildDummyCoupons() {
            coupons = [];
            const categories = ['美�?餐飲', '購物?��?', '美容保�?', '休�?娛�?', '?��?住宿', '?�康?��?'];
            const storeTypes = {
                '美�?餐飲': ['餐廳', '?�啡�?, '小�?�?, '?��?�?, '?�烤�?],
                '購物?��?': ['?�飾�?, '3C�?��', '?��?', '超�?', '?�貨'],
                '美容保�?': ['美髮沙�?', '美甲�?, 'SPA?�館', '美容??, '?�摩�?],
                '休�?娛�?': ['KTV', '?�影??, '?�戲??, '網�?', '保齡?�館'],
                '?��?住宿': ['飯�?', '民宿', '?��?�?, '租�?�?, '?��?'],
                '?�康?��?': ['診�?', '?��?', '?�身??, '?��??�室', '?��?治�?']
            };
            for (let i = 1; i <= 50; i++) {
                const category = categories[Math.floor(Math.random() * categories.length)];
                const storeType = storeTypes[category][Math.floor(Math.random() * storeTypes[category].length)];

                coupons.push({
                    id: i,
                    image: `img/?�好康�?�????(${i}).jpg`,
                    storeName: `${storeType}${i}`,
                    category: category,
                    title: `?��??��?活�? ${i}`,
                    description: `?�是�?{i}?�優?�券?�詳細說?��??�含?�種使用條件?��??�。`,
                    expiry: '2024/12/31',
                    usage: '每人?�用一�?,
                    address: `?��?市信義�?信義路�?�?{i}?�`,
                    phone: `02-2${String(i).padStart(3, '0')}-${String(i * 10).padStart(4, '0')}`
                });
            }
        }

        // �?API 載入資�?
        async function loadCouponsFromApi() {
            try {
                const res = await fetch('api/coupons?page=1&pageSize=50');
                const json = await res.json();
                const items = json?.data?.coupons || [];
                if (Array.isArray(items) && items.length > 0) {
                    coupons = items.map((item, idx) => ({
                        id: item.id || idx + 1,
                        image: item.image && item.image.trim() !== '' ? item.image : `img/?�好康�?�????(${(idx % 50) + 1}).jpg`,
                        storeName: item.storeName || '?��?店家',
                        category: item.category || '一?�優??,
                        title: item.title || '?��?活�?',
                        description: item.description || '詳�?請�?活�?說�???,
                        expiry: item.expiry || '',
                        usage: item.usage || '每人?�用一�?,
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

        // �?API 載入?��?並渲?�到?��?下�??�進�?篩選
        async function loadCategories() {
            try {
                const res = await fetch('api/categories?active=1');
                const json = await res.json();
                const items = Array.isArray(json?.data) ? json.data : json?.data?.items || [];
                const categories = items.length > 0 ? items : [
                    { name: '美�?餐飲', icon: '?���? },
                    { name: '購物?��?', icon: '??�? },
                    { name: '美容保�?', icon: '??' },
                    { name: '休�?娛�?', icon: '?��' },
                    { name: '?��?住宿', icon: '?��?' },
                    { name: '?�康?��?', icon: '?��' }
                ];

                // ?��?下�?：�?類瀏覽 chips
                const grid = document.getElementById('searchCategoryGrid');
                if (grid) {
                    grid.innerHTML = categories.map(cat => `
                        <div class="category-chip" data-category="${cat.slug || cat.name}">
                            <span class="category-chip-icon">${cat.icon || ''}</span>
                            <span class="category-chip-text">${cat.name}</span>
                        </div>
                    `).join('');

                    // 綁�?點�?事件
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

                // ?��?篩選：checkbox ?�表
                const filters = document.getElementById('categoryFilters');
                if (filters) {
                    filters.innerHTML = categories.map(cat => `
                        <label class="filter-checkbox">
                            <input type="checkbox" value="${cat.name}"> ${cat.name}
                        </label>
                    `).join('');
                }
            } catch (e) {
                // ?��?失�??�可，�??�用?�設?��???            }
        }

        // 渲�??��??�卡??- Pinterest 風格
        function renderCoupons(couponsToRender = coupons) {
            const container = document.getElementById('masonryContainer');
            container.classList.remove('empty');
            container.innerHTML = '';

            // 如�??�收?��??��??�顯示收?��??��???            if (isFavoritesView()) {
                const favoriteIds = new Set(getFavorites());
                couponsToRender = couponsToRender.filter(coupon => favoriteIds.has(coupon.id));

                // 如�?沒�??��??�優?�券，顯示空?�??                if (couponsToRender.length === 0) {
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
                        // 點�??��??�移?�收?��??��?詳�?
                        return;
                    }
                    openModal(coupon);
                });

                // 添�?載入?�畫
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
                    <button class="fav-btn ${isFav ? 'active' : ''}" data-action="quick-fav" data-id="${coupon.id}">${isFav ? '?? : '??}</button>
                    <div class="coupon-overlay">
                        <button class="view-btn">?��??��?</button>
                    </div>
                `;

                container.appendChild(card);

                // 延遲顯示?�畫
                setTimeout(() => {
                    card.style.transition = 'all 0.4s ease';
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, index * 50);
            });
        }

        // ?��??��??�空?��??�面
        function renderEmptyFavorites() {
            const container = document.getElementById('masonryContainer');
            container.classList.add('empty');
            container.innerHTML = `
                <div style="display:flex;align-items:center;justify-content:center;width:100%;min-height:40vh;">
                    <div style="max-width:640px;width:90%;background:rgba(248,247,246,0.85);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(252,163,17,0.2);border-radius:24px;padding:32px;box-shadow:0 12px 40px rgba(252,163,17,0.15), inset 0 1px 0 rgba(255,255,255,0.9);text-align:center;">
                        <div style="font-size:20px;color:#333;font-weight:700;margin-bottom:8px;">?��?沒�??��?</div>
                        <div style="font-size:14px;color:#666;margin-bottom:18px;">?�以?�卡?�右上�?�?<span style=\"color:#e60023\">??/span> ?�入?��?</div>
                        <button class="btn-primary" id="backToHomeBtn">?�到首�?</button>
                    </div>
                </div>`;
            const btn = document.getElementById('backToHomeBtn');
            if (btn) btn.addEventListener('click', () => { resetToHomepage(); });
        }

        // ?�覽記�??�空?��??�面
        function renderEmptyHistory() {
            const container = document.getElementById('masonryContainer');
            container.classList.add('empty');
            container.innerHTML = `
                <div style="display:flex;align-items:center;justify-content:center;width:100%;min-height:40vh;">
                    <div style="max-width:640px;width:90%;background:rgba(248,247,246,0.85);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(252,163,17,0.2);border-radius:24px;padding:32px;box-shadow:0 12px 40px rgba(252,163,17,0.15), inset 0 1px 0 rgba(255,255,255,0.9);text-align:center;">
                        <div style="font-size:20px;color:#333;font-weight:700;margin-bottom:8px;">?��?沒�??�覽記�?</div>
                        <div style="font-size:14px;color:#666;margin-bottom:18px;">點�??��??�卡?�查?�詳?��??�自?��???/div>
                        <button class="btn-primary" id="backToHomeFromHistory">?�到首�?</button>
                    </div>
                </div>`;
            const btn = document.getElementById('backToHomeFromHistory');
            if (btn) btn.addEventListener('click', () => { resetToHomepage(); });
        }

        // 添�??�覽記�?清除?��?
        function addHistoryClearButton() {
            // 移除已�??��??��?
            const existingButton = document.getElementById('historyClearButton');
            if (existingButton) {
                existingButton.remove();
            }

            // ?�建清除?��?
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
                <span>??�?/span>
                <span>清除?�?��???/span>
            `;

            // 添�?hover?��?
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

            // 添�?點�?事件
            clearButton.addEventListener('click', () => {
                if (confirm('確�?要�??��??�瀏覽記�??��?此�?作無法復?��?)) {
                    clearAllHistory();
                }
            });

            document.body.appendChild(clearButton);
        }

        // 清除?�?�瀏覽記�?
        function clearAllHistory() {
            historyData = [];
            localStorage.removeItem('viewHistory');
            updateSidebarCounts();

            // 移除清除?��?
            removeHistoryClearButton();

            // 顯示空�???            renderEmptyHistory();
            showSuccessMessage('?�?�瀏覽記�?已�???);
        }

        // 移除?�覽記�?清除?��?
        function removeHistoryClearButton() {
            const clearButton = document.getElementById('historyClearButton');
            if (clearButton) {
                clearButton.remove();
            }
        }

        // ?��?彈�?
        async function openModal(coupon) {
            try {
                // 添�??�瀏覽記�?
                addToHistory(coupon);

                // ?�顯示基?��?�?                const webp = coupon.image.replace(/\.jpg$/i, '.webp');
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

                // 從API?��??�詳細�?資�?
                const res = await fetch(`api/coupons/${coupon.id}`);
                if (res.ok) {
                    const data = await res.json();
                    const detailedCoupon = data.data || data;

                    // ?�新詳細資�?
                    if (detailedCoupon.terms) {
                        document.getElementById('offerDescription').textContent = detailedCoupon.terms;
                    }
                    if (detailedCoupon.discount_type && detailedCoupon.discount_value) {
                        const discountText = getDiscountText(detailedCoupon.discount_type, detailedCoupon.discount_value);
                        document.getElementById('offerUsage').textContent = discountText;
                    }

                    // ?�新?�覽?��?如�??��?話�?
                    if (detailedCoupon.view_count !== undefined) {
                        incrementViewCount(coupon.id);
                    }
                }
            } catch (e) {
                console.warn('?��?載入詳細?��??��?�?', e);
            }

            // ?�步彈�??��??��??��?
            syncModalFavoriteButton();

            document.getElementById('modalOverlay').classList.add('active');
            document.body.style.overflow = 'hidden';

            // 綁�??�箱?��?
            modalImg.onclick = () => openLightbox(modalImg.currentSrc || modalImg.src);
            // 記�??�覽歷史
            addHistory(coupon.id);
        }

        // 輔助?�數：格式�??�扣?��?
        function getDiscountText(type, value) {
            switch (type) {
                case 'percentage': return `${value}% ?�扣`;
                case 'fixed': return `?�扣 NT$${value}`;
                case 'bogo': return '買�??��?';
                case 'free': return '?�費體�?';
                default: return '每人?�用一�?;
            }
        }

        // 增�??�覽?��??��??�新�?        async function incrementViewCount(couponId) {
            try {
                await fetch(`api/coupons/${couponId}/view`, { method: 'POST' });
            } catch (e) {
                // ?��?失�?
            }
        }

        function syncModalFavoriteButton() {
            const favs = new Set(getFavorites());
            const isFav = currentCoupon ? favs.has(currentCoupon.id) : false;
            const btn = document.querySelector('#modalOverlay .btn-secondary');
            if (btn) {
                btn.textContent = isFav ? '?��??��?' : '?��??��?';
            }
        }

        function toggleFavoriteFromModal() {
            if (currentCoupon) {
                toggleFavorite(currentCoupon);
                syncModalFavoriteButton();
            }
        }

        // ?��??�使?��???        async function useCoupon(coupon) {
            if (!coupon) return;

            if (!isLoggedIn()) {
                showSuccessMessage('請�??�入?�能使用?��???);
                closeModal();
                // ?�以?��??�入視�?
                return;
            }

            // 檢查?�否已�?使用??            const usedCoupons = getUsedCoupons();
            if (usedCoupons.includes(coupon.id)) {
                showSuccessMessage('?�已經使?��??�張?��??��?');
                return;
            }

            // 確�?使用?��???            const confirmModal = document.createElement('div');
            confirmModal.className = 'modal-overlay';
            confirmModal.style.cssText = 'display: flex; z-index: 10001;';

            confirmModal.innerHTML = `
                <div class="modal-content" style="max-width: 400px;">
                    <div style="padding: 28px; text-align: center;">
                        <h3 style="margin-bottom: 16px; color: #374151;">?�� 使用?��???/h3>
                        <p style="margin-bottom: 20px; color: #6b7280;">
                            確�?要使?��?{coupon.title}?��?�?br>
                            使用後�??��??�次使用此優?�券??                        </p>
                        <div style="display: flex; gap: 12px;">
                            <button onclick="cancelUseCoupon()" class="btn-secondary" style="flex: 1;">?��?</button>
                            <button onclick="confirmUseCoupon(${coupon.id})" class="btn-primary" style="flex: 1;">確�?使用</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(confirmModal);
            document.body.style.overflow = 'hidden';

            // 添�?點�??�景?��??�能
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
                // 調用API記�?使用
                const response = await fetch(`api/coupons/${couponId}/use`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${getToken()}`
                    }
                });

                if (response.ok) {
                    const result = await response.json();

                    // 記�??�本?��???                    const usedCoupons = getUsedCoupons();
                    usedCoupons.push(couponId);
                    setUsedCoupons(usedCoupons);

                    // ?��??�?��?�?                    cancelUseCoupon();
                    closeModal();

                    // 顯示?��?訊息
                    showSuccessMessage('?? ?��??�使?��??��?請�?店家?�示此�?�?);

                    // ?��?使用?��?（�??�QR Code�?                    generateUsageProof(currentCoupon, result);
                } else {
                    throw new Error('使用?��??�失??);
                }
            } catch (e) {
                console.error('使用?��??�失??', e);
                showSuccessMessage('使用失�?�? + e.message);
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
                    <button onclick="closeUsageProof()" style="position: absolute; top: 10px; right: 15px; background: none; border: none; color: white; font-size: 24px; cursor: pointer;">?</button>
                    <div style="padding: 40px 28px; text-align: center;">
                        <div style="font-size: 48px; margin-bottom: 16px;">?��</div>
                        <h3 style="margin-bottom: 12px;">?��??�使?��?�?/h3>
                        
                        <div style="background: rgba(255,255,255,0.2); padding: 16px; border-radius: 12px; margin-bottom: 16px;">
                            <div style="font-size: 18px; font-weight: 700; margin-bottom: 8px;">${coupon.title}</div>
                            <div style="font-size: 14px; opacity: 0.9;">${coupon.storeName || coupon.vendor_name || '店家?�稱'}</div>
                        </div>
                        
                        ${qrCodeUrl ? `
                        <div style="background: white; padding: 16px; border-radius: 12px; margin-bottom: 16px;">
                            <img src="${qrCodeUrl}" alt="QR Code" style="width: 200px; height: 200px; display: block; margin: 0 auto;">
                            <div style="font-size: 12px; color: #666; margin-top: 8px;">請�?店家?�示此QR Code</div>
                        </div>
                        ` : ''}
                        
                        <div style="background: rgba(255,255,255,0.2); padding: 12px; border-radius: 8px; margin-bottom: 16px;">
                            <div style="font-size: 12px; opacity: 0.8; margin-bottom: 4px;">驗�?�?/div>
                            <div style="font-size: 18px; font-weight: 700; letter-spacing: 1px;">${verificationCode}</div>
                        </div>
                        
                        ${expiresAt ? `
                        <div style="font-size: 12px; opacity: 0.8; margin-bottom: 16px;">
                            ?��??��??�至�?{new Date(expiresAt).toLocaleString('zh-TW')}
                        </div>
                        ` : ''}
                        <div style="font-size: 12px; opacity: 0.8;">
                            使用?��?�?{now.toLocaleString('zh-TW')}<br>
                            請�?店家?�示此�?�?                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(proofModal);

            // 添�?點�??�景?��??�能
            addClickOutsideToClose(proofModal, closeUsageProof);
        }

        function closeUsageProof() {
            const modal = document.querySelector('.modal-overlay:last-child');
            if (modal) {
                modal.remove();
                document.body.style.overflow = 'auto';
            }
        }

        // 使用記�?管�?
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

        // ?��?彈�?
        function closeModal() {
            document.getElementById('modalOverlay').classList.remove('active');
            document.body.style.overflow = 'auto';
        }

        // ?�箱?�能
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

        // ?��??�歷?��??�地�?        function getFavorites() { try { return JSON.parse(localStorage.getItem(LS_FAVORITES) || '[]'); } catch { return []; } }
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
                    // ?�新?��?欄�???                    updateSidebarCounts();
                    // 不�?跳出 alert，使?��?默更?��??��??��?
                } catch (e) {
                    console.warn('?�步?��?失�?');
                }
            } else {
                const favs = getFavorites();
                const idx = favs.indexOf(coupon.id);
                if (idx >= 0) { favs.splice(idx, 1); } else { favs.unshift(coupon.id); }
                setFavorites(favs.slice(0, 200));
                // ?�新?��?欄�???                updateSidebarCounts();
                // 不�?跳出 alert
            }
            // ?�步?�?��?心、收?�數?�收?��???            const nowActive = isFav(coupon.id);
            document.querySelectorAll(`[data-action="quick-fav"][data-id="${coupon.id}"]`).forEach(btn => {
                btn.classList.toggle('active', nowActive);
                btn.textContent = nowActive ? '?? : '??;
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

        // 添�?標籤
        function addTag(tagText, tagType = 'search') {
            // 檢查?�否已�???            if (selectedTags.some(tag => tag.text === tagText)) {
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

            // ?�新下�??�單中�??�中?�??            updateDropdownSelection();
        }

        // 渲�??�中?��?�?        function renderSelectedTags() {
            const container = document.getElementById('selectedTags');
            container.innerHTML = '';

            selectedTags.forEach(tag => {
                const tagElement = document.createElement('div');
                tagElement.className = 'selected-tag';
                tagElement.innerHTML = `
                     <span>${tag.text}</span>
                     <button class="selected-tag-remove" onclick="removeTag('${tag.text}')">?</button>
                 `;
                container.appendChild(tagElement);
            });

            // ?�新?��?�?placeholder
            const searchInput = document.getElementById('searchInput');
            if (selectedTags.length > 0) {
                searchInput.placeholder = '繼�??��?...';
            } else {
                searchInput.placeholder = '?��??��??�、�?家�??��?...';
            }
        }

        // ?�新下�??�單中�??�中?�??        function updateDropdownSelection() {
            // ?�新?��?標籤?�中?�??            document.querySelectorAll('.category-chip').forEach(chip => {
                const category = chip.getAttribute('data-category');
                const isSelected = selectedTags.some(tag => tag.text.includes(category));
                chip.classList.toggle('selected', isSelected);
            });

            // ?�新?��?標籤?�中?�??            document.querySelectorAll('.trending-tag').forEach(tag => {
                const tagText = tag.getAttribute('data-tag');
                const isSelected = selectedTags.some(tag => tag.text === tagText);
                tag.classList.toggle('selected', isSelected);
            });
        }

        // ?��??��? (結�?標籤?�輸?��?)
        async function performSearch() {
            const searchInput = document.getElementById('searchInput');
            const searchTerm = searchInput.value.toLowerCase().trim();

            // 如�??��?尋�?，�?試�?API?��?
            if (searchTerm !== '') {
                try {
                    const res = await fetch(`api/coupons?search=${encodeURIComponent(searchTerm)}&page=1&pageSize=50`);
                    const json = await res.json();
                    const items = json?.data?.coupons || [];

                    if (Array.isArray(items) && items.length > 0) {
                        // 轉�?API資�??��?
                        const searchResults = items.map((item, idx) => ({
                            id: item.id || idx + 1,
                            image: item.image && item.image.trim() !== '' ? item.image : `img/?�好康�?�????(${(idx % 50) + 1}).jpg`,
                            storeName: item.storeName || '?��?店家',
                            category: item.category || '一?�優??,
                            title: item.title || '?��?活�?',
                            discount: item.discount_value ? `${item.discount_value}${item.discount_type === 'percentage' ? '%' : '??} OFF` : '?�價?��?',
                            expiry: item.end_date ? new Date(item.end_date).toLocaleDateString('zh-TW') : '',
                            usage: item.usage_rules || '每人?�用一�?,
                            description: item.description || '詳�?請�?活�?說�???,
                            address: item.address || '',
                            phone: item.phone || ''
                        }));

                        renderCoupons(searchResults);
                        return;
                    }
                } catch (e) {
                    console.warn('API?��?失�?，使?�本?��?�?', e);
                }
            }

            // ?�退?�本?��?�?            let filteredCoupons = coupons;

            // ?��??�中?��?籤篩??            if (selectedTags.length > 0) {
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

            // ?�根?��?尋�??�容?��?步篩??            if (searchTerm !== '') {
                filteredCoupons = filteredCoupons.filter(coupon =>
                    coupon.storeName.toLowerCase().includes(searchTerm) ||
                    coupon.title.toLowerCase().includes(searchTerm) ||
                    coupon.category.toLowerCase().includes(searchTerm)
                );
            }

            renderCoupons(filteredCoupons);
        }

        // ?��??�能 (保�??��??�能，�??�為調用 performSearch)
        function handleSearch() {
            performSearch();
        }

        // ?��?篩選
        function filterByCategory(category) {
            const filteredCoupons = coupons.filter(coupon =>
                coupon.category.includes(category)
            );
            renderCoupons(filteredCoupons);
            document.getElementById('searchDropdown').classList.remove('active');

            // ?�新?��?欄選中�???            updateSidebarSelection(category);
        }

        // ?�置?��???        function resetToHomepage() {
            setView('home');
            // 清空?��?�?            document.getElementById('searchInput').value = '';

            // 清空?�?�選中�?標籤
            selectedTags = [];
            renderSelectedTags();

            // ?��??��?下�??�單
            document.getElementById('searchDropdown').classList.remove('active');

            // ?�新下�??�單?�中?�??            updateDropdownSelection();

            // ?�新渲�??�?�優?�券
            renderCoupons(coupons);

            // ?�置?��?欄選中�??�為首�?
            updateSidebarSelection('首�?');

            // 滾�??��???            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        // ?�新?��?欄選中�???        function updateSidebarSelection(activeItem) {
            // 移除?�?�active?�??            document.querySelectorAll('.sidebar-item').forEach(item => {
                item.classList.remove('active');
            });

            // ?��?activeItem設�??��?active?�??            let targetItem = null;

            document.querySelectorAll('.sidebar-item').forEach(item => {
                const text = item.querySelector('.sidebar-text')?.textContent;

                if (activeItem === '首�?' && text === '首�?') {
                    targetItem = item;
                }
            });

            if (targetItem) {
                targetItem.classList.add('active');
            }
        }

        // ?��?欄�????�起?�能
        function toggleSidebar() {
            const sidebar = document.querySelector('.sidebar');
            sidebar.classList.toggle('expanded');
        }

        // ?��?展�?/?�起?��?�?        function setupSidebarToggle() {
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

            // 滑�??�入?��???            sidebar.addEventListener('mouseenter', () => {
                clearTimeout(hoverTimer);
                expandSidebar();
            });

            // 滑�??��??�收起�?延遲300ms�?            sidebar.addEventListener('mouseleave', () => {
                hoverTimer = setTimeout(() => {
                    collapseSidebar();
                }, 300);
            });

            // 點�??�目?��??��??��??��?段�???            sidebar.addEventListener('click', () => {
                clearTimeout(hoverTimer);
                expandSidebar();

                // 3秒�??��??�起
                hoverTimer = setTimeout(() => {
                    collapseSidebar();
                }, 3000);
            });
        }

        // ?��?欄�??�實??        let currentSidebarView = 'home';
        let historyData = JSON.parse(localStorage.getItem('viewHistory') || '[]');

        // ?�新?��?欄�???        function updateSidebarCounts() {
            // ?�新�?localStorage 載入?�覽記�?，確保數?��?�?            historyData = JSON.parse(localStorage.getItem('viewHistory') || '[]');

            // 清�??��??�瀏覽記�?
            if (coupons && coupons.length > 0) {
                const validHistoryData = historyData.filter(item =>
                    coupons.some(coupon => coupon.id === item.id)
                );

                if (validHistoryData.length !== historyData.length) {
                    historyData = validHistoryData;
                    localStorage.setItem('viewHistory', JSON.stringify(historyData));
                }
            }

            // ?��??��?
            const favCount = getFavorites().length;
            const favCountEl = document.getElementById('favCount');
            if (favCount > 0) {
                favCountEl.textContent = favCount;
                favCountEl.style.display = 'inline-block';
            } else {
                favCountEl.style.display = 'none';
            }

            // ?�覽記�??��?
            const historyCountEl = document.getElementById('historyCount');
            console.log('?�覽記�??��?:', historyData); // 調試??
            if (historyData.length > 0) {
                historyCountEl.textContent = historyData.length > 99 ? '99+' : historyData.length;
                historyCountEl.style.display = 'inline-block';
            } else {
                historyCountEl.style.display = 'none';
            }

            // ?��??�新?�員?�單?�徽�?            if (isLoggedIn()) {
                updateSimpleMemberMenuBadges();
            }
        }

        // 設�??��?欄活?��???        function setSidebarActive(action) {
            document.querySelectorAll('.sidebar-item').forEach(item => {
                item.classList.remove('active');
            });
            const activeItem = document.querySelector(`[data-action="${action}"]`);
            if (activeItem) {
                activeItem.classList.add('active');
            }
            currentSidebarView = action;
        }

        // ?��?欄�??��???        function handleSidebarAction(action) {
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

        // 顯示?�?�優?�券（�??��?
        function showAllCoupons() {
            setView('home');
            removeHistoryClearButton(); // 移除清除?��?
            renderCoupons(coupons);
            showSuccessMessage('?�到首�?');
        }

        // 顯示?��??�表
        async function showFavorites() {
            removeHistoryClearButton(); // 移除清除?��?
            await viewFavorites(); // 使用?��??�收?��???        }

        // 顯示?�覽記�?
        function showHistory() {
            const historyIds = historyData.map(item => item.id);
            const historyCoupons = coupons.filter(coupon => historyIds.includes(coupon.id));

            // 清�??��??�瀏覽記�?（優?�券已�?存在�?            const validHistoryData = historyData.filter(item =>
                coupons.some(coupon => coupon.id === item.id)
            );

            // 如�??�無?��??�被清�?，更??localStorage
            if (validHistoryData.length !== historyData.length) {
                historyData = validHistoryData;
                localStorage.setItem('viewHistory', JSON.stringify(historyData));
                updateSidebarCounts(); // ?�新計數
            }

            // 如�?沒�??�覽記�?，顯示空?�??            if (historyData.length === 0) {
                renderEmptyHistory();
                showSuccessMessage('?��?沒�??�覽記�?');
                return;
            }

            // ?�瀏覽?��??��?（�??��??��?�?            const sortedHistory = historyCoupons.sort((a, b) => {
                const aTime = historyData.find(h => h.id === a.id)?.timestamp || 0;
                const bTime = historyData.find(h => h.id === b.id)?.timestamp || 0;
                return bTime - aTime;
            });

            // ?��??��??�添?��??��???            addHistoryClearButton();
            renderCoupons(sortedHistory);
            showSuccessMessage(`顯示 ${sortedHistory.length} ?�瀏覽記�?`);
        }

        // 顯示?��??��?
        function showHotCoupons() {
            removeHistoryClearButton(); // 移除清除?��?
            // ?�瀏覽次數?��?
            const hotCoupons = [...coupons].sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
            renderCoupons(hotCoupons);

            // ?�新計數
            const hotCountEl = document.getElementById('hotCount');
            hotCountEl.textContent = hotCoupons.length;
            hotCountEl.style.display = 'inline-block';

            showSuccessMessage('顯示?��??��?');
        }

        // 顯示?��??��?（模?�地?��?置�?
        function showNearbyCoupons() {
            removeHistoryClearButton(); // 移除清除?��?
            // 模擬?��??��?（隨機選?��?些優?�券�?            const nearbyCount = Math.min(10, coupons.length);
            const shuffled = [...coupons].sort(() => 0.5 - Math.random());
            const nearbyCoupons = shuffled.slice(0, nearbyCount);

            renderCoupons(nearbyCoupons);

            // ?�新計數
            const nearbyCountEl = document.getElementById('nearbyCount');
            nearbyCountEl.textContent = nearbyCount;
            nearbyCountEl.style.display = 'inline-block';

            showSuccessMessage(`?�到 ${nearbyCount} ?��?近優?�`);
        }

        // 顯示?��?活�?
        function showLimitedCoupons() {
            removeHistoryClearButton(); // 移除清除?��?
            const now = new Date();
            const oneWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

            const limitedCoupons = coupons.filter(coupon => {
                if (!coupon.expiry) return false;
                const expiryDate = new Date(coupon.expiry);
                return expiryDate <= oneWeek && expiryDate > now;
            });

            renderCoupons(limitedCoupons);

            // ?�新計數
            const limitedCountEl = document.getElementById('limitedCount');
            limitedCountEl.textContent = limitedCoupons.length;
            limitedCountEl.style.display = 'inline-block';

            showSuccessMessage(`?�到 ${limitedCoupons.length} ?��??�活?�`);
        }

        // 顯示設�??�板
        function showSettings() {
            const settingsModal = document.createElement('div');
            settingsModal.className = 'modal-overlay';
            settingsModal.style.cssText = 'display: flex; z-index: 10000;';

            settingsModal.innerHTML = `
                <div class="modal-content profile-modal-content">
                    <button class="modal-close" onclick="closeSettings()">?</button>
                    <div class="profile-modal-body">
                        <div class="profile-header">
                            <div class="profile-avatar">?��?</div>
                            <h2 class="profile-title">系統設�?</h2>
                        </div>
                        
                        <!-- 顯示設�? -->
                        <div class="profile-section">
                            <h3 class="section-title">顯示設�?</h3>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label class="form-label">
                                        <input type="checkbox" id="showCounts" style="margin-right: 8px;">
                                        顯示?��?欄�???                                    </label>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">
                                        <input type="checkbox" id="autoExpand" style="margin-right: 8px;">
                                        ?��?展�??��?�?                                    </label>
                                </div>
                            </div>
                        </div>
                        
                        <!-- ?��?設�? -->
                        <div class="profile-section">
                            <h3 class="section-title">?��?管�?</h3>
                            <div class="form-grid">
                                <button class="btn-secondary" onclick="clearHistory()" style="margin-bottom: 10px;">
                                    清除?�覽記�?
                                </button>
                                <button class="btn-secondary" onclick="clearSearchHistory()" style="margin-bottom: 10px;">
                                    清除?��?記�?
                                </button>
                                <button class="btn-secondary" onclick="exportData()">
                                    ?�出?��?資�?
                                </button>
                            </div>
                        </div>
                        
                        <div class="profile-actions">
                            <button onclick="closeSettings()" class="btn-secondary">?��?</button>
                            <button onclick="saveSettings()" class="btn-primary">?��?設�?</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(settingsModal);
            document.body.style.overflow = 'hidden';

            // 添�?點�??�景?��??�能
            addClickOutsideToClose(settingsModal, closeSettings);

            // 載入?��?設�?
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
            showSuccessMessage('設�?已儲�?);
            closeSettings();
        }

        function applySettings(settings) {
            // ?�用顯示設�?
            const countElements = document.querySelectorAll('.sidebar-count');
            countElements.forEach(el => {
                if (settings.showCounts === false) {
                    el.style.display = 'none';
                } else {
                    // ?�復?�本?�顯示�?�?                    const count = parseInt(el.textContent) || 0;
                    el.style.display = count > 0 ? 'inline-block' : 'none';
                }
            });
        }

        function clearHistory() {
            if (confirm('確�?要�??��??�瀏覽記�??��?')) {
                historyData = [];
                localStorage.removeItem('viewHistory');
                updateSidebarCounts();
                showSuccessMessage('?�覽記�?已�???);
            }
        }

        function clearSearchHistory() {
            if (confirm('確�?要�??��??��?尋�??��?�?)) {
                searchHistory = [];
                localStorage.removeItem('searchHistory');
                renderSearchHistory();
                showSuccessMessage('?��?記�?已�???);
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
            a.download = '?��?康_?��?資�?.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showSuccessMessage('資�??�出完�?');
        }

        // 顯示幫助中�?
        function showHelp() {
            const helpModal = document.createElement('div');
            helpModal.className = 'modal-overlay';
            helpModal.style.cssText = 'display: flex; z-index: 10000;';

            helpModal.innerHTML = `
                <div class="modal-content profile-modal-content">
                    <button class="modal-close" onclick="closeHelp()">?</button>
                    <div class="profile-modal-body">
                        <div class="profile-header">
                            <div class="profile-avatar">??/div>
                            <h2 class="profile-title">幫助中�?</h2>
                        </div>
                        
                        <!-- 常�??��? -->
                        <div class="profile-section">
                            <h3 class="section-title">常�??��?</h3>
                            <div class="help-item">
                                <h4>如�?使用?��??��?</h4>
                                <p>1. 點�??��??�卡?�查?�詳??br>
                                2. 點�??��??�使?�」�???br>
                                3. 確�?使用後�??��?使用證�?<br>
                                4. ?��?家出示�??�即?�享?�優??/p>
                            </div>
                            <div class="help-item">
                                <h4>如�??��??��??��?</h4>
                                <p>點�??��??�卡?�右上�??��?心�?標�??�在詳�??�面點�??�收?�優?�」�??��?/p>
                            </div>
                            <div class="help-item">
                                <h4>如�??��??��??��?�?/h4>
                                <p>點�?左側?��??�「�??�收?�」�??��??�右上�??�員?�單中�??��??�收?�」�?/p>
                            </div>
                        </div>
                        
                        <!-- ?�能說�? -->
                        <div class="profile-section">
                            <h3 class="section-title">?�能說�?</h3>
                            <div class="help-item">
                                <h4>?? 首�?</h4>
                                <p>顯示?�?�可?��??��???/p>
                            </div>
                            <div class="help-item">
                                <h4>?��? ?��??��?</h4>
                                <p>?��?已收?��??��???/p>
                            </div>
                            <div class="help-item">
                                <h4>?? ?�覽記�?</h4>
                                <p>?��??�近瀏覽?��??��???/p>
                            </div>
                            <div class="help-item">
                                <h4>?�� ?��??��?</h4>
                                <p>?�瀏覽次數?��??�熱?�?��???/p>
                            </div>
                            <div class="help-item">
                                <h4>?? ?��??��?</h4>
                                <p>?�於?��?位置?��?近優?��?模擬?�能�?/p>
                            </div>
                            <div class="help-item">
                                <h4>???��?活�?</h4>
                                <p>?��??��??��??�優?�券</p>
                            </div>
                        </div>
                        
                        <!-- ?�絡資�? -->
                        <div class="profile-section">
                            <h3 class="section-title">?�絡?��?/h3>
                            <div class="help-item">
                                <p><strong>客�?信箱�?/strong> support@songhokang.com</p>
                                <p><strong>客�??�話�?/strong> 0800-123-456</p>
                                <p><strong>?��??��?�?/strong> ?��??�週�? 09:00-18:00</p>
                            </div>
                        </div>
                        
                        <div class="profile-actions">
                            <button onclick="closeHelp()" class="btn-primary">?��?</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(helpModal);
            document.body.style.overflow = 'hidden';

            // 添�?點�??�景?��??�能
            addClickOutsideToClose(helpModal, closeHelp);
        }

        function closeHelp() {
            const modal = document.querySelector('.modal-overlay:last-child');
            if (modal) {
                modal.remove();
                document.body.style.overflow = 'auto';
            }
        }

        // ?�用?�數：為模�?視�?添�?點�??�景?��??�能
        function addClickOutsideToClose(modalElement, closeFunction) {
            modalElement.addEventListener('click', (e) => {
                if (e.target === e.currentTarget) {
                    closeFunction();
                }
            });
        }

        // 添�??�瀏覽記�?
        function addToHistory(coupon) {
            const existingIndex = historyData.findIndex(item => item.id === coupon.id);
            if (existingIndex !== -1) {
                historyData.splice(existingIndex, 1);
            }

            historyData.unshift({
                id: coupon.id,
                timestamp: Date.now()
            });

            // ?�制記�??��?
            if (historyData.length > 50) {
                historyData = historyData.slice(0, 50);
            }

            localStorage.setItem('viewHistory', JSON.stringify(historyData));
            updateSidebarCounts();
        }

        // ?��??�面?��??��??��??�鍵??        function getPageSwitchKey() {
            // ?��??��??�面路�??��??��??��??��??�鍵??            const path = window.location.pathname;
            if (path.includes('vendor')) return 'switched_from_admin_vendor';
            if (path.includes('admin')) return 'switched_from_admin_admin';
            return 'switched_from_admin_customer'; // ?�台?�面
        }

        // ?��?管�??��??��?�?        function handleAdminSwitch() {
            const urlParams = new URLSearchParams(window.location.search);
            const switchSessionId = urlParams.get('switch_session');

            if (switchSessionId) {
                try {
                    // �?sessionStorage ?��??��??��?
                    const switchDataStr = sessionStorage.getItem(switchSessionId);
                    if (switchDataStr) {
                        const switchData = JSON.parse(switchDataStr);

                        // 檢查?�否?��??��?話模�?                        if (switchData.isolatedSession) {
                            console.log('?��??�離?�話?��?:', switchData);

                            // 保�??��??�面?��?始�?話�??��?如�??��?話�?
                            const currentPageSession = {
                                token: localStorage.getItem(LS_TOKEN),
                                user: localStorage.getItem(LS_USER),
                                timestamp: Date.now()
                            };

                            // 如�??��??�面?��?話�?保�??�臨?��?�?                            const tempSessionKey = `temp_original_session_${switchData.user.role}`;
                            if (currentPageSession.token) {
                                localStorage.setItem(tempSessionKey, JSON.stringify(currentPageSession));
                            }

                            // 使用角色專屬?�鍵?�設置�?話�??��?影響?��?角色
                            const targetTokenKey = switchData.targetTokenKey || LS_TOKEN;
                            const targetUserKey = switchData.targetUserKey || LS_USER;

                            localStorage.setItem(targetTokenKey, switchData.token);
                            localStorage.setItem(targetUserKey, JSON.stringify(switchData.user));

                            // ?��??�容?��?�?��，�?設置?�用?�值�?但這只影響?��??��?�?                            localStorage.setItem(LS_TOKEN, switchData.token);
                            localStorage.setItem(LS_USER, JSON.stringify(switchData.user));

                            currentUser = switchData.user;

                            // 使用?�面?��??�鍵?�儲存管?�員?��?資�?
                            const pageSwitchKey = getPageSwitchKey();
                            const switchInfo = {
                                ...switchData.switched_from_admin,
                                isolatedSession: true,
                                targetRole: switchData.user.role,
                                originalSession: switchData.originalSession,
                                tempSession: currentPageSession,
                                pageType: pageSwitchKey // 記�??�面類�?
                            };
                            localStorage.setItem(pageSwitchKey, JSON.stringify(switchInfo));

                        } else {
                            // ?��??��??�模式�??��??�容�?                            localStorage.setItem(LS_TOKEN, switchData.token);
                            localStorage.setItem(LS_USER, JSON.stringify(switchData.user));
                            currentUser = switchData.user;
                            const pageSwitchKey = getPageSwitchKey();
                            localStorage.setItem(pageSwitchKey, JSON.stringify(switchData.switched_from_admin));
                        }

                        // 清�? sessionStorage
                        sessionStorage.removeItem(switchSessionId);

                        // 移除 URL ?�數
                        window.history.replaceState({}, document.title, window.location.pathname);

                        // 強制?�新?�入UI，確保�??�選?�正確顯�?                        setTimeout(() => {
                            updateLoginUI();
                        }, 100);

                        // 顯示?��??��?消息
                        setTimeout(() => {
                            showSuccessMessage(`?? 已�??�到?�戶??{switchData.user.username}?�\n???�面?�離模�?：其他�??��?話�??�影?�\n\n點�??��?角�?��?標可?�入?�人中�?`);
                        }, 500);

                        console.log('管�??��??��?話�??��???', switchData.user);
                    }
                } catch (error) {
                    console.error('?��?管�??��??��?話失??', error);
                }
            }
        }

        // 檢查?�否?�管?�員?��??��?�?        function isAdminSwitchedSession() {
            const pageSwitchKey = getPageSwitchKey();
            return localStorage.getItem(pageSwitchKey) !== null;
        }

        // 顯示管�??��??��???        function showAdminSwitchStatus() {
            if (isAdminSwitchedSession()) {
                try {
                    const pageSwitchKey = getPageSwitchKey();
                    const switchInfo = JSON.parse(localStorage.getItem(pageSwitchKey));

                    // 檢查?�否已�?顯示?�?��?
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

                    const switchTime = switchInfo.switched_at ? new Date(switchInfo.switched_at).toLocaleString() : '?�知';
                    statusDiv.innerHTML = `
                        ?? 管�??��??�模�?| ?��?身份: ${getUser()?.username || currentUser?.username || '?�知'} | 
                        ?�面: ?�台 | ?��??��?: ${switchTime} | 
                        <button onclick="clearAdminSwitch()" style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 6px 12px; border-radius: 6px; margin-left: 8px; cursor: pointer; font-size: 13px; transition: all 0.2s ease;">結�??��?</button>
                    `;

                    document.body.appendChild(statusDiv);

                    // 調整?�面底部?��?，避?�內容被?��?
                    document.body.style.paddingBottom = '60px';
                } catch (error) {
                    console.error('顯示管�??��??��??�失??', error);
                }
            }
        }

        // 清除管�??��??��???        function clearAdminSwitch() {
            if (confirm('確�?要�??�管?�員?��?模�??��??��?清除?��??�面?��?話�?)) {
                try {
                    // ?��??�面?��??��??��?�?                    const pageSwitchKey = getPageSwitchKey();
                    const switchInfoStr = localStorage.getItem(pageSwitchKey);
                    let switchInfo = null;

                    if (switchInfoStr) {
                        switchInfo = JSON.parse(switchInfoStr);
                    }

                    // 清除?��??�面?��??�相?��?�?                    localStorage.removeItem(pageSwitchKey);

                    // 如�??��??��?話模式�??�試?�復?��??�話
                    if (switchInfo && switchInfo.isolatedSession) {
                        console.log('?�復?�面?�離?�話模�??��?始�???);

                        // 清除?��??��??��?�?                        if (switchInfo.targetRole) {
                            const targetTokenKey = `authToken_${switchInfo.targetRole}`;
                            const targetUserKey = `user_${switchInfo.targetRole}`;
                            localStorage.removeItem(targetTokenKey);
                            localStorage.removeItem(targetUserKey);
                        }

                        // ?�復?��??�面?�話（�??��??�話�?                        const tempSessionKey = `temp_original_session_${switchInfo.targetRole}`;
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
                                console.error('?�復?��??�話失�?:', e);
                            }
                        } else {
                            // 沒�??��??�話，�??�通用?��?                            localStorage.removeItem(LS_TOKEN);
                            localStorage.removeItem(LS_USER);
                        }
                    } else {
                        // ?��??�模式�?清除?�用?�話
                        localStorage.removeItem(LS_TOKEN);
                        localStorage.removeItem(LS_USER);
                    }

                    currentUser = null;

                    // 移除?�?��?
                    const statusDiv = document.getElementById('admin-switch-status');
                    if (statusDiv) {
                        statusDiv.remove();
                    }

                    // ?�復?�面?��?
                    document.body.style.paddingBottom = '';

                    // ?�新載入?�面
                    window.location.reload();

                } catch (error) {
                    console.error('清除?��??�?�失??', error);
                    // ?��??�誤?��?強制清�??�?�相?�數??                    const pageSwitchKey = getPageSwitchKey();
                    localStorage.removeItem(pageSwitchKey);
                    localStorage.removeItem('temp_original_session_customer');
                    localStorage.removeItem('temp_original_session_vendor');
                    localStorage.removeItem(LS_TOKEN);
                    localStorage.removeItem(LS_USER);
                    window.location.reload();
                }
            }
        }

        // 事件??��??        document.addEventListener('DOMContentLoaded', function () {
            // ?��??�當?�用??            currentUser = getUser();

            // ?��?管�??��??��?�?            handleAdminSwitch();

            // 檢查認�?並顯示�??��???            setTimeout(() => {
                showAdminSwitchStatus();
            }, 100);

            loadCouponsFromApi();
            loadCategories();
            setupSidebarToggle();
            renderSearchHistory();

            // 清�??��??�瀏覽記�?
            setTimeout(() => {
                const validHistoryData = historyData.filter(item =>
                    coupons.some(coupon => coupon.id === item.id)
                );

                if (validHistoryData.length !== historyData.length) {
                    historyData = validHistoryData;
                    localStorage.setItem('viewHistory', JSON.stringify(historyData));
                }

                updateSidebarCounts();
            }, 1000); // 等�??��??�數?��??��???
            updateSidebarCounts();

            // ?�用?�戶設�?
            const settings = JSON.parse(localStorage.getItem('userSettings') || '{}');
            applySettings(settings);

            // 行�??�側欄�???            const hamburgerBtn = document.getElementById('hamburgerBtn');
            const sidebar = document.querySelector('.sidebar');
            const backdrop = document.getElementById('backdrop');
            const closeMobileMenu = () => { sidebar.classList.remove('open'); backdrop.style.display = 'none'; hamburgerBtn.setAttribute('aria-expanded', 'false'); };
            const openMobileMenu = () => { sidebar.classList.add('open'); backdrop.style.display = 'block'; hamburgerBtn.setAttribute('aria-expanded', 'true'); };
            hamburgerBtn.addEventListener('click', () => {
                if (sidebar.classList.contains('open')) { closeMobileMenu(); } else { openMobileMenu(); }
            });
            backdrop.addEventListener('click', closeMobileMenu);
            // ?��?欄�??��??��?�?            document.querySelectorAll('.sidebar-item[data-action]').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    const action = item.getAttribute('data-action');
                    if (action) {
                        handleSidebarAction(action);
                        // 行�??�自?��??�側?��?
                        if (window.innerWidth <= 768) {
                            closeMobileMenu();
                        }
                    }
                });
            });

            // ?�入?��??��???            const loginBtn = document.querySelector('.login-btn');
            updateLoginUI();
            const roleMenu = document.getElementById('roleMenu');
            const toggleRoleMenu = () => { roleMenu.classList.toggle('active'); };
            loginBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleRoleMenu(); });
            document.addEventListener('click', (e) => { if (!e.target.closest('#roleMenu')) roleMenu.classList.remove('active'); });
            // 點�??��??��??��??�data-role屬性�??��??��?�?            document.querySelectorAll('#roleMenu .role-item[data-role]').forEach(btn => btn.addEventListener('click', (e) => {
                const role = e.currentTarget.getAttribute('data-role');
                if (!role) return; // 如�?沒�?data-role屬性�?不執�?                roleMenu.classList.remove('active');
                window.__selectedRole = role; // 設�??�選角色，�? openAuth 使用
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

            // 註�?角色?��??�顯�??��?廠�?欄�?
            // 已移?��??��??��?保�?欄�?顯示??openAuth ?�制

            // ?��?框�?�?            const searchInput = document.getElementById('searchInput');
            const searchDropdown = document.getElementById('searchDropdown');
            const searchWrapper = document.getElementById('searchWrapper');

            // 點�??��?框容?��??�焦?�輸?��?
            searchWrapper.addEventListener('click', (e) => {
                if (e.target !== searchInput) {
                    searchInput.focus();
                }
            });

            searchInput.addEventListener('focus', () => {
                searchDropdown.classList.add('active');
                updateDropdownSelection(); // ?�新?�中?�??            });

            // ??Enter ?��??��??��?
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

            // 輸入?�即?�篩?��?不�??��?尋�??��?
            searchInput.addEventListener('input', () => {
                performSearch();
            });

            // 點�??��?框�??��??��??�選??            document.addEventListener('click', (e) => {
                if (!e.target.closest('.search-container')) {
                    searchDropdown.classList.remove('active');
                    closeFilterPanel();
                }
            });

            // ?��?篩選?��?事件
            document.getElementById('filterToggleBtn').addEventListener('click', (e) => {
                e.stopPropagation();
                toggleFilterPanel();
            });

            // Logo 點�??��??��?�?            document.querySelector('.logo').addEventListener('click', (e) => {
                e.preventDefault();
                resetToHomepage();
            });

            // ?��??��?欄�?件監?�器已移?��?使用?��?data-action屬性�???
            // ?�近�?尋�??��??��?�?            document.querySelectorAll('.recent-item').forEach(item => {
                item.addEventListener('click', () => {
                    const searchTerm = item.getAttribute('data-search');
                    addTag(searchTerm, 'search');
                    document.getElementById('searchDropdown').classList.remove('active');
                });
            });

            // ?��?標籤點�?事件 (?�援複選)
            document.querySelectorAll('.category-chip').forEach(item => {
                item.addEventListener('click', () => {
                    const category = item.getAttribute('data-category');
                    const categoryText = item.querySelector('.category-chip-text').textContent;

                    // 檢查?�否已選�?                    const isSelected = selectedTags.some(tag => tag.text === categoryText);

                    if (isSelected) {
                        // 如�?已選中�??�移??                        removeTag(categoryText);
                    } else {
                        // 如�??�選中�??�添?�並保�??��?紀??                        addTag(categoryText, 'category');
                        saveSearchHistory(categoryText);
                    }

                    updateDropdownSelection();
                });
            });

            // ?��?標籤點�?事件 (?�援複選)
            document.querySelectorAll('.trending-tag').forEach(item => {
                item.addEventListener('click', () => {
                    const tag = item.getAttribute('data-tag');

                    // 檢查?�否已選�?                    const isSelected = selectedTags.some(selectedTag => selectedTag.text === tag);

                    if (isSelected) {
                        // 如�?已選中�??�移??                        removeTag(tag);
                    } else {
                        // 如�??�選中�??�添?�並保�??��?紀??                        addTag(tag, 'trending');
                        saveSearchHistory(tag);
                    }

                    updateDropdownSelection();
                });
            });

            // 彈�??��?事件
            document.getElementById('modalClose').addEventListener('click', (e) => { e.stopPropagation(); closeModal(); });
            document.getElementById('modalOverlay').addEventListener('click', (e) => {
                if (e.target === e.currentTarget) {
                    closeModal();
                }
            });
            // ?�箱?��?事件
            const lightboxOverlay = document.getElementById('lightboxOverlay');
            lightboxOverlay.addEventListener('click', (e) => {
                // 點�?黑色?�?��??��?角�??��??��??��???                if (e.target === e.currentTarget || e.target.id === 'lightboxClose') {
                    closeLightbox();
                }
            });
            document.getElementById('lightboxClose').addEventListener('click', closeLightbox);

            // ESC ?��??��?�?            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    closeModal();
                    closeLightbox();
                }
            });
        });

        // ?�入 UI ?�制
        function updateLoginUI() {
            const btn = document.querySelector('.login-btn');
            const roleMenu = document.getElementById('roleMenu');
            if (!btn) return;

            if (isLoggedIn()) {
                const user = getUser();
                const role = (user?.role || '').toLowerCase();

                const avatarUrl = user?.avatar ? (user.avatar.startsWith('http') ? user.avatar : (user.avatar.startsWith('/') ? user.avatar : '/' + user.avatar)) : '';

                if (role === 'customer') {
                    // 一?��??��?顯示?��?（�??�用?��??��?顯示?�示�?                    btn.innerHTML = avatarUrl
                        ? `<img src="${avatarUrl}" alt="avatar" style="width:24px;height:24px;border-radius:50%;object-fit:cover;">`
                        : `<span style="color: #FCA311;">?��</span>`;
                    btn.title = `?�員�?{user?.username || user?.email || '?�知'}`;

                    // ?�新角色?�單?�簡?��??�員?�單
                    roleMenu.innerHTML = `
                        <div style="padding: 8px 12px; border-bottom: 1px solid rgba(0,0,0,0.1); margin-bottom: 4px;">
                            <div style="font-size: 12px; color: #666; margin-bottom: 2px;">?�員</div>
                            <div style="font-size: 14px; font-weight: 600; color: #333;">${user?.username || user?.email || '?�知?�戶'}</div>
                        </div>
                        <button class="role-item member-action" onclick="goToProfile()">
                            <span style="margin-right: 8px;">?��</span>?�人中�?
                        </button>
                        <button class="role-item member-action" onclick="viewFavorites()">
                            <span style="margin-right: 8px;">?��?</span>?��??��? <span class="menu-badge" id="menuFavCount"></span>
                        </button>
                        <div style="border-top: 1px solid rgba(0,0,0,0.1); margin-top: 4px; padding-top: 4px;">
                            <button class="role-item member-action" onclick="logout()" style="color: #dc2626;">
                                <span style="margin-right: 8px;">?��</span>?�出
                            </button>
                        </div>
                    `;

                    // 移除?�?��??�data-role屬性�??��?事件??��?��?�?                    document.querySelectorAll('#roleMenu .role-item').forEach(item => {
                        item.removeAttribute('data-role');
                    });

                    // ?�新?�員?�單中�?徽�?計數
                    updateSimpleMemberMenuBadges();
                } else {
                    // 管�??��?廠�?：顯示頭?��??�出?�示
                    if (avatarUrl) {
                        btn.innerHTML = `<img src="${avatarUrl}" alt="avatar" style="width:24px;height:24px;border-radius:50%;object-fit:cover;">`;
                    } else {
                        btn.textContent = '??;
                    }
                    btn.title = '?�出';
                    roleMenu.innerHTML = `
                        <button class="role-item" onclick="logout()" style="color: #dc2626;">
                            <span style="margin-right: 8px;">?��</span>?�出
                        </button>
                    `;
                }
            } else {
                // ?�登?��?顯示角色?��?
                btn.textContent = '?��';
                btn.title = '?�入';
                roleMenu.innerHTML = `
                    <button class="role-item" data-role="customer">一?�用??/button>
                    <button class="role-item" data-role="vendor">廠�?後台</button>
                    <button class="role-item" data-role="admin">管�?後台</button>
                `;

                // ?�新綁�?角色?��?事件（�??�用?�未?�入?�?��?角色?�單�?                setTimeout(() => {
                    document.querySelectorAll('#roleMenu .role-item[data-role]').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            const role = e.currentTarget.getAttribute('data-role');
                            if (!role) return; // 如�?沒�?data-role屬性�?不執�?                            roleMenu.classList.remove('active');
                            window.__selectedRole = role;
                            if (role === 'admin') { openAuth('login'); }
                            else if (role === 'vendor') { openAuth('register'); }
                            else { openAuth('register'); }
                        });
                    });
                }, 100);
            }
        }

        // ?�員?�能已整?�到?��??�個人?�面 (profile.html)






        async function viewFavorites() {
            document.getElementById('roleMenu').classList.remove('active');

            // 如�?已登?��?從API載入?��??�表
            if (isLoggedIn()) {
                try {
                    const res = await fetch('api/favorites', {
                        headers: { 'Authorization': `Bearer ${getToken()}` }
                    });
                    const json = await res.json();
                    if (json.success && json.data?.favorites) {
                        // ?�新?�地?��??�表
                        const favoriteIds = json.data.favorites.map(fav => fav.id);
                        setFavorites(favoriteIds);
                    }
                } catch (e) {
                    console.warn('載入?��??�表失�?:', e);
                }
            }

            // 設置?��?欄活?��???            setSidebarActive('favorites');
            setView('favorites');
            renderCoupons(); // ?�新渲�??��??�以顯示?��??�容
            showSuccessMessage('?��??�收?��???);
        }

        function viewHistory() {
            document.getElementById('roleMenu').classList.remove('active');

            // ?�接使用?��?欄�?歷史記�??�能
            setSidebarActive('history');
            showHistory();
            showSuccessMessage(`已顯�?${historyData.length} 筆瀏覽記�?`);
        }

        function logout() {
            document.getElementById('roleMenu').classList.remove('active');
            clearAuth();
            setView('home');
            showSuccessMessage('已�??�登??);
        }

        // ?�新簡�??�員?�單徽�?計數
        function updateSimpleMemberMenuBadges() {
            setTimeout(() => {
                // ?��??��?
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

        // 跳�??�個人中�??�面
        function goToProfile() {
            document.getElementById('roleMenu').classList.remove('active');
            window.location.href = 'profile.html';
        }

        // 移除複�??��??��??��?統�??�個人?�面?��?

        // ?��?篩選?�能
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

            // ?��??��?下�??�單
            dropdown.classList.remove('active');

            // ?��?篩選?�板
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
            // 清除?��?篩選
            document.querySelectorAll('#categoryFilters input[type="checkbox"]').forEach(cb => {
                cb.checked = false;
            });

            // ?�置?��??��?篩選
            document.querySelector('input[name="expiry"][value="all"]').checked = true;

            // ?�置?��??��?
            document.getElementById('sortSelect').value = 'default';

            // ?�新載入?�?�優?�券
            renderCoupons(coupons);
            showSuccessMessage('已�??��??�篩?��?�?);
        }

        function applyAdvancedFilters() {
            let filteredCoupons = [...coupons];

            // ?��?篩選
            const selectedCategories = Array.from(document.querySelectorAll('#categoryFilters input[type="checkbox"]:checked'))
                .map(cb => cb.value);

            if (selectedCategories.length > 0) {
                filteredCoupons = filteredCoupons.filter(coupon =>
                    selectedCategories.some(category => coupon.category.includes(category))
                );
            }

            // ?��??��?篩選
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

            // ?��?
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
            showSuccessMessage(`已�??�篩?��?件�??�到 ${count} 張優?�券`);
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
            // ?��?從�??�選?��??��??�設角色調整表單（隱?��?顯示廠�??��??��?位�?
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

        // 顯示?��?訊息
        function showSuccessMessage(message) {
            // ?�建?��??�示
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
                    <span style="font-size: 18px;">??/span>
                    <span>${message}</span>
                </div>
            `;

            document.body.appendChild(successDiv);

            // ?�畫顯示
            setTimeout(() => {
                successDiv.style.transform = 'translateX(0)';
            }, 100);

            // 3秒�??��?消失
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
            if (!username || !password) { showSuccessMessage('請填寫帳?��?密碼'); return; }
            try {
                const res = await fetch('api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
                const json = await res.json();
                if (json.success) {
                    setAuth(json.data.token, json.data.user);
                    const role = (json.data.user?.role || '').toLowerCase();
                    // 額�?存�?份到角色專屬 token，方便�?裝置多�?�?                    const roleKey = ROLE_TOKENS[role];
                    if (roleKey) localStorage.setItem(roleKey, json.data.token);
                    if (role === 'admin') {
                        showSuccessMessage('?�入?��?，�?往管�?後台');
                        window.open('admin/', '_blank');
                        closeAuth();
                        return;
                    }
                    if (role === 'vendor') {
                        showSuccessMessage('?�入?��?，�?往廠�?中�?');
                        window.open('vendor/', '_blank');
                        closeAuth();
                        return;
                    }
                    if (role === 'customer') {
                        showSuccessMessage(`歡�??��?�?{json.data.user?.username || '?�員'}！`);
                        closeAuth();
                        // 一?��??��??��??��?不跳�?                        return;
                    }
                    closeAuth();
                    showSuccessMessage('?�入?��?');
                }
                else { showSuccessMessage(json.message || '?�入失�?'); }
            } catch (err) {
                console.error('?�入?�誤:', err);
                showSuccessMessage('網路?�誤，�?稍�??�試');
            }
        }

        async function onRegisterSubmit(e) {
            e.preventDefault();
            const username = document.getElementById('regUsername').value.trim();
            const email = document.getElementById('regEmail').value.trim();
            const password = document.getElementById('regPassword').value;
            const password2 = document.getElementById('regPassword2').value;
            const phone = document.getElementById('regPhone').value.trim();
            // 角色?��???openAuth 設�?
            const role = (window.__selectedRole === 'vendor') ? 'vendor' : 'customer';
            const company_name = document.getElementById('regCompany').value.trim();
            if (!username || !email || !password) { showSuccessMessage('請�??�填寫用?��??�電子郵件�?密碼'); return; }
            if (password !== password2) { showSuccessMessage('?�次密碼不�???); return; }
            if (role === 'vendor' && !company_name) { showSuccessMessage('廠�?註�?請填寫公?��?�?); return; }
            try {
                const body = { username, email, password, confirm_password: password2, phone, role };
                if (role === 'vendor') { body.company_name = company_name; }
                const res = await fetch('api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
                let json;
                try { json = await res.clone().json(); }
                catch { const txt = await res.text(); showSuccessMessage('註�?失�?�? + txt); return; }
                if (json.success) {
                    showSuccessMessage('註�??��?，�?使用帳�??�入');
                    setTimeout(() => openAuth('login'), 1500);
                } else {
                    const details = json.details ? (typeof json.details === 'string' ? json.details : JSON.stringify(json.details)) : '';
                    showSuccessMessage((json.message || '註�?失�?') + (details ? ('�? + details) : ''));
                }
            } catch (err) {
                console.error('註�??�誤:', err);
                showSuccessMessage('網路?�誤，�?稍�??�試');
            }
        }

        // ?��??��?使用彈�??�側?�次要�???        document.addEventListener('click', (e) => {
            if (e.target && e.target.classList.contains('btn-secondary') && currentCoupon) {
                e.preventDefault();
                toggleFavorite(currentCoupon).then(() => { syncModalFavoriteButton(); updateFavCount(); });
            }
            // ?��??�表中�??�除?��?（�?件代?��?
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
            // ?��??��?角快?�收??            if (e.target && e.target.matches('[data-action="quick-fav"]')) {
                e.stopPropagation();
                const id = Number(e.target.getAttribute('data-id'));
                const c = coupons.find(x => x.id === id);
                if (c) {
                    toggleFavorite(c).then(() => {
                        // ?��??��?�???�符??                        const btn = e.target;
                        const nowFavs = new Set(getFavorites());
                        const active = nowFavs.has(id);
                        btn.classList.toggle('active', active);
                        btn.textContent = active ? '?? : '??;
                        updateFavCount();
                        // ?�在?��?視�?且已?��??��?，直?�移?�該?��?
                        if (isFavoritesView() && !active) {
                            const card = btn.closest('.coupon-card');
                            if (card) card.remove();
                            // ?�刪?��?顯示空畫??                            const remain = document.querySelectorAll('.coupon-card').length;
                            if (remain === 0) renderEmptyFavorites();
                        }
                    });
                }
            }
        });

        // ?�新?��?欄收?�數
        function updateFavCount() {
            const el = document.getElementById('favCount');
            if (!el) return;
            const count = getFavorites().length;
            if (count > 0) { el.textContent = String(count); el.style.display = ''; }
            else { el.textContent = ''; el.style.display = 'none'; }
        }
    
