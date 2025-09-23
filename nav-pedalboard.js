// function initNavPedalboard(userRole) {
//   const isGuest = (userRole === "guest");

//   const navHtml = `
//     <header style="display: flex; align-items: center; justify-content: space-between;">
//       <div style="display: flex; align-items: center; gap: 1rem;">
//         <button class="menu-toggle" id="menuToggle" aria-label="Open menu">
//           <div class="pedalplex-logo"></div>
//         </button>
//         <div class="title">PedalPlex</div>
//         <span class="subtitle" style="font-size: 1.25rem; color: #aaa; font-weight: 600">Pedalboards</span>
//       </div>
//       <div style="display: flex; align-items: center; gap: 1rem;">
//         <span class="showDesktop" style="font-size: 0.75rem; opacity: 0.7;">Add gears</span>

//         <button id="toggleFilterBtn" class="showDesktop" aria-label="Toggle search" style="background:none; border:none; cursor:pointer; padding:4px; display:none;">
//           <svg fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
//               viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
//               <circle cx="11" cy="11" r="7"></circle>
//               <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
//           </svg>
//         </button>

//         <input 
//           type="text"
//           id="pedalFilterInput" 
//           placeholder="..." 
//           style="font-size: 0.875rem; padding: 6px 12px; border: 1px solid #8c8c8c; border-radius: 4px; outline-offset: 2px; width: 200px; display: none;" 
//           aria-label="Filter pedals"/>
        
//         <button
//           id="saveBtn"
//           class="bx--btn bx--btn--primary bx--btn--sm"
//           type="button"
//           aria-label="Save pedalboard"
//           style="display: flex; align-items: center; gap: 0.5rem;">
//           <svg focusable="false" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32" aria-hidden="true" class="bx--btn__icon">
//             <path d="M12 20.414L7.293 15.707 6 17l6 6 14-14-1.293-1.293z"/>
//           </svg>
//           Save
//         </button>

//         <button
//           id="createBtn"
//           class="showDesktop bx--btn bx--btn--secondary bx--btn--sm"
//           type="button"
//           aria-label="Create New Pedalboard"
//           style="display: flex; align-items: center; gap: 0.5rem;">
//           <svg focusable="false" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32" aria-hidden="true" class="bx--btn__icon">
//             <g transform="rotate(90 16 16)">
//               <path d="M28 24L24 24 24 20 22 20 22 24 18 24 18 26 22 26 22 30 24 30 24 26 28 26 28 24z"></path>
//               <path d="M10,28V10H22v7h2V6a2.0023,2.0023,0,0,0-2-2H10A2.002,2.002,0,0,0,8,6V28a2.0023,2.0023,0,0,0,2,2h6l0-2ZM10,6H22l0,2H10Z"></path>
//             </g>
//           </svg>
//           Create pedalboard
//         </button>
//       </div>
//     </header>
//   `;

//   $("body").prepend(navHtml);
//   $("body").append(window.fullscreenMenuHtml);

//   $("#menuToggle").on("click", function () {
//     const randomQuote = songQuotes[Math.floor(Math.random() * songQuotes.length)];
//     $("#song-quote").html(`<span style='font-style:italic'>${randomQuote}</span>`);
//     $("#fullscreenMenu").addClass("active");
//   });
//   $("#closeMenu").on("click", function() { $("#fullscreenMenu").removeClass("active"); });

//   // Filter toggle
//   $("#toggleFilterBtn").on("click", function () {
//     $("#pedalFilterInput").toggle().focus();
//   });
//   $("#pedalFilterInput").on("input", function () {
//     const filterValue = $(this).val().toLowerCase();
//     console.log("Filtering pedals by:", filterValue);
//   });

//   // Function to show filter only if there is at least one pedalboard
//   function toggleFilterVisibility() {
//     if (window.allPedalboards && window.allPedalboards.length > 0) {
//       $("#toggleFilterBtn").show();
//     } else {
//       $("#toggleFilterBtn").hide();
//       $("#pedalFilterInput").hide();
//     }
//   }

//   toggleFilterVisibility(); // Initial check
//   // Call toggleFilterVisibility() whenever pedalboards change:
//   window.updateNavFilterVisibility = toggleFilterVisibility;

//   if (isGuest) {
//     $("#createBtn").hide(); // Guest can't create on server

