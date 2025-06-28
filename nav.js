$(document).ready(function() {
  const navHtml = `
    <header>
      <button class="menu-toggle" id="menuToggle" aria-label="Open menu">
        <svg class="menu-icon" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 6h24v2H4zm0 9h24v2H4zm0 9h24v2H4z"/>
        </svg>
      </button>
      <div class="title">PedalPlex</div>
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

  // Setup event listeners for menu toggle and close buttons
  $("#menuToggle").on("click", function() {
    $("#fullscreenMenu").addClass("active");
  });

  $("#closeMenu").on("click", function() {
    $("#fullscreenMenu").removeClass("active");
  });
});
