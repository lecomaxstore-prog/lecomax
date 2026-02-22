const STORAGE_KEY = 'lecomax_sales';

// DOM Elements
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

// Initialization
function init() {
    loadSalesFromStorage();
    setupEventListeners();
    setDefaultDate();
    renderDashboard();
}

// Data Management
function loadSalesFromStorage() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            if (!Array.isArray(parsed)) {
                salesData = [];
                return;
            }

            salesData = parsed.map((sale) => ({
                ...sale,
                amount: toAmount(sale?.amount),
                date: sale?.date || getToday(),
                product: String(sale?.product || ''),
                customer: String(sale?.customer || ''),
                phone: String(sale?.phone || ''),
                city: String(sale?.city || ''),
                address: String(sale?.address || ''),
                notes: String(sale?.notes || '')
            }));
        } catch (e) {
            console.error('Failed to parse sales data', e);
            salesData = [];
        }
    } else {
        salesData = [];
    }
}

function saveSalesToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(salesData));
    renderDashboard();
}

// Utilities
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
    return dateStr.substring(0, 7); // YYYY-MM
}

function setDefaultDate() {
    els.saleDate.value = getToday();
}

function showToast(message, isError = false) {
    els.toast.textContent = message;
    els.toast.className = `toast show ${isError ? 'error' : ''}`;
    setTimeout(() => {
        els.toast.classList.remove('show');
    }, 3000);
}

// Core Logic
function handleAddSale(e) {
    e.preventDefault();
    
    const formData = new FormData(els.saleForm);
    const amount = Number(formData.get('saleAmount'));
    
    if (amount <= 0) {
        showToast('Amount must be greater than 0', true);
        return;
    }

    const newSale = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        date: formData.get('saleDate') || getToday(),
        product: formData.get('saleProduct').trim(),
        customer: formData.get('saleCustomer').trim(),
        phone: formData.get('salePhone').trim(),
        city: formData.get('saleCity').trim(),
        address: formData.get('saleAddress').trim(),
        amount: amount,
        notes: formData.get('saleNotes').trim(),
        createdAt: Date.now()
    };

    salesData.push(newSale);
    saveSalesToStorage();
    
    els.saleForm.reset();
    setDefaultDate();
    showToast('Saved successfully');
}

function handleEditSale(e) {
    e.preventDefault();
    
    const formData = new FormData(els.editForm);
    const amount = Number(formData.get('editAmount'));
    
    if (amount <= 0) {
        showToast('Amount must be greater than 0', true);
        return;
    }

    const index = salesData.findIndex(s => s.id === currentEditId);
    if (index !== -1) {
        salesData[index] = {
            ...salesData[index],
            date: formData.get('editDate'),
            product: formData.get('editProduct').trim(),
            customer: formData.get('editCustomer').trim(),
            phone: formData.get('editPhone').trim(),
            city: formData.get('editCity').trim(),
            address: formData.get('editAddress').trim(),
            amount: amount,
            notes: formData.get('editNotes').trim()
        };
        
        saveSalesToStorage();
        closeModal();
        showToast('Updated successfully');
    }
}

function deleteSale(id) {
    if (confirm('Are you sure you want to delete this sale?')) {
        salesData = salesData.filter(s => s.id !== id);
        saveSalesToStorage();
        showToast('Deleted successfully');
    }
}

