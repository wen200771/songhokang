        // ?œå?ç´€?„ç®¡??        let searchHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');

        function saveSearchHistory(query) {
            if (!query.trim()) return;

            // ç§»é™¤?è??…ç›®
            searchHistory = searchHistory.filter(item => item !== query);
            // æ·»å??°é???            searchHistory.unshift(query);
            // ?åˆ¶?€å¤šä?å­?0ç­†ç???            searchHistory = searchHistory.slice(0, 10);

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
                    <div class="search-history-delete" onclick="event.stopPropagation(); removeSearchHistory('${query}')" title="?ªé™¤">
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

        // ?¸ä¸­?„æ?ç±¤é™£??        let selectedTags = [];
        let currentCoupon = null;
        let currentView = 'home';

        // ?¬åœ°?²å??µå?
        // ?å°ä½¿ç”¨?¨ç???token keyï¼Œé¿?è?ç®¡ç??¡å??°è?çª?        const LS_TOKEN = 'authToken_customer';
        const LS_USER = 'authUser';
        // é¡å??ºæ¸¬è©¦é?æ®µæ?ä¾›ä??‹è??²å?å±?tokenï¼Œå?è¨±å?è£ç½®?Œæ??»å…¥
        const ROLE_TOKENS = {
            admin: 'authToken_admin',
            vendor: 'authToken_vendor',
            customer: 'authToken_customer'
        };
        const LS_FAVORITES = 'favorites';
        const LS_HISTORY = 'viewHistory';

        // è¦–å??€?‹è??¤æ–·
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

        // ?ªæ??¸è??™ï?å°‡ç”± API å¡«å?ï¼›è‹¥ API ?¡è??™å?ä½¿ç”¨?¬åœ°?‡è??™ï?
        let coupons = [];
        let currentUser = null;

        // ?Ÿæ??‡è??™ï?ä½œç‚º API ?¡è??™æ??„å??™ï?
        function buildDummyCoupons() {
            coupons = [];
            const categories = ['ç¾é?é¤é£²', 'è³¼ç‰©?†å?', 'ç¾å®¹ä¿é?', 'ä¼‘é?å¨›æ?', '?…é?ä½å®¿', '?¥åº·?«ç?'];
            const storeTypes = {
                'ç¾é?é¤é£²': ['é¤å»³', '?–å•¡å»?, 'å°å?åº?, '?«é?åº?, '?’çƒ¤åº?],
                'è³¼ç‰©?†å?': ['?é£¾åº?, '3Cè³? ´', '?¸å?', 'è¶…å?', '?¾è²¨'],
                'ç¾å®¹ä¿é?': ['ç¾é«®æ²™é?', 'ç¾ç”²åº?, 'SPA?ƒé¤¨', 'ç¾å®¹??, '?‰æ‘©åº?],
                'ä¼‘é?å¨›æ?': ['KTV', '?»å½±??, '?Šæˆ²??, 'ç¶²å?', 'ä¿é½¡?ƒé¤¨'],
                '?…é?ä½å®¿': ['é£¯å?', 'æ°‘å®¿', '?…è?ç¤?, 'ç§Ÿè?è¡?, '?¯é?'],
                '?¥åº·?«ç?': ['è¨ºæ?', '?¥å?', '?¥èº«??, '?œç??™å®¤', '?©ç?æ²»ç?']
            };
            for (let i = 1; i <= 50; i++) {
                const category = categories[Math.floor(Math.random() * categories.length)];
                const storeType = storeTypes[category][Math.floor(Math.random() * storeTypes[category].length)];

                coupons.push({
                    id: i,
                    image: `img/?å¥½åº·æ?å®????(${i}).jpg`,
                    storeName: `${storeType}${i}`,
                    category: category,
                    title: `?æ??ªæ?æ´»å? ${i}`,
                    description: `?™æ˜¯ç¬?{i}?‹å„ª? åˆ¸?„è©³ç´°èªª?ï??…å«?„ç¨®ä½¿ç”¨æ¢ä»¶?Œé??¶ã€‚`,
                    expiry: '2024/12/31',
                    usage: 'æ¯äºº?ç”¨ä¸€æ¬?,
                    address: `?°å?å¸‚ä¿¡ç¾©å?ä¿¡ç¾©è·¯ä?æ®?{i}?Ÿ`,
                    phone: `02-2${String(i).padStart(3, '0')}-${String(i * 10).padStart(4, '0')}`
                });
            }
        }

        // å¾?API è¼‰å…¥è³‡æ?
        async function loadCouponsFromApi() {
            try {
                const res = await fetch('api/coupons?page=1&pageSize=50');
                const json = await res.json();
                const items = json?.data?.coupons || [];
                if (Array.isArray(items) && items.length > 0) {
                    coupons = items.map((item, idx) => ({
                        id: item.id || idx + 1,
                        image: item.image && item.image.trim() !== '' ? item.image : `img/?å¥½åº·æ?å®????(${(idx % 50) + 1}).jpg`,
                        storeName: item.storeName || '?ˆä?åº—å®¶',
                        category: item.category || 'ä¸€?¬å„ª??,
                        title: item.title || '?ªæ?æ´»å?',
                        description: item.description || 'è©³æ?è«‹è?æ´»å?èªªæ???,
                        expiry: item.expiry || '',
                        usage: item.usage || 'æ¯äºº?ç”¨ä¸€æ¬?,
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

        // å¾?API è¼‰å…¥?†é?ä¸¦æ¸²?“åˆ°?œå?ä¸‹æ??‡é€²é?ç¯©é¸
        async function loadCategories() {
            try {
                const res = await fetch('api/categories?active=1');
                const json = await res.json();
                const items = Array.isArray(json?.data) ? json.data : json?.data?.items || [];
                const categories = items.length > 0 ? items : [
                    { name: 'ç¾é?é¤é£²', icon: '?½ï¸? },
                    { name: 'è³¼ç‰©?†å?', icon: '??ï¸? },
                    { name: 'ç¾å®¹ä¿é?', icon: '??' },
                    { name: 'ä¼‘é?å¨›æ?', icon: '?®' },
                    { name: '?…é?ä½å®¿', icon: '?ˆï?' },
                    { name: '?¥åº·?«ç?', icon: '?¥' }
                ];

                // ?œå?ä¸‹æ?ï¼šå?é¡ç€è¦½ chips
                const grid = document.getElementById('searchCategoryGrid');
                if (grid) {
                    grid.innerHTML = categories.map(cat => `
                        <div class="category-chip" data-category="${cat.slug || cat.name}">
                            <span class="category-chip-icon">${cat.icon || ''}</span>
                            <span class="category-chip-text">${cat.name}</span>
                        </div>
                    `).join('');

                    // ç¶å?é»æ?äº‹ä»¶
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

                // ?²é?ç¯©é¸ï¼šcheckbox ?—è¡¨
                const filters = document.getElementById('categoryFilters');
                if (filters) {
                    filters.innerHTML = categories.map(cat => `
                        <label class="filter-checkbox">
                            <input type="checkbox" value="${cat.name}"> ${cat.name}
                        </label>
                    `).join('');
                }
            } catch (e) {
                // ?œé?å¤±æ??³å¯ï¼Œä??¯ç”¨?è¨­?‡è???            }
        }

        // æ¸²æ??ªæ??¸å¡??- Pinterest é¢¨æ ¼
        function renderCoupons(couponsToRender = coupons) {
            const container = document.getElementById('masonryContainer');
            container.classList.remove('empty');
            container.innerHTML = '';

            // å¦‚æ??¯æ”¶?è??–ï??ªé¡¯ç¤ºæ”¶?ç??ªæ???            if (isFavoritesView()) {
                const favoriteIds = new Set(getFavorites());
                couponsToRender = couponsToRender.filter(coupon => favoriteIds.has(coupon.id));

                // å¦‚æ?æ²’æ??¶è??„å„ª? åˆ¸ï¼Œé¡¯ç¤ºç©º?€??                if (couponsToRender.length === 0) {
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
                        // é»æ??›å??–ç§»?¤æ”¶?ä??‹å?è©³æ?
                        return;
                    }
                    openModal(coupon);
                });

                // æ·»å?è¼‰å…¥?•ç•«
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
                        <button class="view-btn">?¥ç??ªæ?</button>
                    </div>
                `;

                container.appendChild(card);

                // å»¶é²é¡¯ç¤º?•ç•«
                setTimeout(() => {
                    card.style.transition = 'all 0.4s ease';
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, index * 50);
            });
        }

        // ?‘ç??¶è??ºç©º?‚ç??«é¢
        function renderEmptyFavorites() {
            const container = document.getElementById('masonryContainer');
            container.classList.add('empty');
            container.innerHTML = `
                <div style="display:flex;align-items:center;justify-content:center;width:100%;min-height:40vh;">
                    <div style="max-width:640px;width:90%;background:rgba(248,247,246,0.85);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(252,163,17,0.2);border-radius:24px;padding:32px;box-shadow:0 12px 40px rgba(252,163,17,0.15), inset 0 1px 0 rgba(255,255,255,0.9);text-align:center;">
                        <div style="font-size:20px;color:#333;font-weight:700;margin-bottom:8px;">?®å?æ²’æ??¶è?</div>
                        <div style="font-size:14px;color:#666;margin-bottom:18px;">?¯ä»¥?¨å¡?‡å³ä¸Šè?é»?<span style=\"color:#e60023\">??/span> ? å…¥?¶è?</div>
                        <button class="btn-primary" id="backToHomeBtn">?åˆ°é¦–é?</button>
                    </div>
                </div>`;
            const btn = document.getElementById('backToHomeBtn');
            if (btn) btn.addEventListener('click', () => { resetToHomepage(); });
        }

        // ?è¦½è¨˜é??ºç©º?‚ç??«é¢
        function renderEmptyHistory() {
            const container = document.getElementById('masonryContainer');
            container.classList.add('empty');
            container.innerHTML = `
                <div style="display:flex;align-items:center;justify-content:center;width:100%;min-height:40vh;">
                    <div style="max-width:640px;width:90%;background:rgba(248,247,246,0.85);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(252,163,17,0.2);border-radius:24px;padding:32px;box-shadow:0 12px 40px rgba(252,163,17,0.15), inset 0 1px 0 rgba(255,255,255,0.9);text-align:center;">
                        <div style="font-size:20px;color:#333;font-weight:700;margin-bottom:8px;">?®å?æ²’æ??è¦½è¨˜é?</div>
                        <div style="font-size:14px;color:#666;margin-bottom:18px;">é»æ??ªæ??¸å¡?‡æŸ¥?‹è©³?…å??ƒè‡ª?•è???/div>
                        <button class="btn-primary" id="backToHomeFromHistory">?åˆ°é¦–é?</button>
                    </div>
                </div>`;
            const btn = document.getElementById('backToHomeFromHistory');
            if (btn) btn.addEventListener('click', () => { resetToHomepage(); });
        }

        // æ·»å??è¦½è¨˜é?æ¸…é™¤?‰é?
        function addHistoryClearButton() {
            // ç§»é™¤å·²å??¨ç??‰é?
            const existingButton = document.getElementById('historyClearButton');
            if (existingButton) {
                existingButton.remove();
            }

            // ?µå»ºæ¸…é™¤?‰é?
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
                <span>??ï¸?/span>
                <span>æ¸…é™¤?€?‰è???/span>
            `;

            // æ·»å?hover?ˆæ?
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

            // æ·»å?é»æ?äº‹ä»¶
            clearButton.addEventListener('click', () => {
                if (confirm('ç¢ºå?è¦æ??¤æ??‰ç€è¦½è¨˜é??ï?æ­¤æ?ä½œç„¡æ³•å¾©?Ÿã€?)) {
                    clearAllHistory();
                }
            });

            document.body.appendChild(clearButton);
        }

        // æ¸…é™¤?€?‰ç€è¦½è¨˜é?
        function clearAllHistory() {
            historyData = [];
            localStorage.removeItem('viewHistory');
            updateSidebarCounts();

            // ç§»é™¤æ¸…é™¤?‰é?
            removeHistoryClearButton();

            // é¡¯ç¤ºç©ºç???            renderEmptyHistory();
            showSuccessMessage('?€?‰ç€è¦½è¨˜é?å·²æ???);
        }

        // ç§»é™¤?è¦½è¨˜é?æ¸…é™¤?‰é?
        function removeHistoryClearButton() {
            const clearButton = document.getElementById('historyClearButton');
            if (clearButton) {
                clearButton.remove();
            }
        }

        // ?‹å?å½ˆç?
        async function openModal(coupon) {
            try {
                // æ·»å??°ç€è¦½è¨˜é?
                addToHistory(coupon);

                // ?ˆé¡¯ç¤ºåŸº?¬è?è¨?                const webp = coupon.image.replace(/\.jpg$/i, '.webp');
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

                // å¾API?²å??´è©³ç´°ç?è³‡è?
                const res = await fetch(`api/coupons/${coupon.id}`);
                if (res.ok) {
                    const data = await res.json();
                    const detailedCoupon = data.data || data;

                    // ?´æ–°è©³ç´°è³‡è?
                    if (detailedCoupon.terms) {
                        document.getElementById('offerDescription').textContent = detailedCoupon.terms;
                    }
                    if (detailedCoupon.discount_type && detailedCoupon.discount_value) {
                        const discountText = getDiscountText(detailedCoupon.discount_type, detailedCoupon.discount_value);
                        document.getElementById('offerUsage').textContent = discountText;
                    }

                    // ?´æ–°?è¦½?¸ï?å¦‚æ??‰ç?è©±ï?
                    if (detailedCoupon.view_count !== undefined) {
                        incrementViewCount(coupon.id);
                    }
                }
            } catch (e) {
                console.warn('?¡æ?è¼‰å…¥è©³ç´°?ªæ??¸è?è¨?', e);
            }

            // ?Œæ­¥å½ˆç??¶è??‰é??‡å?
            syncModalFavoriteButton();

            document.getElementById('modalOverlay').classList.add('active');
            document.body.style.overflow = 'hidden';

            // ç¶å??ˆç®±?‹å?
            modalImg.onclick = () => openLightbox(modalImg.currentSrc || modalImg.src);
            // è¨˜é??è¦½æ­·å²
            addHistory(coupon.id);
        }

        // è¼”åŠ©?½æ•¸ï¼šæ ¼å¼å??˜æ‰£?‡å?
        function getDiscountText(type, value) {
            switch (type) {
                case 'percentage': return `${value}% ?˜æ‰£`;
                case 'fixed': return `?˜æ‰£ NT$${value}`;
                case 'bogo': return 'è²·ä??ä?';
                case 'free': return '?è²»é«”é?';
                default: return 'æ¯äºº?ç”¨ä¸€æ¬?;
            }
        }

        // å¢å??è¦½?¸ï??œé??´æ–°ï¼?        async function incrementViewCount(couponId) {
            try {
                await fetch(`api/coupons/${couponId}/view`, { method: 'POST' });
            } catch (e) {
                // ?œé?å¤±æ?
            }
        }

        function syncModalFavoriteButton() {
            const favs = new Set(getFavorites());
            const isFav = currentCoupon ? favs.has(currentCoupon.id) : false;
            const btn = document.querySelector('#modalOverlay .btn-secondary');
            if (btn) {
                btn.textContent = isFav ? '?–æ??¶è?' : '?¶è??ªæ?';
            }
        }

        function toggleFavoriteFromModal() {
            if (currentCoupon) {
                toggleFavorite(currentCoupon);
                syncModalFavoriteButton();
            }
        }

        // ?ªæ??¸ä½¿?¨å???        async function useCoupon(coupon) {
            if (!coupon) return;

            if (!isLoggedIn()) {
                showSuccessMessage('è«‹å??»å…¥?èƒ½ä½¿ç”¨?ªæ???);
                closeModal();
                // ?¯ä»¥?‹å??»å…¥è¦–ç?
                return;
            }

            // æª¢æŸ¥?¯å¦å·²ç?ä½¿ç”¨??            const usedCoupons = getUsedCoupons();
            if (usedCoupons.includes(coupon.id)) {
                showSuccessMessage('?¨å·²ç¶“ä½¿?¨é??™å¼µ?ªæ??¸ä?');
                return;
            }

            // ç¢ºè?ä½¿ç”¨?ªæ???            const confirmModal = document.createElement('div');
            confirmModal.className = 'modal-overlay';
            confirmModal.style.cssText = 'display: flex; z-index: 10001;';

            confirmModal.innerHTML = `
                <div class="modal-content" style="max-width: 400px;">
                    <div style="padding: 28px; text-align: center;">
                        <h3 style="margin-bottom: 16px; color: #374151;">?« ä½¿ç”¨?ªæ???/h3>
                        <p style="margin-bottom: 20px; color: #6b7280;">
                            ç¢ºå?è¦ä½¿?¨ã€?{coupon.title}?å?ï¼?br>
                            ä½¿ç”¨å¾Œå??¡æ??æ¬¡ä½¿ç”¨æ­¤å„ª? åˆ¸??                        </p>
                        <div style="display: flex; gap: 12px;">
                            <button onclick="cancelUseCoupon()" class="btn-secondary" style="flex: 1;">?–æ?</button>
                            <button onclick="confirmUseCoupon(${coupon.id})" class="btn-primary" style="flex: 1;">ç¢ºè?ä½¿ç”¨</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(confirmModal);
            document.body.style.overflow = 'hidden';

            // æ·»å?é»æ??Œæ™¯?œé??Ÿèƒ½
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
                // èª¿ç”¨APIè¨˜é?ä½¿ç”¨
                const response = await fetch(`api/coupons/${couponId}/use`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${getToken()}`
                    }
                });

                if (response.ok) {
                    const result = await response.json();

                    // è¨˜é??°æœ¬?°å???                    const usedCoupons = getUsedCoupons();
                    usedCoupons.push(couponId);
                    setUsedCoupons(usedCoupons);

                    // ?œé??€?‰å?çª?                    cancelUseCoupon();
                    closeModal();

                    // é¡¯ç¤º?å?è¨Šæ¯
                    showSuccessMessage('?? ?ªæ??¸ä½¿?¨æ??Ÿï?è«‹å?åº—å®¶?ºç¤ºæ­¤æ?è­?);

                    // ?Ÿæ?ä½¿ç”¨?‘è?ï¼ˆå??«QR Codeï¼?                    generateUsageProof(currentCoupon, result);
                } else {
                    throw new Error('ä½¿ç”¨?ªæ??¸å¤±??);
                }
            } catch (e) {
                console.error('ä½¿ç”¨?ªæ??¸å¤±??', e);
                showSuccessMessage('ä½¿ç”¨å¤±æ?ï¼? + e.message);
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
                        <div style="font-size: 48px; margin-bottom: 16px;">?«</div>
                        <h3 style="margin-bottom: 12px;">?ªæ??¸ä½¿?¨æ?è­?/h3>
                        
                        <div style="background: rgba(255,255,255,0.2); padding: 16px; border-radius: 12px; margin-bottom: 16px;">
                            <div style="font-size: 18px; font-weight: 700; margin-bottom: 8px;">${coupon.title}</div>
                            <div style="font-size: 14px; opacity: 0.9;">${coupon.storeName || coupon.vendor_name || 'åº—å®¶?ç¨±'}</div>
                        </div>
                        
                        ${qrCodeUrl ? `
                        <div style="background: white; padding: 16px; border-radius: 12px; margin-bottom: 16px;">
                            <img src="${qrCodeUrl}" alt="QR Code" style="width: 200px; height: 200px; display: block; margin: 0 auto;">
                            <div style="font-size: 12px; color: #666; margin-top: 8px;">è«‹å?åº—å®¶?ºç¤ºæ­¤QR Code</div>
                        </div>
                        ` : ''}
                        
                        <div style="background: rgba(255,255,255,0.2); padding: 12px; border-radius: 8px; margin-bottom: 16px;">
                            <div style="font-size: 12px; opacity: 0.8; margin-bottom: 4px;">é©—è?ç¢?/div>
                            <div style="font-size: 18px; font-weight: 700; letter-spacing: 1px;">${verificationCode}</div>
                        </div>
                        
                        ${expiresAt ? `
                        <div style="font-size: 12px; opacity: 0.8; margin-bottom: 16px;">
                            ?‘è??‰æ??Ÿè‡³ï¼?{new Date(expiresAt).toLocaleString('zh-TW')}
                        </div>
                        ` : ''}
                        <div style="font-size: 12px; opacity: 0.8;">
                            ä½¿ç”¨?‚é?ï¼?{now.toLocaleString('zh-TW')}<br>
                            è«‹å?åº—å®¶?ºç¤ºæ­¤æ?è­?                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(proofModal);

            // æ·»å?é»æ??Œæ™¯?œé??Ÿèƒ½
            addClickOutsideToClose(proofModal, closeUsageProof);
        }

        function closeUsageProof() {
            const modal = document.querySelector('.modal-overlay:last-child');
            if (modal) {
                modal.remove();
                document.body.style.overflow = 'auto';
            }
        }

        // ä½¿ç”¨è¨˜é?ç®¡ç?
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

        // ?œé?å½ˆç?
        function closeModal() {
            document.getElementById('modalOverlay').classList.remove('active');
            document.body.style.overflow = 'auto';
        }

        // ?ˆç®±?Ÿèƒ½
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

        // ?¶è??‡æ­·?²ï??¬åœ°ï¼?        function getFavorites() { try { return JSON.parse(localStorage.getItem(LS_FAVORITES) || '[]'); } catch { return []; } }
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
                    // ?´æ–°?´é?æ¬„è???                    updateSidebarCounts();
                    // ä¸å?è·³å‡º alertï¼Œä½¿?¨é?é»˜æ›´?°è??›å??‡æ?
                } catch (e) {
                    console.warn('?Œæ­¥?¶è?å¤±æ?');
                }
            } else {
                const favs = getFavorites();
                const idx = favs.indexOf(coupon.id);
                if (idx >= 0) { favs.splice(idx, 1); } else { favs.unshift(coupon.id); }
                setFavorites(favs.slice(0, 200));
                // ?´æ–°?´é?æ¬„è???                updateSidebarCounts();
                // ä¸å?è·³å‡º alert
            }
            // ?Œæ­¥?€?‰æ?å¿ƒã€æ”¶?æ•¸?‡æ”¶?è???            const nowActive = isFav(coupon.id);
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

        // æ·»å?æ¨™ç±¤
        function addTag(tagText, tagType = 'search') {
            // æª¢æŸ¥?¯å¦å·²å???            if (selectedTags.some(tag => tag.text === tagText)) {
                return;
            }

            selectedTags.push({ text: tagText, type: tagType });
            renderSelectedTags();
            performSearch();
        }

        // ç§»é™¤æ¨™ç±¤
        function removeTag(tagText) {
            selectedTags = selectedTags.filter(tag => tag.text !== tagText);
            renderSelectedTags();
            performSearch();

            // ?´æ–°ä¸‹æ??¸å–®ä¸­ç??¸ä¸­?€??            updateDropdownSelection();
        }

        // æ¸²æ??¸ä¸­?„æ?ç±?        function renderSelectedTags() {
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

            // ?´æ–°?œå?æ¡?placeholder
            const searchInput = document.getElementById('searchInput');
            if (selectedTags.length > 0) {
                searchInput.placeholder = 'ç¹¼ç??œå?...';
            } else {
                searchInput.placeholder = '?œå??ªæ??¸ã€å?å®¶æ??†é?...';
            }
        }

        // ?´æ–°ä¸‹æ??¸å–®ä¸­ç??¸ä¸­?€??        function updateDropdownSelection() {
            // ?´æ–°?†é?æ¨™ç±¤?¸ä¸­?€??            document.querySelectorAll('.category-chip').forEach(chip => {
                const category = chip.getAttribute('data-category');
                const isSelected = selectedTags.some(tag => tag.text.includes(category));
                chip.classList.toggle('selected', isSelected);
            });

            // ?´æ–°?±é?æ¨™ç±¤?¸ä¸­?€??            document.querySelectorAll('.trending-tag').forEach(tag => {
                const tagText = tag.getAttribute('data-tag');
                const isSelected = selectedTags.some(tag => tag.text === tagText);
                tag.classList.toggle('selected', isSelected);
            });
        }

        // ?·è??œå? (çµå?æ¨™ç±¤?Œè¼¸?¥æ?)
        async function performSearch() {
            const searchInput = document.getElementById('searchInput');
            const searchTerm = searchInput.value.toLowerCase().trim();

            // å¦‚æ??‰æ?å°‹è?ï¼Œå?è©¦å?API?œå?
            if (searchTerm !== '') {
                try {
                    const res = await fetch(`api/coupons?search=${encodeURIComponent(searchTerm)}&page=1&pageSize=50`);
                    const json = await res.json();
                    const items = json?.data?.coupons || [];

                    if (Array.isArray(items) && items.length > 0) {
                        // è½‰æ?APIè³‡æ??¼å?
                        const searchResults = items.map((item, idx) => ({
                            id: item.id || idx + 1,
                            image: item.image && item.image.trim() !== '' ? item.image : `img/?å¥½åº·æ?å®????(${(idx % 50) + 1}).jpg`,
                            storeName: item.storeName || '?ˆä?åº—å®¶',
                            category: item.category || 'ä¸€?¬å„ª??,
                            title: item.title || '?ªæ?æ´»å?',
                            discount: item.discount_value ? `${item.discount_value}${item.discount_type === 'percentage' ? '%' : '??} OFF` : '?¹åƒ¹?ªæ?',
                            expiry: item.end_date ? new Date(item.end_date).toLocaleDateString('zh-TW') : '',
                            usage: item.usage_rules || 'æ¯äºº?ç”¨ä¸€æ¬?,
                            description: item.description || 'è©³æ?è«‹è?æ´»å?èªªæ???,
                            address: item.address || '',
                            phone: item.phone || ''
                        }));

                        renderCoupons(searchResults);
                        return;
                    }
                } catch (e) {
                    console.warn('API?œå?å¤±æ?ï¼Œä½¿?¨æœ¬?°æ?å°?', e);
                }
            }

            // ?é€€?°æœ¬?°æ?å°?            let filteredCoupons = coupons;

            // ?¹æ??¸ä¸­?„æ?ç±¤ç¯©??            if (selectedTags.length > 0) {
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

            // ?æ ¹?šæ?å°‹æ??§å®¹?²ä?æ­¥ç¯©??            if (searchTerm !== '') {
                filteredCoupons = filteredCoupons.filter(coupon =>
                    coupon.storeName.toLowerCase().includes(searchTerm) ||
                    coupon.title.toLowerCase().includes(searchTerm) ||
                    coupon.category.toLowerCase().includes(searchTerm)
                );
            }

            renderCoupons(filteredCoupons);
        }

        // ?œå??Ÿèƒ½ (ä¿ç??Ÿæ??Ÿèƒ½ï¼Œä??¹ç‚ºèª¿ç”¨ performSearch)
        function handleSearch() {
            performSearch();
        }

        // ?†é?ç¯©é¸
        function filterByCategory(category) {
            const filteredCoupons = coupons.filter(coupon =>
                coupon.category.includes(category)
            );
            renderCoupons(filteredCoupons);
            document.getElementById('searchDropdown').classList.remove('active');

            // ?´æ–°?´é?æ¬„é¸ä¸­ç???            updateSidebarSelection(category);
        }

        // ?ç½®?é???        function resetToHomepage() {
            setView('home');
            // æ¸…ç©º?œå?æ¡?            document.getElementById('searchInput').value = '';

            // æ¸…ç©º?€?‰é¸ä¸­ç?æ¨™ç±¤
            selectedTags = [];
            renderSelectedTags();

            // ?œé??œå?ä¸‹æ??¸å–®
            document.getElementById('searchDropdown').classList.remove('active');

            // ?´æ–°ä¸‹æ??¸å–®?¸ä¸­?€??            updateDropdownSelection();

            // ?æ–°æ¸²æ??€?‰å„ª? åˆ¸
            renderCoupons(coupons);

            // ?ç½®?´é?æ¬„é¸ä¸­ç??‹ç‚ºé¦–é?
            updateSidebarSelection('é¦–é?');

            // æ»¾å??°é???            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        // ?´æ–°?´é?æ¬„é¸ä¸­ç???        function updateSidebarSelection(activeItem) {
            // ç§»é™¤?€?‰active?€??            document.querySelectorAll('.sidebar-item').forEach(item => {
                item.classList.remove('active');
            });

            // ?¹æ?activeItemè¨­å??°ç?active?€??            let targetItem = null;

            document.querySelectorAll('.sidebar-item').forEach(item => {
                const text = item.querySelector('.sidebar-text')?.textContent;

                if (activeItem === 'é¦–é?' && text === 'é¦–é?') {
                    targetItem = item;
                }
            });

            if (targetItem) {
                targetItem.classList.add('active');
            }
        }

        // ?´é?æ¬„å????¶èµ·?Ÿèƒ½
        function toggleSidebar() {
            const sidebar = document.querySelector('.sidebar');
            sidebar.classList.toggle('expanded');
        }

        // ?ªå?å±•é?/?¶èµ·?´é?æ¬?        function setupSidebarToggle() {
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

            // æ»‘é??²å…¥?‚å???            sidebar.addEventListener('mouseenter', () => {
                clearTimeout(hoverTimer);
                expandSidebar();
            });

            // æ»‘é??¢é??‚æ”¶èµ·ï?å»¶é²300msï¼?            sidebar.addEventListener('mouseleave', () => {
                hoverTimer = setTimeout(() => {
                    collapseSidebar();
                }, 300);
            });

            // é»æ??…ç›®?‚ä??å??‹ç??‹ä?æ®µæ???            sidebar.addEventListener('click', () => {
                clearTimeout(hoverTimer);
                expandSidebar();

                // 3ç§’å??ªå??¶èµ·
                hoverTimer = setTimeout(() => {
                    collapseSidebar();
                }, 3000);
            });
        }

        // ?´é?æ¬„å??½å¯¦??        let currentSidebarView = 'home';
        let historyData = JSON.parse(localStorage.getItem('viewHistory') || '[]');

        // ?´æ–°?´é?æ¬„è???        function updateSidebarCounts() {
            // ?æ–°å¾?localStorage è¼‰å…¥?è¦½è¨˜é?ï¼Œç¢ºä¿æ•¸?šå?æ­?            historyData = JSON.parse(localStorage.getItem('viewHistory') || '[]');

            // æ¸…ç??¡æ??„ç€è¦½è¨˜é?
            if (coupons && coupons.length > 0) {
                const validHistoryData = historyData.filter(item =>
                    coupons.some(coupon => coupon.id === item.id)
                );

                if (validHistoryData.length !== historyData.length) {
                    historyData = validHistoryData;
                    localStorage.setItem('viewHistory', JSON.stringify(historyData));
                }
            }

            // ?¶è??¸é?
            const favCount = getFavorites().length;
            const favCountEl = document.getElementById('favCount');
            if (favCount > 0) {
                favCountEl.textContent = favCount;
                favCountEl.style.display = 'inline-block';
            } else {
                favCountEl.style.display = 'none';
            }

            // ?è¦½è¨˜é??¸é?
            const historyCountEl = document.getElementById('historyCount');
            console.log('?è¦½è¨˜é??¸æ?:', historyData); // èª¿è©¦??
            if (historyData.length > 0) {
                historyCountEl.textContent = historyData.length > 99 ? '99+' : historyData.length;
                historyCountEl.style.display = 'inline-block';
            } else {
                historyCountEl.style.display = 'none';
            }

            // ?Œæ??´æ–°?ƒå“¡?¸å–®?„å¾½ç«?            if (isLoggedIn()) {
                updateSimpleMemberMenuBadges();
            }
        }

        // è¨­å??´é?æ¬„æ´»?•ç???        function setSidebarActive(action) {
            document.querySelectorAll('.sidebar-item').forEach(item => {
                item.classList.remove('active');
            });
            const activeItem = document.querySelector(`[data-action="${action}"]`);
            if (activeItem) {
                activeItem.classList.add('active');
            }
            currentSidebarView = action;
        }

        // ?´é?æ¬„å??½è???        function handleSidebarAction(action) {
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

        // é¡¯ç¤º?€?‰å„ª? åˆ¸ï¼ˆé??ï?
        function showAllCoupons() {
            setView('home');
            removeHistoryClearButton(); // ç§»é™¤æ¸…é™¤?‰é?
            renderCoupons(coupons);
            showSuccessMessage('?åˆ°é¦–é?');
        }

        // é¡¯ç¤º?¶è??—è¡¨
        async function showFavorites() {
            removeHistoryClearButton(); // ç§»é™¤æ¸…é™¤?‰é?
            await viewFavorites(); // ä½¿ç”¨?¾æ??„æ”¶?å???        }

        // é¡¯ç¤º?è¦½è¨˜é?
        function showHistory() {
            const historyIds = historyData.map(item => item.id);
            const historyCoupons = coupons.filter(coupon => historyIds.includes(coupon.id));

            // æ¸…ç??¡æ??„ç€è¦½è¨˜é?ï¼ˆå„ª? åˆ¸å·²ä?å­˜åœ¨ï¼?            const validHistoryData = historyData.filter(item =>
                coupons.some(coupon => coupon.id === item.id)
            );

            // å¦‚æ??‰ç„¡?ˆè??„è¢«æ¸…ç?ï¼Œæ›´??localStorage
            if (validHistoryData.length !== historyData.length) {
                historyData = validHistoryData;
                localStorage.setItem('viewHistory', JSON.stringify(historyData));
                updateSidebarCounts(); // ?´æ–°è¨ˆæ•¸
            }

            // å¦‚æ?æ²’æ??è¦½è¨˜é?ï¼Œé¡¯ç¤ºç©º?€??            if (historyData.length === 0) {
                renderEmptyHistory();
                showSuccessMessage('?®å?æ²’æ??è¦½è¨˜é?');
                return;
            }

            // ?‰ç€è¦½?‚é??’å?ï¼ˆæ??°ç??¨å?ï¼?            const sortedHistory = historyCoupons.sort((a, b) => {
                const aTime = historyData.find(h => h.id === a.id)?.timestamp || 0;
                const bTime = historyData.find(h => h.id === b.id)?.timestamp || 0;
                return bTime - aTime;
            });

            // ?¨é??¢é??¨æ·»? æ??¤æ???            addHistoryClearButton();
            renderCoupons(sortedHistory);
            showSuccessMessage(`é¡¯ç¤º ${sortedHistory.length} ?‹ç€è¦½è¨˜é?`);
        }

        // é¡¯ç¤º?±é??ªæ?
        function showHotCoupons() {
            removeHistoryClearButton(); // ç§»é™¤æ¸…é™¤?‰é?
            // ?‰ç€è¦½æ¬¡æ•¸?’å?
            const hotCoupons = [...coupons].sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
            renderCoupons(hotCoupons);

            // ?´æ–°è¨ˆæ•¸
            const hotCountEl = document.getElementById('hotCount');
            hotCountEl.textContent = hotCoupons.length;
            hotCountEl.style.display = 'inline-block';

            showSuccessMessage('é¡¯ç¤º?±é??ªæ?');
        }

        // é¡¯ç¤º?„è??ªæ?ï¼ˆæ¨¡?¬åœ°?†ä?ç½®ï?
        function showNearbyCoupons() {
            removeHistoryClearButton(); // ç§»é™¤æ¸…é™¤?‰é?
            // æ¨¡æ“¬?„è??ªæ?ï¼ˆéš¨æ©Ÿé¸?‡ä?äº›å„ª? åˆ¸ï¼?            const nearbyCount = Math.min(10, coupons.length);
            const shuffled = [...coupons].sort(() => 0.5 - Math.random());
            const nearbyCoupons = shuffled.slice(0, nearbyCount);

            renderCoupons(nearbyCoupons);

            // ?´æ–°è¨ˆæ•¸
            const nearbyCountEl = document.getElementById('nearbyCount');
            nearbyCountEl.textContent = nearbyCount;
            nearbyCountEl.style.display = 'inline-block';

            showSuccessMessage(`?¾åˆ° ${nearbyCount} ?‹é?è¿‘å„ª? `);
        }

        // é¡¯ç¤º?æ?æ´»å?
        function showLimitedCoupons() {
            removeHistoryClearButton(); // ç§»é™¤æ¸…é™¤?‰é?
            const now = new Date();
            const oneWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

            const limitedCoupons = coupons.filter(coupon => {
                if (!coupon.expiry) return false;
                const expiryDate = new Date(coupon.expiry);
                return expiryDate <= oneWeek && expiryDate > now;
            });

            renderCoupons(limitedCoupons);

            // ?´æ–°è¨ˆæ•¸
            const limitedCountEl = document.getElementById('limitedCount');
            limitedCountEl.textContent = limitedCoupons.length;
            limitedCountEl.style.display = 'inline-block';

            showSuccessMessage(`?¾åˆ° ${limitedCoupons.length} ?‹é??‚æ´»?•`);
        }

        // é¡¯ç¤ºè¨­å??¢æ¿
        function showSettings() {
            const settingsModal = document.createElement('div');
            settingsModal.className = 'modal-overlay';
            settingsModal.style.cssText = 'display: flex; z-index: 10000;';

            settingsModal.innerHTML = `
                <div class="modal-content profile-modal-content">
                    <button class="modal-close" onclick="closeSettings()">?</button>
                    <div class="profile-modal-body">
                        <div class="profile-header">
                            <div class="profile-avatar">?™ï?</div>
                            <h2 class="profile-title">ç³»çµ±è¨­å?</h2>
                        </div>
                        
                        <!-- é¡¯ç¤ºè¨­å? -->
                        <div class="profile-section">
                            <h3 class="section-title">é¡¯ç¤ºè¨­å?</h3>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label class="form-label">
                                        <input type="checkbox" id="showCounts" style="margin-right: 8px;">
                                        é¡¯ç¤º?´é?æ¬„è???                                    </label>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">
                                        <input type="checkbox" id="autoExpand" style="margin-right: 8px;">
                                        ?ªå?å±•é??´é?æ¬?                                    </label>
                                </div>
                            </div>
                        </div>
                        
                        <!-- ?¸æ?è¨­å? -->
                        <div class="profile-section">
                            <h3 class="section-title">?¸æ?ç®¡ç?</h3>
                            <div class="form-grid">
                                <button class="btn-secondary" onclick="clearHistory()" style="margin-bottom: 10px;">
                                    æ¸…é™¤?è¦½è¨˜é?
                                </button>
                                <button class="btn-secondary" onclick="clearSearchHistory()" style="margin-bottom: 10px;">
                                    æ¸…é™¤?œå?è¨˜é?
                                </button>
                                <button class="btn-secondary" onclick="exportData()">
                                    ?¯å‡º?‘ç?è³‡æ?
                                </button>
                            </div>
                        </div>
                        
                        <div class="profile-actions">
                            <button onclick="closeSettings()" class="btn-secondary">?œé?</button>
                            <button onclick="saveSettings()" class="btn-primary">?²å?è¨­å?</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(settingsModal);
            document.body.style.overflow = 'hidden';

            // æ·»å?é»æ??Œæ™¯?œé??Ÿèƒ½
            addClickOutsideToClose(settingsModal, closeSettings);

            // è¼‰å…¥?¶å?è¨­å?
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
            showSuccessMessage('è¨­å?å·²å„²å­?);
            closeSettings();
        }

        function applySettings(settings) {
            // ?‰ç”¨é¡¯ç¤ºè¨­å?
            const countElements = document.querySelectorAll('.sidebar-count');
            countElements.forEach(el => {
                if (settings.showCounts === false) {
                    el.style.display = 'none';
                } else {
                    // ?¢å¾©?Ÿæœ¬?„é¡¯ç¤ºé?è¼?                    const count = parseInt(el.textContent) || 0;
                    el.style.display = count > 0 ? 'inline-block' : 'none';
                }
            });
        }

        function clearHistory() {
            if (confirm('ç¢ºå?è¦æ??¤æ??‰ç€è¦½è¨˜é??ï?')) {
                historyData = [];
                localStorage.removeItem('viewHistory');
                updateSidebarCounts();
                showSuccessMessage('?è¦½è¨˜é?å·²æ???);
            }
        }

        function clearSearchHistory() {
            if (confirm('ç¢ºå?è¦æ??¤æ??‰æ?å°‹è??„å?ï¼?)) {
                searchHistory = [];
                localStorage.removeItem('searchHistory');
                renderSearchHistory();
                showSuccessMessage('?œå?è¨˜é?å·²æ???);
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
            a.download = '?é?åº·_?‘ç?è³‡æ?.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showSuccessMessage('è³‡æ??¯å‡ºå®Œæ?');
        }

        // é¡¯ç¤ºå¹«åŠ©ä¸­å?
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
                            <h2 class="profile-title">å¹«åŠ©ä¸­å?</h2>
                        </div>
                        
                        <!-- å¸¸è??é? -->
                        <div class="profile-section">
                            <h3 class="section-title">å¸¸è??é?</h3>
                            <div class="help-item">
                                <h4>å¦‚ä?ä½¿ç”¨?ªæ??¸ï?</h4>
                                <p>1. é»æ??ªæ??¸å¡?‡æŸ¥?‹è©³??br>
                                2. é»æ??Œç??³ä½¿?¨ã€æ???br>
                                3. ç¢ºè?ä½¿ç”¨å¾Œæ??Ÿæ?ä½¿ç”¨è­‰æ?<br>
                                4. ?‘å?å®¶å‡ºç¤ºè??å³?¯äº«?—å„ª??/p>
                            </div>
                            <div class="help-item">
                                <h4>å¦‚ä??¶è??ªæ??¸ï?</h4>
                                <p>é»æ??ªæ??¸å¡?‡å³ä¸Šè??„æ?å¿ƒå?æ¨™ï??–åœ¨è©³æ??é¢é»æ??Œæ”¶?å„ª? ã€æ??•ã€?/p>
                            </div>
                            <div class="help-item">
                                <h4>å¦‚ä??¥ç??‘ç??¶è?ï¼?/h4>
                                <p>é»æ?å·¦å´?Šæ??„ã€Œæ??„æ”¶?ã€ï??–é??Šå³ä¸Šè??ƒå“¡?¸å–®ä¸­ç??Œæ??„æ”¶?ã€ã€?/p>
                            </div>
                        </div>
                        
                        <!-- ?Ÿèƒ½èªªæ? -->
                        <div class="profile-section">
                            <h3 class="section-title">?Ÿèƒ½èªªæ?</h3>
                            <div class="help-item">
                                <h4>?? é¦–é?</h4>
                                <p>é¡¯ç¤º?€?‰å¯?¨ç??ªæ???/p>
                            </div>
                            <div class="help-item">
                                <h4>?¤ï? ?‘ç??¶è?</h4>
                                <p>?¥ç?å·²æ”¶?ç??ªæ???/p>
                            </div>
                            <div class="help-item">
                                <h4>?? ?è¦½è¨˜é?</h4>
                                <p>?¥ç??€è¿‘ç€è¦½?ç??ªæ???/p>
                            </div>
                            <div class="help-item">
                                <h4>?”¥ ?±é??ªæ?</h4>
                                <p>?‰ç€è¦½æ¬¡æ•¸?’å??„ç†±?€?ªæ???/p>
                            </div>
                            <div class="help-item">
                                <h4>?? ?„è??ªæ?</h4>
                                <p>?ºæ–¼?°ç?ä½ç½®?„é?è¿‘å„ª? ï?æ¨¡æ“¬?Ÿèƒ½ï¼?/p>
                            </div>
                            <div class="help-item">
                                <h4>???æ?æ´»å?</h4>
                                <p>?³å??°æ??„é??‚å„ª? åˆ¸</p>
                            </div>
                        </div>
                        
                        <!-- ?¯çµ¡è³‡è? -->
                        <div class="profile-section">
                            <h3 class="section-title">?¯çµ¡?‘å€?/h3>
                            <div class="help-item">
                                <p><strong>å®¢æ?ä¿¡ç®±ï¼?/strong> support@songhokang.com</p>
                                <p><strong>å®¢æ??»è©±ï¼?/strong> 0800-123-456</p>
                                <p><strong>?å??‚é?ï¼?/strong> ?±ä??³é€±ä? 09:00-18:00</p>
                            </div>
                        </div>
                        
                        <div class="profile-actions">
                            <button onclick="closeHelp()" class="btn-primary">?œé?</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(helpModal);
            document.body.style.overflow = 'hidden';

            // æ·»å?é»æ??Œæ™¯?œé??Ÿèƒ½
            addClickOutsideToClose(helpModal, closeHelp);
        }

        function closeHelp() {
            const modal = document.querySelector('.modal-overlay:last-child');
            if (modal) {
                modal.remove();
                document.body.style.overflow = 'auto';
            }
        }

        // ?šç”¨?½æ•¸ï¼šç‚ºæ¨¡æ?è¦–ç?æ·»å?é»æ??Œæ™¯?œé??Ÿèƒ½
        function addClickOutsideToClose(modalElement, closeFunction) {
            modalElement.addEventListener('click', (e) => {
                if (e.target === e.currentTarget) {
                    closeFunction();
                }
            });
        }

        // æ·»å??°ç€è¦½è¨˜é?
        function addToHistory(coupon) {
            const existingIndex = historyData.findIndex(item => item.id === coupon.id);
            if (existingIndex !== -1) {
                historyData.splice(existingIndex, 1);
            }

            historyData.unshift({
                id: coupon.id,
                timestamp: Date.now()
            });

            // ?åˆ¶è¨˜é??¸é?
            if (historyData.length > 50) {
                historyData = historyData.slice(0, 50);
            }

            localStorage.setItem('viewHistory', JSON.stringify(historyData));
            updateSidebarCounts();
        }

        // ?²å??é¢?¹å??„å??›ç??‹éµ??        function getPageSwitchKey() {
            // ?¹æ??¶å??é¢è·¯å??Ÿæ??¯ä??„å??›ç??‹éµ??            const path = window.location.pathname;
            if (path.includes('vendor')) return 'switched_from_admin_vendor';
            if (path.includes('admin')) return 'switched_from_admin_admin';
            return 'switched_from_admin_customer'; // ?å°?é¢
        }

        // ?•ç?ç®¡ç??¡å??›æ?è©?        function handleAdminSwitch() {
            const urlParams = new URLSearchParams(window.location.search);
            const switchSessionId = urlParams.get('switch_session');

            if (switchSessionId) {
                try {
                    // å¾?sessionStorage ?²å??‡æ??¸æ?
                    const switchDataStr = sessionStorage.getItem(switchSessionId);
                    if (switchDataStr) {
                        const switchData = JSON.parse(switchDataStr);

                        // æª¢æŸ¥?¯å¦?ºé??¢æ?è©±æ¨¡å¼?                        if (switchData.isolatedSession) {
                            console.log('?•ç??”é›¢?ƒè©±?‡æ?:', switchData);

                            // ä¿å??¶å??é¢?„å?å§‹æ?è©±ç??‹ï?å¦‚æ??‰ç?è©±ï?
                            const currentPageSession = {
                                token: localStorage.getItem(LS_TOKEN),
                                user: localStorage.getItem(LS_USER),
                                timestamp: Date.now()
                            };

                            // å¦‚æ??¶å??é¢?‰æ?è©±ï?ä¿å??°è‡¨?‚ä?ç½?                            const tempSessionKey = `temp_original_session_${switchData.user.role}`;
                            if (currentPageSession.token) {
                                localStorage.setItem(tempSessionKey, JSON.stringify(currentPageSession));
                            }

                            // ä½¿ç”¨è§’è‰²å°ˆå±¬?„éµ?¼è¨­ç½®æ?è©±ï??¿å?å½±éŸ¿?¶ä?è§’è‰²
                            const targetTokenKey = switchData.targetTokenKey || LS_TOKEN;
                            const targetUserKey = switchData.targetUserKey || LS_USER;

                            localStorage.setItem(targetTokenKey, switchData.token);
                            localStorage.setItem(targetUserKey, JSON.stringify(switchData.user));

                            // ?ºä??¼å®¹?¾æ?ä»?¢¼ï¼Œä?è¨­ç½®?šç”¨?µå€¼ï?ä½†é€™åªå½±éŸ¿?¶å??†é?ï¼?                            localStorage.setItem(LS_TOKEN, switchData.token);
                            localStorage.setItem(LS_USER, JSON.stringify(switchData.user));

                            currentUser = switchData.user;

                            // ä½¿ç”¨?é¢?¹å??„éµ?¼å„²å­˜ç®¡?†å“¡?‡æ?è³‡è?
                            const pageSwitchKey = getPageSwitchKey();
                            const switchInfo = {
                                ...switchData.switched_from_admin,
                                isolatedSession: true,
                                targetRole: switchData.user.role,
                                originalSession: switchData.originalSession,
                                tempSession: currentPageSession,
                                pageType: pageSwitchKey // è¨˜é??é¢é¡å?
                            };
                            localStorage.setItem(pageSwitchKey, JSON.stringify(switchInfo));

                        } else {
                            // ?Šç??é??¢æ¨¡å¼ï??‘å??¼å®¹ï¼?                            localStorage.setItem(LS_TOKEN, switchData.token);
                            localStorage.setItem(LS_USER, JSON.stringify(switchData.user));
                            currentUser = switchData.user;
                            const pageSwitchKey = getPageSwitchKey();
                            localStorage.setItem(pageSwitchKey, JSON.stringify(switchData.switched_from_admin));
                        }

                        // æ¸…ç? sessionStorage
                        sessionStorage.removeItem(switchSessionId);

                        // ç§»é™¤ URL ?ƒæ•¸
                        window.history.replaceState({}, document.title, window.location.pathname);

                        // å¼·åˆ¶?´æ–°?»å…¥UIï¼Œç¢ºä¿æ??¡é¸?®æ­£ç¢ºé¡¯ç¤?                        setTimeout(() => {
                            updateLoginUI();
                        }, 100);

                        // é¡¯ç¤º?‡æ??å?æ¶ˆæ¯
                        setTimeout(() => {
                            showSuccessMessage(`?? å·²å??›åˆ°?¨æˆ¶??{switchData.user.username}?\n???é¢?”é›¢æ¨¡å?ï¼šå…¶ä»–é??¢æ?è©±ä??—å½±?¿\n\né»æ??³ä?è§’ğ?¤å?æ¨™å¯?²å…¥?‹äººä¸­å?`);
                        }, 500);

                        console.log('ç®¡ç??¡å??›æ?è©±è??†å???', switchData.user);
                    }
                } catch (error) {
                    console.error('?•ç?ç®¡ç??¡å??›æ?è©±å¤±??', error);
                }
            }
        }

        // æª¢æŸ¥?¯å¦?ºç®¡?†å“¡?‡æ??„æ?è©?        function isAdminSwitchedSession() {
            const pageSwitchKey = getPageSwitchKey();
            return localStorage.getItem(pageSwitchKey) !== null;
        }

        // é¡¯ç¤ºç®¡ç??¡å??›ç???        function showAdminSwitchStatus() {
            if (isAdminSwitchedSession()) {
                try {
                    const pageSwitchKey = getPageSwitchKey();
                    const switchInfo = JSON.parse(localStorage.getItem(pageSwitchKey));

                    // æª¢æŸ¥?¯å¦å·²ç?é¡¯ç¤º?€?‹å?
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

                    const switchTime = switchInfo.switched_at ? new Date(switchInfo.switched_at).toLocaleString() : '?ªçŸ¥';
                    statusDiv.innerHTML = `
                        ?? ç®¡ç??¡å??›æ¨¡å¼?| ?®å?èº«ä»½: ${getUser()?.username || currentUser?.username || '?ªçŸ¥'} | 
                        ?é¢: ?å° | ?‡æ??‚é?: ${switchTime} | 
                        <button onclick="clearAdminSwitch()" style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 6px 12px; border-radius: 6px; margin-left: 8px; cursor: pointer; font-size: 13px; transition: all 0.2s ease;">çµæ??‡æ?</button>
                    `;

                    document.body.appendChild(statusDiv);

                    // èª¿æ•´?é¢åº•éƒ¨?Šè?ï¼Œé¿?å…§å®¹è¢«?®æ?
                    document.body.style.paddingBottom = '60px';
                } catch (error) {
                    console.error('é¡¯ç¤ºç®¡ç??¡å??›ç??‹å¤±??', error);
                }
            }
        }

        // æ¸…é™¤ç®¡ç??¡å??›ç???        function clearAdminSwitch() {
            if (confirm('ç¢ºå?è¦ç??Ÿç®¡?†å“¡?‡æ?æ¨¡å??ï??™å?æ¸…é™¤?¶å??é¢?„æ?è©±ã€?)) {
                try {
                    // ?²å??é¢?¹å??„å??›è?è¨?                    const pageSwitchKey = getPageSwitchKey();
                    const switchInfoStr = localStorage.getItem(pageSwitchKey);
                    let switchInfo = null;

                    if (switchInfoStr) {
                        switchInfo = JSON.parse(switchInfoStr);
                    }

                    // æ¸…é™¤?¶å??é¢?„å??›ç›¸?œè?è¨?                    localStorage.removeItem(pageSwitchKey);

                    // å¦‚æ??¯é??¢æ?è©±æ¨¡å¼ï??—è©¦?¢å¾©?Ÿå??ƒè©±
                    if (switchInfo && switchInfo.isolatedSession) {
                        console.log('?¢å¾©?é¢?”é›¢?ƒè©±æ¨¡å??„å?å§‹ç???);

                        // æ¸…é™¤?¶å??‡æ??„æ?è©?                        if (switchInfo.targetRole) {
                            const targetTokenKey = `authToken_${switchInfo.targetRole}`;
                            const targetUserKey = `user_${switchInfo.targetRole}`;
                            localStorage.removeItem(targetTokenKey);
                            localStorage.removeItem(targetUserKey);
                        }

                        // ?¢å¾©?Ÿå??é¢?ƒè©±ï¼ˆå??œæ??„è©±ï¼?                        const tempSessionKey = `temp_original_session_${switchInfo.targetRole}`;
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
                                console.error('?¢å¾©?Ÿå??ƒè©±å¤±æ?:', e);
                            }
                        } else {
                            // æ²’æ??Ÿå??ƒè©±ï¼Œæ??¤é€šç”¨?µå€?                            localStorage.removeItem(LS_TOKEN);
                            localStorage.removeItem(LS_USER);
                        }
                    } else {
                        // ?é??¢æ¨¡å¼ï?æ¸…é™¤?šç”¨?ƒè©±
                        localStorage.removeItem(LS_TOKEN);
                        localStorage.removeItem(LS_USER);
                    }

                    currentUser = null;

                    // ç§»é™¤?€?‹å?
                    const statusDiv = document.getElementById('admin-switch-status');
                    if (statusDiv) {
                        statusDiv.remove();
                    }

                    // ?¢å¾©?é¢?Šè?
                    document.body.style.paddingBottom = '';

                    // ?æ–°è¼‰å…¥?é¢
                    window.location.reload();

                } catch (error) {
                    console.error('æ¸…é™¤?‡æ??€?‹å¤±??', error);
                    // ?¼ç??¯èª¤?‚ï?å¼·åˆ¶æ¸…ç??€?‰ç›¸?œæ•¸??                    const pageSwitchKey = getPageSwitchKey();
                    localStorage.removeItem(pageSwitchKey);
                    localStorage.removeItem('temp_original_session_customer');
                    localStorage.removeItem('temp_original_session_vendor');
                    localStorage.removeItem(LS_TOKEN);
                    localStorage.removeItem(LS_USER);
                    window.location.reload();
                }
            }
        }

        // äº‹ä»¶??½??        document.addEventListener('DOMContentLoaded', function () {
            // ?å??–ç•¶?ç”¨??            currentUser = getUser();

            // ?•ç?ç®¡ç??¡å??›æ?è©?            handleAdminSwitch();

            // æª¢æŸ¥èªè?ä¸¦é¡¯ç¤ºå??›ç???            setTimeout(() => {
                showAdminSwitchStatus();
            }, 100);

            loadCouponsFromApi();
            loadCategories();
            setupSidebarToggle();
            renderSearchHistory();

            // æ¸…ç??¡æ??„ç€è¦½è¨˜é?
            setTimeout(() => {
                const validHistoryData = historyData.filter(item =>
                    coupons.some(coupon => coupon.id === item.id)
                );

                if (validHistoryData.length !== historyData.length) {
                    historyData = validHistoryData;
                    localStorage.setItem('viewHistory', JSON.stringify(historyData));
                }

                updateSidebarCounts();
            }, 1000); // ç­‰å??ªæ??¸æ•¸?šè??¥å???
            updateSidebarCounts();

            // ?‰ç”¨?¨æˆ¶è¨­å?
            const settings = JSON.parse(localStorage.getItem('userSettings') || '{}');
            applySettings(settings);

            // è¡Œå??ˆå´æ¬„å???            const hamburgerBtn = document.getElementById('hamburgerBtn');
            const sidebar = document.querySelector('.sidebar');
            const backdrop = document.getElementById('backdrop');
            const closeMobileMenu = () => { sidebar.classList.remove('open'); backdrop.style.display = 'none'; hamburgerBtn.setAttribute('aria-expanded', 'false'); };
            const openMobileMenu = () => { sidebar.classList.add('open'); backdrop.style.display = 'block'; hamburgerBtn.setAttribute('aria-expanded', 'true'); };
            hamburgerBtn.addEventListener('click', () => {
                if (sidebar.classList.contains('open')) { closeMobileMenu(); } else { openMobileMenu(); }
            });
            backdrop.addEventListener('click', closeMobileMenu);
            // ?´é?æ¬„é??®é??Šä?ä»?            document.querySelectorAll('.sidebar-item[data-action]').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    const action = item.getAttribute('data-action');
                    if (action) {
                        handleSidebarAction(action);
                        // è¡Œå??ˆè‡ª?•é??‰å´?Šæ?
                        if (window.innerWidth <= 768) {
                            closeMobileMenu();
                        }
                    }
                });
            });

            // ?»å…¥?‰é??‡ç???            const loginBtn = document.querySelector('.login-btn');
            updateLoginUI();
            const roleMenu = document.getElementById('roleMenu');
            const toggleRoleMenu = () => { roleMenu.classList.toggle('active'); };
            loginBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleRoleMenu(); });
            document.addEventListener('click', (e) => { if (!e.target.closest('#roleMenu')) roleMenu.classList.remove('active'); });
            // é»è??²é??®ï??…å??‰data-roleå±¬æ€§ç??ƒç??Ÿæ?ï¼?            document.querySelectorAll('#roleMenu .role-item[data-role]').forEach(btn => btn.addEventListener('click', (e) => {
                const role = e.currentTarget.getAttribute('data-role');
                if (!role) return; // å¦‚æ?æ²’æ?data-roleå±¬æ€§ï?ä¸åŸ·è¡?                roleMenu.classList.remove('active');
                window.__selectedRole = role; // è¨­å??é¸è§’è‰²ï¼Œä? openAuth ä½¿ç”¨
                if (role === 'admin') { openAuth('login'); }
                else if (role === 'vendor') { openAuth('register'); }
                else { openAuth('register'); }
            }));

            // Auth modal äº‹ä»¶
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

            // è¨»å?è§’è‰²?‡æ??‚é¡¯ç¤??±è?å» å?æ¬„ä?
            // å·²ç§»?¤è??²å??›ï?ä¿ç?æ¬„ä?é¡¯ç¤º??openAuth ?§åˆ¶

            // ?œå?æ¡†ä?ä»?            const searchInput = document.getElementById('searchInput');
            const searchDropdown = document.getElementById('searchDropdown');
            const searchWrapper = document.getElementById('searchWrapper');

            // é»æ??œå?æ¡†å®¹?¨æ??šç„¦?°è¼¸?¥æ?
            searchWrapper.addEventListener('click', (e) => {
                if (e.target !== searchInput) {
                    searchInput.focus();
                }
            });

            searchInput.addEventListener('focus', () => {
                searchDropdown.classList.add('active');
                updateDropdownSelection(); // ?´æ–°?¸ä¸­?€??            });

            // ??Enter ?µæ??·è??œå?
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

            // è¼¸å…¥?‚å³?‚ç¯©?¸ï?ä¸è??„æ?å°‹ç??„ï?
            searchInput.addEventListener('input', () => {
                performSearch();
            });

            // é»æ??œå?æ¡†å??¨é??‰ä??‰é¸??            document.addEventListener('click', (e) => {
                if (!e.target.closest('.search-container')) {
                    searchDropdown.classList.remove('active');
                    closeFilterPanel();
                }
            });

            // ?²é?ç¯©é¸?‰é?äº‹ä»¶
            document.getElementById('filterToggleBtn').addEventListener('click', (e) => {
                e.stopPropagation();
                toggleFilterPanel();
            });

            // Logo é»æ??é??ä?ä»?            document.querySelector('.logo').addEventListener('click', (e) => {
                e.preventDefault();
                resetToHomepage();
            });

            // ?Šç??´é?æ¬„ä?ä»¶ç›£?½å™¨å·²ç§»?¤ï?ä½¿ç”¨?°ç?data-actionå±¬æ€§è???
            // ?€è¿‘æ?å°‹é??®é??Šä?ä»?            document.querySelectorAll('.recent-item').forEach(item => {
                item.addEventListener('click', () => {
                    const searchTerm = item.getAttribute('data-search');
                    addTag(searchTerm, 'search');
                    document.getElementById('searchDropdown').classList.remove('active');
                });
            });

            // ?†é?æ¨™ç±¤é»æ?äº‹ä»¶ (?¯æ´è¤‡é¸)
            document.querySelectorAll('.category-chip').forEach(item => {
                item.addEventListener('click', () => {
                    const category = item.getAttribute('data-category');
                    const categoryText = item.querySelector('.category-chip-text').textContent;

                    // æª¢æŸ¥?¯å¦å·²é¸ä¸?                    const isSelected = selectedTags.some(tag => tag.text === categoryText);

                    if (isSelected) {
                        // å¦‚æ?å·²é¸ä¸­ï??‡ç§»??                        removeTag(categoryText);
                    } else {
                        // å¦‚æ??ªé¸ä¸­ï??‡æ·»? ä¸¦ä¿å??œå?ç´€??                        addTag(categoryText, 'category');
                        saveSearchHistory(categoryText);
                    }

                    updateDropdownSelection();
                });
            });

            // ?±é?æ¨™ç±¤é»æ?äº‹ä»¶ (?¯æ´è¤‡é¸)
            document.querySelectorAll('.trending-tag').forEach(item => {
                item.addEventListener('click', () => {
                    const tag = item.getAttribute('data-tag');

                    // æª¢æŸ¥?¯å¦å·²é¸ä¸?                    const isSelected = selectedTags.some(selectedTag => selectedTag.text === tag);

                    if (isSelected) {
                        // å¦‚æ?å·²é¸ä¸­ï??‡ç§»??                        removeTag(tag);
                    } else {
                        // å¦‚æ??ªé¸ä¸­ï??‡æ·»? ä¸¦ä¿å??œå?ç´€??                        addTag(tag, 'trending');
                        saveSearchHistory(tag);
                    }

                    updateDropdownSelection();
                });
            });

            // å½ˆç??œé?äº‹ä»¶
            document.getElementById('modalClose').addEventListener('click', (e) => { e.stopPropagation(); closeModal(); });
            document.getElementById('modalOverlay').addEventListener('click', (e) => {
                if (e.target === e.currentTarget) {
                    closeModal();
                }
            });
            // ?ˆç®±?œé?äº‹ä»¶
            const lightboxOverlay = document.getElementById('lightboxOverlay');
            lightboxOverlay.addEventListener('click', (e) => {
                // é»æ?é»‘è‰²?€?Ÿæ??³ä?è§’é??‰æ??•ç??¯é???                if (e.target === e.currentTarget || e.target.id === 'lightboxClose') {
                    closeLightbox();
                }
            });
            document.getElementById('lightboxClose').addEventListener('click', closeLightbox);

            // ESC ?µé??‰å?çª?            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    closeModal();
                    closeLightbox();
                }
            });
        });

        // ?»å…¥ UI ?§åˆ¶
        function updateLoginUI() {
            const btn = document.querySelector('.login-btn');
            const roleMenu = document.getElementById('roleMenu');
            if (!btn) return;

            if (isLoggedIn()) {
                const user = getUser();
                const role = (user?.role || '').toLowerCase();

                const avatarUrl = user?.avatar ? (user.avatar.startsWith('http') ? user.avatar : (user.avatar.startsWith('/') ? user.avatar : '/' + user.avatar)) : '';

                if (role === 'customer') {
                    // ä¸€?¬æ??¡ï?é¡¯ç¤º?­å?ï¼ˆæ??‡ç”¨?–ï??¡å?é¡¯ç¤º?–ç¤ºï¼?                    btn.innerHTML = avatarUrl
                        ? `<img src="${avatarUrl}" alt="avatar" style="width:24px;height:24px;border-radius:50%;object-fit:cover;">`
                        : `<span style="color: #FCA311;">?‘¤</span>`;
                    btn.title = `?ƒå“¡ï¼?{user?.username || user?.email || '?ªçŸ¥'}`;

                    // ?´æ–°è§’è‰²?¸å–®?ºç°¡?–ç??ƒå“¡?¸å–®
                    roleMenu.innerHTML = `
                        <div style="padding: 8px 12px; border-bottom: 1px solid rgba(0,0,0,0.1); margin-bottom: 4px;">
                            <div style="font-size: 12px; color: #666; margin-bottom: 2px;">?ƒå“¡</div>
                            <div style="font-size: 14px; font-weight: 600; color: #333;">${user?.username || user?.email || '?ªçŸ¥?¨æˆ¶'}</div>
                        </div>
                        <button class="role-item member-action" onclick="goToProfile()">
                            <span style="margin-right: 8px;">?‘¤</span>?‹äººä¸­å?
                        </button>
                        <button class="role-item member-action" onclick="viewFavorites()">
                            <span style="margin-right: 8px;">?¤ï?</span>?‘ç??¶è? <span class="menu-badge" id="menuFavCount"></span>
                        </button>
                        <div style="border-top: 1px solid rgba(0,0,0,0.1); margin-top: 4px; padding-top: 4px;">
                            <button class="role-item member-action" onclick="logout()" style="color: #dc2626;">
                                <span style="margin-right: 8px;">?šª</span>?»å‡º
                            </button>
                        </div>
                    `;

                    // ç§»é™¤?€?‰è??„data-roleå±¬æ€§ï??¿å?äº‹ä»¶??½?¨è?çª?                    document.querySelectorAll('#roleMenu .role-item').forEach(item => {
                        item.removeAttribute('data-role');
                    });

                    // ?´æ–°?ƒå“¡?¸å–®ä¸­ç?å¾½ç?è¨ˆæ•¸
                    updateSimpleMemberMenuBadges();
                } else {
                    // ç®¡ç??¡æ?å» å?ï¼šé¡¯ç¤ºé ­?æ??»å‡º?–ç¤º
                    if (avatarUrl) {
                        btn.innerHTML = `<img src="${avatarUrl}" alt="avatar" style="width:24px;height:24px;border-radius:50%;object-fit:cover;">`;
                    } else {
                        btn.textContent = '??;
                    }
                    btn.title = '?»å‡º';
                    roleMenu.innerHTML = `
                        <button class="role-item" onclick="logout()" style="color: #dc2626;">
                            <span style="margin-right: 8px;">?šª</span>?»å‡º
                        </button>
                    `;
                }
            } else {
                // ?ªç™»?¥ï?é¡¯ç¤ºè§’è‰²?¸æ?
                btn.textContent = '?‘¤';
                btn.title = '?»å…¥';
                roleMenu.innerHTML = `
                    <button class="role-item" data-role="customer">ä¸€?¬ç”¨??/button>
                    <button class="role-item" data-role="vendor">å» å?å¾Œå°</button>
                    <button class="role-item" data-role="admin">ç®¡ç?å¾Œå°</button>
                `;

                // ?æ–°ç¶å?è§’è‰²?¸æ?äº‹ä»¶ï¼ˆå??©ç”¨?¼æœª?»å…¥?€?‹ç?è§’è‰²?¸å–®ï¼?                setTimeout(() => {
                    document.querySelectorAll('#roleMenu .role-item[data-role]').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            const role = e.currentTarget.getAttribute('data-role');
                            if (!role) return; // å¦‚æ?æ²’æ?data-roleå±¬æ€§ï?ä¸åŸ·è¡?                            roleMenu.classList.remove('active');
                            window.__selectedRole = role;
                            if (role === 'admin') { openAuth('login'); }
                            else if (role === 'vendor') { openAuth('register'); }
                            else { openAuth('register'); }
                        });
                    });
                }, 100);
            }
        }

        // ?ƒå“¡?Ÿèƒ½å·²æ•´?ˆåˆ°?¨ç??„å€‹äºº?é¢ (profile.html)






        async function viewFavorites() {
            document.getElementById('roleMenu').classList.remove('active');

            // å¦‚æ?å·²ç™»?¥ï?å¾APIè¼‰å…¥?¶è??—è¡¨
            if (isLoggedIn()) {
                try {
                    const res = await fetch('api/favorites', {
                        headers: { 'Authorization': `Bearer ${getToken()}` }
                    });
                    const json = await res.json();
                    if (json.success && json.data?.favorites) {
                        // ?´æ–°?¬åœ°?¶è??—è¡¨
                        const favoriteIds = json.data.favorites.map(fav => fav.id);
                        setFavorites(favoriteIds);
                    }
                } catch (e) {
                    console.warn('è¼‰å…¥?¶è??—è¡¨å¤±æ?:', e);
                }
            }

            // è¨­ç½®?´é?æ¬„æ´»?•ç???            setSidebarActive('favorites');
            setView('favorites');
            renderCoupons(); // ?æ–°æ¸²æ??ªæ??¸ä»¥é¡¯ç¤º?¶è??§å®¹
            showSuccessMessage('?‡æ??°æ”¶?é???);
        }

        function viewHistory() {
            document.getElementById('roleMenu').classList.remove('active');

            // ?´æ¥ä½¿ç”¨?´é?æ¬„ç?æ­·å²è¨˜é??Ÿèƒ½
            setSidebarActive('history');
            showHistory();
            showSuccessMessage(`å·²é¡¯ç¤?${historyData.length} ç­†ç€è¦½è¨˜é?`);
        }

        function logout() {
            document.getElementById('roleMenu').classList.remove('active');
            clearAuth();
            setView('home');
            showSuccessMessage('å·²æ??Ÿç™»??);
        }

        // ?´æ–°ç°¡å??ƒå“¡?¸å–®å¾½ç?è¨ˆæ•¸
        function updateSimpleMemberMenuBadges() {
            setTimeout(() => {
                // ?¶è??¸é?
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

        // è·³è??°å€‹äººä¸­å??é¢
        function goToProfile() {
            document.getElementById('roleMenu').classList.remove('active');
            window.location.href = 'profile.html';
        }

        // ç§»é™¤è¤‡é??„æ??¡å??½ï?çµ±ä??°å€‹äºº?é¢?•ç?

        // ?²é?ç¯©é¸?Ÿèƒ½
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

            // ?œé??œå?ä¸‹æ??¸å–®
            dropdown.classList.remove('active');

            // ?‹å?ç¯©é¸?¢æ¿
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
            // æ¸…é™¤?†é?ç¯©é¸
            document.querySelectorAll('#categoryFilters input[type="checkbox"]').forEach(cb => {
                cb.checked = false;
            });

            // ?ç½®?°æ??‚é?ç¯©é¸
            document.querySelector('input[name="expiry"][value="all"]').checked = true;

            // ?ç½®?’å??¸é?
            document.getElementById('sortSelect').value = 'default';

            // ?æ–°è¼‰å…¥?€?‰å„ª? åˆ¸
            renderCoupons(coupons);
            showSuccessMessage('å·²æ??¤æ??‰ç¯©?¸æ?ä»?);
        }

        function applyAdvancedFilters() {
            let filteredCoupons = [...coupons];

            // ?†é?ç¯©é¸
            const selectedCategories = Array.from(document.querySelectorAll('#categoryFilters input[type="checkbox"]:checked'))
                .map(cb => cb.value);

            if (selectedCategories.length > 0) {
                filteredCoupons = filteredCoupons.filter(coupon =>
                    selectedCategories.some(category => coupon.category.includes(category))
                );
            }

            // ?°æ??‚é?ç¯©é¸
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

            // ?’å?
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
            showSuccessMessage(`å·²å??¨ç¯©?¸æ?ä»¶ï??¾åˆ° ${count} å¼µå„ª? åˆ¸`);
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
            // ?¹æ?å¾è??²é¸?®é??Šç??è¨­è§’è‰²èª¿æ•´è¡¨å–®ï¼ˆéš±?æ?é¡¯ç¤ºå» å??¸é??‡æ?ä½ï?
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

        // é¡¯ç¤º?å?è¨Šæ¯
        function showSuccessMessage(message) {
            // ?µå»º?å??ç¤º
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

            // ?•ç•«é¡¯ç¤º
            setTimeout(() => {
                successDiv.style.transform = 'translateX(0)';
            }, 100);

            // 3ç§’å??ªå?æ¶ˆå¤±
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
            if (!username || !password) { showSuccessMessage('è«‹å¡«å¯«å¸³?Ÿå?å¯†ç¢¼'); return; }
            try {
                const res = await fetch('api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
                const json = await res.json();
                if (json.success) {
                    setAuth(json.data.token, json.data.user);
                    const role = (json.data.user?.role || '').toLowerCase();
                    // é¡å?å­˜ä?ä»½åˆ°è§’è‰²å°ˆå±¬ tokenï¼Œæ–¹ä¾¿å?è£ç½®å¤šæ?è©?                    const roleKey = ROLE_TOKENS[role];
                    if (roleKey) localStorage.setItem(roleKey, json.data.token);
                    if (role === 'admin') {
                        showSuccessMessage('?»å…¥?å?ï¼Œå?å¾€ç®¡ç?å¾Œå°');
                        window.open('admin/', '_blank');
                        closeAuth();
                        return;
                    }
                    if (role === 'vendor') {
                        showSuccessMessage('?»å…¥?å?ï¼Œå?å¾€å» å?ä¸­å?');
                        window.open('vendor/', '_blank');
                        closeAuth();
                        return;
                    }
                    if (role === 'customer') {
                        showSuccessMessage(`æ­¡è??ä?ï¼?{json.data.user?.username || '?ƒå“¡'}ï¼`);
                        closeAuth();
                        // ä¸€?¬æ??¡ç??¨å??°ï?ä¸è·³è½?                        return;
                    }
                    closeAuth();
                    showSuccessMessage('?»å…¥?å?');
                }
                else { showSuccessMessage(json.message || '?»å…¥å¤±æ?'); }
            } catch (err) {
                console.error('?»å…¥?¯èª¤:', err);
                showSuccessMessage('ç¶²è·¯?¯èª¤ï¼Œè?ç¨å??è©¦');
            }
        }

        async function onRegisterSubmit(e) {
            e.preventDefault();
            const username = document.getElementById('regUsername').value.trim();
            const email = document.getElementById('regEmail').value.trim();
            const password = document.getElementById('regPassword').value;
            const password2 = document.getElementById('regPassword2').value;
            const phone = document.getElementById('regPhone').value.trim();
            // è§’è‰²?ºå???openAuth è¨­å?
            const role = (window.__selectedRole === 'vendor') ? 'vendor' : 'customer';
            const company_name = document.getElementById('regCompany').value.trim();
            if (!username || !email || !password) { showSuccessMessage('è«‹å??´å¡«å¯«ç”¨?¶å??é›»å­éƒµä»¶å?å¯†ç¢¼'); return; }
            if (password !== password2) { showSuccessMessage('?©æ¬¡å¯†ç¢¼ä¸ä???); return; }
            if (role === 'vendor' && !company_name) { showSuccessMessage('å» å?è¨»å?è«‹å¡«å¯«å…¬?¸å?ç¨?); return; }
            try {
                const body = { username, email, password, confirm_password: password2, phone, role };
                if (role === 'vendor') { body.company_name = company_name; }
                const res = await fetch('api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
                let json;
                try { json = await res.clone().json(); }
                catch { const txt = await res.text(); showSuccessMessage('è¨»å?å¤±æ?ï¼? + txt); return; }
                if (json.success) {
                    showSuccessMessage('è¨»å??å?ï¼Œè?ä½¿ç”¨å¸³å??»å…¥');
                    setTimeout(() => openAuth('login'), 1500);
                } else {
                    const details = json.details ? (typeof json.details === 'string' ? json.details : JSON.stringify(json.details)) : '';
                    showSuccessMessage((json.message || 'è¨»å?å¤±æ?') + (details ? ('ï¼? + details) : ''));
                }
            } catch (err) {
                console.error('è¨»å??¯èª¤:', err);
                showSuccessMessage('ç¶²è·¯?¯èª¤ï¼Œè?ç¨å??è©¦');
            }
        }

        // ?¶è??•ï?ä½¿ç”¨å½ˆç??³å´?„æ¬¡è¦æ???        document.addEventListener('click', (e) => {
            if (e.target && e.target.classList.contains('btn-secondary') && currentCoupon) {
                e.preventDefault();
                toggleFavorite(currentCoupon).then(() => { syncModalFavoriteButton(); updateFavCount(); });
            }
            // ?¶è??—è¡¨ä¸­ç??ªé™¤?‰é?ï¼ˆä?ä»¶ä»£?†ï?
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
            // ?¡ç??³ä?è§’å¿«?Ÿæ”¶??            if (e.target && e.target.matches('[data-action="quick-fav"]')) {
                e.stopPropagation();
                const id = Number(e.target.getAttribute('data-id'));
                const c = coupons.find(x => x.id === id);
                if (c) {
                    toggleFavorite(c).then(() => {
                        // ?‡æ??›å?æ¨???‡ç¬¦??                        const btn = e.target;
                        const nowFavs = new Set(getFavorites());
                        const active = nowFavs.has(id);
                        btn.classList.toggle('active', active);
                        btn.textContent = active ? '?? : '??;
                        updateFavCount();
                        // ?¥åœ¨?¶è?è¦–å?ä¸”å·²?–æ??¶è?ï¼Œç›´?¥ç§»?¤è©²?¡ç?
                        if (isFavoritesView() && !active) {
                            const card = btn.closest('.coupon-card');
                            if (card) card.remove();
                            // ?¥åˆª?‰å?é¡¯ç¤ºç©ºç•«??                            const remain = document.querySelectorAll('.coupon-card').length;
                            if (remain === 0) renderEmptyFavorites();
                        }
                    });
                }
            }
        });

        // ?´æ–°?´é?æ¬„æ”¶?æ•¸
        function updateFavCount() {
            const el = document.getElementById('favCount');
            if (!el) return;
            const count = getFavorites().length;
            if (count > 0) { el.textContent = String(count); el.style.display = ''; }
            else { el.textContent = ''; el.style.display = 'none'; }
        }
    
