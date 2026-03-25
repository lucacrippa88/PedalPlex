$(document).ready(function () {

  const navHtml = `
    <header style="display: flex; align-items: center; justify-content: space-between;">
      <!-- Left: menu toggle + title -->
      <div style="display: flex; align-items: center; gap: 1rem;">
        <button class="menu-toggle" id="menuToggle" aria-label="Open menu">
          <div class="pedalplex-logo"></div>
        </button>
        <a href="/" style="text-decoration:none;" class="title">PedalPlex</a>
        <span class="subtitle" style="font-size: 1.25rem; color: #aaa; font-weight: 600"></span>
      </div>
    </header>
  `;

  $("body").prepend(navHtml);


  // ==========================
  // Sync fullscreen menu state
  // ==========================

  function syncMenu() {
    if (typeof updateFullscreenMenu === 'function') {
      updateFullscreenMenu();
    }
  }

  // Caso 1: currentUser già disponibile (best case)
  if (window.currentUser !== undefined) {
    syncMenu();
  } else {
    // Caso 2: arriva async (fallback robusto)
    const waitForUser = setInterval(() => {
      if (window.currentUser !== undefined) {
        clearInterval(waitForUser);
        syncMenu();
      }
    }, 50);
  }

});