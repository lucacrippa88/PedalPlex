// ========================== UTILITY ==========================
function getPedalIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id"); // null se non presente
}

// ========================== NAVBAR ==========================
function renderNavBar(userRole = "guest") {
  const navHtml = `
    <header style="display: flex; align-items: center; justify-content: space-between; padding: 1rem; background:#222; color:white;">
      <div style="display: flex; align-items: center; gap: 1rem;">
        <button class="menu-toggle" id="menuToggle" aria-label="Open menu" style="background:none; border:none; cursor:pointer;">
          <div class="pedalplex-logo" style="width:40px; height:40px; background:linear-gradient(to right,#ff0044,#00ff99); border-radius:50%;"></div>
        </button>

        <div class="title" style="font-size:1.25rem; font-weight:bold;">PedalPlex</div>
        <a href="gears" class="subtitle" style="font-size:1rem; color: #aaa; text-decoration:none;">View Gear</a>
      </div>

      <div>
        ${userRole === "guest" ? `<button id="loginBtn" style="color:white;background:#555;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;">Login</button>` : `<span>Welcome, ${window.currentUser?.username || "User"}</span>`}
      </div>
    </header>
  `;

  $("body").prepend(navHtml);

  // Gestione click pulsante login
  $("#loginBtn").on("click", () => window.location.href = "login");

  // Menu toggle (puoi collegare il tuo fullscreenMenu se esiste)
  $("#menuToggle").on("click", function () {
    const randomQuote = window.songQuotes ? songQuotes[Math.floor(Math.random() * songQuotes.length)] : "";
    $("#song-quote").html(`<span style='font-style:italic'>${randomQuote}</span>`);
    $("#fullscreenMenu").addClass("active");
  });

  $("#closeMenu").on("click", () => $("#fullscreenMenu").removeClass("active"));
}

// ========================== NAV INIT ==========================
$(document).ready(() => {
  const token = localStorage.getItem("authToken");
  const userRole = token ? window.currentUser?.role || "user" : "guest";
  renderNavBar(userRole);
});
