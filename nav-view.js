// ========================== UTILITY ==========================
function getPedalIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id"); // null se non presente
}

// ========================== NAVBAR ==========================
function renderNavBar(userRole = "guest") {
  const navHtml = `
    <header style="display: flex; align-items: center; justify-content: space-between; padding: 1rem;">
      <div style="display: flex; align-items: center; gap: 1rem;">
        <button class="menu-toggle" id="menuToggle" aria-label="Open menu" style="background:none; border:none; cursor:pointer;">
          <div class="pedalplex-logo"></div>
        </button>

        <div class="title">PedalPlex</div>
        <a href="gears" class="subtitle" style="font-size: 1.25rem; color: #aaa; font-weight: 600; text-decoration:none;">View Gear</a>
      </div>

      <div>
        ${userRole === "guest" ? `<button id="loginBtn" class="bx--btn bx--btn--primary bx--btn--sm" type="button" aria-label="Login">Login</button>` : ''}
      </div>
    </header>
  `;

  $("body").prepend(navHtml);

  // Login button click
  $("#loginBtn").on("click", () => window.location.href = "login");

  // Menu toggle
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
