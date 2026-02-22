const ADMIN_EMAIL = 'admin@lecomax.com';
const ADMIN_PASSWORD = 'lecomax123';
const AUTH_KEY = 'lecomax_admin_auth';
const SALES_STORAGE_KEY = 'lecomax_admin_sales_records';

function isAuthenticated() {
    return localStorage.getItem(AUTH_KEY) === 'true';
}

function setAuthenticated(value) {
    localStorage.setItem(AUTH_KEY, value ? 'true' : 'false');
}

function formatMad(value) {
    return `MAD ${Number(value || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}

function getTodayInputDate() {
    return new Date().toISOString().slice(0, 10);
}

function isValidDateInput(dateString) {
    if (typeof dateString !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return false;
    }

    const parsed = new Date(`${dateString}T00:00:00`);
    return !Number.isNaN(parsed.getTime());
}

function getMonthKeyFromDate(dateString) {
    if (isValidDateInput(dateString)) {
        return dateString.slice(0, 7);
    }

    return getTodayInputDate().slice(0, 7);
}

function getCurrentMonthKey() {
    return getTodayInputDate().slice(0, 7);
}

function getMonthLabelFromKey(monthKey) {
    if (!/^\d{4}-\d{2}$/.test(monthKey)) {
        return monthKey;
    }

    const [year, month] = monthKey.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    return date.toLocaleString(undefined, { month: 'long', year: 'numeric' });
}

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function normalizeSale(entry) {
    const date = isValidDateInput(entry?.date) ? entry.date : getTodayInputDate();
    const amount = Number(entry?.amount);

    return {
        id: String(entry?.id || `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`),
        product: String(entry?.product || '').trim(),
        customer: String(entry?.customer || '').trim(),
        phone: String(entry?.phone || '').trim(),
        city: String(entry?.city || '').trim(),
        address: String(entry?.address || '').trim(),
        amount: Number.isFinite(amount) ? amount : 0,
        notes: String(entry?.notes || '').trim(),
        date,
        monthKey: getMonthKeyFromDate(date)
    };
}

function readSales() {
    const raw = localStorage.getItem(SALES_STORAGE_KEY);

    if (!raw) {
        return [];
    }

    try {
        const parsed = JSON.parse(raw);

        if (!Array.isArray(parsed)) {
            return [];
        }

        return parsed
            .map((entry) => normalizeSale(entry))
            .filter((entry) => Number.isFinite(entry.amount) && entry.amount > 0);
    } catch (error) {
        console.error('Failed to parse sales records:', error);
        return [];
    }
}

function saveSales(sales) {
    localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(sales));
}

function sortSalesByDateDesc(sales) {
    return [...sales].sort((a, b) => {
        if (a.date === b.date) {
            return b.id.localeCompare(a.id);
        }
        return b.date.localeCompare(a.date);
    });
}

function buildSummary(sales) {
    const totalOrders = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.amount, 0);
    const currentMonthKey = getCurrentMonthKey();
    const currentMonthSales = sales.filter((sale) => sale.monthKey === currentMonthKey);

    return {
        totalOrders,
        totalRevenue,
        monthOrders: currentMonthSales.length,
        monthRevenue: currentMonthSales.reduce((sum, sale) => sum + sale.amount, 0)
    };
}

function buildMonthOptions(sales) {
    const monthSet = new Set(sales.map((sale) => sale.monthKey));
    monthSet.add(getCurrentMonthKey());
    return [...monthSet].sort((a, b) => b.localeCompare(a));
}

function filterSales(sales, searchTerm, monthKey) {
    const query = String(searchTerm || '').trim().toLowerCase();

    return sales.filter((sale) => {
        if (monthKey !== 'all' && sale.monthKey !== monthKey) {
            return false;
        }

        if (!query) {
            return true;
        }

        const searchable = `${sale.customer} ${sale.phone} ${sale.product} ${sale.city}`.toLowerCase();
        return searchable.includes(query);
    });
}

function getTotalsForMonth(sales, monthKey) {
    if (monthKey === 'all') {
        return {
            orders: sales.length,
            revenue: sales.reduce((sum, sale) => sum + sale.amount, 0)
        };
    }

    const monthSales = sales.filter((sale) => sale.monthKey === monthKey);
    return {
        orders: monthSales.length,
        revenue: monthSales.reduce((sum, sale) => sum + sale.amount, 0)
    };
}

function updateMonthFilterOptions(monthFilter, sales) {
    if (!monthFilter) {
        return;
    }

    const previousValue = monthFilter.value || getCurrentMonthKey();
    const monthOptions = buildMonthOptions(sales);

    const optionHtml = [
        '<option value="all">All Months</option>',
        ...monthOptions.map((monthKey) => `<option value="${monthKey}">${escapeHtml(getMonthLabelFromKey(monthKey))}</option>`)
    ].join('');

    monthFilter.innerHTML = optionHtml;

    if (monthOptions.includes(previousValue) || previousValue === 'all') {
        monthFilter.value = previousValue;
    } else {
        monthFilter.value = getCurrentMonthKey();
    }
}

function renderSummaryCards(sales, elements) {
    const summary = buildSummary(sales);
    const currentMonthLabel = getMonthLabelFromKey(getCurrentMonthKey());

    if (elements.totalOrdersEl) {
        elements.totalOrdersEl.textContent = summary.totalOrders.toLocaleString();
    }
    if (elements.totalRevenueEl) {
        elements.totalRevenueEl.textContent = formatMad(summary.totalRevenue);
    }
    if (elements.monthOrdersEl) {
        elements.monthOrdersEl.textContent = summary.monthOrders.toLocaleString();
    }
    if (elements.monthRevenueEl) {
        elements.monthRevenueEl.textContent = formatMad(summary.monthRevenue);
    }
    if (elements.monthOrdersLabel) {
        elements.monthOrdersLabel.textContent = `Orders (${currentMonthLabel})`;
    }
    if (elements.monthRevenueLabel) {
        elements.monthRevenueLabel.textContent = `Revenue (${currentMonthLabel})`;
    }
}

function renderSelectedMonthTotals(sales, monthKey, elements) {
    const totals = getTotalsForMonth(sales, monthKey);

    if (elements.selectedMonthOrdersEl) {
        elements.selectedMonthOrdersEl.textContent = totals.orders.toLocaleString();
    }
    if (elements.selectedMonthRevenueEl) {
        elements.selectedMonthRevenueEl.textContent = formatMad(totals.revenue);
    }
}

function renderHistoryTable(sales, historyBody) {
    if (!historyBody) {
        return;
    }

    if (!sales.length) {
        historyBody.innerHTML = '<tr><td colspan="9" class="empty-row">No sales found.</td></tr>';
        return;
    }

    const rows = sortSalesByDateDesc(sales).map((sale) => `
        <tr>
            <td>${escapeHtml(sale.date)}</td>
            <td>${escapeHtml(sale.product)}</td>
            <td>${escapeHtml(sale.customer)}</td>
            <td>${escapeHtml(sale.phone)}</td>
            <td>${escapeHtml(sale.city)}</td>
            <td>${escapeHtml(sale.address)}</td>
            <td>${formatMad(sale.amount)}</td>
            <td>${escapeHtml(sale.notes)}</td>
            <td>
                <button type="button" class="action-btn" data-action="edit" data-id="${escapeHtml(sale.id)}">Edit</button>
                <button type="button" class="action-btn delete" data-action="delete" data-id="${escapeHtml(sale.id)}">Delete</button>
            </td>
        </tr>
    `).join('');

    historyBody.innerHTML = rows;
}

function setMessage(element, message, type) {
    if (!element) {
        return;
    }

    element.textContent = message;
    element.classList.remove('error', 'success');

    if (type === 'error') {
        element.classList.add('error');
    }

    if (type === 'success') {
        element.classList.add('success');
    }
}

function toCsvValue(value) {
    const text = String(value ?? '');
    return `"${text.replace(/"/g, '""')}"`;
}

