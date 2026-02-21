/**
 * LECOMAX Admin Dashboard
 * 
 * Note: This dashboard currently uses generated DEMO data stored in localStorage.
 * To connect to a real backend, implement the `fetchRealData()` function below
 * to fetch from your API endpoint instead of generating random data.
 */

const CACHE_KEY = 'lecomax_admin_data';
const CACHE_TIME_KEY = 'lecomax_admin_time';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

// Global State
let dashboardData = [];
let currentFilter = 30; // days
let charts = {};
let sortConfig = { key: 'date', direction: 'desc' };

// DOM Elements
const els = {
    loading: document.getElementById('loading-overlay'),
    error: document.getElementById('error-state'),
    dashboard: document.getElementById('dashboard-content'),
    dateFilter: document.getElementById('date-filter'),
    refreshBtn: document.getElementById('refresh-btn'),
    tableSearch: document.getElementById('table-search'),
    tableBody: document.getElementById('table-body'),
    tableEmpty: document.getElementById('table-empty')
};

// Initialize Dashboard
async function init() {
    try {
        showLoading(true);
        
        // 1. Try to fetch real data first
        let data = await fetchRealData();
        
        // 2. If no real data, use/generate demo data
        if (!data) {
            data = getDemoData();
        }

        dashboardData = data;
        
        // 3. Render UI
        updateDashboard();
        setupEventListeners();
        
        showLoading(false);
    } catch (err) {
        console.error('Dashboard Init Error:', err);
        showError(true);
    }
}

/**
 * Placeholder for real API integration.
 * Replace the contents of this function to fetch from your actual backend.
 * Expected return format: Array of daily objects (see generateDemoData for structure).
 */
async function fetchRealData() {
    try {
        const response = await fetch('/api/stats');
        if (response.status === 401) {
            window.location.href = '/admin/login.html';
            return null;
        }
        if (!response.ok) return null;
        
        const data = await response.json();
        
        // Update Gmail Status UI
        const statusBadge = document.getElementById('gmail-status');
        const connectBtn = document.getElementById('connect-gmail-btn');
        
        if (data.isGmailConnected) {
            statusBadge.textContent = 'GMAIL CONNECTED';
            statusBadge.style.backgroundColor = 'var(--success)';
            connectBtn.classList.add('hidden');
        } else {
            statusBadge.textContent = 'GMAIL DISCONNECTED';
            statusBadge.style.backgroundColor = 'var(--danger)';
            connectBtn.classList.remove('hidden');
        }

        // Fetch orders for the table
        const ordersRes = await fetch('/api/orders');
        const orders = await ordersRes.json();
        
        // Map DB stats to dashboard format
        return data.dailyStats.map(row => ({
            date: row.date.split('T')[0],
            orders: row.orders,
            revenue: parseFloat(row.revenue),
            visits: row.orders * 25, // Mock visits based on orders
            conversion: 4.0, // Mock conversion
            refunds: 0
        }));
    } catch (err) {
        console.error(err);
        return null;
    }
}

// --- Demo Data Generation ---

function getDemoData() {
    const now = new Date().getTime();
    const lastUpdate = localStorage.getItem(CACHE_TIME_KEY);
    const cachedData = localStorage.getItem(CACHE_KEY);

    if (cachedData && lastUpdate && (now - parseInt(lastUpdate)) < CACHE_EXPIRY) {
        return JSON.parse(cachedData);
    }

    // Generate new demo data
    const newData = generateDemoData(90); // Generate 90 days of data
    localStorage.setItem(CACHE_KEY, JSON.stringify(newData));
    localStorage.setItem(CACHE_TIME_KEY, now.toString());
    
    return newData;
}

