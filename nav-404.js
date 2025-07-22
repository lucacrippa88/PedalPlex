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

        <div class="title">PedalPlex</div><span class="subtitle" style="font-size: 1.25rem; color: #aaa; font-weight: 600"></span>
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

});