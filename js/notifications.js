/**
 * notifications.js — "PedalPlex updates".
 *
 * Entry point is a "Notifications" item inside the Actions dropdown (#pp-actions-menu).
 * A red dot on the Actions button (and next to the item) signals unread updates.
 * Clicking the item closes the Actions menu and opens the updates panel in its place.
 *
 * Data: GET_NOTIFICATIONS.php -> latest gear + curated features (max 10).
 * Unread state: ids already seen are kept in localStorage; the dot shows while the list
 * contains at least one id that has not been seen yet. Opening the panel marks all as seen.
 *
 * Usage:
 *   - load this script BEFORE nav-rigs.js / nav-plexes.js
 *   - put window.ppNotificationsMenuItem() in the Actions menu markup
 *   - call window.initNotifications() once #pp-actions-wrapper is in the DOM
 */
(function () {
  const API_URL      = 'https://api.pedalplex.com/GET_NOTIFICATIONS.php'; // latest gear added
  const FEATURES_URL = '/notifications.json';                             // hand-curated features (frontend root)
  const MAX_ITEMS    = 10;
  const STORAGE_KEY  = 'pp_notif_seen';

  const ICON_BELL = '<svg focusable="false" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32" aria-hidden="true"><path d="M28.707,19.293,26,16.586V13a10.014,10.014,0,0,0-9-9.9492V1H15V3.0508A10.014,10.014,0,0,0,6,13v3.586L3.293,19.293A1,1,0,0,0,3,20v3a1,1,0,0,0,1,1h7v.7768a5.152,5.152,0,0,0,4.5,5.1987A5.0057,5.0057,0,0,0,21,25V24h7a1,1,0,0,0,1-1V20A1,1,0,0,0,28.707,19.293ZM19,25a3,3,0,0,1-3.2261,2.9917A3.1463,3.1463,0,0,1,13,24.7768V24h6Zm8-3H5V20.414L7.707,17.707A1,1,0,0,0,8,17V13a8,8,0,0,1,16,0v4a1,1,0,0,0,.293.707L27,20.414Z"/></svg>';

  let items = [];

  function getSeen() {
    try {
      const v = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return Array.isArray(v) ? v : [];
    } catch (e) { return []; }
  }

  function setSeen(ids) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(ids)); } catch (e) { /* storage unavailable */ }
  }

  function timeAgo(dateStr) {
    const t = Date.parse(dateStr);
    if (isNaN(t)) return '';
    const days = Math.floor((Date.now() - t) / 86400000);
    if (days < 1) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 30) return days + ' days ago';
    return new Date(t).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  // Markup of the Actions menu item (inserted by nav-rigs.js / nav-plexes.js)
  window.ppNotificationsMenuItem = function () {
    return '<div class="pp-action-separator"></div>' +
      '<button class="pp-action-item" id="pp-action-notifications" type="button">' +
      ICON_BELL + ' <span>Notifications</span></button>';
  };

  function injectStyle() {
    if (document.getElementById('pp-notif-style')) return;
    const style = document.createElement('style');
    style.id = 'pp-notif-style';
    style.textContent = `
      #pp-notif-dot {
        display: none;
        position: absolute;
        top: -3px;
        right: -3px;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #da1e28;
        pointer-events: none;
        z-index: 1;
      }
      #pp-actions-wrapper.has-unread #pp-notif-dot { display: block; }
      #pp-actions-wrapper.has-unread #pp-action-notifications span::after {
        content: '';
        display: inline-block;
        width: 8px;
        height: 8px;
        margin-left: 8px;
        border-radius: 50%;
        background: #da1e28;
      }
      #pp-notif-menu {
        display: none;
        position: absolute;
        top: calc(100% + 6px);
        right: 0;
        width: 340px;
        max-height: 70vh;
        overflow-y: auto;
        background: rgb(30,30,30);
        border: 1px solid #9C54D5;
        border-radius: 8px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.5);
        z-index: 4000;
        padding: 4px 0;
        animation: ppFadeIn 0.1s ease;
      }
      .pp-notif-heading {
        padding: 10px 16px 6px;
        font-size: 0.75rem;
        font-weight: 600;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: #a8a8a8;
      }
      .pp-notif-item {
        display: block;
        padding: 9px 16px;
        color: #fff;
        text-decoration: none;
        font-size: 0.875rem;
        line-height: 1.35;
      }
      a.pp-notif-item:hover { background: rgba(156, 84, 213, 0.18); }
      .pp-notif-item-top { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
      .pp-notif-title { font-weight: 600; word-break: break-word; }
      .pp-notif-date { flex-shrink: 0; font-size: 0.75rem; color: #a8a8a8; }
      .pp-notif-text { margin-top: 2px; font-size: 0.8125rem; color: #c6c6c6; }
      .pp-notif-tag { color: #9C54D5; font-weight: 600; }
      .pp-notif-empty { padding: 14px 16px; font-size: 0.875rem; color: #a8a8a8; }
      html[data-theme="light"] #pp-notif-menu { background: #ffffff; box-shadow: 0 8px 24px rgba(0,0,0,0.18); }
      html[data-theme="light"] .pp-notif-item { color: #161616; }
      html[data-theme="light"] .pp-notif-heading,
      html[data-theme="light"] .pp-notif-date,
      html[data-theme="light"] .pp-notif-empty { color: #6f6f6f; }
      html[data-theme="light"] .pp-notif-text { color: #525252; }
      @media (max-width: 768px) {
        #pp-notif-menu {
          position: fixed;
          top: calc(var(--nav-h, 72px) + 6px);
          left: 8px;
          right: 8px;
          width: auto;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function renderItems(menu) {
    menu.innerHTML = '';
    const heading = document.createElement('div');
    heading.className = 'pp-notif-heading';
    heading.textContent = 'PedalPlex updates';
    menu.appendChild(heading);

    if (!items.length) {
      const empty = document.createElement('div');
      empty.className = 'pp-notif-empty';
      empty.textContent = 'Nothing new yet.';
      menu.appendChild(empty);
      return;
    }

    items.forEach(function (n) {
      const el = document.createElement(n.link ? 'a' : 'div');
      el.className = 'pp-notif-item';
      if (n.link) el.href = n.link;

      const top = document.createElement('div');
      top.className = 'pp-notif-item-top';
      const title = document.createElement('span');
      title.className = 'pp-notif-title';
      title.textContent = n.title;
      const date = document.createElement('span');
      date.className = 'pp-notif-date';
      date.textContent = timeAgo(n.date);
      top.appendChild(title);
      top.appendChild(date);
      el.appendChild(top);

      const text = document.createElement('div');
      text.className = 'pp-notif-text';
      if (n.type === 'feature') {
        const tag = document.createElement('span');
        tag.className = 'pp-notif-tag';
        tag.textContent = 'New feature · ';
        text.appendChild(tag);
      }
      text.appendChild(document.createTextNode(n.text || ''));
      el.appendChild(text);

      menu.appendChild(el);
    });
  }

  window.initNotifications = function () {
    const wrapper = document.getElementById('pp-actions-wrapper');
    if (!wrapper || document.getElementById('pp-notif-menu')) return;

    injectStyle();

    const dot = document.createElement('span');
    dot.id = 'pp-notif-dot';
    dot.setAttribute('aria-hidden', 'true');
    wrapper.appendChild(dot);

    const menu = document.createElement('div');
    menu.id = 'pp-notif-menu';
    menu.setAttribute('role', 'menu');
    wrapper.appendChild(menu);

    function setOpen(open) {
      menu.style.display = open ? 'block' : 'none';
    }

    // Click on the "Notifications" item inside the Actions dropdown
    // (delegated: the item may be rendered after this init runs)
    document.addEventListener('click', function (e) {
      const item = e.target.closest ? e.target.closest('#pp-action-notifications') : null;
      if (item) {
        const actionsMenu = document.getElementById('pp-actions-menu');
        if (actionsMenu) actionsMenu.style.display = 'none';
        setOpen(true);
        if (items.length) {
          // Opening the panel marks everything currently listed as seen
          setSeen(items.map(function (n) { return n.id; }));
          wrapper.classList.remove('has-unread');
        }
        return;
      }
      if (!menu.contains(e.target)) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setOpen(false);
    });
    // Opening the Actions menu again closes the updates panel
    wrapper.addEventListener('click', function (e) {
      if (e.target.closest('#pp-actions-btn, #pp-actions-btn-tablet, #pp-actions-btn-mobile')) setOpen(false);
    });

    // Each source fails independently: a missing one must not hide the other
    const gearsP = fetch(API_URL)
      .then(function (r) { return r.json(); })
      .then(function (data) { return Array.isArray(data) ? data : []; })
      .catch(function () { return []; });

    const featuresP = fetch(FEATURES_URL, { cache: 'no-cache' })
      .then(function (r) { return r.json(); })
      .then(function (list) {
        if (!Array.isArray(list)) return [];
        return list
          .filter(function (f) { return f && f.id && f.date && f.title; })
          .map(function (f) {
            return {
              id: 'feature:' + f.id,
              type: 'feature',
              title: f.title,
              text: f.text || '',
              link: f.link || '',
              date: f.date
            };
          });
      })
      .catch(function () { return []; });

    Promise.all([gearsP, featuresP])
      .then(function (res) {
        items = res[0].concat(res[1])
          .sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); })
          .slice(0, MAX_ITEMS);
        renderItems(menu);
        const seen = getSeen();
        if (items.some(function (n) { return seen.indexOf(n.id) === -1; })) {
          wrapper.classList.add('has-unread');
        }
      })
      .catch(function () { /* notifications are optional: fail silently */ });
  };
})();
