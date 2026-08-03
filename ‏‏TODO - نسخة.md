# TODO - إضافة نظام URL Routing للتطبيق

## ✅ المهام المنجزة بالكامل

### 1. `supabase.js` و `products.js` - إضافة دالة `handleRoute()`
- [x] `?id=XXX` → تفتح تفاصيل المنتج مع `?id=productId` في الـ URL
- [x] `?store=XXX` → تفتح متجر البائع
- [x] `?founder=XXX` → تفتح صفحة المؤسس
- [x] استخدام `window.history.replaceState` لتحديث الـ URL عند التنقل

### 2. `product.js` - تعديل `openProductDetail()`
- [x] إضافة `window.history.pushState` لتحديث الـ URL عند فتح تفاصيل المنتج
- [x] إضافة `popstate` event listener للرجوع عند الضغط على Back
- [x] إضافة التحقق من حالة المنتج (`status === 'deleted'`)
- [x] إزالة الدالة المكررة `openProductDetail` الثانية (غير المكتملة)

### 3. `index.html` - استدعاء `handleRoute()`
- [x] استدعاء `handleRoute()` بعد تهيئة التطبيق (`showScreen(appState.currentScreen)`)

### 4. `admin-dashboard.js` - إضافة تبويب الإعلانات
- [x] إضافة `case 'banners': loadBannersTable(); break;` في `switchFounderTab()`
- [x] إضافة `case 'banners': loadBannersTable(); break;` في `refreshFounderDashboard()`

### 5. `supabase.js` - إضافة دوال السلايدر
- [x] إضافة `banners: []` إلى `appState` (تهيئة المصفوفة)
- [x] إضافة تصدير دوال السلايدر: `loadBanners`, `renderBanners`, `slideBanner`, `goToBanner`, `startBannerAutoSlide`, `resetBannerAutoSlide`, `updateBannerVisibility`

### 6. إزالة التكرار
- [x] إزالة الدالة المكررة `openProductDetail` من `product.js`

## ⚠️ ملاحظات باقية
- يوجد دالة `handleRoute()` مكررة في كل من `supabase.js` و `products.js` - تحتاج تنظيف (إزالة من `supabase.js`)
- `loadProductsFromDB` مُستخدمة في `handleRoute()` داخل `products.js` فقط

## ✅ اختبار النظام
- [ ] اختبار فتح المنتج بالرابط `?id=XXX`
- [ ] اختبار متجر البائع بالرابط `?store=XXX`
- [ ] اختبار صفحة المؤسس بالرابط `?founder=XXX`
- [ ] اختبار أزرار Back في المتصفح (`popstate`)
