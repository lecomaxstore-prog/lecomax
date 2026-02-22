const ADMIN_EMAIL = 'admin@lecomax.com';
const ADMIN_PASSWORD = 'lecomax123';
const AUTH_KEY = 'lecomax_admin_auth';

function isAuthenticated() {
    return localStorage.getItem(AUTH_KEY) === 'true';
}

function setAuthenticated(value) {
    localStorage.setItem(AUTH_KEY, value ? 'true' : 'false');
}

function setCounterValue(element, target, prefix = '', suffix = '') {
    const value = Number.isFinite(target) ? target : 0;
    element.textContent = `${prefix}${value.toLocaleString()}${suffix}`;
}

async function loadDashboardStats() {
    const counterElements = document.querySelectorAll('[data-counter-key]');

    if (!counterElements.length) {
        return;
    }

    try {
        const response = await fetch('/api/admin/ga-stats', { credentials: 'same-origin' });

        if (!response.ok) {
            throw new Error('Failed to fetch analytics stats');
        }

        const stats = await response.json();

        counterElements.forEach((element) => {
            const key = element.dataset.counterKey;
            const prefix = element.dataset.prefix || '';
            const suffix = element.dataset.suffix || '';
            const target = Number(stats[key] || 0);
            setCounterValue(element, target, prefix, suffix);
        });
    } catch (error) {
        console.error('Dashboard stats load error:', error);
        counterElements.forEach((element) => {
            const prefix = element.dataset.prefix || '';
            const suffix = element.dataset.suffix || '';
            setCounterValue(element, 0, prefix, suffix);
        });
    }
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

    loadDashboardStats();

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