function generateDemoData(days) {
    const data = [];
    const today = new Date();
    
    let baseRevenue = 1000;
    let baseOrders = 20;

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        
        // Add some random variance and weekend bumps
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        const multiplier = isWeekend ? 1.5 : 1.0;
        const randomFactor = 0.8 + (Math.random() * 0.4); // 0.8 to 1.2
        
        const dailyOrders = Math.floor(baseOrders * multiplier * randomFactor);
        const dailyRevenue = dailyOrders * (450 + Math.random() * 200); // AOV between 450-650 MAD
        const dailyVisits = Math.floor(dailyOrders * (20 + Math.random() * 10)); // 3-5% conversion
        const dailyRefunds = Math.floor(dailyOrders * (Math.random() * 0.05)); // 0-5% refund rate
        
        data.push({
            date: date.toISOString().split('T')[0],
            orders: dailyOrders,
            revenue: parseFloat(dailyRevenue.toFixed(2)),
            visits: dailyVisits,
            conversion: parseFloat(((dailyOrders / dailyVisits) * 100).toFixed(2)),
            refunds: dailyRefunds
        });
    }
    return data;
}

function forceRefreshDemoData() {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_TIME_KEY);
    init();
}

// --- UI Updates ---

function updateDashboard() {
    // Filter data based on selected timeframe
    const filteredData = dashboardData.slice(-currentFilter);
    const previousData = dashboardData.slice(-currentFilter * 2, -currentFilter); // For trends

    updateKPIs(filteredData, previousData);
    updateCharts(filteredData);
    renderTable(filteredData);
}

function updateKPIs(current, previous) {
    // Calculate Totals
    const curRev = current.reduce((sum, day) => sum + day.revenue, 0);
    const prevRev = previous.reduce((sum, day) => sum + day.revenue, 0);
    
    const curOrders = current.reduce((sum, day) => sum + day.orders, 0);
    const prevOrders = previous.reduce((sum, day) => sum + day.orders, 0);
    
    const curVisits = current.reduce((sum, day) => sum + day.visits, 0);
    
    const today = current[current.length - 1];

    // Update DOM
    document.getElementById('kpi-revenue').textContent = formatCurrency(curRev);
    document.getElementById('kpi-revenue-today').textContent = formatCurrency(today.revenue);
    setTrend('kpi-revenue-trend', curRev, prevRev);

    document.getElementById('kpi-orders').textContent = formatNumber(curOrders);
    document.getElementById('kpi-orders-today').textContent = formatNumber(today.orders);
    setTrend('kpi-orders-trend', curOrders, prevOrders);

    const curConv = curVisits ? (curOrders / curVisits) * 100 : 0;
    document.getElementById('kpi-conversion').textContent = curConv.toFixed(2) + '%';
    // Trend for conversion is omitted for simplicity, or can be added similarly

    const curAOV = curOrders ? (curRev / curOrders) : 0;
    document.getElementById('kpi-aov').textContent = formatCurrency(curAOV);

    // Static/Randomized Demo KPIs for Returning & CSAT
    document.getElementById('kpi-returning').textContent = '34.2%';
    document.getElementById('kpi-csat').textContent = '4.8';
    document.getElementById('kpi-reviews').textContent = '1,284';
}

function setTrend(elementId, current, previous) {
    const el = document.getElementById(elementId);
    if (!previous) {
        el.innerHTML = `<span class="trend-value">N/A</span> vs previous`;
        return;
    }
    
    const percentChange = ((current - previous) / previous) * 100;
    const isPositive = percentChange >= 0;
    const colorClass = isPositive ? 'trend-up' : 'trend-down';
    const sign = isPositive ? '+' : '';
    
    el.innerHTML = `<span class="trend-value ${colorClass}">${sign}${percentChange.toFixed(1)}%</span> vs previous period`;
}

// --- Charts ---

