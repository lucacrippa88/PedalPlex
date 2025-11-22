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
  "Running with the devil, no one else can see",
  "I've got the eye of the tiger, a fighter, dancing through the fire",
  "Nothing else matters to me / All my trust is in you",
  "Living on a prayer, take my hand, we'll make it I swear",
  "You shook me all night long, yeah you shook me",
  "It's a long way to the top if you wanna rock 'n' roll",
  "Don't stop me now / I'm having such a good time",
  "I see a little silhouetto of a man / Scaramouche, Scaramouche, will you do the Fandango?",
  "Mama, just killed a man / Put a gun against his head",
  "Hold on to that feeling, streetlights, people",
  "And the scars of your love remind me of us",
  "I'm on the highway to hell, no stop signs, speed limit, nobody's gonna slow me down",
  "I hear the drums echoing tonight / She hears only whispers of some quiet conversation",
  "Sweet child o' mine / She's got eyes of the bluest skies",
  "Living easy, living free / Season ticket on a one-way ride",
  "Ride the lightning, ride the storm",
  "The show must go on, inside my heart is breaking",
  "Here I stand, rock you like a hurricane",
  "Caught in the middle, life is a riddle",
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
  "I see a little silhouetto of a man / Scaramouche, Scaramouche",
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
  "I want to ride my bicycle, I want to ride it where I like",
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
  "We will, we will rock you!"
];


// ==========================
// Fullscreen menu HTML
// ==========================
window.fullscreenMenuHtml = `
<div class="fullscreen-menu" id="fullscreenMenu">
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

    <button id="logoutBtn" class="bx--btn bx--btn--primary" style="display:none;">
      Logout
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
// Inject menu and bind events
// ==========================
$(document).ready(function () {
  if (!$("#fullscreenMenu").length) $("body").append(window.fullscreenMenuHtml);

  $("#menuToggle").on("click", function() {
    const randomQuote = songQuotes[Math.floor(Math.random() * songQuotes.length)];
    $("#song-quote").html(`<span style='font-style:italic'>${randomQuote}</span>`);
    $("#fullscreenMenu").addClass("active");
  });

  $("#closeMenu").on("click", function() {
    $("#fullscreenMenu").removeClass("active");
  });

  $("#logoutBtn").on("click", function() {
    localStorage.removeItem('authToken');
    window.location.href = '/PedalPlex/';
  });

  // Dynamic year helper
  const startYear = 2025;
  const currentYear = new Date().getFullYear();
  $("#year-range").text(currentYear > startYear ? `${startYear}–${currentYear}` : `${startYear}`);
});

// ==========================
// Exposed function to show logout if logged in
// ==========================
window.showLogoutButton = function(isLoggedIn) {
  if (isLoggedIn) {
    $("#logoutBtn").show();
  } else {
    $("#logoutBtn").hide();
  }
};
