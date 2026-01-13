// ==========================
// Song quotes array
// ==========================
const songQuotes = [
  "Rock 'n' roll will never die!",
  "We are the champions, my friend!",
  "We're not gonna take it!",
  "I wanna rock and roll all night / And party every day!",
  "I was born with a plastic spoon in my mouth!",
  "Take it easy!",
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
  "If you wake up and don’t want to smile / If it takes just a little while…",
  "Here I go again on my own / Goin' down the only road I've ever known",
  "I've been caught in a landslide, no escape from reality",
  "So many times it happens too fast / You change your passion for glory",
  "Living easy, living free / Season ticket on a one-way ride",
  "Riding on the back of a hurricane / Face the storm, never hide",
  "Sleep with one eye open / Gripping your pillow tight",
  "Shivers run down my spine / But I’ll keep moving on",
  "In the jungle, the mighty jungle / The lion sleeps tonight",
  "Nothing else matters / Never cared for what they do",
  "I see a red door and I want it painted black",
  "There's a lady who's sure all that glitters is gold",
  "Highway to hell, no stop signs, speed limit, nobody's gonna slow me down",
  "I've paid my dues, time after time / I've done my sentence, but committed no crime",
  "Caught in a trap, I can't walk out",
  "All the small things / True care, truth brings",
  "Running with the devil / no one else can see",
  "I've got the eye of the tiger / a fighter, dancing through the fire",
  "Nothing else matters to me / All my trust is in you",
  "Living on a prayer / take my hand / we'll make it I swear",
  "You shook me all night long, yeah you shook me",
  "It's a long way to the top if you wanna rock 'n' roll",
  "Don't stop me now / I'm having such a good time",
  "I see a little silhouetto of a man / Scaramouche, Scaramouche, will you do the Fandango?",
  "Mama, just killed a man / Put a gun against his head",
  "Hold on to that feeling, streetlights, people",
  "And the scars of your love remind me of us",
  "I'm on the highway to hell / no stop signs, speed limit / nobody's gonna slow me down",
  "I hear the drums echoing tonight / She hears only whispers of some quiet conversation",
  "Sweet child o' mine / She's got eyes of the bluest skies",
  "Living easy, living free / Season ticket on a one-way ride",
  "Ride the lightning, ride the storm",
  "The show must go on, inside my heart is breaking",
  "Here I stand, rock you like a hurricane",
  "Caught in the middle / life is a riddle",
  "Dream on, dream until your dreams come true",
  "Carry on my wayward son / There'll be peace when you are done",
  "I want to break free / I've got to break free",
  "Shout it out loud / We're a rock 'n' roll band",
  "Thunderbolt and lightning, very very frightening me",
  "Pour some sugar on me, ooh, in the name of love",
  "I walk this empty street / On the Boulevard of Broken Dreams",
  "Another one bites the dust",
  "Sweet emotion / The way you move me",
  "Fear of the dark, fear of the dark, I have a constant fear that something's always near",
  "We will, we will rock you!",
  "Living after midnight / Rocking to the dawn",
  "Don't stop thinking about tomorrow",
  "I'm still standing, yeah yeah yeah",
  "Every breath you take, every move you make / I'll be watching you",
  "Somewhere I belong, somewhere I belong",
  "Nothing else matters, never cared for what they do",
  "In the end, it doesn't even matter",
  "Breaking the law, breaking the law",
  "Pain, pain, pain, painkiller",
  "Seek and destroy",
  "I want to ride my bicycle / I want to ride it where I like",
  "Crazy, but that's how it goes / Millions of people living as foes",
  "Living in the material world",
  "I believe in a thing called love / Just listen to the rhythm of my heart",
  "All along the watchtower, princes kept the view",
  "The sky is crying, can't you see the tears of heaven?",
  "Nothing else matters to me / Never cared for what they do",
  "I'm on top of the world, hey",
  "With the lights out, it's less dangerous",
  "I see a red door and I want it painted black",
  "Ride the lightning, ride the storm",
  "I am the highway, I am the night",
  "We will, we will rock you!",
  "Fat bottomed girls / you make the rockin' world go round!"
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
    <a href='' class="pedalplex-logo-fullscreen-menu"></a><br>
    <a href="plexes">Edit your Plexes</a>
    <a href="rigs">Manage Rigs</a>
    <a href="gears">View Gears catalog</a>
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
        <path d="M26,30H14a2,2,0,0,1-2-2V25h2v3H26V4H14V7H12V4a2,2,0,0,1,2-2H26a2,2,0,0,1,2 2V28A2,2,0,0,1,26,30Z"/>
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
    <a href="terms">Terms</a> · <a href="privacy">Privacy</a> · <a href="https://github.com/lucacrippa88" target="_blank">Support</a> · Developed in Italy <span style="display: inline-block; width: 20px; height: 4px; background: linear-gradient(to right, #008C45 33.33%, #F4F5F0 33.33% 66.66%, #CD212A 66.66%); vertical-align: middle"></span>
  </div>
</div>
`;

// ==========================
// Helper: update fullscreen menu buttons
// ==========================
function updateFullscreenMenu() {
  if (!window.currentUser || window.currentUser.role === "guest") {
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

  // Wait for currentUser to be set, then update menu
  const checkUserInterval = setInterval(() => {
    if (window.currentUser !== undefined) {
      clearInterval(checkUserInterval);
      updateFullscreenMenu();
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
          window.currentUser = { role: 'guest', username: 'guest' }; // reset state
          updateFullscreenMenu(); // immediately update buttons
          window.location.href = 'https://pedalplex.com';
        }
      });
    }
  });

  // Login button for guest
  $(document).on('click', '#loginFullscreenBtn', function () {
    window.location.href = 'login';
  });

  // -- dynamic year helper --
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

  if (!setYearRangeIfReady()) {
    let retries = 0;
    const maxRetries = 30;
    const pollId = setInterval(() => {
      retries++;
      if (setYearRangeIfReady() || retries >= maxRetries) clearInterval(pollId);
    }, 100);
  }
});
