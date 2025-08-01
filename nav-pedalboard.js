function initNavPedalboard() {
  const navHtml = `
    <header style="display: flex; align-items: center; justify-content: space-between;">
      <!-- Left: menu toggle + title -->
      <div style="display: flex; align-items: center; gap: 1rem;">
        <button class="menu-toggle" id="menuToggle" aria-label="Open menu" style="background:none; border:none; cursor:pointer;">
          <svg class="menu-icon" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
            <path d="M4 6h24v2H4zm0 9h24v2H4zm0 9h24v2H4"/>
          </svg>
        </button>

        <div class="title">PedalPlex</div><span class="subtitle" style="font-size: 1.25rem; color: #aaa; font-weight: 600">Build Pedalboard</span>
      </div>

      <!-- Right: search toggle, input, create button -->
      <div style="display: flex; align-items: center; gap: 1rem;">

        <span style="font-size: 0.75rem; opacity: 0.7;">Add gears</span>

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
          placeholder="..." 
          style="font-size: 0.875rem; padding: 6px 12px; border: 1px solid #8c8c8c; border-radius: 4px; outline-offset: 2px; width: 200px; display: none;" 
          aria-label="Filter pedals"/>
      
        <button
          id="saveBtn"
          class="bx--btn bx--btn--primary bx--btn--sm"
          type="button"
          aria-label="Save pedalboard"
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
            <path d="M12 20.414L7.293 15.707 6 17l6 6 14-14-1.293-1.293z"/>
          </svg>
          Save
        </button>

        <button
          id="createBtn"
          class="bx--btn bx--btn--secondary bx--btn--sm"
          type="button"
          aria-label="Create New Pedalboard"
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
          Create pedalboard
        </button>

      </div>

    </header>  
  `;

  // Prepend the navigation HTML to the body
  $("body").prepend(navHtml);

  // Add fullscreen menu HTML from external file
  $("body").append(window.fullscreenMenuHtml);

  // Fullscreen menu toggle with quote
  $("#menuToggle").on("click", function () {
    const randomQuote = songQuotes[Math.floor(Math.random() * songQuotes.length)];
    $("#song-quote").html(`<span style='font-style:italic'>${randomQuote}</span>`);
    $("#fullscreenMenu").addClass("active");
  });

  $("#closeMenu").on("click", function() {
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
    console.log("Filtering pedals by:", filterValue);
    // Add your filtering logic here
  });

  $("#saveBtn").on("click", function() {
    if (typeof savePedalboard === "function") {
      savePedalboard();
    } else {
      console.warn("savePedalboard() function not found");
    }
  });

}