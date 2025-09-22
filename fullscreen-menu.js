// // Define fullscreen menu HTML template
// window.fullscreenMenuHtml = `
// <div class="fullscreen-menu" id="fullscreenMenu"><br>
//   <div class="fullscreen-header" style="display: flex; justify-content: space-between; align-items: center;">
//     <button class="close-btn" id="closeMenu" aria-label="Close menu" style="background: none; border: none; cursor: pointer;">
//       <svg class="close-icon" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
//         <path d="M24 9.41L22.59 8 16 14.59 9.41 8 8 9.41 14.59 16 
//                  8 22.59 9.41 24 16 17.41 22.59 24 24 22.59 
//                  17.41 16 24 9.41z"/>
//       </svg>
//     </button>
//   </div>

//   <div class="fullscreen-nav">
//     <div class="pedalplex-logo-fullscreen-menu"></div><br>
//     <a href="preset">Edit your presets</a>
//     <a href="pedalboard">Manage pedalboards</a>
//     <a href="catalog">View gears catalog</a>
//     <br><br>
//     <span class="showMobile" style="color:#161616">Visit desktop website<br>to access all editing features</span></br></br>
//     <button id="profileBtn" class="bx--btn bx--btn--secondary"
//       style="display: flex; align-items: center; gap: 0.5rem;">
//       <svg focusable="false" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 32 32" width="16" height="16">
//         <path d="M16 16a7 7 0 1 0-7-7 7 7 0 0 0 7 7zm0 2c-4.42 0-13 2.21-13 6.61V28h26v-3.39C29 20.21 20.42 18 16 18z"/>
//       </svg>
//       Your profile
//     </button>
//     <br><br>
//     <button id="logoutBtn" class="bx--btn bx--btn--primary"
//       style="display: flex; align-items: center; gap: 0.5rem;">
//       Logout
//       <svg focusable="false" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 32 32" width="16" height="16">
//         <path d="M20 23v-2h-8V11h8V9h-8a2.0023 2.0023 0 0 0-2 2v10a2.0023 2.0023 0 0 0 2 2Zm7-7-5-5v3H12v4h10v3Z"/>
//       </svg>
//     </button>
//   </div>

//   <div id="song-quote" class="menu-bottom" style="text-align: center; margin-top: auto; padding: 1rem; font-size: 1rem; color: #000;">
//     <span style='font-style:italic'>Rock 'n' roll will never die!</span>
//   </div>

//   <div class="menu-footer" style="text-align: center; margin-top: auto; padding: 1rem; font-size: 0.75rem; color: #aaa;">
//     Made with love by <a href='https://github.com/lucacrippa88' target='_blank'>@luca.crippa88</a><br><br>© 2025 PedalPlex. All rights reserved.
//   </div>
// </div>
// `;

// // Song quotes array
// const songQuotes = [
//   "Rock 'n' roll will never die!",
//   "We are the champions, my friend!",
//   "We're not gonna take it!",
//   "I wanna rock and roll all night and party every day!",
//   "I was born with a plastic spoon in my mouth!",
//   "Take it Easy!",
//   "I'd trade all my tomorrows for a single yesterday!",
//   "We learned more from a three-minute record than we ever learned in school!",
//   "You may say I'm a dreamer, but I'm not the only one!",
//   "The answer, my friend, is blowing in the wind!",
//   "Mama, I'm coming home...",
//   "Back in business again!",
//   "Won't you fly high, free bird, yeah!",
//   "So if you want to love me, then darlin' don't refrain...",
//   "And if you listen very hard, the tune will come to you at last!"
// ];

// // DOM ready
// $(document).ready(function () {
//   // Close fullscreen menu
//   $(document).on('click', '#closeMenu', function () {
//     $('#fullscreenMenu').removeClass('active');
//   });

//   // Profile button
//   $(document).on('click', '#profileBtn', function () {
//     window.location.href = 'profile';
//   });

