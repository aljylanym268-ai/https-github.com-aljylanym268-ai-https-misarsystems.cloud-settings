# خطة إصلاح مشكلة التوقف والتجميد في التطبيق

## ✅ تم تحليل المشكلة

### أسباب المشكلة:
1. **مسارات ملفات JavaScript خاطئة في index.html** - 9 ملفات 404
2. **ملف admin-reports.js مفقود** - يسبب خطأ 404
3. **ازدواجية في دالة switchFounderTab** - معرفة في admin-dashboard.js و inline script
4. **نقص رسائل التصحيح** - صعوبة تحديد مكان توقف التنفيذ

### خطة الإصلاح:

#### الخطوة 1: تصحيح مسارات admin scripts في index.html
- تغيير `js/admin-couriers.js` → `js/js/admin-couriers.js`
- تغيير `js/admin-users.js` → `js/js/js/admin-users.js`
- تغيير `js/admin-products.js` → `js/js/js/js/admin-products.js`
- تغيير `js/admin-properties.js` → `js/js/js/js/js/admin-properties.js`
- تغيير `js/admin-services.js` → `js/js/js/js/js/js/admin-services.js`
- تغيير `js/admin-orders.js` → `js/js/js/js/js/js/js/admin-orders.js`
- تغيير `js/admin-logs.js` → `js/js/js/js/js/js/js/js/admin-logs.js`
- تغيير `js/admin-settings.js` → `js/js/js/js/js/js/js/js/js/admin-settings.js`
- إصلاح مسار `js/admin-reports.js` (إنشاء الملف المفقود)

#### الخطوة 2: إنشاء ملف admin-reports.js
- إنشاء ملف يحتوي على الدوال الأساسية للبلاغات

#### الخطوة 3: إضافة رسائل تصحيح
- إضافة console.log في showScreen(), handleRoute(), goBack()

#### الخطوة 4: إزالة الازدواجية
- إزالة دالة switchFounderTab من admin-dashboard.js (النسخة in-line هي الرسمية)
