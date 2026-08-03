// ============================================================
// إدارة الإعلانات (Banners) – لوحة المؤسس
// نسخة نهائية – تم إصلاح خطأ تحديث عمود id
// ============================================================

// ====== حالة البحث والترقيم ======
let bannersFilter = { query: '' };

// ====== دوال مساعدة افتراضية ======
if (typeof escapeHTML !== 'function') {
    window.escapeHTML = function(str) {
        if (!str) return '';
        return String(str).replace(/[&<>"]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            if (m === '"') return '&quot;';
            return m;
        });
    };
}
if (typeof showToast !== 'function') {
    window.showToast = function(message, type = 'info') {
        alert(`[${type}] ${message}`);
        console.log(`[Toast] ${type}: ${message}`);
    };
}
if (typeof showLoading !== 'function') {
    window.showLoading = function(show) {
        console.log(`[Loading] ${show ? 'ظهر' : 'اختفى'}`);
    };
}
if (typeof renderPagination !== 'function') {
    window.renderPagination = function(containerId, total, page, pageSize, onPageChange) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const totalPages = Math.ceil(total / pageSize);
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }
        let html = '<div class="pagination">';
        for (let i = 1; i <= totalPages; i++) {
            html += `<button class="${i === page ? 'active' : ''}" onclick="window._paginationCallback(${i})">${i}</button>`;
        }
        html += '</div>';
        container.innerHTML = html;
        window._paginationCallback = onPageChange;
    };
}

// ====== دوال التعامل مع قاعدة البيانات ======

/** جلب جميع الإعلانات */
async function getAllBannersLocal() {
    console.log('📋 [getAllBannersLocal] جلب الإعلانات...');
    const { data, error } = await supabaseClient
        .from('banners')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });
    if (error) {
        console.error('❌ [getAllBannersLocal] خطأ:', error);
        throw error;
    }
    console.log(`✅ [getAllBannersLocal] تم جلب ${data?.length || 0} إعلان`);
    return data || [];
}

/** حفظ إعلان (إدراج أو تحديث) – مع إزالة id من التحديث */
async function saveBannerLocal(bannerData) {
    console.log('💾 [saveBannerLocal] حفظ:', bannerData);
    
    // إزالة updated_at إن وجد (لأن العمود غير موجود حالياً)
    delete bannerData.updated_at;
    
    let result;
    if (bannerData.id) {
        // تحديث: نحتفظ بالـ id للشرط ولكن نزيله من بيانات التحديث
        const bannerId = bannerData.id;
        delete bannerData.id; // مهم: نزيل id من الكائن المرسل للتحديث
        
        const { data, error } = await supabaseClient
            .from('banners')
            .update(bannerData)
            .eq('id', bannerId)
            .select();
        if (error) {
            console.error('❌ [saveBannerLocal] فشل التحديث:', error);
            throw error;
        }
        result = data;
        console.log('✅ [saveBannerLocal] تم التحديث');
    } else {
        // إدراج جديد
        const { data, error } = await supabaseClient
            .from('banners')
            .insert([bannerData])
            .select();
        if (error) {
            console.error('❌ [saveBannerLocal] فشل الإدراج:', error);
            throw error;
        }
        result = data;
        console.log('✅ [saveBannerLocal] تم الإدراج');
    }
    return result;
}

/** حذف إعلان */
async function deleteBannerLocal(bannerId) {
    console.log('🗑️ [deleteBannerLocal] حذف:', bannerId);
    const { error } = await supabaseClient
        .from('banners')
        .delete()
        .eq('id', bannerId);
    if (error) {
        console.error('❌ [deleteBannerLocal] فشل الحذف:', error);
        throw error;
    }
    console.log('✅ [deleteBannerLocal] تم الحذف');
}

// ====== دالة رفع الصورة – تستخدم bucket "product-images" ======

