// nav-catalog.js

// Initialize navigation catalog
function initNavCatalog(userRole) {
  const isAdmin = (userRole === "admin");
  const subtitleText = `Gears Catalog${isAdmin ? " Manager" : ""}`;

  // Nav HTML
  const navHtml = `
    <header style="display: flex; align-items: center; justify-content: space-between;">
      <div style="display: flex; align-items: center; gap: 1rem;">
        <button class="menu-toggle" id="menuToggle" aria-label="Open menu" style="background:none; border:none; cursor:pointer;">
          <svg class="menu-icon" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
            <path d="M4 6h24v2H4zm0 9h24v2H4zm0 9h24v2H4"/>
          </svg>
        </button>

        <div class="title">PedalPlex</div>
        <span class="subtitle" style="font-size: 1.25rem; color: #aaa; font-weight: 600">${subtitleText}</span>
      </div>

      <div style="display: flex; align-items: center; gap: 1rem;">
        <span id="pedalCount" style="font-size: 0.75rem; color:#aaa"></span>

        <button id="toggleFilterBtn" aria-label="Toggle search" style="background:none; border:none; cursor:pointer; padding:4px;">
          <svg fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
              viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
              <circle cx="11" cy="11" r="7"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </button>

        <input 
          type="text" 
          id="pedalFilterInput" 
          placeholder="Filter gears..." 
          style="font-size: 0.875rem; padding: 6px 12px; border: 1px solid #8c8c8c; border-radius: 4px; outline-offset: 2px; width: 120px; display: none;" 
          aria-label="Filter pedals"/>

        ${isAdmin ? `
          <button id="createPedalBtn" class="bx--btn bx--btn--primary bx--btn--sm" type="button" aria-label="Create New Gear" style="display: flex; align-items: center; gap: 0.5rem;">
            <svg focusable="false" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32" aria-hidden="true" class="bx--btn__icon">
              <path d="M16 4v24M4 16h24" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            Add gear
          </button>` : ''}

        ${!isAdmin ? `
          <button id="createOwnPedalBtn" class="bx--btn bx--btn--primary bx--btn--sm" type="button" aria-label="Add Your Own Gear" style="display: flex; align-items: center; gap: 0.5rem;">
            <svg focusable="false" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32" aria-hidden="true" class="bx--btn__icon">
              <path d="M16 4v24M4 16h24" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            Add Your Own Gear
          </button>` : ''}
      </div>
    </header>
  `;

  $("body").prepend(navHtml);

  // Allow all users to create pedals
  $(document).on('click', '#createPedalBtn', createNewPedal);
  $(document).on('click', '#createOwnPedalBtn', createNewPedal);

  // Add fullscreen menu HTML from external file
  $("body").append(window.fullscreenMenuHtml);

  // Fullscreen menu toggle with random quote
  $("#menuToggle").on("click", function () {
    const randomQuote = songQuotes[Math.floor(Math.random() * songQuotes.length)];
    $("#song-quote").html(`<span style='font-style:italic'>${randomQuote}</span>`);
    $("#fullscreenMenu").addClass("active");
  });

  $("#closeMenu").on("click", function () {
    $("#fullscreenMenu").removeClass("active");
  });

  // Toggle filter input visibility
  $("#toggleFilterBtn").on("click", function () {
    const input = $("#pedalFilterInput");
    if (input.is(":visible")) {
      input.hide().val("");
    } else {
      input.show().focus();
    }
  });

  // Filter pedals dynamically
  $("#pedalFilterInput").on("input", function () {
    const filterValue = $(this).val().toLowerCase();

    $(".pedal-catalog").each(function () {
      const $pedal = $(this);
      const name = $pedal.data("pedal-id")?.toLowerCase() || "";
      $pedal.toggle(name.includes(filterValue));
    });

    // Update counts after filtering
    updatePedalCounts();
  });
}