//     // Offline save button
//     $("#saveBtn").html(`
//       <svg focusable='false' preserveAspectRatio='xMidYMid meet'
//            xmlns='http://www.w3.org/2000/svg' fill='currentColor'
//            width='16' height='16' viewBox='0 0 32 32' aria-hidden='true' class='bx--btn__icon'>
//         <path d='M24.8008 12.1362a8.8694 8.8694 0 00-.9795-2.5434L30 3.4142 28.5872 2 2 28.5872 3.4142 30l5-5H23.5a6.4974 6.4974 0 001.3008-12.8638zM23.5 23H10.4141L22.3418 11.0723a6.9049 6.9049 0 01.6006 2.0708l.0986.812.8154.0639A4.4975 4.4975 0 0123.5 23zM4.2964 23.4487l1.4313-1.4311A4.4774 4.4774 0 018.144 14.019l.8155-.0639.0991-.812a6.9867 6.9867 0 0110.63-5.0865l1.4431-1.4428A8.9859 8.9859 0 007.2 12.1362 6.4891 6.4891 0 004.2964 23.4487z'/>
//       </svg> Offline Save
//     `);

//     $("#saveBtn").on("click", function() {
//       if (typeof saveGuestPedalboard === "function") saveGuestPedalboard();
//       if (window.allPedalboards.length === 1) setupPedalboardDropdownAndRender();
//     });

//     // Add login button and position filter input before it
//     const loginBtnHtml = `<button id="loginBtn" class="bx--btn bx--btn--primary bx--btn--sm" 
//                            style="display: flex; align-items: center; gap: 0.5rem;">Login</button>`;
//     $("#toggleFilterBtn").after(loginBtnHtml);
//     $("#loginBtn").before($("#pedalFilterInput"));

//     $("#loginBtn").on("click", () => window.location.href = "/PedalPlex/");
//   } else {
//     // Logged-in users
//     $("#saveBtn").on("click", function() {
//       if (typeof savePedalboard === "function") savePedalboard();
//     });
//     $("#createBtn").on("click", function() {
//       if (typeof createNewPedalboard === "function") createNewPedalboard();
//     });
//   }
// }

