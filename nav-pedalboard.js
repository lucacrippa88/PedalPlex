// function initNavPedalboard() {
//   const navHtml = `
//     <header style="display: flex; align-items: center; justify-content: space-between;">
//       <!-- Left: menu toggle + title -->
//       <div style="display: flex; align-items: center; gap: 1rem;">
//         <button class="menu-toggle" id="menuToggle" aria-label="Open menu">
//           <div class="pedalplex-logo"></div>
//         </button>

//         <div class="title">PedalPlex</div><span class="subtitle" style="font-size: 1.25rem; color: #aaa; font-weight: 600">Pedalboards</span>
//       </div>

//       <!-- Right: search toggle, input, create button -->
//       <div style="display: flex; align-items: center; gap: 1rem;">

//         <span class="showDesktop" style="font-size: 0.75rem; opacity: 0.7;">Add gears</span>

//         <button id="toggleFilterBtn" class="showDesktop" aria-label="Toggle search" style="background:none; border:none; cursor:pointer; padding:4px;">
//             <svg fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
//                 viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
//                 <circle cx="11" cy="11" r="7"></circle>
//                 <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
//             </svg>
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
//           <svg
//             focusable="false"
//             preserveAspectRatio="xMidYMid meet"
//             xmlns="http://www.w3.org/2000/svg"
//             fill="currentColor"
//             width="16"
//             height="16"
//             viewBox="0 0 32 32"
//             aria-hidden="true"
//             class="bx--btn__icon">
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
//           <svg
//             focusable="false"
//             preserveAspectRatio="xMidYMid meet"
//             xmlns="http://www.w3.org/2000/svg"
//             fill="currentColor"
//             width="16"
//             height="16"
//             viewBox="0 0 32 32"
//             aria-hidden="true"
//             class="bx--btn__icon">
//             <g transform="rotate(90 16 16)">
//             <path d="M28 24L24 24 24 20 22 20 22 24 18 24 18 26 22 26 22 30 24 30 24 26 28 26 28 24z"></path><path d="M10,28V10H22v7h2V6a2.0023,2.0023,0,0,0-2-2H10A2.002,2.002,0,0,0,8,6V28a2.0023,2.0023,0,0,0,2,2h6l0-2ZM10,6H22l0,2H10Z"></path>
//             </g>
//           </svg>
//           Create pedalboard
//         </button>

//       </div>

//     </header>  
//   `;

//   // Prepend the navigation HTML to the body
//   $("body").prepend(navHtml);

//   // Add fullscreen menu HTML from external file
//   $("body").append(window.fullscreenMenuHtml);

//   // Fullscreen menu toggle with quote
//   $("#menuToggle").on("click", function () {
//     const randomQuote = songQuotes[Math.floor(Math.random() * songQuotes.length)];
//     $("#song-quote").html(`<span style='font-style:italic'>${randomQuote}</span>`);
//     $("#fullscreenMenu").addClass("active");
//   });

//   $("#closeMenu").on("click", function() {
//     $("#fullscreenMenu").removeClass("active");
//   });

//   // Toggle filter input visibility
//   $("#toggleFilterBtn").on("click", function () {
//     const input = $("#pedalFilterInput");
//     if (input.is(":visible")) {
//       input.hide().val("");
//     } else {
//       input.show().focus();
//     }
//   });

//   $("#pedalFilterInput").on("input", function () {
//     const filterValue = $(this).val().toLowerCase();
//     console.log("Filtering pedals by:", filterValue);
//     // Add your filtering logic here
//   });

//   $("#saveBtn").on("click", function() {
//     if (typeof savePedalboard === "function") {
//       savePedalboard();
//     } else {
//       console.warn("savePedalboard() function not found");
//     }
//   });

// }


// nav-pedalboard.js

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

        <button id="toggleFilterBtn" class="showDesktop" aria-label="Toggle search" style="background:none; border:none; cursor:pointer; padding:4px;">
          <svg fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
              viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
              <circle cx="11" cy="11" r="7"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </button>

        <input 
          type="text"
          id="pedalFilterInput" 
          placeholder="..." 
          style="font-size: 0.875rem; padding: 6px 12px; border: 1px solid #8c8c8c; border-radius: 4px; outline-offset: 2px; width: 200px; display: none;" 
          aria-label="Filter pedals"/>
        
        <button
          id="saveBtn"
          class="bx--btn bx--btn--primary bx--btn--sm"
          type="button"
          aria-label="Save pedalboard"
          style="display: flex; align-items: center; gap: 0.5rem;">
          <svg focusable="false" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32" aria-hidden="true" class="bx--btn__icon">
            <path d="M12 20.414L7.293 15.707 6 17l6 6 14-14-1.293-1.293z"/>
          </svg>
          Save
        </button>

        <button
          id="createBtn"
          class="showDesktop bx--btn bx--btn--secondary bx--btn--sm"
          type="button"
          aria-label="Create New Pedalboard"
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

  if (isGuest) {
    // Hide create button for guests
    $("#createBtn").hide();

    // Save button stores pedalboard in localStorage
    $("#saveBtn").text("Temporary Save");
    $("#saveBtn").on("click", function() {
      if (typeof getCurrentPedalboard === "function") {
        const boardData = getCurrentPedalboard(); // should return a JSON-serializable object
        localStorage.setItem("guestPedalboard", JSON.stringify(boardData));
        Swal.fire({
          icon: 'success',
          title: 'Saved temporarily',
          text: 'Your pedalboard has been saved locally in this browser.',
          confirmButtonText: 'OK',
          customClass: { confirmButton: 'bx--btn bx--btn--primary' }
        });
      } else {
        console.warn("getCurrentPedalboard() not found");
      }
    });

    // Add Login button
    const loginBtnHtml = `<button id="loginBtn" class="bx--btn bx--btn--primary bx--btn--sm" style="display: flex; align-items: center; gap: 0.5rem;">Login</button>`;
    $("#toggleFilterBtn").after(loginBtnHtml);
    $("#loginBtn").on("click", () => window.location.href = "/PedalPlex/");

  } else {
    // Logged-in users: normal save to DB
    $("#saveBtn").on("click", function() {
      if (typeof savePedalboard === "function") savePedalboard();
      else console.warn("savePedalboard() not found");
    });

    $("#createBtn").on("click", function() {
      if (typeof createNewPedalboard === "function") createNewPedalboard();
      else console.warn("createNewPedalboard() not found");
    });
  }
}