async function uploadBannerImage(file) {
    console.log('📤 [uploadBannerImage] بدء رفع:', file.name, file.size, file.type);
    try {
        if (!file.type.startsWith('image/')) throw new Error('الملف ليس صورة');
        if (file.size > 10 * 1024 * 1024) throw new Error('حجم الصورة يتجاوز 10 ميجابايت');

        let compressed = file;
        if (typeof compressImage === 'function') {
            console.log('🔄 [uploadBannerImage] جاري ضغط الصورة...');
            compressed = await compressImage(file, 1200, 600, 0.8);
            console.log('✅ [uploadBannerImage] تم الضغط، الحجم الجديد:', compressed.size);
        } else {
            console.warn('⚠️ [uploadBannerImage] دالة compressImage غير موجودة، سيتم رفع الملف الأصلي');
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `banner-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `banners/${fileName}`;
        console.log('📁 [uploadBannerImage] المسار:', filePath);

        const BUCKET_NAME = 'product-images';
        console.log(`⏫ [uploadBannerImage] بدء الرفع إلى bucket "${BUCKET_NAME}"...`);
        const { error, data } = await supabaseClient.storage
            .from(BUCKET_NAME)
            .upload(filePath, compressed, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error('❌ [uploadBannerImage] فشل الرفع:', error);
            throw new Error(`فشل الرفع: ${error.message}`);
        }
        console.log('✅ [uploadBannerImage] تم الرفع بنجاح، data:', data);

        const { data: { publicUrl } } = supabaseClient.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filePath);
        console.log('🔗 [uploadBannerImage] الرابط العام:', publicUrl);
        return publicUrl;
    } catch (err) {
        console.error('❌ [uploadBannerImage] خطأ:', err);
        throw err;
    }
}

// ====== دوال تحميل وعرض الجدول ======

async function loadBannersTable(page = 1, pageSize = 10) {
    console.log('📋 [loadBannersTable] الصفحة:', page);
    try {
        const banners = await getAllBannersLocal();
        const filtered = banners.filter(b => {
            const q = bannersFilter.query.toLowerCase();
            return !q || b.title.toLowerCase().includes(q) || (b.description && b.description.toLowerCase().includes(q));
        });
        const total = filtered.length;
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        const pageData = filtered.slice(start, end);
        renderBannersTable(pageData);
        renderPagination('bannersPagination', total, page, pageSize, (p) => loadBannersTable(p, pageSize));
        console.log('✅ [loadBannersTable] تم عرض', pageData.length, 'إعلان');
    } catch (err) {
        console.error('❌ [loadBannersTable] خطأ:', err);
        showToast('فشل التحميل: ' + err.message, 'error');
    }
}

function renderBannersTable(data) {
    const tbody = document.getElementById('bannersTableBody');
    if (!tbody) return;
    if (!data.length) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px;">لا توجد إعلانات</td></tr>';
        return;
    }
    tbody.innerHTML = data.map(b => {
        const img = b.image_url ? `<img src="${b.image_url}" style="width:80px; height:50px; object-fit:cover; border-radius:8px;" loading="lazy">` : '📷';
        const statusText = b.active ? 'مفعل' : 'غير مفعل';
        const statusClass = b.active ? 'active' : 'inactive';
        return `<tr>
            <td>${img}</td>
            <td>${escapeHTML(b.title)}</td>
            <td>${escapeHTML(b.description || '')}</td>
            <td><a href="${b.link || '#'}" target="_blank" style="color:#1a237e;">${b.link ? 'رابط' : 'بدون'}</a></td>
            <td>${b.sort_order}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>
                <div class="action-group">
                    <button class="btn-sm edit" onclick="editBanner('${b.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn-sm ${b.active ? 'suspend' : 'reactivate'}" onclick="toggleBannerStatus('${b.id}', ${!b.active})">
                        <i class="fas ${b.active ? 'fa-pause' : 'fa-play'}"></i>
                    </button>
                    <button class="btn-sm delete" onclick="deleteBannerConfirm('${b.id}')"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

// ====== دوال النوافذ المنبثقة والبحث ======

window.filterBanners = function() {
    const input = document.getElementById('bannerSearchInput');
    bannersFilter.query = input ? input.value.trim() : '';
    loadBannersTable();
};

window.showAddBannerForm = function() {
    console.log('➕ [showAddBannerForm] فتح نموذج إضافة');
    document.getElementById('bannerModalTitle').textContent = 'إضافة إعلان';
    document.getElementById('editingBannerId').value = '';
    document.getElementById('bannerTitle').value = '';
    document.getElementById('bannerDescription').value = '';
    document.getElementById('bannerLink').value = '';
    document.getElementById('bannerSortOrder').value = '0';
    document.getElementById('bannerActive').checked = true;
    document.getElementById('bannerImagePreview').innerHTML = '';
    document.getElementById('bannerImageInput').value = '';
    document.getElementById('bannerModal').classList.add('active');
};

window.closeBannerModal = function() {
    console.log('❌ [closeBannerModal] إغلاق المودال');
    document.getElementById('bannerModal').classList.remove('active');
};

window.previewBannerImage = function(event) {
    const file = event.target.files[0];
    const container = document.getElementById('bannerImagePreview');
    container.innerHTML = '';
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.maxWidth = '100%';
            img.style.maxHeight = '200px';
            img.style.borderRadius = '12px';
            img.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            container.appendChild(img);
            console.log('🖼️ [previewBannerImage] تم تحميل المعاينة');
        };
        reader.readAsDataURL(file);
    }
};

// ====== دالة الحفظ الرئيسية (مع إصلاح خطأ id) ======

window.saveBanner = async function() {
    console.log('💾 [saveBanner] بدء عملية الحفظ');

    const id = document.getElementById('editingBannerId').value || null;
    const title = document.getElementById('bannerTitle').value.trim();
    const description = document.getElementById('bannerDescription').value.trim();
    const link = document.getElementById('bannerLink').value.trim();
    const sort_order = parseInt(document.getElementById('bannerSortOrder').value) || 0;
    const active = document.getElementById('bannerActive').checked;
    const imageInput = document.getElementById('bannerImageInput');

    if (!title) {
        showToast('يرجى إدخال عنوان الإعلان', 'warning');
        console.warn('⚠️ [saveBanner] العنوان فارغ');
        return;
    }

    let image_url = '';

    if (imageInput.files && imageInput.files.length > 0) {
        const file = imageInput.files[0];
        console.log('📷 [saveBanner] توجد صورة جديدة، جاري الرفع...');
        try {
            image_url = await uploadBannerImage(file);
            console.log('✅ [saveBanner] تم رفع الصورة، الرابط:', image_url);
        } catch (err) {
            console.error('❌ [saveBanner] فشل رفع الصورة:', err);
            showToast('فشل رفع الصورة: ' + err.message, 'error');
            return;
        }
    } else if (id) {
        console.log('🔍 [saveBanner] لا توجد صورة جديدة، جلب الرابط القديم...');
        try {
            const banners = await getAllBannersLocal();
            const existing = banners.find(b => b.id == id);
            if (existing && existing.image_url) {
                image_url = existing.image_url;
                console.log('✅ [saveBanner] تم جلب الرابط القديم:', image_url);
            } else {
                console.warn('⚠️ [saveBanner] لم يتم العثور على إعلان سابق أو لا يوجد صورة');
            }
        } catch (err) {
            console.error('❌ [saveBanner] فشل جلب الإعلان القديم:', err);
            showToast('فشل تحميل بيانات الإعلان القديم', 'error');
            return;
        }
    } else {
        console.warn('⚠️ [saveBanner] لا توجد صورة مرفوعة ولا يوجد إعلان سابق');
        showToast('يرجى رفع صورة للإعلان', 'warning');
        return;
    }

    if (!image_url) {
        showToast('يرجى رفع صورة للإعلان', 'warning');
        console.warn('⚠️ [saveBanner] لا توجد صورة (image_url فارغ)');
        return;
    }

    // تحضير البيانات (بدون updated_at)
    const bannerData = {
        title,
        description: description || null,
        image_url,
        link: link || null,
        sort_order,
        active
        // لا نرسل updated_at
    };
    if (id) {
        bannerData.id = id; // سيتم إزالته في saveBannerLocal أثناء التحديث
    }

    console.log('📦 [saveBanner] البيانات المرسلة:', bannerData);

    showLoading(true);
    try {
        console.log('⏳ [saveBanner] استدعاء saveBannerLocal...');
        const result = await saveBannerLocal(bannerData);
        console.log('✅ [saveBanner] تم الحفظ بنجاح، النتيجة:', result);

        showToast(id ? 'تم تحديث الإعلان' : 'تم إضافة الإعلان', 'success');
        closeBannerModal();

        await loadBannersTable();
        if (typeof loadBanners === 'function') {
            await loadBanners();
            console.log('🔄 [saveBanner] تم تحديث السلايدر');
        }

    } catch (err) {
        console.error('❌ [saveBanner] فشل الحفظ:', err);
        showToast('فشل حفظ الإعلان: ' + err.message, 'error');
    } finally {
        showLoading(false);
        console.log('🏁 [saveBanner] انتهت العملية');
    }
};

// ====== دوال التعديل وتغيير الحالة والحذف ======

window.editBanner = async function(bannerId) {
    console.log('✏️ [editBanner] تحميل بيانات الإعلان للمعاينة:', bannerId);
    try {
        const banners = await getAllBannersLocal();
        const banner = banners.find(b => b.id == bannerId);
        if (!banner) {
            showToast('الإعلان غير موجود', 'error');
            return;
        }
        document.getElementById('bannerModalTitle').textContent = 'تعديل إعلان';
        document.getElementById('editingBannerId').value = banner.id;
        document.getElementById('bannerTitle').value = banner.title;
        document.getElementById('bannerDescription').value = banner.description || '';
        document.getElementById('bannerLink').value = banner.link || '';
        document.getElementById('bannerSortOrder').value = banner.sort_order || 0;
        document.getElementById('bannerActive').checked = banner.active;
        const container = document.getElementById('bannerImagePreview');
        container.innerHTML = '';
        if (banner.image_url) {
            const img = document.createElement('img');
            img.src = banner.image_url;
            img.style.maxWidth = '100%';
            img.style.maxHeight = '200px';
            img.style.borderRadius = '12px';
            img.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            container.appendChild(img);
        }
        document.getElementById('bannerImageInput').value = '';
        document.getElementById('bannerModal').classList.add('active');
        console.log('✅ [editBanner] تم ملء النموذج');
    } catch (err) {
        console.error('❌ [editBanner] خطأ:', err);
        showToast('فشل تحميل بيانات الإعلان', 'error');
    }
};

window.toggleBannerStatus = async function(bannerId, newStatus) {
    console.log('🔄 [toggleBannerStatus] تغيير حالة الإعلان:', bannerId, 'إلى', newStatus);
    showLoading(true);
    try {
        const banners = await getAllBannersLocal();
        const existing = banners.find(b => b.id == bannerId);
        if (!existing) {
            showToast('الإعلان غير موجود', 'error');
            return;
        }
        // نحدث الحالة فقط (بدون updated_at)
        const updated = { ...existing, active: newStatus };
        // نزيل id من البيانات (سيتم إزالته في saveBannerLocal)
        await saveBannerLocal(updated);
        showToast(newStatus ? 'تم تفعيل الإعلان' : 'تم إيقاف الإعلان', 'success');
        await loadBannersTable();
        if (typeof loadBanners === 'function') await loadBanners();
        console.log('✅ [toggleBannerStatus] تم تغيير الحالة');
    } catch (err) {
        console.error('❌ [toggleBannerStatus] خطأ:', err);
        showToast(err.message, 'error');
    } finally {
        showLoading(false);
    }
};

window.deleteBannerConfirm = async function(bannerId) {
    if (!confirm('هل أنت متأكد من حذف هذا الإعلان نهائياً؟')) return;
    console.log('🗑️ [deleteBannerConfirm] حذف الإعلان:', bannerId);
    showLoading(true);
    try {
        await deleteBannerLocal(bannerId);
        showToast('تم حذف الإعلان', 'success');
        await loadBannersTable();
        if (typeof loadBanners === 'function') await loadBanners();
        console.log('✅ [deleteBannerConfirm] تم الحذف');
    } catch (err) {
        console.error('❌ [deleteBannerConfirm] خطأ:', err);
        showToast(err.message, 'error');
    } finally {
        showLoading(false);
    }
};

// ====== تصدير الدوال ======
window.loadBannersTable = loadBannersTable;
window.filterBanners = filterBanners;
window.showAddBannerForm = showAddBannerForm;
window.closeBannerModal = closeBannerModal;
window.previewBannerImage = previewBannerImage;
window.saveBanner = saveBanner;
window.editBanner = editBanner;
window.toggleBannerStatus = toggleBannerStatus;
window.deleteBannerConfirm = deleteBannerConfirm;
window.uploadBannerImage = uploadBannerImage;

console.log('✅ [admin-banners.js] تم تحميل جميع الدوال بنجاح (مع إصلاح id)');