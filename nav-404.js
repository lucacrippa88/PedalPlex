function initNav404() {
  const navHtml = `
    <header style="display: flex; align-items: center; justify-content: space-between;">
      <!-- Left: menu toggle + title -->
      <div style="display: flex; align-items: center; gap: 1rem;">
        <button class="menu-toggle" id="menuToggle" aria-label="Open menu">
          <svg class="menu-icon" focusable="false" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true"><path d="M4 6H28V8H4zM4 24H28V26H4zM4 12H28V14H4zM4 18H28V20H4z"></path></svg>
        </button>

        <a href="" style="text-decoration:none;" class="title">PedalPlex</a><span class="subtitle" style="font-size: 1.25rem; color: #aaa; font-weight: 600"></span>
      </div>

    </header>  
  `;

  // Prepend the navigation HTML to the body
  $("body").prepend(navHtml);

  // Fullscreen menu toggle with quote
  $("#menuToggle").on("click", function () {
    const randomQuote = songQuotes[Math.floor(Math.random() * songQuotes.length)];
    $("#song-quote").html(`<span style='font-style:italic'>${randomQuote}</span>`);
    $("#fullscreenMenu").addClass("active");
  });

  $("#closeMenu").on("click", function() {
    $("#fullscreenMenu").removeClass("active");
  });

}