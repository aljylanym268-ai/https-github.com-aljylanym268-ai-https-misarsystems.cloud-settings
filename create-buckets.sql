-- ============================================================
-- إنشاء جميع Storage Buckets + سياسات RLS
-- لتطبيق Misar Systems
-- شغّل هذا الكود في SQL Editor في Supabase Dashboard
-- ============================================================

-- 1. إنشاء Buckets إذا لم تكن موجودة
-- (ملاحظة: يمكن إنشاء buckets فقط عبر API أو Dashboard،
--  SQL يستخدم الدالة supabase_add_bucket المتاحة)

-- Bucket: product-images (صور المنتجات)
SELECT storage.create_bucket('product-images', 'public');

-- Bucket: review-media (صور وفيديوهات التقييمات)
SELECT storage.create_bucket('review-media', 'public');

-- Bucket: user-images (الصور الشخصية)
SELECT storage.create_bucket('user-images', 'public');

-- Bucket: banner-images (صور الإعلانات)
SELECT storage.create_bucket('banner-images', 'public');

-- Bucket: property-images (صور العقارات)
SELECT storage.create_bucket('property-images', 'public');

-- ============================================================
-- 2. تفعيل RLS على Storage objects
-- ============================================================
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. إنشاء سياسات للسماح بالرفع والعرض للجميع (public buckets)
-- ============================================================

-- سياسة لعرض الملفات (للمستخدمين غير المسجلين)
DROP POLICY IF EXISTS "Public Access - GET" ON storage.objects;
CREATE POLICY "Public Access - GET" 
ON storage.objects FOR SELECT 
USING (bucket_id IN ('product-images', 'review-media', 'user-images', 'banner-images', 'property-images'));

-- سياسة لرفع الملفات (للمستخدمين المسجلين)
DROP POLICY IF EXISTS "Authenticated Upload - INSERT" ON storage.objects;
CREATE POLICY "Authenticated Upload - INSERT" 
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (bucket_id IN ('product-images', 'review-media', 'user-images', 'banner-images', 'property-images'));

-- سياسة لتحديث الملفات (للمستخدمين المسجلين - يمكنهم تعديل ملفاتهم)
DROP POLICY IF EXISTS "Authenticated Update - UPDATE" ON storage.objects;
CREATE POLICY "Authenticated Update - UPDATE" 
ON storage.objects FOR UPDATE 
TO authenticated
USING (auth.uid() = owner);

-- سياسة لحذف الملفات (للمستخدمين المسجلين - يمكنهم حذف ملفاتهم)
DROP POLICY IF EXISTS "Authenticated Delete - DELETE" ON storage.objects;
CREATE POLICY "Authenticated Delete - DELETE" 
ON storage.objects FOR DELETE 
TO authenticated
USING (auth.uid() = owner);

-- ============================================================
-- 4. بديل: سياسات مفتوحة للجميع (للتطوير فقط - استخدم بحذر)
-- ============================================================
-- إذا كنت تريد السماح لأي شخص (حتى الزوار) برفع الملفات،
-- استخدم هذه السياسات بدلاً من السابقة:

-- DROP POLICY IF EXISTS "Public Access - ALL" ON storage.objects;
-- CREATE POLICY "Public Access - ALL" 
-- ON storage.objects FOR ALL 
-- USING (bucket_id IN ('product-images', 'review-media', 'user-images', 'banner-images', 'property-images'))
-- WITH CHECK (bucket_id IN ('product-images', 'review-media', 'user-images', 'banner-images', 'property-images'));

-- ============================================================
-- 5. التحقق من إنشاء الـ buckets بنجاح
-- ============================================================
SELECT id, name, public 
FROM storage.buckets 
WHERE name IN ('product-images', 'review-media', 'user-images', 'banner-images', 'property-images');

