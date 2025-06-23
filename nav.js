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
        <a href="index.html">View your presets</a>
        <a href="build.html">Edit your pedalboard</a>
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



const menuToggle = document.getElementById('menuToggle');
const fullscreenMenu = document.getElementById('fullscreenMenu');
const closeMenu = document.getElementById('closeMenu');

menuToggle.addEventListener('click', () => {
    fullscreenMenu.classList.add('active');
});

closeMenu.addEventListener('click', () => {
    fullscreenMenu.classList.remove('active');
});

carbonComponents = window.CarbonComponents;
carbonComponents.watch();  // activates all JS Carbon widgets