//   // Logout
//   $(document).on('click', '#logoutBtn', function () {
//     Swal.fire({
//       title: 'Are you sure you want to logout?',
//       icon: 'warning',
//       showCancelButton: true,
//       confirmButtonText: 'Logout',
//       cancelButtonText: 'Cancel',
//       customClass: {
//         confirmButton: 'bx--btn bx--btn--primary',
//         cancelButton: 'bx--btn bx--btn--secondary'
//       },
//       buttonsStyling: false
//     }).then((result) => {
//       if (result.isConfirmed) {
//         localStorage.removeItem('authToken');

//         Swal.fire({
//           title: 'Logged out',
//           text: 'Redirecting to login page...',
//           icon: 'success',
//           timer: 1000,
//           showConfirmButton: false,
//           allowOutsideClick: false,
//           allowEscapeKey: false,
//           customClass: {
//             popup: 'swal2-carbon-popup'
//           }
//         });

//         setTimeout(() => {
//           window.location.href = '/PedalPlex/';
//         }, 1000);
//       }
//     });
//   });


// });



// ==========================
// Song quotes array
// ==========================
const songQuotes = [
  "Rock 'n' roll will never die!",
  "We are the champions, my friend!",
  "We're not gonna take it!",
  "I wanna rock and roll all night and party every day!",
  "I was born with a plastic spoon in my mouth!",
  "Take it Easy!",
  "I'd trade all my tomorrows for a single yesterday!",
  "We learned more from a three-minute record than we ever learned in school!",
  "You may say I'm a dreamer, but I'm not the only one!",
  "Mama, I'm coming home...",
  "Back in business again!",
  "Won't you fly high, free bird, yeah!",
  "So if you want to love me, then darlin' don't refrain...",
  "And if you listen very hard, the tune will come to you at last!"
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

    <button id="profileBtn" class="bx--btn bx--btn--secondary"
      style="display: none; align-items: center; gap: 0.5rem;">
      <svg focusable="false" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 32 32" width="16" height="16">
        <path d="M16 16a7 7 0 1 0-7-7 7 7 0 0 0 7 7zm0 2c-4.42 0-13 2.21-13 6.61V28h26v-3.39C29 20.21 20.42 18 16 18z"/>
      </svg>
      Your profile
    </button>
    <br><br>
    <button id="logoutBtn" class="bx--btn bx--btn--primary"
      style="display: none; align-items: center; gap: 0.5rem;">
      Logout
      <svg focusable="false" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 32 32" width="16" height="16">
        <path d="M20 23v-2h-8V11h8V9h-8a2.0023 2.0023 0 0 0-2 2v10a2.0023 2.0023 0 0 0 2 2Zm7-7-5-5v3H12v4h10v3Z"/>
      </svg>
    </button>

    <button id="loginFullscreenBtn" class="bx--btn bx--btn--primary"
      style="display: none; align-items: center; gap: 0.5rem;">
      Login
    </button>
  </div>

  <div id="song-quote" class="menu-bottom" style="text-align: center; margin-top: auto; padding: 1rem; font-size: 1rem; color: #000;">
    <span style='font-style:italic'>Rock 'n' roll will never die!</span>
  </div>

  <div class="menu-footer" style="text-align: center; margin-top: auto; padding: 1rem; font-size: 0.75rem; color: #aaa;">
    Made with love by <a href='https://github.com/lucacrippa88' target='_blank'>@luca.crippa88</a><br><br>© 2025 PedalPlex. All rights reserved.
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

  // Poll for window.currentUser every 100ms until defined
  const checkUserInterval = setInterval(() => {
    if (window.currentUser !== undefined) {
      clearInterval(checkUserInterval);

      if (window.currentUser.role && window.currentUser.role !== "guest") {
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
    window.location.href = 'profile';
  });

  // Logout button
  $(document).on('click', '#logoutBtn', function () {
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
        window.location.href = '/PedalPlex/';
      }
    });
  });

  // Login button for guest
  $(document).on('click', '#loginFullscreenBtn', function () {
    window.location.href = '/PedalPlex/';
  });
});
