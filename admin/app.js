import { signInWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import { auth, ADMIN_EMAIL } from './firebase-config.js';

function goToPage(pageFile) {
    const target = new URL(pageFile, window.location.href);
    window.location.href = target.href;
}

function replaceToPage(pageFile) {
    const target = new URL(pageFile, window.location.href);
    window.location.replace(target.href);
}

function setFeedback(message, type = 'error') {
    const errorMsg = document.getElementById('errorMsg');
    if (errorMsg) {
        errorMsg.textContent = message || '';
        errorMsg.classList.remove('success');
        if (type === 'success') {
            errorMsg.classList.add('success');
        }
    }
}

function initLoginPage() {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');

    if (!loginForm || !emailInput || !passwordInput) {
        return;
    }

    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            return;
        }

        const email = String(user.email || '').toLowerCase();
        if (email !== ADMIN_EMAIL.toLowerCase()) {
            await signOut(auth);
            setFeedback('This account is not authorized for admin access.');
            return;
        }

        replaceToPage('dashboard.html');
    });

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        setFeedback('');

        const email = emailInput.value.trim().toLowerCase();
        const password = passwordInput.value;

        if (!email || !password) {
            setFeedback('Email and password are required.');
            return;
        }

        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            const signedInEmail = String(result.user?.email || '').toLowerCase();

            if (signedInEmail !== ADMIN_EMAIL.toLowerCase()) {
                await signOut(auth);
                setFeedback('This account is not authorized for admin access.');
                return;
            }

            goToPage('dashboard.html');
        } catch (error) {
            setFeedback(error?.message || 'Invalid credentials');
        }
    });

    if (forgotPasswordBtn) {
        forgotPasswordBtn.addEventListener('click', async () => {
            setFeedback('');

            const email = emailInput.value.trim().toLowerCase() || ADMIN_EMAIL.toLowerCase();

            if (!email) {
                setFeedback('Enter your admin email first.');
                return;
            }

            try {
                await sendPasswordResetEmail(auth, email);
                setFeedback('Password reset email sent. Check your inbox.', 'success');
            } catch (error) {
                setFeedback(error?.message || 'Failed to send reset email.');
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initLoginPage();
});
