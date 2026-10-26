// Utility
function getPedalIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id"); // null se non presente
}

// Navbar
function renderNavBar(userRole = "guest") {
  const navHtml = `
    <header style="display: flex; align-items: center; justify-content: space-between;">
      <div style="display: flex; align-items: center; gap: 1rem;">
        <button class="menu-toggle" id="menuToggle" aria-label="Open menu" style="background:none; border:none; cursor:pointer;">
          <span class="menu-morph" aria-hidden="true"><i class="menu-morph__ham"></i><i class="menu-morph__logo"></i></span>
        </button>

        <div class="title">PedalPlex</div>
        <a href="/gears" class="subtitle" style="font-size: 1.25rem; color: #aaa; font-weight: 600; text-decoration:none;">View Gear</a>
      </div>

      <div>
        ${userRole === "guest" ? `<button id="loginBtn" class="bx--btn bx--btn--primary bx--btn--sm" type="button" aria-label="Login"><svg focusable="false" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32" aria-hidden="true" class="bx--btn__icon"><path d="M26,30H14a2,2,0,0,1-2-2V25h2v3H26V4H14V7H12V4a2,2,0,0,1,2-2H26a2,2,0,0,1,2,2V28A2,2,0,0,1,26,30Z"></path><path d="M14.59 20.59L18.17 17 4 17 4 15 18.17 15 14.59 11.41 16 10 22 16 16 22 14.59 20.59z"></path></svg>Login</button>` : ''}
      </div>
    </header>
  `;

  $("body").prepend(navHtml);

  // Login button click
  $("#loginBtn").on("click", () => window.location.href = "/login");

  // Menu toggle
  $("#menuToggle").on("click", function () {
    const randomQuote = window.songQuotes ? songQuotes[Math.floor(Math.random() * songQuotes.length)] : "";
    $("#song-quote").html(`<span style='font-style:italic'>${randomQuote}</span>`);
    $("#fullscreenMenu").addClass("active");
  });

  $("#closeMenu").on("click", () => $("#fullscreenMenu").removeClass("active"));
}

// Navbar init
$(document).ready(() => {
  const token = localStorage.getItem("authToken");
  const userRole = token ? window.currentUser?.role || "user" : "guest";
  renderNavBar(userRole);
});
