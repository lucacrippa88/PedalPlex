function initNavCatalog(userRole) {

  const initialCount = $(".pedal-catalog").length;
  $("#pedalCount").text(`${initialCount} gear${initialCount === 1 ? "" : "s"} available`);


  const isAdmin = (userRole === "admin");
  const subtitleText = `Gears Catalog${isAdmin ? " Manager" : ""}`;

  const navHtml = `
    <header style="display: flex; align-items: center; justify-content: space-between;">
      <!-- Left: menu toggle + title -->
      <div style="display: flex; align-items: center; gap: 1rem;">
        <button class="menu-toggle" id="menuToggle" aria-label="Open menu" style="background:none; border:none; cursor:pointer;">
          <svg class="menu-icon" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
            <path d="M4 6h24v2H4zm0 9h24v2H4zm0 9h24v2H4"/>
          </svg>
        </button>

        <div class="title">PedalPlex</div>
        <span class="subtitle" style="font-size: 1.25rem; color: #aaa; font-weight: 600">${subtitleText}</span>
      </div>

      <!-- Right: search toggle, input, create button -->
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
          <button
            id="createPedalBtn"
            class="bx--btn bx--btn--primary bx--btn--sm"
            type="button"
            aria-label="Create New Gear"
            style="display: flex; align-items: center; gap: 0.5rem;">
            <svg
              focusable="false"
              preserveAspectRatio="xMidYMid meet"
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              width="16"
              height="16"
              viewBox="0 0 32 32"
              aria-hidden="true"
              class="bx--btn__icon">
              <path d="M16 4v24M4 16h24" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            Add gear
          </button>
        ` : ''}

        ${!isAdmin ? `
          <button
            id="requestPedalBtn"
            class="bx--btn bx--btn--primary bx--btn--sm"
            type="button"
            aria-label="Request New Gear"
            style="display: flex; align-items: center; gap: 0.5rem;">
            <svg
              focusable="false"
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              width="16"
              height="16"
              viewBox="0 0 32 32"
              aria-hidden="true"
              class="bx--btn__icon"
              >
              <!-- Arrow markers -->
              <polygon points="8.59 20.41 12.17 24 12.17 24 8.58 27.59 10 29 15 24 10 19 8.59 20.41"/>
              <polygon points="15.59 20.41 19.17 24 19.17 24 15.58 27.59 17 29 22 24 17 19 15.59 20.41"/>
              <!-- Envelope shape -->
              <path d="M14,23H4V7.91l11.43,7.91a1,1,0,0,0,1.14,0L28,7.91V17h2V7a2,2,0,0,0-2-2H4A2,2,0,0,0,2,7V23a2,2,0,0,0,2,2H14ZM25.8,7,16,13.78,6.2,7Z"/>
            </svg>
            Request gear
          </button>
        ` : ''}

      </div>

    </header>
  `;

  // Prepend the navigation HTML to the body
  $("body").prepend(navHtml);

  // Allow all users to create pedals
  $(document).on('click', '#createPedalBtn', createNewPedal);

  
  // Add fullscreen menu HTML from external file
  $("body").append(window.fullscreenMenuHtml);

  // Fullscreen menu toggle with quote
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

  $("#pedalFilterInput").on("input", function () {
    const filterValue = $(this).val().toLowerCase();
    let visibleCount = 0;

    $(".pedal-catalog").each(function () {
      const $pedal = $(this);
      const name = $pedal.data("pedal-id")?.toLowerCase() || "";

      if (name.includes(filterValue)) {
        $pedal.show();
        visibleCount++;
      } else {
        $pedal.hide();
      }
    });

    $("#pedalCount").text(`${visibleCount} gear${visibleCount === 1 ? "" : "s"} found`);
  });


}
