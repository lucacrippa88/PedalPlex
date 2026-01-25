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
  $("body").append(window.fullscreenMenuHtml);

  // Wait until currentUser is known
  // const checkUserInterval = setInterval(() => {
  //   if (window.currentUser !== undefined) {
  //     clearInterval(checkUserInterval);

  //     if (!window.currentUser || window.currentUser.role === "guest") {
  //       $("#navRight").html(`
  //         <button id="loginBtn" class="bx--btn bx--btn--primary bx--btn--sm" type="button" aria-label="Login/Register" 
  //           style="display: flex; align-items: center; gap: 0.5rem;">
  //           <svg focusable="false" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32" aria-hidden="true" class="bx--btn__icon">
  //             <path d="M26,30H14a2,2,0,0,1-2-2V25h2v3H26V4H14V7H12V4a2,2,0,0,1,2-2H26a2,2,0,0,1,2,2V28A2,2,0,0,1,26,30Z"/>
  //             <path d="M14.59 20.59L18.17 17 4 17 4 15 18.17 15 14.59 11.41 16 10 22 16 16 22 14.59 20.59z"/>
  //           </svg>
  //           Login/Register
  //         </button>
  //       `);
  //     } else {
  //       $("#navRight").empty(); // logged in → no login button
  //     }
  //   }
  // }, 100);

  // Fullscreen menu toggle with quote
  $(document).on("click", "#menuToggle", function () {
    const randomQuote = songQuotes[Math.floor(Math.random() * songQuotes.length)];
    $("#song-quote").html(`<span style='font-style:italic'>${randomQuote}</span>`);
    $("#fullscreenMenu").addClass("active");
  });

  $(document).on("click", "#closeMenu", () => {
    $("#fullscreenMenu").removeClass("active");
  });

  // Login button action
  // $(document).on("click", "#loginBtn", function () {
  //   window.location.href = "login"; // redirect to login page
  // });
});
