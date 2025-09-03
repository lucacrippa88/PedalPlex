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
        <span id="pedalCount" style="font-size: 0.75rem; opacity: 0.7;"></span>

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

// Updates pedal counts including draft/private/reviewing
function updatePedalCounts() {
  const pedals = $(".pedal-catalog:visible"); // only visible pedals if filtering
  const totalCount = pedals.length;
  const statusCounts = { draft: 0, private: 0, reviewing: 0 };

  pedals.each(function() {
    const status = ($(this).data("published") || "").toLowerCase();
    if (status in statusCounts) statusCounts[status]++;
  });

  $("#pedalCount").text(
    `${totalCount} gear${totalCount === 1 ? "" : "s"} available ` +
    `(Draft: ${statusCounts.draft}, Private: ${statusCounts.private}, Reviewing: ${statusCounts.reviewing})`
  );
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
