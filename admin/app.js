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

    document.querySelectorAll('[data-counter]').forEach((element) => {
        const target = Number(element.dataset.counter || 0);
        const prefix = element.dataset.prefix || '';
        const suffix = element.dataset.suffix || '';
        setCounterValue(element, target, prefix, suffix);
    });

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