function exportCsv(records, fileName) {
    if (!records.length) {
        return false;
    }

    const header = ['Date', 'Product', 'Customer', 'Phone', 'City', 'Address', 'Amount (MAD)', 'Notes'];
    const rows = records.map((sale) => [
        sale.date,
        sale.product,
        sale.customer,
        sale.phone,
        sale.city,
        sale.address,
        sale.amount.toFixed(2),
        sale.notes
    ]);

    const csvContent = [header, ...rows]
        .map((row) => row.map((value) => toCsvValue(value)).join(','))
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    return true;
}

function initLoginPage() {
    if (isAuthenticated()) {
        window.location.replace('/admin/dashboard.html');
        return;
    }

    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorMsg = document.getElementById('errorMsg');

    if (!loginForm) {
        return;
    }

    if (emailInput) {
        emailInput.value = '';
    }
    if (passwordInput) {
        passwordInput.value = '';
    }

    loginForm.addEventListener('submit', (event) => {
        event.preventDefault();
        errorMsg.textContent = '';

        const email = emailInput.value.trim().toLowerCase();
        const password = passwordInput.value;

        if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
            setAuthenticated(true);
            window.location.href = '/admin/dashboard.html';
            return;
        }

        errorMsg.textContent = 'Invalid credentials';
    });
}

