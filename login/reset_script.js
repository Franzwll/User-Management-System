(function () {
    'use strict';

    const el = {
        formReset: document.getElementById('form-reset'),
        resetTokenInput: document.getElementById('reset-token'),
        newPassword: document.getElementById('new-password'),
        confirmPassword: document.getElementById('confirm-password'),
        btnReset: document.getElementById('btn-reset'),
        resetStep: document.getElementById('reset-step'),
        successStep: document.getElementById('success-step'),
        toast: document.getElementById('toast'),
        toastMsg: document.getElementById('toast-msg'),
    };

    function showToast(message, isError) {
        el.toastMsg.textContent = message;
        el.toast.classList.toggle('error', !!isError);
        el.toast.classList.add('show');
        setTimeout(function () {
            el.toast.classList.remove('show');
        }, 3200);
    }

    function setLoading(button, loading) {
        if (!button) return;
        button.classList.toggle('loading', loading);
        button.disabled = loading;
    }

    function getQueryParam(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }

    // Attempt to auto-fill the token if a link was clicked
    const urlToken = getQueryParam('token');
    if (urlToken && el.resetTokenInput) {
        el.resetTokenInput.value = urlToken;
    }

    if (el.formReset) {
        el.formReset.addEventListener('submit', function (e) {
            e.preventDefault();

            const tokenVal = el.resetTokenInput ? el.resetTokenInput.value.trim() : '';
            const pass = el.newPassword.value;
            const confirm = el.confirmPassword.value;

            if (!tokenVal) {
                showToast('Recovery code is required', true);
                return;
            }

            if (pass.length < 8) {
                showToast('Password must be at least 8 characters long', true);
                return;
            }

            if (pass !== confirm) {
                showToast('Passwords do not match', true);
                return;
            }

            setLoading(el.btnReset, true);

            fetch('../backend/reset_password_api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: tokenVal,
                    password: pass
                })
            })
            .then(function (res) { return res.json(); })
            .then(function (result) {
                setLoading(el.btnReset, false);
                if (result.success) {
                    el.resetStep.classList.remove('show');
                    el.successStep.classList.add('show');
                } else {
                    showToast(result.error || 'Failed to reset password', true);
                }
            })
            .catch(function () {
                setLoading(el.btnReset, false);
                showToast('Server error. Please try again.', true);
            });
        });
    }
})();

// PRELOADER & THEME GLOBAL EVENTS
document.addEventListener('DOMContentLoaded', function() {
    const p = document.getElementById('preloader');
    if (p) {
        setTimeout(() => {
            p.classList.add('fade-out');
            setTimeout(() => { p.style.display = 'none'; }, 300);
        }, 2000);
    }
});

window.toggleTheme = function() {
    const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    const next = current === 'light' ? 'dark' : 'light';
    try { localStorage.setItem('ums-theme', next); } catch(e){}
    applyTheme(next);
};

function applyTheme(theme) {
    const root = document.documentElement;
    const mode = theme === 'light' ? 'light' : 'dark';
    if (mode === 'light') {
        root.setAttribute('data-theme', 'light');
    } else {
        root.removeAttribute('data-theme');
    }
    const toggles = document.querySelectorAll('[data-role="theme-toggle"]');
    toggles.forEach(function (btn) {
        if (mode === 'light') {
            btn.textContent = '☾';
            btn.title = 'Switch to dark mode';
        } else {
            btn.textContent = '☀';
            btn.title = 'Switch to light mode';
        }
    });

    const logoImg = document.querySelector('.login-brand img');
    if (logoImg) {
        if (mode === 'light') {
            logoImg.src = '../assets/images/badge_1.png';
        } else {
            logoImg.src = '../assets/images/badge_2.png';
        }
    }
}

let storedTheme = null;
try { storedTheme = localStorage.getItem('ums-theme'); } catch(e){}
if (!storedTheme) {
    storedTheme = 'light';
    try { localStorage.setItem('ums-theme', 'light'); } catch(e){}
}
applyTheme(storedTheme);