function openEditModal(id) {
    const sale = salesData.find(s => s.id === id);
    if (!sale) return;
    
    currentEditId = id;
    
    document.getElementById('editProduct').value = sale.product;
    document.getElementById('editCustomer').value = sale.customer;
    document.getElementById('editPhone').value = sale.phone;
    document.getElementById('editCity').value = sale.city;
    document.getElementById('editAmount').value = sale.amount;
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

// UI Updates
function renderDashboard() {
    updateMonthDropdown();
    const filteredData = getFilteredData();
    
    calculateTotals(filteredData);
    renderTable(filteredData);
}

function updateMonthDropdown() {
    const months = [...new Set(salesData.map(s => getMonthKey(s.date)))].sort().reverse();
    const currentVal = els.monthFilter.value;
    
    els.monthFilter.innerHTML = '<option value="all">All Months</option>';
    
    months.forEach(month => {
        const [year, m] = month.split('-');
        const date = new Date(year, m - 1);
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
    
    // Search filter
    const searchTerm = els.searchInput.value.toLowerCase();
    if (searchTerm) {
        data = data.filter(s => 
            s.product.toLowerCase().includes(searchTerm) ||
            s.customer.toLowerCase().includes(searchTerm) ||
            s.phone.toLowerCase().includes(searchTerm) ||
            s.city.toLowerCase().includes(searchTerm)
        );
    }
    
    // Month dropdown filter
    const selectedMonth = els.monthFilter.value;
    if (selectedMonth !== 'all') {
        data = data.filter(s => getMonthKey(s.date) === selectedMonth);
    }
    
    // Quick filters
    const today = getToday();
    const thisMonth = getMonthKey(today);
    
    if (activeQuickFilter === 'today') {
        data = data.filter(s => s.date === today);
    } else if (activeQuickFilter === 'thisMonth') {
        data = data.filter(s => getMonthKey(s.date) === thisMonth);
    }
    
    // Sort by date descending
    return data.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function calculateTotals(filteredData) {
    // All time
    const totalOrders = salesData.length;
    const totalRev = salesData.reduce((sum, s) => sum + toAmount(s.amount), 0);
    
    els.totalOrders.textContent = totalOrders;
    els.totalRevenue.textContent = formatMAD(totalRev);
    
    // This month
    const thisMonth = getMonthKey(getToday());
    const thisMonthData = salesData.filter(s => getMonthKey(s.date) === thisMonth);
    
    els.thisMonthOrders.textContent = thisMonthData.length;
    els.thisMonthRevenue.textContent = formatMAD(thisMonthData.reduce((sum, s) => sum + toAmount(s.amount), 0));
    
    // Selected/Filtered
    els.selectedMonthOrders.textContent = filteredData.length;
    els.selectedMonthRevenue.textContent = formatMAD(filteredData.reduce((sum, s) => sum + toAmount(s.amount), 0));
}

function renderTable(data) {
    if (data.length === 0) {
        els.historyBody.innerHTML = '<tr><td colspan="9" class="empty-row">No sales found.</td></tr>';
        return;
    }
    
    els.historyBody.innerHTML = data.map(sale => `
        <tr>
            <td style="white-space: nowrap">${sale.date}</td>
            <td><strong>${escapeHTML(sale.product)}</strong></td>
            <td>${escapeHTML(sale.customer)}</td>
            <td>${escapeHTML(sale.phone)}</td>
            <td>${escapeHTML(sale.city)}</td>
            <td>${escapeHTML(sale.address)}</td>
            <td style="font-weight: 600; color: var(--primary-dark); white-space: nowrap">${formatMAD(toAmount(sale.amount))}</td>
            <td><small style="color: var(--muted)">${escapeHTML(sale.notes)}</small></td>
            <td>
                <div class="table-actions">
                    <button class="btn btn-outline" onclick="openEditModal('${sale.id}')" style="padding: 4px 8px; font-size: 12px;">Edit</button>
                    <button class="btn btn-danger" onclick="deleteSale('${sale.id}')" style="padding: 4px 8px; font-size: 12px;">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

// Export / Import
function exportCSV() {
    const data = getFilteredData();
    if (data.length === 0) {
        showToast('No data to export', true);
        return;
    }
    
    const headers = ['Date', 'Product', 'Customer', 'Phone', 'City', 'Address', 'Amount', 'Notes'];
    const csvRows = data.map(s => [
        s.date,
        `"${s.product.replace(/"/g, '""')}"`,
        `"${s.customer.replace(/"/g, '""')}"`,
        `"${s.phone.replace(/"/g, '""')}"`,
        `"${s.city.replace(/"/g, '""')}"`,
        `"${s.address.replace(/"/g, '""')}"`,
        s.amount,
        `"${s.notes.replace(/"/g, '""')}"`
    ].join(','));
    
    const csvContent = [headers.join(','), ...csvRows].join('\n');
    downloadFile(csvContent, `lecomax_sales_${getToday()}.csv`, 'text/csv');
}

function downloadJSON() {
    if (salesData.length === 0) {
        showToast('No data to backup', true);
        return;
    }
    const jsonContent = JSON.stringify(salesData, null, 2);
    downloadFile(jsonContent, `lecomax_backup_${getToday()}.json`, 'application/json');
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

function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const importedData = JSON.parse(event.target.result);
            if (Array.isArray(importedData)) {
                if (confirm(`This will replace your current data with ${importedData.length} imported records. Continue?`)) {
                    salesData = importedData.map((sale) => ({
                        ...sale,
                        amount: toAmount(sale?.amount),
                        date: sale?.date || getToday(),
                        product: String(sale?.product || ''),
                        customer: String(sale?.customer || ''),
                        phone: String(sale?.phone || ''),
                        city: String(sale?.city || ''),
                        address: String(sale?.address || ''),
                        notes: String(sale?.notes || '')
                    }));
                    saveSalesToStorage();
                    showToast('Backup restored successfully');
                }
            } else {
                showToast('Invalid backup file format', true);
            }
        } catch (err) {
            showToast('Error reading backup file', true);
        }
        els.importJsonInput.value = ''; // Reset input
    };
    reader.readAsText(file);
}

// Event Listeners
function setupEventListeners() {
    els.saleForm.addEventListener('submit', handleAddSale);
    els.editForm.addEventListener('submit', handleEditSale);
    
    els.searchInput.addEventListener('input', renderDashboard);
    els.monthFilter.addEventListener('change', renderDashboard);
    
    els.quickFilters.forEach(btn => {
        btn.addEventListener('click', (e) => {
            els.quickFilters.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            activeQuickFilter = e.target.dataset.quickFilter;
            renderDashboard();
        });
    });
    
    els.exportCsvBtn.addEventListener('click', exportCSV);
    els.downloadJsonBtn.addEventListener('click', downloadJSON);
    els.importJsonBtn.addEventListener('click', () => els.importJsonInput.click());
    els.importJsonInput.addEventListener('change', handleImport);
    
    els.closeModalBtn.addEventListener('click', closeModal);
    document.querySelectorAll('[data-close-modal]').forEach(el => {
        el.addEventListener('click', closeModal);
    });
    
    els.logoutBtn.addEventListener('click', () => {
        window.location.href = 'login.html';
    });
}

// Start
document.addEventListener('DOMContentLoaded', init);