function initDashboardPage() {
    if (!isAuthenticated()) {
        window.location.replace('/admin/index.html');
        return;
    }

    const dashboardContent = document.getElementById('dashboardContent');
    const logoutBtn = document.getElementById('logoutBtn');

    if (!dashboardContent) {
        return;
    }

    dashboardContent.style.display = 'block';

    const totalOrdersEl = document.getElementById('totalOrders');
    const totalRevenueEl = document.getElementById('totalRevenue');
    const monthOrdersEl = document.getElementById('monthOrders');
    const monthRevenueEl = document.getElementById('monthRevenue');
    const monthOrdersLabel = document.getElementById('monthOrdersLabel');
    const monthRevenueLabel = document.getElementById('monthRevenueLabel');
    const selectedMonthOrdersEl = document.getElementById('selectedMonthOrders');
    const selectedMonthRevenueEl = document.getElementById('selectedMonthRevenue');
    const saleForm = document.getElementById('saleForm');
    const saleFormTitle = document.getElementById('saleFormTitle');
    const saveSaleBtn = document.getElementById('saveSaleBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const saleMsg = document.getElementById('saleMsg');
    const saleProduct = document.getElementById('saleProduct');
    const saleCustomer = document.getElementById('saleCustomer');
    const salePhone = document.getElementById('salePhone');
    const saleCity = document.getElementById('saleCity');
    const saleAddress = document.getElementById('saleAddress');
    const saleAmount = document.getElementById('saleAmount');
    const saleNotes = document.getElementById('saleNotes');
    const saleDate = document.getElementById('saleDate');
    const historyBody = document.getElementById('historyBody');
    const searchInput = document.getElementById('searchInput');
    const monthFilter = document.getElementById('monthFilter');
    const exportScope = document.getElementById('exportScope');
    const exportCsvBtn = document.getElementById('exportCsvBtn');

    let sales = readSales();
    let editingSaleId = null;

    if (saleDate && !saleDate.value) {
        saleDate.value = getTodayInputDate();
    }

    function resetForm() {
        if (!saleForm) {
            return;
        }

        saleForm.reset();

        if (saleDate) {
            saleDate.value = getTodayInputDate();
        }

        editingSaleId = null;

        if (saveSaleBtn) {
            saveSaleBtn.textContent = 'Save';
        }
        if (saleFormTitle) {
            saleFormTitle.textContent = 'Add Sale';
        }
        if (cancelEditBtn) {
            cancelEditBtn.style.display = 'none';
        }
    }

    function fillFormForEdit(sale) {
        if (!sale) {
            return;
        }

        editingSaleId = sale.id;
        if (saleProduct) saleProduct.value = sale.product;
        if (saleCustomer) saleCustomer.value = sale.customer;
        if (salePhone) salePhone.value = sale.phone;
        if (saleCity) saleCity.value = sale.city;
        if (saleAddress) saleAddress.value = sale.address;
        if (saleAmount) saleAmount.value = String(sale.amount);
        if (saleNotes) saleNotes.value = sale.notes;
        if (saleDate) saleDate.value = sale.date;
        if (saveSaleBtn) saveSaleBtn.textContent = 'Update Sale';
        if (saleFormTitle) saleFormTitle.textContent = 'Edit Sale';
        if (cancelEditBtn) cancelEditBtn.style.display = 'inline-flex';
        if (saleProduct) saleProduct.focus();
    }

    function render() {
        updateMonthFilterOptions(monthFilter, sales);

        const activeMonth = monthFilter ? monthFilter.value : getCurrentMonthKey();
        const searchTerm = searchInput ? searchInput.value : '';
        const filteredSales = filterSales(sales, searchTerm, activeMonth);

        renderSummaryCards(sales, {
            totalOrdersEl,
            totalRevenueEl,
            monthOrdersEl,
            monthRevenueEl,
            monthOrdersLabel,
            monthRevenueLabel
        });
        renderSelectedMonthTotals(sales, activeMonth, {
            selectedMonthOrdersEl,
            selectedMonthRevenueEl
        });
        renderHistoryTable(filteredSales, historyBody);
    }

    render();

    if (saleForm) {
        saleForm.addEventListener('submit', (event) => {
            event.preventDefault();

            const salePayload = normalizeSale({
                id: editingSaleId || undefined,
                product: saleProduct?.value,
                customer: saleCustomer?.value,
                phone: salePhone?.value,
                city: saleCity?.value,
                address: saleAddress?.value,
                amount: saleAmount?.value,
                notes: saleNotes?.value,
                date: saleDate?.value || getTodayInputDate()
            });

            if (!salePayload.product || !salePayload.customer || !salePayload.phone || !salePayload.city) {
                setMessage(saleMsg, 'Please fill all required fields: product, customer name, phone, city, and amount.', 'error');
                return;
            }

            if (!Number.isFinite(salePayload.amount) || salePayload.amount <= 0) {
                setMessage(saleMsg, 'Amount must be greater than 0.', 'error');
                return;
            }

            if (editingSaleId) {
                sales = sales.map((sale) => (sale.id === editingSaleId ? salePayload : sale));
                setMessage(saleMsg, 'Sale updated successfully.', 'success');
            } else {
                sales.push(salePayload);
                setMessage(saleMsg, 'Sale saved successfully.', 'success');
            }

            saveSales(sales);
            render();
            resetForm();
        });
    }

    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', () => {
            resetForm();
            setMessage(saleMsg, 'Edit cancelled.', '');
        });
    }

    if (historyBody) {
        historyBody.addEventListener('click', (event) => {
            const target = event.target;

            if (!(target instanceof HTMLButtonElement)) {
                return;
            }

            const action = target.dataset.action;
            const id = target.dataset.id;

            if (!id || !action) {
                return;
            }

            const sale = sales.find((item) => item.id === id);
            if (!sale) {
                return;
            }

            if (action === 'edit') {
                fillFormForEdit(sale);
                setMessage(saleMsg, 'Editing selected row.', '');
                return;
            }

            if (action === 'delete') {
                const confirmed = window.confirm('Delete this sale record?');

                if (!confirmed) {
                    return;
                }

                sales = sales.filter((item) => item.id !== id);
                saveSales(sales);

                if (editingSaleId === id) {
                    resetForm();
                }

                render();
                setMessage(saleMsg, 'Sale deleted successfully.', 'success');
            }
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            render();
        });
    }

    if (monthFilter) {
        monthFilter.addEventListener('change', () => {
            render();
        });
    }

    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', () => {
            const scope = exportScope ? exportScope.value : 'filtered';
            const activeMonth = monthFilter ? monthFilter.value : getCurrentMonthKey();
            const monthRecords = activeMonth === 'all' ? sales : sales.filter((sale) => sale.monthKey === activeMonth);
            const exportRecords = scope === 'all' ? sales : monthRecords;

            const exported = exportCsv(sortSalesByDateDesc(exportRecords), `lecomax-sales-${scope}-${new Date().toISOString().slice(0, 10)}.csv`);

            if (!exported) {
                setMessage(saleMsg, 'No sales available to export.', 'error');
                return;
            }

            setMessage(saleMsg, 'CSV exported successfully.', 'success');
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            setAuthenticated(false);
            window.location.href = '/admin/index.html';
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;

    if (path.endsWith('/dashboard.html')) {
        initDashboardPage();
        return;
    }

    initLoginPage();
});
