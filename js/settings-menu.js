/**
 * settings-menu.js — Settings button (bottom-right) + appearance theme.
 *
 * Loaded in <head> so the theme is applied before first paint.
 * The button is injected in the bottom bar (.zoom-controls) of plexes / rigs.
 *
 * Menu:
 *   • Appearance: Dark / Light / Auto (system)
 *   • Guided Tour
 *   • Terms · Privacy
 */
(function () {
  // <script ... data-no-button>: apply the saved theme only (e.g. login page)
  const NO_BUTTON = !!(document.currentScript && document.currentScript.hasAttribute('data-no-button'));
  const STORAGE_KEY = 'pp_theme';
  const MODES = ['dark', 'light', 'auto'];
  const darkQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  function getMode() {
    const saved = localStorage.getItem(STORAGE_KEY);
    return MODES.includes(saved) ? saved : 'dark';
  }

  function applyTheme(mode) {
    const effective = mode === 'auto'
      ? (darkQuery && !darkQuery.matches ? 'light' : 'dark')
      : mode;
    document.documentElement.setAttribute('data-theme', effective);
  }

  // Apply immediately (script runs in <head>)
  applyTheme(getMode());

  // In "auto" mode follow OS changes live
  if (darkQuery) {
    const onChange = () => { if (getMode() === 'auto') applyTheme('auto'); };
    if (darkQuery.addEventListener) darkQuery.addEventListener('change', onChange);
    else if (darkQuery.addListener) darkQuery.addListener(onChange);
  }

  const SVG = {
    gear:  '<svg focusable="false" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32" aria-hidden="true" class="bx--btn__icon"><path d="M27,16.76c0-.25,0-.5,0-.76s0-.51,0-.77l1.92-1.68A2,2,0,0,0,29.3,11L26.94,7a2,2,0,0,0-1.73-1,2,2,0,0,0-.64.1l-2.43.82a11.35,11.35,0,0,0-1.31-.75l-.51-2.52a2,2,0,0,0-2-1.61H13.64a2,2,0,0,0-2,1.61l-.51,2.52a11.48,11.48,0,0,0-1.32.75L7.43,6.06A2,2,0,0,0,6.79,6,2,2,0,0,0,5.06,7L2.7,11a2,2,0,0,0,.41,2.51L5,15.24c0,.25,0,.5,0,.76s0,.51,0,.77L3.11,18.45A2,2,0,0,0,2.7,21L5.06,25a2,2,0,0,0,1.73,1,2,2,0,0,0,.64-.1l2.43-.82a11.35,11.35,0,0,0,1.31.75l.51,2.52a2,2,0,0,0,2,1.61h4.72a2,2,0,0,0,2-1.61l.51-2.52a11.48,11.48,0,0,0,1.32-.75l2.42.82a2,2,0,0,0,.64.1,2,2,0,0,0,1.73-1L29.3,21a2,2,0,0,0-.41-2.51ZM25.21,24l-3.43-1.17a8.86,8.86,0,0,1-2.71,1.57L18.36,28H13.64l-.71-3.55a9.36,9.36,0,0,1-2.7-1.57L6.79,24,4.43,20l2.72-2.4a8.9,8.9,0,0,1,0-3.13L4.43,12,6.79,8l3.43,1.17a8.86,8.86,0,0,1,2.71-1.57L13.64,4h4.72l.71,3.55a9.36,9.36,0,0,1,2.7,1.57L25.21,8,27.57,12l-2.72,2.4a8.9,8.9,0,0,1,0,3.13L27.57,20Z"/><path d="M16,22a6,6,0,1,1,6-6A5.94,5.94,0,0,1,16,22Zm0-10a3.91,3.91,0,0,0-4,4,3.91,3.91,0,0,0,4,4,3.91,3.91,0,0,0,4-4A3.91,3.91,0,0,0,16,12Z"/></svg>',
    check: '<svg focusable="false" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32" aria-hidden="true"><path d="M12 20.414L7.293 15.707 6 17l6 6 14-14-1.293-1.293z"/></svg>',
    tour:  '<svg focusable="false" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 2a14 14 0 1 0 14 14A14 14 0 0 0 16 2zm0 26a12 12 0 1 1 12-12 12 12 0 0 1-12 12z"/><path d="M16 11a1.5 1.5 0 1 0 1.5 1.5A1.5 1.5 0 0 0 16 11zM15 17h2v8h-2z"/></svg>',
  };

  const THEME_LABELS = { dark: 'Dark', light: 'Light', auto: 'Auto (system)' };

  function buildHtml() {
    const current = getMode();
    const themeItems = MODES.map(m => `
        <button type="button" class="pp-settings-item pp-settings-theme" role="menuitemradio"
                aria-checked="${m === current}" data-theme-mode="${m}">
          <span class="pp-settings-check">${m === current ? SVG.check : ''}</span>
          <span>${THEME_LABELS[m]}</span>
        </button>`).join('');

    return `
      <button id="pp-settings-btn" class="bx--btn bx--btn--tertiary bx--btn--sm bx--btn--icon-only"
              type="button" aria-label="Settings" aria-haspopup="true" aria-expanded="false">
        ${SVG.gear}
      </button>
      <div id="pp-settings-menu" role="menu" style="display:none;">
        <div class="pp-settings-heading">Appearance</div>
        ${themeItems}
        <div class="pp-settings-separator"></div>
        <button type="button" class="pp-settings-item" id="pp-settings-tour" role="menuitem">
          <span class="pp-settings-check">${SVG.tour}</span><span>Guided Tour</span>
        </button>
        <div class="pp-settings-separator"></div>
        <div class="pp-settings-links">
          <a href="/terms">Terms</a><span aria-hidden="true">·</span><a href="/privacy">Privacy</a>
        </div>
      </div>`;
  }

  function init() {
    if (NO_BUTTON || document.getElementById('pp-settings-wrapper')) return;
    const bar = document.querySelector('.zoom-controls');

    const wrapper = document.createElement('div');
    wrapper.id = 'pp-settings-wrapper';
    wrapper.innerHTML = buildHtml();

    if (bar) {
      // rigs: the right-aligned group already exists; append to it
      // plexes: zoom buttons sit directly in the bar -> Settings goes first, pushed to the
      // right, so the zoom icons follow it on the right side
      const group = bar.querySelector(':scope > div');
      if (group) {
        group.appendChild(wrapper);
      } else {
        wrapper.style.marginLeft = 'auto';
        const firstZoom = bar.querySelector('#zoomIn');
        bar.insertBefore(wrapper, firstZoom || null);
      }
    } else {
      // pages without a bottom bar (terms, privacy, profile, gears): floating button
      wrapper.classList.add('pp-settings-floating');
      document.body.appendChild(wrapper);
    }

    const btn  = wrapper.querySelector('#pp-settings-btn');
    const menu = wrapper.querySelector('#pp-settings-menu');

    function setOpen(open) {
      menu.style.display = open ? 'block' : 'none';
      btn.setAttribute('aria-expanded', String(open));
    }

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      setOpen(menu.style.display === 'none');
    });
    document.addEventListener('click', function (e) {
      if (!wrapper.contains(e.target)) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setOpen(false);
    });

    wrapper.querySelectorAll('.pp-settings-theme').forEach(function (item) {
      item.addEventListener('click', function () {
        const mode = item.getAttribute('data-theme-mode');
        localStorage.setItem(STORAGE_KEY, mode);
        applyTheme(mode);
        wrapper.querySelectorAll('.pp-settings-theme').forEach(function (el) {
          const active = el === item;
          el.setAttribute('aria-checked', String(active));
          el.querySelector('.pp-settings-check').innerHTML = active ? SVG.check : '';
        });
      });
    });

    wrapper.querySelector('#pp-settings-tour').addEventListener('click', function () {
      setOpen(false);
      if (typeof window.startTour === 'function') {
        window.startTour(0);
      } else {
        // tour.js is not loaded here: start it on /rigs (first tour page)
        localStorage.setItem('pp_tour_active', 'true');
        localStorage.setItem('pp_tour_step', '0');
        localStorage.removeItem('pp_tour_paused');
        sessionStorage.setItem('pp_tour_session', '1');
        window.location.href = '/rigs';
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
