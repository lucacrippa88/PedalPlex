$(document).ready(function () {
    const navHtml = `
    <header style="display: flex; align-items: center; justify-content: space-between;">
      <!-- Left: menu toggle + title -->
      <div style="display: flex; align-items: center; gap: 1rem;">
        <button class="menu-toggle" id="menuToggle" aria-label="Open menu">
          <div class="pedalplex-logo"></div>
        </button>

        <div class="title">PedalPlex</div><span class="subtitle" style="font-size: 1.25rem; color: #aaa; font-weight: 600"></span>
      </div>

      </div>

    </header>
  `;

    // Prepend the navigation HTML to the body
    $("body").prepend(navHtml);
    $("body").append(window.fullscreenMenuHtml);

    // Fullscreen menu toggle with quote
    $("#menuToggle").on("click", function () {
      const randomQuote = songQuotes[Math.floor(Math.random() * songQuotes.length)];
      $("#song-quote").html(`<span style='font-style:italic'>${randomQuote}</span>`);
      $("#fullscreenMenu").addClass("active");
    });

    $("#closeMenu").on("click", () => {
      $("#fullscreenMenu").removeClass("active");
    });

});
