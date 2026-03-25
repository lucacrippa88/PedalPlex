$(document).ready(function () {

  const navHtml = `
    <header style="display: flex; align-items: center; justify-content: space-between;">
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
  // GESTIONE AUTH (come nav-plexes)
  // ==========================

  const applyAuthToMenu = () => {
    const isGuest = !window.currentUser || window.currentUser.role === "guest";

    const loginBtn = document.getElementById("loginFullscreenBtn");
    const guestMsg = document.getElementById("guestLoginMessage");
    const profileBtn = document.getElementById("profileBtn");
    const logoutBtn = document.getElementById("logoutBtn");

    if (!loginBtn || !profileBtn || !logoutBtn || !guestMsg) return;

    if (isGuest) {
      loginBtn.style.display = "flex";
      guestMsg.style.display = "block";

      profileBtn.style.display = "none";
      logoutBtn.style.display = "none";
    } else {
      loginBtn.style.display = "none";
      guestMsg.style.display = "none";

      profileBtn.style.display = "flex";
      logoutBtn.style.display = "flex";
    }
  };


  // Caso 1: currentUser già disponibile
  if (window.currentUser !== undefined) {
    applyAuthToMenu();
  } else {
    // Caso 2: async (come fai già in altri punti)
    const waitForUser = setInterval(() => {
      if (window.currentUser !== undefined) {
        clearInterval(waitForUser);
        applyAuthToMenu();
      }
    }, 50);
  }

});