// Updates pedal counts including draft/private/reviewing/public-by-me
function updatePedalCounts(activeFilter = null) {
  const visiblePedals = $(".pedal-catalog:visible");
  const allPedals = $(".pedal-catalog");
  const totalVisible = visiblePedals.length;
  const totalAbsolute = allPedals.length;

  const statusCounts = { draft: 0, private: 0, reviewing: 0, publicByMe: 0 };
  let userPedalsCount = 0;

  allPedals.each(function() {
    const status = ($(this).data("published") || "").toLowerCase();
    const author = ($(this).data("author") || "").toLowerCase();

    if (status in statusCounts) statusCounts[status]++;
    if (status === "public" && author === window.currentUser.username.toLowerCase()) {
      statusCounts.publicByMe++;
    }

    // Count pedals created by non-admin users
    if (author && author !== "admin") {
      userPedalsCount++;
    }
  });

  // Badge for reviewing
  const reviewingBadge = statusCounts.reviewing > 0
    ? `<span class="status-filter ${activeFilter === "reviewing" ? "active-filter" : ""}" data-filter="reviewing" style="
        background:#ff0000;
        color:white;
        border-radius:50%;
        padding:1px 5px;
        font-size:0.75rem;
        font-weight:bold;
        min-width:18px;
        text-align:center;
      ">${statusCounts.reviewing}</span>`
    : `<span class="status-filter ${activeFilter === "reviewing" ? "active-filter" : ""}" data-filter="reviewing">0</span>`;

  // Build counters
  let countsHtml =
    `${totalVisible} gear${totalVisible === 1 ? "" : "s"} available ` +
    `(All: <span class="status-filter ${activeFilter === "all" ? "active-filter" : ""}" data-filter="all">${totalAbsolute}</span>, 
     Draft: <span class="status-filter ${activeFilter === "draft" ? "active-filter" : ""}" data-filter="draft">${statusCounts.draft}</span>, 
     Private: <span class="status-filter ${activeFilter === "private" ? "active-filter" : ""}" data-filter="private">${statusCounts.private}</span>, 
     Reviewing: ${reviewingBadge}, 
     Published by me: <span class="status-filter ${activeFilter === "publicByMe" ? "active-filter" : ""}" data-filter="publicByMe">${statusCounts.publicByMe}</span>`;

  // Add user pedal counter only for admins (inside parentheses)
  if (window.currentUser?.role === "admin") {
    countsHtml += `, Published by Users: <span class="status-filter" data-filter="user">${userPedalsCount}</span>`;
  }

  countsHtml += `)`;

  $("#pedalCount").html(countsHtml);

  // Attach click handler
  $(".status-filter").off("click").on("click", function() {
    const filter = $(this).data("filter");
    filterPedalsByStatus(filter);
  });
}




// Filtering function
function filterPedalsByStatus(filter) {
  const currentUsername = (window.currentUser?.username || "").toLowerCase();

  $(".pedal-catalog").each(function() {
    const status = ($(this).data("published") || "").toLowerCase();
    const author = ($(this).data("author") || "").toLowerCase();

    const isMine = (status === "public" && author === currentUsername);
    const isUserCreated = author && author !== "admin"; // keeps same semantics you used for counting

    if (filter === "all") {
      $(this).show();
    } else if (filter === "publicByMe") {
      $(this).toggle(isMine);
    } else if (filter === "user") {
      // Show pedals created by regular users (non-admin authors)
      $(this).toggle(isUserCreated);
    } else {
      // filter is one of: "draft", "private", "reviewing", "public"
      $(this).toggle(status === filter);
    }
  });

  // Update counts after filtering (keeps UI in sync)
  updatePedalCounts(filter);
}


// CSS for link look + active highlight
const style = document.createElement("style");
style.textContent = `
  .status-filter {
    cursor: pointer;
    text-decoration: underline;
    color: #ddd;
  }
  .status-filter.active-filter {
    font-weight: bold;
    color: #fff;
    text-decoration: none;
    border-bottom: 2px solid #fff;
  }
`;
document.head.appendChild(style);




// Filtering function
function filterPedalsByStatus(filter) {
  $(".pedal-catalog").each(function() {
    const status = ($(this).data("published") || "").toLowerCase();
    const author = ($(this).data("author") || "").toLowerCase();
    const isMine = (status === "public" && author === window.currentUser.username.toLowerCase());

    if (filter === "all") {
      $(this).show();
    } else if (filter === "publicByMe") {
      $(this).toggle(isMine);
    } else {
      $(this).toggle(status === filter);
    }
  });

  // Update counts after filtering
  updatePedalCounts();
}


// Initialize catalog after pedals are loaded
function initCatalog(userRole) {
  const resultsDiv = document.getElementById("catalog");

  resultsDiv.innerHTML = `
      <div class="bx--loading-overlay">
        <div class="bx--loading" role="status">
          <svg class="bx--loading__svg" viewBox="-75 -75 150 150">
            <circle class="bx--loading__background" cx="0" cy="0" r="37.5"/>
            <circle class="bx--loading__stroke" cx="0" cy="0" r="37.5"/>
          </svg>
        </div>     
      </div>`;

  fetch(`https://www.cineteatrosanluigi.it/plex/GET_CATALOG.php?role=${userRole}&username=${window.currentUser.username}`)
    .then(response => {
      if (!response.ok) throw new Error("Network response was not ok");
      return response.json();
    })
    .then(pedals => {
      resultsDiv.innerHTML = ""; // Clear loader
      $("#pedalCount").text(`${pedals.length} gears`); // temporary before full update

      pedals.sort((a, b) => a._id - b._id);

      pedals.forEach(pedal => {
        const $pedalDiv = renderPedal(pedal, userRole);
        // Add author + published to data attributes so counts work
        $pedalDiv.attr("data-author", pedal.author || "");
        $pedalDiv.attr("data-published", (pedal.published || "draft").toLowerCase());
        $(resultsDiv).append($pedalDiv);
      });

      // Update counts including statuses after pedals are rendered
      updatePedalCounts();

      // Setup edit button handlers
      setupEditPedalHandler(pedals);
    })
    .catch(error => {
      console.error("Error fetching pedals:", error);
      resultsDiv.innerHTML = `<p style="color:red;">Error loading pedals: ${error.message}</p>`;
    });
}
