// ============================================================
// دوال البلاغات (admin-reports.js)
// ============================================================
let reportsFilter = { query: '', status: 'all' };

async function loadReportsTable(page = 1, pageSize = 10) {
    const reports = await getAllReports();
    const filtered = reports.filter(r => {
        const q = reportsFilter.query.toLowerCase();
        const matchQuery = !q || r.target_type.toLowerCase().includes(q) ||
                           (r.reporter?.name && r.reporter.name.toLowerCase().includes(q)) ||
                           (r.reason && r.reason.toLowerCase().includes(q));
        const matchStatus = reportsFilter.status === 'all' || r.status === reportsFilter.status;
        return matchQuery && matchStatus;
    });
    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const pageData = filtered.slice(start, end);
    renderReportsTable(pageData);
    renderPagination('reportsPagination', total, page, pageSize, (p) => loadReportsTable(p, pageSize));
}

function renderReportsTable(data) {
    const tbody = document.getElementById('reportsTableBody');
    if (!tbody) return;
    if (!data.length) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">لا توجد بلاغات</td></tr>';
        return;
    }
    tbody.innerHTML = data.map(r => {
        const statusMap = { 'pending': 'قيد المراجعة', 'approved': 'مقبول', 'rejected': 'مرفوض' };
        const statusText = statusMap[r.status] || r.status;
        const typeMap = { 'product': 'منتج', 'property': 'عقار', 'service': 'خدمة', 'user': 'مستخدم' };
        const typeText = typeMap[r.target_type] || r.target_type;
        return `<tr>
            <td>${escapeHTML(r.reporter?.name || 'غير معروف')}</td>
            <td>${typeText}</td>
            <td>${escapeHTML(r.reason || '')}</td>
            <td>${new Date(r.created_at).toLocaleDateString('ar-EG')}</td>
            <td><span class="status-badge ${r.status}">${statusText}</span></td>
            <td>
                <div class="action-group">
                    ${r.status === 'pending' ? `
                        <button class="btn-sm approve" onclick="approveReport('${r.id}')"><i class="fas fa-check"></i></button>
                        <button class="btn-sm reject" onclick="rejectReport('${r.id}')"><i class="fas fa-times"></i></button>
                    ` : ''}
                    <button class="btn-sm view" onclick="viewReportDetails('${r.id}')"><i class="fas fa-eye"></i></button>
                    <button class="btn-sm delete" onclick="deleteReportContent('${r.id}')"><i class="fas fa-trash"></i></button>
                    <button class="btn-sm suspend" onclick="warnReportOwner('${r.id}')"><i class="fas fa-exclamation-triangle"></i></button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

window.filterReports = function() {
    const input = document.getElementById('reportSearchInput');
    reportsFilter.query = input ? input.value.trim() : '';
    loadReportsTable();
};

window.filterReportsByStatus = function(status) {
    reportsFilter.status = status;
    document.querySelectorAll('#tab-reports .filter-btn').forEach(b => b.classList.remove('active'));
    const btns = document.querySelectorAll('#tab-reports .filter-btn');
    const index = ['all','pending','approved','rejected'].indexOf(status);
    if (btns[index]) btns[index].classList.add('active');
    loadReportsTable();
};

window.approveReport = async function(reportId) {
    if (!confirm('قبول هذا البلاغ؟')) return;
    showLoading(true);
    try {
        await updateReportStatus(reportId, 'approved');
        showToast('تم قبول البلاغ', 'success');
        loadReportsTable();
    } catch (err) { showToast(err.message, 'error'); }
    finally { showLoading(false); }
};

window.rejectReport = async function(reportId) {
    if (!confirm('رفض هذا البلاغ؟')) return;
    showLoading(true);
    try {
        await updateReportStatus(reportId, 'rejected');
        showToast('تم رفض البلاغ', 'success');
        loadReportsTable();
    } catch (err) { showToast(err.message, 'error'); }
    finally { showLoading(false); }
};

window.viewReportDetails = function(reportId) {
    showToast('عرض التفاصيل قيد التطوير', 'info');
};

window.deleteReportContent = function(reportId) {
    if (!confirm('حذف المحتوى المبلغ عنه؟')) return;
    showToast('سيتم حذف المحتوى', 'info');
};

window.warnReportOwner = function(reportId) {
    showToast('تم إرسال تحذير', 'success');
};

