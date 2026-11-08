/**
 * notifications.js — "PedalPlex updates" bell (header, left of Actions).
 *
 * Data: GET_NOTIFICATIONS.php -> latest public gears + curated features (max 10).
 * Unread state: ids already seen are kept in localStorage; the purple dot shows
 * while the list contains at least one id that has not been seen yet.
 * Opening the panel marks everything as seen.
 *
 * Usage: call window.initNotifications() after the header has been injected.
 */
(function () {
  const API_URL     = 'https://api.pedalplex.com/GET_NOTIFICATIONS.php';
  const STORAGE_KEY = 'pp_notif_seen';

  const ICON_BELL = '<svg focusable="false" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32" aria-hidden="true"><path d="M28.707,19.293,26,16.586V13a10.014,10.014,0,0,0-9-9.9492V1H15V3.0508A10.014,10.014,0,0,0,6,13v3.586L3.293,19.293A1,1,0,0,0,3,20v3a1,1,0,0,0,1,1h7v.7768a5.152,5.152,0,0,0,4.5,5.1987A5.0057,5.0057,0,0,0,21,25V24h7a1,1,0,0,0,1-1V20A1,1,0,0,0,28.707,19.293ZM19,25a3,3,0,0,1-3.2261,2.9917A3.1463,3.1463,0,0,1,13,24.7768V24h6Zm8-3H5V20.414L7.707,17.707A1,1,0,0,0,8,17V13a8,8,0,0,1,16,0v4a1,1,0,0,0,.293.707L27,20.414Z"/></svg>';

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

  function injectStyle() {
    if (document.getElementById('pp-notif-style')) return;
    const style = document.createElement('style');
    style.id = 'pp-notif-style';
    style.textContent = `
      #pp-notif-wrapper { position: relative; }
      #pp-notif-dot {
        display: none;
        position: absolute;
        top: 6px;
        right: 6px;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #9C54D5;
        pointer-events: none;
      }
      #pp-notif-wrapper.has-unread #pp-notif-dot { display: block; }
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

  function renderItems(menu, items) {
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
    if (document.getElementById('pp-notif-wrapper')) return;
    const anchor = document.getElementById('pp-actions-wrapper');
    if (!anchor) return;

    injectStyle();

    const wrapper = document.createElement('div');
    wrapper.id = 'pp-notif-wrapper';
    wrapper.innerHTML = `
      <button id="pp-notif-btn" class="bx--btn bx--btn--tertiary bx--btn--sm bx--btn--icon-only"
              type="button" aria-label="PedalPlex updates" aria-haspopup="true" aria-expanded="false">
        ${ICON_BELL}
      </button>
      <span id="pp-notif-dot" aria-hidden="true"></span>
      <div id="pp-notif-menu" role="menu"></div>`;
    anchor.parentNode.insertBefore(wrapper, anchor);

    const btn  = wrapper.querySelector('#pp-notif-btn');
    const menu = wrapper.querySelector('#pp-notif-menu');
    let items = [];

    function setOpen(open) {
      menu.style.display = open ? 'block' : 'none';
      btn.setAttribute('aria-expanded', String(open));
    }

    btn.addEventListener('click', function () {
      const open = menu.style.display !== 'block';
      setOpen(open);
      if (open && items.length) {
        // Opening the panel marks everything currently listed as seen
        setSeen(items.map(function (n) { return n.id; }));
        wrapper.classList.remove('has-unread');
      }
    });
    document.addEventListener('click', function (e) {
      if (!wrapper.contains(e.target)) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setOpen(false);
    });

    fetch(API_URL)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!Array.isArray(data)) return;
        items = data.slice(0, 10);
        renderItems(menu, items);
        const seen = getSeen();
        if (items.some(function (n) { return seen.indexOf(n.id) === -1; })) {
          wrapper.classList.add('has-unread');
        }
      })
      .catch(function () { /* notifications are optional: fail silently */ });
  };
})();
