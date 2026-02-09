$(document).ready(function () {
  const navHtml = `
    <header style="display: flex; align-items: center; justify-content: space-between;">
      <!-- Left: menu toggle + title -->
      <div style="display: flex; align-items: center; gap: 1rem;">
        <button class="menu-toggle" id="menuToggle" aria-label="Open menu">
          <div class="pedalplex-logo"></div>
        </button>
        <a href="" style="text-decoration:none;" class="title">PedalPlex</a>
        <span class="subtitle" style="font-size: 1.25rem; color: #aaa; font-weight: 600"></span>
      </div>

      <!-- Right: login button placeholder -->
      <!-- <div id="navRight"></div> -->
    </header>
  `;

  $("body").prepend(navHtml);

  // Fullscreen menu toggle with quote
  $(document).on("click", "#menuToggle", function () {
    const randomQuote = songQuotes[Math.floor(Math.random() * songQuotes.length)];
    $("#song-quote").html(`<span style='font-style:italic'>${randomQuote}</span>`);
    $("#fullscreenMenu").addClass("active");
  });

  $(document).on("click", "#closeMenu", () => {
    $("#fullscreenMenu").removeClass("active");
  });

});
