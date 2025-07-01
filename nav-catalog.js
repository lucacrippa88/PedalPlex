$(document).ready(function () {
    const navHtml = `
    <header style="display: flex; align-items: center; justify-content: space-between;">
      <!-- Left: menu toggle + title -->
      <div style="display: flex; align-items: center; gap: 1rem;">
        <button class="menu-toggle" id="menuToggle" aria-label="Open menu" style="background:none; border:none; cursor:pointer;">
          <svg class="menu-icon" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
            <path d="M4 6h24v2H4zm0 9h24v2H4zm0 9h24v2H4"/>
          </svg>
        </button>

        <div class="title">PedalPlex</div><span class="subtitle" style="font-size: 1.25rem; color: #aaa; font-weight: 600">Catalog</span>
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
      </div>
    </header>



    <div class="fullscreen-menu" id="fullscreenMenu">
      <div class="fullscreen-header">
        <button class="close-btn" id="closeMenu" aria-label="Close menu">
          <svg class="close-icon" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <path d="M24 9.41L22.59 8 16 14.59 9.41 8 8 9.41 14.59 16 
                     8 22.59 9.41 24 16 17.41 22.59 24 24 22.59 
                     17.41 16 24 9.41z"/>
          </svg>
        </button>
      </div>
      <div class="fullscreen-nav">
        <a href="presets.html">View your presets</a>
        <a href="pedalboard.html">Edit your pedalboard</a>
        <a href="catalog.html">Edit pedals catalog</a>
      </div>
      <div class="menu-bottom" style="text-align: center; margin-top: auto; padding: 1rem; font-size: 1rem; color: #000;">
        <span style='font-style:italic'>Rock 'n' roll will never die!</span>
      </div>
      <div class="menu-footer" style="text-align: center; margin-top: auto; padding: 1rem; font-size: 0.75rem; color: #aaa;">
        Made with love by <a href='https://github.com/lucacrippa88' target='_blank'>@luca.crippa88</a><br><br>© 2025 PedalPlex. All rights reserved.
      </div>
    </div>
  `;

    // Prepend the navigation HTML to the body
    $("body").prepend(navHtml);
    $(document).on('click', '#createPedalBtn', createNewPedal);

    // Setup event listeners for menu toggle and close buttons
    $("#menuToggle").on("click", function () {
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

        $(".pedal").each(function () {
            const $pedal = $(this);
            const name = $pedal.data("pedal-id")?.toLowerCase() || "";

            if (name.includes(filterValue)) {
                $pedal.show();
            } else {
                $pedal.hide();
            }
        });

    });


});
