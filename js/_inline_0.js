
   // ======== Ø§Ù„ØªÙ‡ÙŠØ¦Ø© Ø§Ù„Ø¹Ø§Ù…Ø© ========
    document.addEventListener('DOMContentLoaded', async function() {
        console.log('ðŸš€ ØªØ·Ø¨ÙŠÙ‚ Misar Systems Ø¨Ø¯Ø£ Ø§Ù„ØªØ­Ù…ÙŠÙ„...');

        // Ø¨
        // 1. ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ù…ÙˆÙ‚Ø¹ Ø§Ù„Ù…Ø®Ø²Ù†
        const savedLocation = localStorage.getItem('misarUserLocation');
        if (savedLocation) {
            try {
                appState.location = JSON.parse(savedLocation);
            } catch(e) {}
        }

        // 2. Ø¬Ù„Ø³Ø© Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            const user = session.user;
            appState.user = {
                id: user.id,
                email: user.email,
                user_metadata: user.user_metadata
            };
            await loadUserData();
            appState.currentScreen = appState.userData.account_type === 'seller' ? 'sellerDashboardScreen' :
                                     (appState.userData.account_type === 'delivery' ? 'deliveryDashboardScreen' :
                                     (appState.userData.account_type === 'founder' ? 'founderDashboardScreen' :
                                     'homeScreen'));
        } else {
            appState.currentScreen = appState.location ? 'homeScreen' : 'locationScreen';
        }

        // 3. ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø£Ø³Ø§Ø³ÙŠØ©
        await loadProductsFromDB();
        await loadBanners();   // ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ø¥Ø¹Ù„Ø§Ù†Ø§Øª
        loadFeaturedProducts();
        loadMarketProducts();
        loadServices();
        loadCart();
        await updateCartBadgeFromDB();

        // 4. Ø¥Ø®ÙØ§Ø¡ Ø´Ø§Ø´Ø© Ø§Ù„ØªØ­Ù…ÙŠÙ„ ÙˆØ¹Ø±Ø¶ Ø§Ù„Ø´Ø§Ø´Ø© Ø§Ù„Ù…Ù†Ø§Ø³Ø¨Ø©
        setTimeout(() => {
            document.getElementById('loadingScreen').style.display = 'none';
            showScreen(appState.currentScreen);
            if (!handleRoute()) {
                // Ø¥Ø°Ø§ Ù„Ù… ÙŠØªÙ… ØªÙˆØ¬ÙŠÙ‡Ù‡ØŒ Ù†Ø¹Ø±Ø¶ Ø§Ù„Ø´Ø§Ø´Ø© Ø§Ù„Ø§ÙØªØ±Ø§Ø¶ÙŠØ©
            }
            if (appState.location) {
                updateWelcomeLocation();
                updateProfileLocation();
            }
            toggleLoginMenu(!!appState.user);
            const isSeller = appState.userData?.account_type === 'seller';
            const isDelivery = appState.userData?.account_type === 'delivery';
            const isFounder = appState.userData?.account_type === 'founder';
            toggleSellerMenuItem(isSeller);
            toggleDeliveryMenuItem(isDelivery);
            toggleFounderMenuItem(isFounder);
            addInputInteractions();

            // Ø¥Ø°Ø§ ÙƒØ§Ù† Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… Ù…Ø¤Ø³Ø³Ø§Ù‹ØŒ Ù‚Ù… Ø¨ØªØ­Ù…ÙŠÙ„ Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ…
            if (isFounder) {
                setTimeout(() => {
                    if (typeof refreshFounderDashboard === 'function') {
                        refreshFounderDashboard();
                    }
                }, 500);
            }
        }, 1500);

        // ======== Ø¥Ø¶Ø§ÙØ© Ù…Ø³ØªÙ…Ø¹ Ø­Ø§Ù„Ø© Ø§Ù„Ù…ØµØ§Ø¯Ù‚Ø© ========
        supabaseClient.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
                appState.user = {
                    id: session.user.id,
                    email: session.user.email,
                    user_metadata: session.user.user_metadata
                };
                await loadUserData();
                toggleLoginMenu(true);
                const accountType = appState.userData?.account_type || 'client';
                toggleSellerMenuItem(accountType === 'seller');
                toggleDeliveryMenuItem(accountType === 'delivery');
                toggleFounderMenuItem(accountType === 'founder');
                await updateCartBadgeFromDB();

                let targetScreen = 'homeScreen';
                if (accountType === 'seller') targetScreen = 'sellerDashboardScreen';
                else if (accountType === 'delivery') targetScreen = 'deliveryDashboardScreen';
                else if (accountType === 'founder') targetScreen = 'founderDashboardScreen';
                showScreen(targetScreen);
                showToast('ØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø¨Ù†Ø¬Ø§Ø­', 'success');
                updateUserInfo();
                updateWelcomeLocation();
                updateProfileLocation();
            }

            if (event === 'SIGNED_OUT') {
                appState.user = null;
                appState.userData = {};
                toggleLoginMenu(false);
                toggleSellerMenuItem(false);
                toggleDeliveryMenuItem(false);
                toggleFounderMenuItem(false);
                updateUserInfo(true);
                await loadCart();
                await updateCartBadgeFromDB();
                showScreen('homeScreen');
                showToast('ØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø®Ø±ÙˆØ¬', 'info');
            }
        });

        // ======== Ø±Ø¨Ø· Ø§Ù„Ø£Ø­Ø¯Ø§Ø« ========
        document.getElementById('loginBtn')?.addEventListener('click', function(e) {
            e.preventDefault();
            if (typeof signInWithEmail === 'function') signInWithEmail();
            else showToast('Ø­Ø¯Ø« Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ù†Ø¸Ø§Ù…', 'error');
        });

        document.getElementById('registerBtn')?.addEventListener('click', function(e) {
            e.preventDefault();
            if (typeof signUpWithEmail === 'function') signUpWithEmail();
            else showToast('Ø­Ø¯Ø« Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ù†Ø¸Ø§Ù…', 'error');
        });

        document.getElementById('googleLoginBtn')?.addEventListener('click', function(e) {
            e.preventDefault();
            if (typeof signInWithGoogle === 'function') signInWithGoogle();
            else showToast('Ø­Ø¯Ø« Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ù†Ø¸Ø§Ù…', 'error');
        });

        document.getElementById('showRegisterLink')?.addEventListener('click', function(e) {
            e.preventDefault();
            showScreen('registerScreen');
        });
        document.getElementById('showLoginLink')?.addEventListener('click', function(e) {
            e.preventDefault();
            showScreen('loginScreen');
        });

        document.getElementById('saveLocationBtn')?.addEventListener('click', saveLocation);

        const centerSelect = document.getElementById('centerSelect');
        const villageSelect = document.getElementById('villageSelect');
        if (centerSelect && villageSelect) {
            centerSelect.addEventListener('change', function() {
                const center = this.value;
                if (!center) {
                    villageSelect.innerHTML = '<option value="">Ø§Ø®ØªØ± Ø§Ù„Ù‚Ø±ÙŠØ©</option>';
                    villageSelect.disabled = true;
                    return;
                }
                villageSelect.disabled = false;
                loadVillagesForCenter(center, '');
            });
            if (appState.location?.center) {
                centerSelect.value = appState.location.center;
                villageSelect.disabled = false;
                loadVillagesForCenter(appState.location.center, appState.location.village || '');
            } else {
                villageSelect.disabled = true;
            }
        }

        document.querySelectorAll('.star').forEach(star => {
            star.addEventListener('click', function() {
                const value = parseInt(this.dataset.value);
                document.getElementById('reviewRating').value = value;
                document.querySelectorAll('.star').forEach(s => {
                    s.textContent = parseInt(s.dataset.value) <= value ? 'â˜…' : 'â˜†';
                    s.style.color = parseInt(s.dataset.value) <= value ? '#D4AF37' : '#ccc';
                });
            });
            star.addEventListener('mouseenter', function() {
                const value = parseInt(this.dataset.value);
                document.querySelectorAll('.star').forEach(s => {
                    s.style.color = parseInt(s.dataset.value) <= value ? '#D4AF37' : '#ccc';
                });
            });
            star.addEventListener('mouseleave', function() {
                const selected = parseInt(document.getElementById('reviewRating').value) || 5;
                document.querySelectorAll('.star').forEach(s => {
                    s.style.color = parseInt(s.dataset.value) <= selected ? '#D4AF37' : '#ccc';
                });
            });
        });

        document.getElementById('notificationRecipients')?.addEventListener('change', function() {
            const specificEmail = document.getElementById('specificUserEmail');
            if (this.value === 'specific') {
                specificEmail.style.display = 'block';
            } else {
                specificEmail.style.display = 'none';
            }
        });

        console.log('âœ… ØªÙ… ØªØ­Ù…ÙŠÙ„ Ø§Ù„ØªØ·Ø¨ÙŠÙ‚ Ø¨Ù†Ø¬Ø§Ø­.');
    });

    // ======== Ø¯ÙˆØ§Ù„ Ù…Ø³Ø§Ø¹Ø¯Ø© ========
    function togglePasswordVisibility(inputId, toggleEl) {
        const input = document.getElementById(inputId);
        if (!input || !toggleEl) return;
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        const icon = toggleEl.querySelector('i');
        if (icon) {
            icon.className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
        }
    }
    window.togglePasswordVisibility = togglePasswordVisibility;

    // ======== Ø§Ø³ØªØ¯Ø¹Ø§Ø¡ Ø¯ÙˆØ§Ù„ Ù„ÙˆØ­Ø© Ø§Ù„Ù…Ø¤Ø³Ø³ Ø¹Ù†Ø¯ ØªØ¨Ø¯ÙŠÙ„ Ø§Ù„ØªØ¨ÙˆÙŠØ¨ ========
    window.switchFounderTab = function(tabId) {
        document.querySelectorAll('.founder-tab').forEach(tab => tab.classList.remove('active'));
        const activeTab = document.querySelector(`.founder-tab[data-tab="${tabId}"]`);
        if (activeTab) activeTab.classList.add('active');
        document.querySelectorAll('.founder-tab-panel').forEach(panel => panel.classList.remove('active'));
        const targetPanel = document.getElementById(`tab-${tabId}`);
        if (targetPanel) targetPanel.classList.add('active');

        switch (tabId) {
            case 'dashboard': if (typeof refreshFounderDashboard === 'function') refreshFounderDashboard(); break;
            case 'deliveries': if (typeof loadDeliveriesTable === 'function') loadDeliveriesTable(); break;
            case 'customers': if (typeof loadCustomersTable === 'function') loadCustomersTable(); break;
            case 'sellers': if (typeof loadSellersTable === 'function') loadSellersTable(); break;
            case 'products': if (typeof loadProductsTableAdmin === 'function') loadProductsTableAdmin(); break;
            case 'properties': if (typeof loadPropertiesTable === 'function') loadPropertiesTable(); break;
            case 'services': if (typeof loadServicesTableAdmin === 'function') loadServicesTableAdmin(); break;
            case 'orders': if (typeof loadOrdersTableAdmin === 'function') loadOrdersTableAdmin(); break;
            case 'reports': if (typeof loadReportsTable === 'function') loadReportsTable(); break;
            case 'logs': if (typeof loadLogsTable === 'function') loadLogsTable(); break;
            case 'banners': if (typeof loadBannersTable === 'function') loadBannersTable(); break;
            case 'settings': if (typeof loadSettingsForm === 'function') loadSettingsForm(); break;
        }
    };

    console.log('âœ… ØªÙ… ØªØ­Ù…ÙŠÙ„ Ø¬Ù…ÙŠØ¹ Ø§Ù„Ø¯ÙˆØ§Ù„.');

