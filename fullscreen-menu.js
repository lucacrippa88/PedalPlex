// ==========================
// Song quotes array
// ==========================
const songQuotes = [
  "Rock 'n' roll will never die!",
  "We are the champions, my friend!",
  "We're not gonna take it!",
  "I wanna rock and roll all night / And party every day!",
  "I was born with a plastic spoon in my mouth!",
  "Take it Easy!",
  "I'd trade all my tomorrows / For a single yesterday!",
  "We learned more from a three-minute record than we ever learned in school!",
  "You may say I'm a dreamer / But I'm not the only one!",
  "Mama, I'm coming home...",
  "Back in business again!",
  "Won't you fly high, free bird, yeah!",
  "So if you want to love me / Then darlin' don't refrain...",
  "And if you listen very hard / The tune will come to you at last!",
  "Here I am, rock you like a hurricane!",
  "Exit light, enter night!",
  "Living easy, loving free!",
  "Don’t stop believin’!",
  "Sweet dreams are made of this...",
  "Take me down to the Paradise City / Where the grass is green and the girls are pretty!",
  "I’m a cowboy, on a steel horse I ride / I’m wanted dead or alive!",
  "Is this the real life? Is this just fantasy? / Caught in a landslide, no escape from reality...",
  "If you wake up and don’t want to smile / If it takes just a little while…"
];

// ==========================
// Fullscreen menu HTML
// ==========================
window.fullscreenMenuHtml = `
<div class="fullscreen-menu" id="fullscreenMenu"><br>
  <div class="fullscreen-header" style="display: flex; justify-content: space-between; align-items: center;">
    <button class="close-btn" id="closeMenu" aria-label="Close menu" style="background: none; border: none; cursor: pointer;">
      <svg class="close-icon" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <path d="M24 9.41L22.59 8 16 14.59 9.41 8 8 9.41 14.59 16 
                 8 22.59 9.41 24 16 17.41 22.59 24 24 22.59 
                 17.41 16 24 9.41z"/>
      </svg>
    </button>
  </div>

  <div class="fullscreen-nav">
    <a href='/PedalPlex/' class="pedalplex-logo-fullscreen-menu"></a><br>
    <a href="preset">Edit your presets</a>
    <a href="pedalboard">Manage pedalboards</a>
    <a href="catalog">View gears catalog</a>
    <br><br>
    <span class="showMobile" style="color:#161616">
      Visit desktop website<br>to access all editing features
    </span>
    <span id="guestLoginMessage" style="color:#161616; font-size:0.875rem; display:none;">
      Login to access all features
    </span>
    <br><br>

    <button id="profileBtn" class="bx--btn bx--btn--secondary" style="display:none;">
      Your profile
    </button>

    <button id="logoutBtn" class="bx--btn bx--btn--primary" style="display:none;">
      Logout
    </button>

    <button id="loginFullscreenBtn" class="bx--btn bx--btn--primary" style="display:none;">
      Login
    </button>
  </div>

  <div id="song-quote" class="menu-bottom" style="text-align: center; margin-top: auto; padding: 1rem; font-size: 1rem; color: #000;">
    <span style='font-style:italic'>Rock 'n' roll will never die!</span>
  </div>

  <div class='menu-footer' style="margin-top:4rem; text-align:center; padding:1rem; font-size:0.875rem; color:#aaa;">
    © <span id="year-range"></span> PedalPlex · 
    <a href="terms">Terms</a> · <a href="privacy">Privacy</a> · <a href="#">Support</a>
  </div>
</div>
`;

// ==========================
// Update fullscreen menu buttons
// ==========================
function updateFullscreenMenu(userRole) {
  const isGuest = (userRole === "guest");
  if (isGuest) {
    $("#loginFullscreenBtn, #guestLoginMessage").show();
    $("#profileBtn, #logoutBtn").hide();
  } else {
    $("#loginFullscreenBtn, #guestLoginMessage").hide();
    $("#profileBtn, #logoutBtn").show();
  }
}

// ==========================
// DOM Ready
// ==========================
$(document).ready(function () {
  // Inject menu HTML if missing
  if (!$("#fullscreenMenu").length) $("body").append(window.fullscreenMenuHtml);

  // Close/open menu
  $("#menuToggle").on("click", function() {
    const randomQuote = songQuotes[Math.floor(Math.random() * songQuotes.length)];
    $("#song-quote").html(`<span style='font-style:italic'>${randomQuote}</span>`);
    $("#fullscreenMenu").addClass("active");
  });
  $("#closeMenu").on("click", function() {
    $("#fullscreenMenu").removeClass("active");
  });

  // --- Buttons actions ---
  $("#profileBtn").on("click", function() {
    window.location.href = "profile";
  });

  $("#logoutBtn").on("click", function() {
    localStorage.removeItem('authToken');
    // Aggiorna menu a guest dopo logout
    $(document).trigger('userRoleChanged', ['guest']);
    window.location.href = '/PedalPlex/';
  });

  $("#loginFullscreenBtn").on("click", function() {
    window.location.href = "login";
  });

  // --- Dynamic year helper ---
  const startYear = 2025;
  const currentYear = new Date().getFullYear();
  $("#year-range").text(currentYear > startYear ? `${startYear}–${currentYear}` : `${startYear}`);

  // --- Ascolta evento userRoleChanged ---
  $(document).on('userRoleChanged', function(e, role) {
    updateFullscreenMenu(role);
  });
});
