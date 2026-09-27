(function () {
  'use strict';

  const STEP_1 = 'step-1';
  const STEP_2 = 'step-2';
  const STEP_FORGOT = 'step-forgot';
  const RESEND_COOLDOWN = 60; // seconds

  let currentStep = STEP_1;
  let pendingEmail = '';
  let resendTimer = null;
  let resendSeconds = 0;

  // ── MODULE DETECTION ──
  const params = new URLSearchParams(window.location.search);
  const moduleId = parseInt(params.get('module')) || 10; // Default to User Management

  const MODULE_MAP = {
    1: { main: 'Student', sub: 'Information' },
    2: { main: 'Enrollment', sub: 'Registration' },
    3: { main: 'Curriculum', sub: 'Management' },
    4: { main: 'Class', sub: 'Scheduling' },
    5: { main: 'Grades', sub: 'Assessment' },
    6: { main: 'Payment', sub: 'Accounting' },
    7: { main: 'Document', sub: 'Credentials' },
    8: { main: 'Human', sub: 'Resource' },
    9: { main: 'Clinic', sub: 'Medical' },
    10: { main: 'User', sub: 'Management' }
  };

  const el = {
    step1: document.getElementById(STEP_1),
    step2: document.getElementById(STEP_2),
    formCredentials: document.getElementById('form-credentials'),
    formOtp: document.getElementById('form-otp'),
    loginEmail: document.getElementById('login-email'),
    loginPassword: document.getElementById('login-password'),
    rememberMe: document.getElementById('login-remember'),
    btnContinue: document.getElementById('btn-continue'),
    btnVerify: document.getElementById('btn-verify'),
    btnResend: document.getElementById('btn-resend'),
    btnBack: document.getElementById('btn-back'),
    otpEmailDisplay: document.getElementById('otp-email-display'),
    otpInput: document.getElementById('otp-input'),
    otpDigits: document.querySelectorAll('.otp-digit'),
    resendCountdown: document.getElementById('resend-countdown'),
    toast: document.getElementById('toast'),
    toastMsg: document.getElementById('toast-msg'),
    btnTogglePass: document.getElementById('btn-toggle-pass'),
    forgotLink: document.querySelector('.form-link'),
    stepForgot: document.getElementById(STEP_FORGOT),
    formForgot: document.getElementById('form-forgot'),
    forgotEmail: document.getElementById('forgot-email'),
    btnForgot: document.getElementById('btn-forgot'),
    btnBackForgot: document.getElementById('btn-back-forgot'),
  };

  // ── REMEMBER ME: Restore saved email on page load ──
  try {
    var savedEmail = localStorage.getItem('ums-remember-email');
    var emailInput = document.getElementById('login-email');
    var rememberChk = document.getElementById('login-remember');
    if (savedEmail && emailInput && rememberChk) {
      emailInput.value = savedEmail;
      rememberChk.checked = true;
    }
  } catch(eRemember) {}

  function togglePasswordVisibility() {
    const isPass = el.loginPassword.type === 'password';
    el.loginPassword.type = isPass ? 'text' : 'password';
    
    // Toggle SVG icons
    const eyeOpen = el.btnTogglePass.querySelector('.eye-open');
    const eyeClosed = el.btnTogglePass.querySelector('.eye-closed');
    
    if (eyeOpen && eyeClosed) {
      eyeOpen.style.display = isPass ? 'none' : 'block';
      eyeClosed.style.display = isPass ? 'block' : 'none';
    }
  }

  function showStep(step) {
    currentStep = step;
    el.step1.classList.toggle('show', step === STEP_1);
    el.step2.classList.toggle('show', step === STEP_2);
    el.stepForgot.classList.toggle('show', step === STEP_FORGOT);
    if (step === STEP_2) {
      el.otpEmailDisplay.textContent = pendingEmail || 'your email';
      el.otpDigits.forEach(function (d) {
        d.value = '';
      });
      syncOtpHidden();
      setVerifyButtonState();
      startResendCountdown();
      el.otpDigits[0].focus();
    } else {
      stopResendCountdown();
    }
  }

  function setLoading(button, loading) {
    if (!button) return;
    button.classList.toggle('loading', loading);
    button.disabled = loading;
  }

  function showToast(message, isError) {
    el.toastMsg.textContent = message;
    el.toast.classList.toggle('error', !!isError);
    el.toast.classList.add('show');
    setTimeout(function () {
      el.toast.classList.remove('show');
    }, 3200);
  }

  function syncOtpHidden() {
    const value = Array.from(el.otpDigits)
      .map(function (d) { return d.value; })
      .join('');
    el.otpInput.value = value;
    setVerifyButtonState();
  }

  function setVerifyButtonState() {
    const value = (el.otpInput && el.otpInput.value) || '';
    el.btnVerify.disabled = value.length !== 6;
  }

  function startResendCountdown() {
    stopResendCountdown();
    resendSeconds = RESEND_COOLDOWN;
    el.btnResend.disabled = true;
    el.resendCountdown.textContent = resendSeconds;
    resendTimer = setInterval(function () {
      resendSeconds--;
      el.resendCountdown.textContent = resendSeconds;
      if (resendSeconds <= 0) {
        stopResendCountdown();
        el.btnResend.disabled = false;
        el.btnResend.innerHTML = 'Resend code';
      }
    }, 1000);
  }

  function stopResendCountdown() {
    if (resendTimer) {
      clearInterval(resendTimer);
      resendTimer = null;
    }
  }

  // Step 1: validate and "send OTP" (mock)
  function handleCredentialsSubmit(e) {
    e.preventDefault();
    var email = (el.loginEmail && el.loginEmail.value) ? el.loginEmail.value.trim() : '';
    var password = el.loginPassword && el.loginPassword.value;

    if (!email) {
      showToast('Please enter your email', true);
      el.loginEmail.focus();
      return;
    }
    if (!password) {
      showToast('Please enter your password', true);
      el.loginPassword.focus();
      return;
    }

    // ── REMEMBER ME: Save or clear email ──
    try {
      var remChk = document.getElementById('login-remember');
      if (remChk && remChk.checked) {
        localStorage.setItem('ums-remember-email', email);
      } else {
        localStorage.removeItem('ums-remember-email');
      }
    } catch(eRemember) {}

    setLoading(el.btnContinue, true);

    // Real API call: verify credentials and record login event in activity_logs
    fetch('../backend/login.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: email, 
        password: password,
        module_id: moduleId,
        submodule_id: 3 // Default Auth & Security
      })
    })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, data: data };
        });
      })
      .then(function (result) {
        setLoading(el.btnContinue, false);
        if (!result.ok) {
          showToast(result.data.error || 'Invalid credentials', true);
          return;
        }
        // Store user info for session
        try {
          sessionStorage.setItem('ums-user-id', result.data.user_id);
          sessionStorage.setItem('ums-user', result.data.email);
          sessionStorage.setItem('ums-user-name', result.data.full_name);
          sessionStorage.setItem('ums-user-role', result.data.role);
          if (result.data.session_token) {
            sessionStorage.setItem('ums-session-token', result.data.session_token);
          }
        } catch (err) { }
        pendingEmail = email;
        showToast('Verification code sent to your email');
        showStep(STEP_2);
      })
      .catch(function () {
        setLoading(el.btnContinue, false);
        showToast('Server error. Please try again.', true);
      });
  }

  // Step 2: verify OTP (mock)
  function handleOtpSubmit(e) {
    e.preventDefault();
    var code = (el.otpInput && el.otpInput.value) || '';

    if (code.length !== 6) {
      showToast('Please enter the 6-digit code', true);
      return;
    }

    // Real API call to verify OTP
    fetch('../backend/verify_otp_api.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: pendingEmail, otp: code })
    })
      .then(function (res) { return res.json(); })
      .then(function (result) {
        setLoading(el.btnVerify, false);
        if (result.success) {
          // Store user info for session
          try {
            sessionStorage.setItem('ums-user-id', result.user_id);
            sessionStorage.setItem('ums-user', result.email);
            sessionStorage.setItem('ums-user-name', result.full_name);
            sessionStorage.setItem('ums-user-role', result.role);
            if (result.session_token) {
              sessionStorage.setItem('ums-session-token', result.session_token);
            }
          } catch (err) { }
          showToast('Sign in successful');
          window.location.href = '../index.html';
        } else {
          showToast(result.error || 'Invalid or expired code. Try again or resend.', true);
        }
      })
      .catch(function () {
        setLoading(el.btnVerify, false);
        showToast('Server error. Please try again.', true);
      });
  }

  function handleResend() {
    if (el.btnResend.disabled) return;
    el.btnResend.disabled = true;
    showToast('New code sent to ' + pendingEmail);
    el.btnResend.innerHTML = 'Resend in <span id="resend-countdown">' + RESEND_COOLDOWN + '</span>s';
    el.resendCountdown = document.getElementById('resend-countdown');
    startResendCountdown();
  }

  function handleBack() {
    showStep(STEP_1);
  }

  // OTP digit inputs: single char, auto-advance, paste support
  function initOtpDigits() {
    el.otpDigits.forEach(function (input, idx) {
      input.addEventListener('input', function () {
        var v = this.value.replace(/\D/g, '').slice(0, 1);
        this.value = v;
        if (v && idx < el.otpDigits.length - 1) {
          el.otpDigits[idx + 1].focus();
        }
        syncOtpHidden();
      });
      input.addEventListener('keydown', function (ev) {
        if (ev.key === 'Backspace' && !this.value && idx > 0) {
          el.otpDigits[idx - 1].focus();
        }
      });
      input.addEventListener('paste', function (ev) {
        ev.preventDefault();
        var pasted = (ev.clipboardData && ev.clipboardData.getData('text')) || '';
        var digits = pasted.replace(/\D/g, '').slice(0, 6).split('');
        digits.forEach(function (d, i) {
          if (el.otpDigits[i]) {
            el.otpDigits[i].value = d;
          }
        });
        syncOtpHidden();
        if (digits.length > 0) {
          var next = Math.min(digits.length, el.otpDigits.length - 1);
          el.otpDigits[next].focus();
        }
      });
    });
  }

  function handleForgotSubmit(e) {
    e.preventDefault();
    var email = (el.forgotEmail && el.forgotEmail.value) ? el.forgotEmail.value.trim() : '';

    if (!email) {
      showToast('Please enter your email', true);
      el.forgotEmail.focus();
      return;
    }

    setLoading(el.btnForgot, true);

    fetch('../backend/forgot_password_api.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email })
    })
      .then(function (res) { return res.json(); })
      .then(function (result) {
        if (result.success) {
          showToast(result.message);
          showStep(STEP_1);
        } else {
          showToast(result.error || 'Failed to request recovery', true);
        }
      })
      .catch(function () {
        setLoading(el.btnForgot, false);
        showToast('Server error. Please try again.', true);
      });
  }

  if (el.formCredentials) {
    el.formCredentials.addEventListener('submit', handleCredentialsSubmit);
  }
  if (el.formOtp) {
    el.formOtp.addEventListener('submit', handleOtpSubmit);
  }
  if (el.btnResend) {
    el.btnResend.addEventListener('click', handleResend);
  }
  if (el.btnBack) {
    el.btnBack.addEventListener('click', handleBack);
  }
  if (el.btnTogglePass) {
    el.btnTogglePass.addEventListener('click', togglePasswordVisibility);
  }
  if (el.forgotLink) {
    el.forgotLink.addEventListener('click', function(e) {
      e.preventDefault();
      showStep(STEP_FORGOT);
    });
  }
  if (el.formForgot) {
    el.formForgot.addEventListener('submit', handleForgotSubmit);
  }
  if (el.btnBackForgot) {
    el.btnBackForgot.addEventListener('click', function() {
      showStep(STEP_1);
    });
  }

  initOtpDigits();
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

  // Initialize theme tracking
  let storedTheme = null;
  try { storedTheme = localStorage.getItem('ums-theme'); } catch(e){}
  if (!storedTheme) {
    storedTheme = 'light';
    try { localStorage.setItem('ums-theme', 'light'); } catch(e){}
  }
  applyTheme(storedTheme);

  // Initialize Dynamic Branding
  function initBranding() {
    const config = MODULE_MAP[moduleId] || MODULE_MAP[10];
    const logoEl = document.querySelector('.logo-txt');
    if (logoEl) {
      logoEl.innerHTML = config.main + ' <span>' + config.sub + '</span>';
    }
    
    // Also update document title
    document.title = 'Sign in — ' + config.main + ' ' + config.sub;
  }
  initBranding();

})();

// PRELOADER GLOBAL EVENT
document.addEventListener('DOMContentLoaded', function() {
  const p = document.getElementById('preloader');
  if (p) {
    setTimeout(() => {
      p.classList.add('fade-out');
      setTimeout(() => { p.style.display = 'none'; }, 300);
    }, 2000);
  }
});
