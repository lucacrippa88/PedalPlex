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
    <div class="pedalplex-logo-fullscreen-menu"></div><br>
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

    <button id="profileBtn" class="bx--btn bx--btn--secondary" type="button" aria-label="Create New Gear" style="display: flex; align-items: center; gap: 0.5rem;">
      <svg focusable="false" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32" aria-hidden="true" class="bx--btn__icon">
        <path d="M16 4a5 5 0 11-5 5 5 5 0 015-5m0-2a7 7 0 107 7A7 7 0 0016 2zM26 30H24V25a5 5 0 00-5-5H13a5 5 0 00-5 5v5H6V25a7 7 0 017-7h6a7 7 0 017 7z"/>
      </svg>
      Your profile
    </button>

    <br><br>

    <button id="logoutBtn" class="bx--btn bx--btn--primary" type="button" aria-label="Create New Gear" style="display: flex; align-items: center; gap: 0.5rem;">
      <svg focusable="false" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32" aria-hidden="true" class="bx--btn__icon">
        <path d="M6,30H18a2.0023,2.0023,0,0,0,2-2V25H18v3H6V4H18V7h2V4a2.0023,2.0023,0,0,0-2-2H6A2.0023,2.0023,0,0,0,4,4V28A2.0023,2.0023,0,0,0,6,30Z"/>
        <path d="M20.586 20.586L24.172 17 10 17 10 15 24.172 15 20.586 11.414 22 10 28 16 22 22 20.586 20.586z"/>
      </svg>
      Logout
    </button>

    <button id="loginFullscreenBtn" class="bx--btn bx--btn--primary" type="button" aria-label="Create New Gear" style="display: flex; align-items: center; gap: 0.5rem;">
      <svg focusable="false" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32" aria-hidden="true" class="bx--btn__icon">
        <path d="M26,30H14a2,2,0,0,1-2-2V25h2v3H26V4H14V7H12V4a2,2,0,0,1,2-2H26a2,2,0,0,1,2,2V28A2,2,0,0,1,26,30Z"/>
        <path d="M14.59 20.59L18.17 17 4 17 4 15 18.17 15 14.59 11.41 16 10 22 16 16 22 14.59 20.59z"/>
      </svg>
      Login
    </button>
  </div>

  <div id="song-quote" class="menu-bottom" style="text-align: center; margin-top: auto; padding: 1rem; font-size: 1rem; color: #000;">
    <span style='font-style:italic'>Rock 'n' roll will never die!</span>
  </div>

  <div class='menu-footer' style="margin-top:4rem; text-align:center; padding:1rem; font-size:0.875rem; color:#aaa;">
    © <span id="year-range"></span> PedalPlex · 
    <a href="#">Terms</a> · <a href="#">Privacy</a> · <a href="#">Support</a>
  </div>
  
</div>
`;

// ==========================
// DOM Ready
// ==========================
$(document).ready(function () {
  // Close fullscreen menu
  $(document).on('click', '#closeMenu', function () {
    $('#fullscreenMenu').removeClass('active');
  });

  // Open menu and display random quote
  $(document).on('click', '#menuToggle', function () {
    const randomQuote = songQuotes[Math.floor(Math.random() * songQuotes.length)];
    $("#song-quote").html(`<span style='font-style:italic'>${randomQuote}</span>`);
    $('#fullscreenMenu').addClass('active');
  });

  // Safe check for currentUser
  const checkUserInterval = setInterval(() => {
    if (window.currentUser !== undefined) {
      clearInterval(checkUserInterval);

      if (window.currentUser && window.currentUser.role && window.currentUser.role !== "guest") {
        $("#loginFullscreenBtn, #guestLoginMessage").hide();
        $("#profileBtn, #logoutBtn").show();
      } else {
        $("#loginFullscreenBtn, #guestLoginMessage").show();
        $("#profileBtn, #logoutBtn").hide();
      }
    }
  }, 100);

  // Profile button
  $(document).on('click', '#profileBtn', function () {
    if (window.currentUser && window.currentUser.role !== "guest") {
      window.location.href = 'profile';
    } else {
      Swal.fire({
        icon: 'info',
        title: 'Guest mode',
        text: 'Please log in to access your profile.',
        confirmButtonText: 'OK'
      });
    }
  });

  // Logout button
  $(document).on('click', '#logoutBtn', function () {
    if (window.currentUser && window.currentUser.role !== "guest") {
      Swal.fire({
        title: 'Are you sure you want to logout?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Logout',
        cancelButtonText: 'Cancel',
        customClass: {
          confirmButton: 'bx--btn bx--btn--primary',
          cancelButton: 'bx--btn bx--btn--secondary'
        },
        buttonsStyling: false
      }).then((result) => {
        if (result.isConfirmed) {
          localStorage.removeItem('authToken');
          window.location.href = 'login';
        }
      });
    }
  });

  // Login button for guest
  $(document).on('click', '#loginFullscreenBtn', function () {
    window.location.href = 'login';
  });



  // -- dynamic year helper (robust: waits until #year-range exists) --
  function setYearRangeIfReady() {
    const startYear = 2025;
    const currentYear = new Date().getFullYear();
    const yearText = (currentYear > startYear) ? `${startYear}–${currentYear}` : `${startYear}`;
    const $yr = $("#year-range");
    if ($yr.length) {
      $yr.text(yearText);
      return true;
    }
    return false;
  }

  // Try immediately; if element not present yet, poll until it appears (then write and stop).
  if (!setYearRangeIfReady()) {
    let retries = 0;
    const maxRetries = 30; // ~3 seconds with 100ms interval
    const pollId = setInterval(() => {
      retries++;
      if (setYearRangeIfReady() || retries >= maxRetries) {
        clearInterval(pollId);
        if (retries >= maxRetries) {
          console.warn("year-range element not found after waiting; year not set.");
        }
      }
    }, 100);
  }

});