function updateCharts(data) {
    const dates = data.map(d => formatDateShort(d.date));
    const revenues = data.map(d => d.revenue);
    const orders = data.map(d => d.orders);

    // Revenue Line Chart (Last 30 days max for readability, or current filter)
    const revData = currentFilter > 30 ? data.slice(-30) : data;
    const revDates = revData.map(d => formatDateShort(d.date));
    const revVals = revData.map(d => d.revenue);

    if (charts.revenue) charts.revenue.destroy();
    charts.revenue = new Chart(document.getElementById('revenueChart'), {
        type: 'line',
        data: {
            labels: revDates,
            datasets: [{
                label: 'Revenue (MAD)',
                data: revVals,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
        }
    });

    // Orders Bar Chart (Last 14 days max)
    const ordData = currentFilter > 14 ? data.slice(-14) : data;
    const ordDates = ordData.map(d => formatDateShort(d.date));
    const ordVals = ordData.map(d => d.orders);

    if (charts.orders) charts.orders.destroy();
    charts.orders = new Chart(document.getElementById('ordersChart'), {
        type: 'bar',
        data: {
            labels: ordDates,
            datasets: [{
                label: 'Orders',
                data: ordVals,
                backgroundColor: '#10b981',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
        }
    });

    // Payment Methods Doughnut Chart (Static Demo Data)
    if (!charts.payment) {
        charts.payment = new Chart(document.getElementById('paymentChart'), {
            type: 'doughnut',
            data: {
                labels: ['Credit Card', 'PayPal', 'Cash on Delivery'],
                datasets: [{
                    data: [65, 25, 10],
                    backgroundColor: ['#3b82f6', '#f59e0b', '#64748b'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }
}

// --- Table ---

function renderTable(data) {
    const tbody = els.tableBody;
    const searchTerm = els.tableSearch.value.toLowerCase();
    
    // Filter by search
    let displayData = data.filter(row => row.date.includes(searchTerm));
    
    // Sort
    displayData.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];
        
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    tbody.innerHTML = '';

    if (displayData.length === 0) {
        els.tableEmpty.classList.remove('hidden');
    } else {
        els.tableEmpty.classList.add('hidden');
        displayData.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.date}</td>
                <td>${formatNumber(row.orders)}</td>
                <td>${formatCurrency(row.revenue)}</td>
                <td>${formatNumber(row.visits)}</td>
                <td>${row.conversion}%</td>
                <td>${row.refunds}</td>
            `;
            tbody.appendChild(tr);
        });
    }
}

// --- Event Listeners ---

function setupEventListeners() {
    els.dateFilter.addEventListener('change', (e) => {
        currentFilter = parseInt(e.target.value);
        updateDashboard();
    });

    els.refreshBtn.addEventListener('click', async () => {
        els.refreshBtn.disabled = true;
        els.refreshBtn.innerHTML = 'Syncing...';
        try {
            const res = await fetch('/api/sync', { method: 'POST' });
            if (res.status === 401) window.location.href = '/admin/login.html';
            const data = await res.json();
            if (data.success) {
                alert(`Synced successfully! Found ${data.newOrders} new orders.`);
                init(); // Reload dashboard
            } else {
                alert('Sync failed: ' + data.error);
            }
        } catch (err) {
            console.error(err);
            alert('Sync failed. Check console.');
        }
        els.refreshBtn.disabled = false;
        els.refreshBtn.innerHTML = 'Refresh Now';
    });

    const connectBtn = document.getElementById('connect-gmail-btn');
    if (connectBtn) {
        connectBtn.addEventListener('click', async () => {
            const res = await fetch('/api/gmail/auth');
            const data = await res.json();
            if (data.url) {
                window.open(data.url, 'GmailAuth', 'width=600,height=600');
            }
        });
    }

    els.tableSearch.addEventListener('input', () => {
        updateDashboard();
    });

    // Table Sorting
    document.querySelectorAll('th[data-sort]').forEach(th => {
        th.addEventListener('click', () => {
            const key = th.dataset.sort;
            if (sortConfig.key === key) {
                sortConfig.direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
            } else {
                sortConfig.key = key;
                sortConfig.direction = 'desc';
            }
            updateDashboard();
        });
    });
}

// --- Utilities ---

function showLoading(show) {
    if (show) {
        els.loading.classList.remove('hidden');
        els.dashboard.classList.add('hidden');
        els.error.classList.add('hidden');
    } else {
        els.loading.classList.add('hidden');
        els.dashboard.classList.remove('hidden');
    }
}

function showError(show) {
    if (show) {
        els.error.classList.remove('hidden');
        els.loading.classList.add('hidden');
        els.dashboard.classList.add('hidden');
    }
}

function formatCurrency(num) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'MAD' }).format(num);
}

function formatNumber(num) {
    return new Intl.NumberFormat('en-US').format(num);
}

function formatDateShort(dateStr) {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
}

// Start App
document.addEventListener('DOMContentLoaded', init);
