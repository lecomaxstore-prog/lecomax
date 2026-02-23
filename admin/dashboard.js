import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import {
    collection,
    addDoc,
    getDocs,
    query,
    orderBy,
    doc,
    updateDoc,
    deleteDoc,
    writeBatch,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';
import { auth, db, ADMIN_EMAIL } from './firebase-config.js';

const ORDERS_COLLECTION = 'orders';
const FORM_DRAFT_KEY = 'lecomax_admin_sale_form_draft';
const SALES_CACHE_KEY = 'lecomax_admin_sales_cache';

const els = {
    totalOrders: document.getElementById('totalOrders'),
    totalRevenue: document.getElementById('totalRevenue'),
    thisMonthOrders: document.getElementById('thisMonthOrders'),
    thisMonthRevenue: document.getElementById('thisMonthRevenue'),
    selectedMonthOrders: document.getElementById('selectedMonthOrders'),
    selectedMonthRevenue: document.getElementById('selectedMonthRevenue'),

    saleForm: document.getElementById('saleForm'),
    saleDate: document.getElementById('saleDate'),

    historyBody: document.getElementById('historyBody'),
    searchInput: document.getElementById('searchInput'),
    monthFilter: document.getElementById('monthFilter'),
    quickFilters: document.querySelectorAll('.quick-filter'),

    exportCsvBtn: document.getElementById('exportCsvBtn'),
    downloadJsonBtn: document.getElementById('downloadJsonBtn'),
    importJsonBtn: document.getElementById('importJsonBtn'),
    importJsonInput: document.getElementById('importJsonInput'),

    editModal: document.getElementById('editModal'),
    editForm: document.getElementById('editForm'),
    closeModalBtn: document.getElementById('closeModalBtn'),

    toast: document.getElementById('toast'),
    logoutBtn: document.getElementById('logoutBtn')
};

let salesData = [];
let currentEditId = null;
let activeQuickFilter = 'all';
let isInitialized = false;

function formatMAD(amount) {
    return `MAD ${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function toAmount(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function getToday() {
    return new Date().toISOString().split('T')[0];
}

function getMonthKey(dateStr) {
    return String(dateStr || '').slice(0, 7);
}

function setDefaultDate() {
    if (els.saleDate && !els.saleDate.value) {
        els.saleDate.value = getToday();
    }
}

function showToast(message, isError = false) {
    if (!els.toast) {
        return;
    }

    els.toast.textContent = message;
    els.toast.className = `toast show ${isError ? 'error' : ''}`;
    setTimeout(() => {
        els.toast.classList.remove('show');
    }, 3000);
}

function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g,
        (tag) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

function normalizeSaleFromDoc(docSnap) {
    const data = docSnap.data() || {};
    const date = typeof data.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data.date) ? data.date : getToday();

    return {
        id: docSnap.id,
        clientName: String(data.clientName || data.customer || '').trim(),
        phone: String(data.phone || '').trim(),
        city: String(data.city || '').trim(),
        product: String(data.product || '').trim(),
        price: toAmount(data.price ?? data.amount),
        date,
        address: String(data.address || '').trim(),
        notes: String(data.notes || '').trim()
    };
}

function normalizeSaleFromObject(raw) {
    const date = typeof raw?.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.date) ? raw.date : getToday();
    return {
        id: String(raw?.id || ''),
        clientName: String(raw?.clientName || raw?.customer || '').trim(),
        phone: String(raw?.phone || '').trim(),
        city: String(raw?.city || '').trim(),
        product: String(raw?.product || '').trim(),
        price: toAmount(raw?.price ?? raw?.amount),
        date,
        address: String(raw?.address || '').trim(),
        notes: String(raw?.notes || '').trim()
    };
}

async function loadSalesFromFirestore() {
    try {
        const ordersRef = collection(db, ORDERS_COLLECTION);
        const salesQuery = query(ordersRef, orderBy('date', 'desc'));
        const snapshot = await getDocs(salesQuery);
        salesData = snapshot.docs.map(normalizeSaleFromDoc);
        saveSalesCache();
    } catch (error) {
        const cachedSales = loadSalesCache();
        if (cachedSales.length) {
            salesData = cachedSales;
            showToast('Using locally saved sales data', true);
            return;
        }

        throw error;
    }
}

async function createSaleOnFirestore(newSale) {
    const payload = {
        clientName: newSale.clientName,
        phone: newSale.phone,
        city: newSale.city,
        product: newSale.product,
        price: toAmount(newSale.price),
        date: newSale.date,
        address: newSale.address || '',
        notes: newSale.notes || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    };

    const ref = await addDoc(collection(db, ORDERS_COLLECTION), payload);
    return { ...newSale, id: ref.id };
}

async function updateSaleOnFirestore(id, salePatch) {
    const payload = {
        clientName: salePatch.clientName,
        phone: salePatch.phone,
        city: salePatch.city,
        product: salePatch.product,
        price: toAmount(salePatch.price),
        date: salePatch.date,
        address: salePatch.address || '',
        notes: salePatch.notes || '',
        updatedAt: serverTimestamp()
    };

    await updateDoc(doc(db, ORDERS_COLLECTION, id), payload);
    return { ...salePatch, id };
}

async function deleteSaleOnFirestore(id) {
    await deleteDoc(doc(db, ORDERS_COLLECTION, id));
}

async function replaceSalesOnFirestore(rows) {
    const normalizedRows = rows.map(normalizeSaleFromObject);
    const existing = await getDocs(collection(db, ORDERS_COLLECTION));

    if (!existing.empty) {
        const deleteBatch = writeBatch(db);
        existing.forEach((item) => {
            deleteBatch.delete(item.ref);
        });
        await deleteBatch.commit();
    }

    for (const row of normalizedRows) {
        await addDoc(collection(db, ORDERS_COLLECTION), {
            clientName: row.clientName,
            phone: row.phone,
            city: row.city,
            product: row.product,
            price: toAmount(row.price),
            date: row.date,
            address: row.address || '',
            notes: row.notes || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
    }
}

function saveFormDraft() {
    if (!els.saleForm) {
        return;
    }

    const formData = new FormData(els.saleForm);
    const draft = {
        saleProduct: String(formData.get('saleProduct') || ''),
        saleCustomer: String(formData.get('saleCustomer') || ''),
        salePhone: String(formData.get('salePhone') || ''),
        saleCity: String(formData.get('saleCity') || ''),
        saleAmount: String(formData.get('saleAmount') || ''),
        saleDate: String(formData.get('saleDate') || ''),
        saleAddress: String(formData.get('saleAddress') || ''),
        saleNotes: String(formData.get('saleNotes') || '')
    };

    localStorage.setItem(FORM_DRAFT_KEY, JSON.stringify(draft));
}

function restoreFormDraft() {
    if (!els.saleForm) {
        return;
    }

    const rawDraft = localStorage.getItem(FORM_DRAFT_KEY);
    if (!rawDraft) {
        return;
    }

    try {
        const draft = JSON.parse(rawDraft);
        if (!draft || typeof draft !== 'object') {
            return;
        }

        const fields = ['saleProduct', 'saleCustomer', 'salePhone', 'saleCity', 'saleAmount', 'saleDate', 'saleAddress', 'saleNotes'];
        fields.forEach((fieldName) => {
            const field = els.saleForm.elements.namedItem(fieldName);
            if (field && 'value' in field) {
                field.value = String(draft[fieldName] || '');
            }
        });

        setDefaultDate();
    } catch (error) {
        console.error('Failed to restore sale form draft', error);
    }
}

function clearFormDraft() {
    localStorage.removeItem(FORM_DRAFT_KEY);
}

function saveSalesCache() {
    localStorage.setItem(SALES_CACHE_KEY, JSON.stringify(salesData));
}

function loadSalesCache() {
    const rawCache = localStorage.getItem(SALES_CACHE_KEY);
    if (!rawCache) {
        return [];
    }

    try {
        const parsed = JSON.parse(rawCache);
        if (!Array.isArray(parsed)) {
            return [];
        }

        return parsed.map(normalizeSaleFromObject);
    } catch (error) {
        console.error('Failed to parse sales cache', error);
        return [];
    }
}

function updateMonthDropdown() {
    const months = [...new Set(salesData.map((s) => getMonthKey(s.date)).filter(Boolean))].sort().reverse();
    const currentVal = els.monthFilter.value;

    els.monthFilter.innerHTML = '<option value="all">All Months</option>';

    months.forEach((month) => {
        const [year, m] = month.split('-');
        const date = new Date(Number(year), Number(m) - 1, 1);
        const label = date.toLocaleString('default', { month: 'long', year: 'numeric' });

        const option = document.createElement('option');
        option.value = month;
        option.textContent = label;
        els.monthFilter.appendChild(option);
    });

    if (months.includes(currentVal) || currentVal === 'all') {
        els.monthFilter.value = currentVal;
    }
}

function getFilteredData() {
    let data = [...salesData];

    const searchTerm = String(els.searchInput.value || '').toLowerCase().trim();
    if (searchTerm) {
        data = data.filter((s) =>
            s.product.toLowerCase().includes(searchTerm)
            || s.clientName.toLowerCase().includes(searchTerm)
            || s.phone.toLowerCase().includes(searchTerm)
            || s.city.toLowerCase().includes(searchTerm)
        );
    }

    const selectedMonth = els.monthFilter.value;
    if (selectedMonth !== 'all') {
        data = data.filter((s) => getMonthKey(s.date) === selectedMonth);
    }

    const today = getToday();
    const thisMonth = getMonthKey(today);

    if (activeQuickFilter === 'today') {
        data = data.filter((s) => s.date === today);
    } else if (activeQuickFilter === 'thisMonth') {
        data = data.filter((s) => getMonthKey(s.date) === thisMonth);
    }

    return data.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function calculateTotals(filteredData) {
    const totalOrders = salesData.length;
    const totalRevenue = salesData.reduce((sum, s) => sum + toAmount(s.price), 0);

    els.totalOrders.textContent = totalOrders.toLocaleString();
    els.totalRevenue.textContent = formatMAD(totalRevenue);

    const thisMonth = getMonthKey(getToday());
    const thisMonthData = salesData.filter((s) => getMonthKey(s.date) === thisMonth);

    els.thisMonthOrders.textContent = thisMonthData.length.toLocaleString();
    els.thisMonthRevenue.textContent = formatMAD(thisMonthData.reduce((sum, s) => sum + toAmount(s.price), 0));

    els.selectedMonthOrders.textContent = filteredData.length.toLocaleString();
    els.selectedMonthRevenue.textContent = formatMAD(filteredData.reduce((sum, s) => sum + toAmount(s.price), 0));
}

function renderTable(data) {
    if (!data.length) {
        els.historyBody.innerHTML = '<tr><td colspan="9" class="empty-row">No sales found.</td></tr>';
        return;
    }

    els.historyBody.innerHTML = data.map((sale) => `
        <tr>
            <td style="white-space: nowrap">${escapeHTML(sale.date)}</td>
            <td><strong>${escapeHTML(sale.product)}</strong></td>
            <td>${escapeHTML(sale.clientName)}</td>
            <td>${escapeHTML(sale.phone)}</td>
            <td>${escapeHTML(sale.city)}</td>
            <td>${escapeHTML(sale.address)}</td>
            <td style="font-weight: 600; color: var(--primary-dark); white-space: nowrap">${formatMAD(toAmount(sale.price))}</td>
            <td><small style="color: var(--muted)">${escapeHTML(sale.notes)}</small></td>
            <td>
                <div class="table-actions">
                    <button class="btn btn-outline" data-action="edit" data-id="${escapeHTML(sale.id)}" style="padding: 4px 8px; font-size: 12px;">Edit</button>
                    <button class="btn btn-danger" data-action="delete" data-id="${escapeHTML(sale.id)}" style="padding: 4px 8px; font-size: 12px;">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderDashboard() {
    updateMonthDropdown();
    const filteredData = getFilteredData();
    calculateTotals(filteredData);
    renderTable(filteredData);
}

async function handleAddSale(event) {
    event.preventDefault();

    const formData = new FormData(els.saleForm);
    const price = Number(formData.get('saleAmount'));

    if (price <= 0) {
        showToast('Amount must be greater than 0', true);
        return;
    }

    const newSale = normalizeSaleFromObject({
        product: String(formData.get('saleProduct') || '').trim(),
        clientName: String(formData.get('saleCustomer') || '').trim(),
        phone: String(formData.get('salePhone') || '').trim(),
        city: String(formData.get('saleCity') || '').trim(),
        address: String(formData.get('saleAddress') || '').trim(),
        price,
        notes: String(formData.get('saleNotes') || '').trim(),
        date: String(formData.get('saleDate') || getToday())
    });

    if (!newSale.clientName || !newSale.phone || !newSale.city || !newSale.product) {
        showToast('Please fill all required fields', true);
        return;
    }

    try {
        const created = await createSaleOnFirestore(newSale);
        salesData.push(created);
        saveSalesCache();
        renderDashboard();

        els.saleForm.reset();
        setDefaultDate();
        clearFormDraft();
        showToast('Saved successfully');
    } catch (error) {
        const localSale = {
            ...newSale,
            id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        };

        salesData.push(localSale);
        saveSalesCache();
        renderDashboard();

        els.saleForm.reset();
        setDefaultDate();
        clearFormDraft();
        showToast(error.message ? `Saved locally only: ${error.message}` : 'Saved locally only (cloud save failed)', true);
    }
}

function openEditModal(id) {
    const sale = salesData.find((s) => s.id === id);
    if (!sale) {
        return;
    }

    currentEditId = id;

    document.getElementById('editProduct').value = sale.product;
    document.getElementById('editCustomer').value = sale.clientName;
    document.getElementById('editPhone').value = sale.phone;
    document.getElementById('editCity').value = sale.city;
    document.getElementById('editAmount').value = sale.price;
    document.getElementById('editDate').value = sale.date;
    document.getElementById('editAddress').value = sale.address || '';
    document.getElementById('editNotes').value = sale.notes || '';

    els.editModal.classList.add('show');
}

function closeModal() {
    els.editModal.classList.remove('show');
    currentEditId = null;
    els.editForm.reset();
}

async function handleEditSale(event) {
    event.preventDefault();

    const formData = new FormData(els.editForm);
    const price = Number(formData.get('editAmount'));

    if (price <= 0) {
        showToast('Amount must be greater than 0', true);
        return;
    }

    const index = salesData.findIndex((s) => s.id === currentEditId);
    if (index === -1) {
        showToast('Order not found', true);
        return;
    }

    const patch = normalizeSaleFromObject({
        id: currentEditId,
        product: String(formData.get('editProduct') || '').trim(),
        clientName: String(formData.get('editCustomer') || '').trim(),
        phone: String(formData.get('editPhone') || '').trim(),
        city: String(formData.get('editCity') || '').trim(),
        address: String(formData.get('editAddress') || '').trim(),
        price,
        notes: String(formData.get('editNotes') || '').trim(),
        date: String(formData.get('editDate') || getToday())
    });

    if (!patch.clientName || !patch.phone || !patch.city || !patch.product) {
        showToast('Please fill all required fields', true);
        return;
    }

    try {
        const updated = await updateSaleOnFirestore(currentEditId, patch);
        salesData[index] = updated;
        saveSalesCache();
        renderDashboard();
        closeModal();
        showToast('Updated successfully');
    } catch (error) {
        showToast(error.message || 'Failed to update order', true);
    }
}

async function deleteSale(id) {
    if (!confirm('Are you sure you want to delete this sale?')) {
        return;
    }

    try {
        await deleteSaleOnFirestore(id);
        salesData = salesData.filter((s) => s.id !== id);
        saveSalesCache();
        renderDashboard();
        showToast('Deleted successfully');
    } catch (error) {
        showToast(error.message || 'Failed to delete order', true);
    }
}

function exportCSV() {
    const data = getFilteredData();
    if (!data.length) {
        showToast('No data to export', true);
        return;
    }

    const headers = ['Date', 'Product', 'Client Name', 'Phone', 'City', 'Address', 'Price', 'Notes'];
    const csvRows = data.map((s) => [
        s.date,
        `"${s.product.replace(/"/g, '""')}"`,
        `"${s.clientName.replace(/"/g, '""')}"`,
        `"${s.phone.replace(/"/g, '""')}"`,
        `"${s.city.replace(/"/g, '""')}"`,
        `"${s.address.replace(/"/g, '""')}"`,
        s.price,
        `"${s.notes.replace(/"/g, '""')}"`
    ].join(','));

    const csvContent = [headers.join(','), ...csvRows].join('\n');
    downloadFile(csvContent, `lecomax_orders_${getToday()}.csv`, 'text/csv');
}

function downloadJSON() {
    if (!salesData.length) {
        showToast('No data to backup', true);
        return;
    }

    const jsonContent = JSON.stringify(salesData, null, 2);
    downloadFile(jsonContent, `lecomax_orders_backup_${getToday()}.json`, 'application/json');
}

function downloadFile(content, fileName, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function handleImport(event) {
    const file = event.target.files[0];
    if (!file) {
        return;
    }

    const reader = new FileReader();
    reader.onload = async (readerEvent) => {
        try {
            const importedData = JSON.parse(String(readerEvent.target?.result || '[]'));
            if (!Array.isArray(importedData)) {
                showToast('Invalid backup file format', true);
                return;
            }

            if (!confirm(`This will replace all current orders with ${importedData.length} records. Continue?`)) {
                return;
            }

            await replaceSalesOnFirestore(importedData);
            await loadSalesFromFirestore();
            renderDashboard();
            showToast('Backup restored successfully');
        } catch (error) {
            showToast(error.message || 'Error reading backup file', true);
        } finally {
            els.importJsonInput.value = '';
        }
    };

    reader.readAsText(file);
}

async function handleLogout() {
    try {
        await signOut(auth);
    } finally {
        window.location.replace('index.html');
    }
}

function setupEventListeners() {
    els.saleForm.addEventListener('submit', handleAddSale);
    els.saleForm.addEventListener('input', saveFormDraft);
    els.saleForm.addEventListener('change', saveFormDraft);
    els.editForm.addEventListener('submit', handleEditSale);

    els.searchInput.addEventListener('input', renderDashboard);
    els.monthFilter.addEventListener('change', renderDashboard);

    els.quickFilters.forEach((btn) => {
        btn.addEventListener('click', (event) => {
            els.quickFilters.forEach((b) => b.classList.remove('active'));
            event.currentTarget.classList.add('active');
            activeQuickFilter = event.currentTarget.dataset.quickFilter;
            renderDashboard();
        });
    });

    els.exportCsvBtn.addEventListener('click', exportCSV);
    els.downloadJsonBtn.addEventListener('click', downloadJSON);
    els.importJsonBtn.addEventListener('click', () => els.importJsonInput.click());
    els.importJsonInput.addEventListener('change', handleImport);

    els.closeModalBtn.addEventListener('click', closeModal);
    document.querySelectorAll('[data-close-modal]').forEach((el) => {
        el.addEventListener('click', closeModal);
    });

    els.logoutBtn.addEventListener('click', handleLogout);

    els.historyBody.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-action][data-id]');
        if (!button) {
            return;
        }

        const action = button.dataset.action;
        const id = button.dataset.id;

        if (action === 'edit') {
            openEditModal(id);
        } else if (action === 'delete') {
            deleteSale(id);
        }
    });
}

async function initAfterAuth() {
    if (isInitialized) {
        return;
    }

    isInitialized = true;

    setDefaultDate();
    restoreFormDraft();
    setupEventListeners();

    await loadSalesFromFirestore();
    renderDashboard();
}

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.replace('index.html');
        return;
    }

    const email = String(user.email || '').toLowerCase();
    if (email !== ADMIN_EMAIL.toLowerCase()) {
        await signOut(auth);
        window.location.replace('index.html');
        return;
    }

    try {
        await initAfterAuth();
    } catch (error) {
        console.error('Dashboard initialization failed:', error);
        showToast(error.message || 'Could not load orders', true);
    }
});
