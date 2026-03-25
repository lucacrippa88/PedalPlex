$(document).ready(function () {
  // ==========================
  // 1. Inject header/nav
  // ==========================
  const navHtml = `
    <header style="display: flex; align-items: center; justify-content: space-between;">
      <div style="display: flex; align-items: center; gap: 1rem;">
        <button class="menu-toggle" id="menuToggle" aria-label="Open menu">
          <div class="pedalplex-logo"></div>
        </button>
        <a href="/" style="text-decoration:none;" class="title">PedalPlex</a>
        <span class="subtitle" style="font-size:1.25rem;color:#aaa;font-weight:600"></span>
      </div>
    </header>
  `;
  $("body").prepend(navHtml);

  // ==========================
  // 2. Inject fullscreen menu if missing
  // ==========================
  if (!$("#fullscreenMenu").length) {
    $("body").append(window.fullscreenMenuHtml);
  }

  // ==========================
  // 3. Fullscreen menu toggle & random quote
  // ==========================
  $(document).on("click", "#menuToggle", function () {
    const randomQuote = songQuotes[Math.floor(Math.random() * songQuotes.length)];
    $("#song-quote").html(`<span style='font-style:italic'>${randomQuote}</span>`);
    $("#fullscreenMenu").addClass("active");
  });

  $(document).on("click", "#closeMenu", function () {
    $("#fullscreenMenu").removeClass("active");
  });

  // ==========================
  // 4. Wait for currentUser, then update menu buttons
  // ==========================
  const checkUser = setInterval(() => {
    if (window.currentUser !== undefined) {
      clearInterval(checkUser);
      if (typeof updateFullscreenMenu === "function") {
        updateFullscreenMenu();
      }
    }
  }, 50);

  // ==========================
  // 5. Profile button
  // ==========================
  $(document).on("click", "#profileBtn", function () {
    if (window.currentUser && window.currentUser.role !== "guest") {
      window.location.href = "/profile";
    } else {
      Swal.fire({
        icon: "info",
        title: "Guest mode",
        text: "Please log in to access your profile.",
        confirmButtonText: "OK"
      });
    }
  });

  // ==========================
  // 6. Logout button
  // ==========================
  $(document).on("click", "#logoutBtn", function () {
    if (window.currentUser && window.currentUser.role !== "guest") {
      Swal.fire({
        title: "Are you sure you want to logout?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Logout",
        cancelButtonText: "Cancel",
        customClass: {
          confirmButton: "bx--btn bx--btn--primary",
          cancelButton: "bx--btn bx--btn--secondary"
        },
        buttonsStyling: false
      }).then((result) => {
        if (result.isConfirmed) {
          localStorage.removeItem("authToken");
          window.currentUser = { role: "guest", username: "guest" };
          if (typeof updateFullscreenMenu === "function") updateFullscreenMenu();
          window.location.href = "https://pedalplex.com";
        }
      });
    }
  });

  // ==========================
  // 7. Login button
  // ==========================
  $(document).on("click", "#loginFullscreenBtn", function () {
    window.location.href = "/login";
  });

  // ==========================
  // 8. Dynamic year range in footer
  // ==========================
  function setYearRangeIfReady() {
    const startYear = 2025;
    const currentYear = new Date().getFullYear();
    const yearText = currentYear > startYear ? `${startYear}–${currentYear}` : `${startYear}`;
    const $yr = $("#year-range");
    if ($yr.length) {
      $yr.text(yearText);
      return true;
    }
    return false;
  }

  if (!setYearRangeIfReady()) {
    let retries = 0;
    const maxRetries = 30;
    const pollId = setInterval(() => {
      retries++;
      if (setYearRangeIfReady() || retries >= maxRetries) clearInterval(pollId);
    }, 100);
  }
});