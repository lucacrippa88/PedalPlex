// Auth bootstrap for the static pages (/gear/<slug>.html and 404.html).
//
// 1. window.currentUser is set IMMEDIATELY from the JWT payload kept in localStorage (username, role, userid),
//    so the page never starts as "guest" while the server answer is pending (or if it fails).
// 2. USER_CHECK_AUTH_JWT.php then enriches it (avatar, badges, instruments).
// 3. The token is removed ONLY when it is expired/invalid (401). Network errors, CORS, 5xx, bad JSON: the user stays logged in.
(function () {
  function decodeJwt(token) {
    try {
      const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(atob(b64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(json);
    } catch (e) {
      return null;
    }
  }

  function refreshUi() {
    if (typeof window.ppUpdateAvatarButton === 'function') window.ppUpdateAvatarButton();
    if (typeof window.updateFullscreenMenu === 'function') window.updateFullscreenMenu();
  }

  function setUser(role, info) {
    window.currentUser = Object.assign({ role: role }, info || {});
    if (typeof window.initNavCatalog === 'function') window.initNavCatalog(role);
  }

  const token = localStorage.getItem('authToken');
  const payload = token ? decodeJwt(token) : null;
  const expired = payload && payload.exp && payload.exp * 1000 <= Date.now();

  if (!token) {
    setUser('guest');
    return;
  }
  if (!payload || expired) {
    localStorage.removeItem('authToken');
    setUser('guest');
    return;
  }

  // Logged in right away, from the token itself
  setUser(String(payload.role || 'user').toLowerCase(), { username: payload.username, userid: payload.userid });

  document.addEventListener('DOMContentLoaded', function () {
    fetch('https://api.pedalplex.com/USER_CHECK_AUTH_JWT.php', {
      headers: { 'Authorization': 'Bearer ' + token }
    })
      .then(function (res) {
        if (res.status === 401) {
          localStorage.removeItem('authToken');
          setUser('guest');
          refreshUi();
          return null;
        }
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (user) {
        if (!user || !user.role) return;   // keep the user built from the JWT
        setUser(user.role, user);
        refreshUi();
      })
      .catch(function (err) {
        console.warn('Auth check failed, keeping the session from the token:', err);
      });
  });
})();
