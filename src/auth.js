/* ACS Visualizer - Auth Module */
var ACS_AUTH = (function() {
  var STORAGE_KEY = 'acs_auth_' + CONFIG.project.replace(/\s+/g, '_').toLowerCase();
  var currentUser = null;

  function init() {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        currentUser = JSON.parse(saved);
        hideLogin();
        updateUserBadge();
        return true;
      } catch(e) { localStorage.removeItem(STORAGE_KEY); }
    }
    showLogin();
    return false;
  }

  function showLogin() {
    var el = document.getElementById('loginOverlay');
    if (el) el.classList.remove('hidden');
  }

  function hideLogin() {
    var el = document.getElementById('loginOverlay');
    if (el) el.classList.add('hidden');
  }

  function doLogin() {
    var emailEl = document.getElementById('loginEmail');
    var passEl = document.getElementById('loginPass');
    var errEl = document.getElementById('loginError');
    var email = (emailEl.value || '').trim().toLowerCase();
    var pass = passEl.value || '';
    errEl.textContent = '';

    if (!email || !pass) {
      errEl.textContent = 'Please enter email and password.';
      return;
    }

    var match = CONFIG.credentials.find(function(c) {
      return c.email.toLowerCase() === email && c.pass === pass;
    });

    if (!match) {
      errEl.textContent = 'Invalid credentials.';
      passEl.value = '';
      return;
    }

    currentUser = { email: match.email, loggedIn: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser));
    hideLogin();
    updateUserBadge();
    if (typeof onAuthReady === 'function') onAuthReady();
  }

  function logout() {
    currentUser = null;
    localStorage.removeItem(STORAGE_KEY);
    showLogin();
    var badge = document.getElementById('userBadge');
    if (badge) badge.textContent = '';
  }

  function updateUserBadge() {
    var badge = document.getElementById('userBadge');
    if (badge && currentUser) badge.textContent = currentUser.email;
  }

  function getUser() { return currentUser; }

  // Bind login button and enter key
  document.addEventListener('DOMContentLoaded', function() {
    var btn = document.getElementById('loginBtn');
    if (btn) btn.addEventListener('click', doLogin);
    var passEl = document.getElementById('loginPass');
    if (passEl) passEl.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') doLogin();
    });
    var emailEl = document.getElementById('loginEmail');
    if (emailEl) emailEl.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') doLogin();
    });
  });

  return { init: init, logout: logout, getUser: getUser };
})();