function initNavPedalboard(userRole) {
  const isGuest = (userRole === "guest");

  const navHtml = `
    <header style="display: flex; align-items: center; justify-content: space-between;">
      <div style="display: flex; align-items: center; gap: 1rem;">
        <button class="menu-toggle" id="menuToggle" aria-label="Open menu">
          <div class="pedalplex-logo"></div>
        </button>
        <div class="title">PedalPlex</div>
        <span class="subtitle" style="font-size: 1.25rem; color: #aaa; font-weight: 600">Pedalboards</span>
      </div>
      <div style="display: flex; align-items: center; gap: 1rem;">
        <span class="showDesktop" style="font-size: 0.75rem; opacity: 0.7;">Add gears</span>

        <!-- Hide by default -->
        <button id="toggleFilterBtn" class="showDesktop" aria-label="Toggle search" 
                style="background:none; border:none; cursor:pointer; padding:4px; display:none;">
          <svg fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
              viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
              <circle cx="11" cy="11" r="7"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </button>

        <input type="text"
               id="pedalFilterInput"
               placeholder="..."
               style="font-size: 0.875rem; padding: 6px 12px; border: 1px solid #8c8c8c; border-radius: 4px; outline-offset: 2px; width: 200px; display:none;" 
               aria-label="Filter pedals"/>

        <button id="saveBtn" class="bx--btn bx--btn--primary bx--btn--sm" type="button" aria-label="Save pedalboard"
                style="display: flex; align-items: center; gap: 0.5rem;">
          <svg focusable="false" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32" aria-hidden="true" class="bx--btn__icon">
            <path d="M12 20.414L7.293 15.707 6 17l6 6 14-14-1.293-1.293z"/>
          </svg>
          Save
        </button>

        <button id="createBtn" class="showDesktop bx--btn bx--btn--secondary bx--btn--sm" type="button" aria-label="Create New Pedalboard"
                style="display: flex; align-items: center; gap: 0.5rem;">
          <svg focusable="false" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32" aria-hidden="true" class="bx--btn__icon">
            <g transform="rotate(90 16 16)">
              <path d="M28 24L24 24 24 20 22 20 22 24 18 24 18 26 22 26 22 30 24 30 24 26 28 26 28 24z"></path>
              <path d="M10,28V10H22v7h2V6a2.0023,2.0023,0,0,0-2-2H10A2.002,2.002,0,0,0,8,6V28a2.0023,2.0023,0,0,0,2,2h6l0-2ZM10,6H22l0,2H10Z"></path>
            </g>
          </svg>
          Create pedalboard
        </button>
      </div>
    </header>
  `;

  $("body").prepend(navHtml);
  $("body").append(window.fullscreenMenuHtml);

  $("#menuToggle").on("click", function () {
    const randomQuote = songQuotes[Math.floor(Math.random() * songQuotes.length)];
    $("#song-quote").html(`<span style='font-style:italic'>${randomQuote}</span>`);
    $("#fullscreenMenu").addClass("active");
  });
  $("#closeMenu").on("click", function() { $("#fullscreenMenu").removeClass("active"); });

  $("#toggleFilterBtn").on("click", function () {
    $("#pedalFilterInput").toggle().focus();
  });
  $("#pedalFilterInput").on("input", function () {
    const filterValue = $(this).val().toLowerCase();
    console.log("Filtering pedals by:", filterValue);
  });

  // --- SHOW FILTER ONLY IF THERE'S AT LEAST ONE PEDALBOARD ---
  function updateFilterVisibility() {
    const hasBoards = Array.isArray(window.allPedalboards) && window.allPedalboards.length > 0;
    if (hasBoards) {
      $("#toggleFilterBtn").show();
    } else {
      $("#toggleFilterBtn").hide();
      $("#pedalFilterInput").hide();
    }
  }

  // Initial visibility check
  updateFilterVisibility();
  // Expose function so you can call it after creating/deleting boards
  window.updateNavFilterVisibility = updateFilterVisibility;

  if (isGuest) {
    $("#createBtn").hide();

    $("#saveBtn").html(`
      <svg focusable='false' preserveAspectRatio='xMidYMid meet'
           xmlns='http://www.w3.org/2000/svg' fill='currentColor'
           width='16' height='16' viewBox='0 0 32 32' aria-hidden='true' class='bx--btn__icon'>
        <path d='M24.8008 12.1362a8.8694 8.8694 0 00-.9795-2.5434L30 3.4142 28.5872 2 2 28.5872 3.4142 30l5-5H23.5a6.4974 6.4974 0 001.3008-12.8638zM23.5 23H10.4141L22.3418 11.0723a6.9049 6.9049 0 01.6006 2.0708l.0986.812.8154.0639A4.4975 4.4975 0 0123.5 23zM4.2964 23.4487l1.4313-1.4311A4.4774 4.4774 0 018.144 14.019l.8155-.0639.0991-.812a6.9867 6.9867 0 0110.63-5.0865l1.4431-1.4428A8.9859 8.9859 0 007.2 12.1362 6.4891 6.4891 0 004.2964 23.4487z'/>
      </svg> Offline Save
    `);

    $("#saveBtn").on("click", function() {
      if (typeof saveGuestPedalboard === "function") saveGuestPedalboard();
      if (window.allPedalboards.length === 1) setupPedalboardDropdownAndRender();
      updateFilterVisibility();
    });

    const loginBtnHtml = `<button id="loginBtn" class="bx--btn bx--btn--primary bx--btn--sm" type="button" aria-label="Create New Gear" style="display: flex; align-items: center; gap: 0.5rem;">
          <svg focusable="false" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32" aria-hidden="true" class="bx--btn__icon">
            <path d="M26,30H14a2,2,0,0,1-2-2V25h2v3H26V4H14V7H12V4a2,2,0,0,1,2-2H26a2,2,0,0,1,2,2V28A2,2,0,0,1,26,30Z"/>
            <path d="M14.59 20.59L18.17 17 4 17 4 15 18.17 15 14.59 11.41 16 10 22 16 16 22 14.59 20.59z"/>
          </svg>
          Login
        </button>`;
    $("#toggleFilterBtn").after(loginBtnHtml);
    $("#loginBtn").before($("#pedalFilterInput"));
    $("#loginBtn").on("click", () => window.location.href = "/PedalPlex/");
  } else {
    $("#saveBtn").on("click", function() { if (typeof savePedalboard === "function") savePedalboard(); });
    $("#createBtn").on("click", function() { if (typeof createNewPedalboard === "function") createNewPedalboard(); });
  }
}
