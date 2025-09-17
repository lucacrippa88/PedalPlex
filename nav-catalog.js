// // nav-catalog.js

// // Initialize navigation catalog
// function initNavCatalog(userRole) {
//   const isAdmin = (userRole === "admin");
//   const subtitleText = `Gears Catalog${isAdmin ? " Manager" : ""}`;

//   // Nav HTML
//   const navHtml = `
//     <header style="display: flex; align-items: center; justify-content: space-between;">
//       <div style="display: flex; align-items: center; gap: 1rem;">
//         <button class="menu-toggle" id="menuToggle" aria-label="Open menu">
//           <div class="pedalplex-logo"></div>
//         </button>

//         <div class="title">PedalPlex</div>
//         <span class="subtitle" style="font-size: 1.25rem; color: #aaa; font-weight: 600">${subtitleText}</span>
//       </div>

//       <div style="display: flex; align-items: center; gap: 1rem;">
//         <span id="pedalCount" style="font-size: 0.75rem; color:#aaa"></span>

//         <button id="toggleFilterBtn" aria-label="Toggle search" style="background:none; border:none; cursor:pointer; padding:4px;">
//           <svg fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
//               viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
//               <circle cx="11" cy="11" r="7"></circle>
//               <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
//           </svg>
//         </button>

//         <input 
//           type="text" 
//           id="pedalFilterInput" 
//           placeholder="Filter gears..." 
//           style="font-size: 0.875rem; padding: 6px 12px; border: 1px solid #8c8c8c; border-radius: 4px; outline-offset: 2px; width: 120px; display: none;" 
//           aria-label="Filter pedals"/>

//         ${isAdmin ? `
//           <button id="createPedalBtn" class="bx--btn bx--btn--primary bx--btn--sm" type="button" aria-label="Create New Gear" style="display: flex; align-items: center; gap: 0.5rem;">
//             <svg focusable="false" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32" aria-hidden="true" class="bx--btn__icon">
//               <path d="M16 4v24M4 16h24" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
//             </svg>
//             Add gear
//           </button>` : ''}

//         ${!isAdmin ? `
//           <button id="createOwnPedalBtn" class="bx--btn bx--btn--primary bx--btn--sm" type="button" aria-label="Add Your Own Gear" style="display: flex; align-items: center; gap: 0.5rem;">
//             <svg focusable="false" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32" aria-hidden="true" class="bx--btn__icon">
//               <path d="M16 4v24M4 16h24" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
//             </svg>
//             Add Your Own Gear
//           </button>` : ''}
//       </div>
//     </header>
//   `;

//   $("body").prepend(navHtml);

//   // Allow all users to create pedals
//   function isTokenValid() {
//     const token = localStorage.getItem("authToken");
//     if (!token) return false;

//     try {
//       const base64Url = token.split('.')[1];
//       const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/'); // handle URL-safe JWTs
//       const payload = JSON.parse(atob(base64));

//       console.log("Decoded JWT payload:", payload); // 👈 for debugging

//       const now = Math.floor(Date.now() / 1000);
//       return payload.exp && payload.exp > now;
//     } catch (err) {
//       console.error("Invalid JWT:", err);
//       return false;
//     }
//   }


//   function handleCreatePedalClick() {
//     if (!isTokenValid()) {
//       Swal.fire({
//         icon: 'warning',
//         title: 'Login Required',
//         text: 'Please log in to create a pedal.',
//         confirmButtonText: 'Login',
//         customClass: {
//           confirmButton: 'bx--btn bx--btn--primary'
//         }
//       }).then(() => {
//         window.location.href = "/PedalPlex/";
//       });
//       return;
//     }

//     // Valid token: proceed
//     createNewPedal();
//   }

//   $(document).on('click', '#createPedalBtn', handleCreatePedalClick);
//   $(document).on('click', '#createOwnPedalBtn', handleCreatePedalClick);



//   // Add fullscreen menu HTML from external file
//   $("body").append(window.fullscreenMenuHtml);

//   // Fullscreen menu toggle with random quote
//   $("#menuToggle").on("click", function () {
//     const randomQuote = songQuotes[Math.floor(Math.random() * songQuotes.length)];
//     $("#song-quote").html(`<span style='font-style:italic'>${randomQuote}</span>`);
//     $("#fullscreenMenu").addClass("active");
//   });

//   $("#closeMenu").on("click", function () {
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

//   // Filter pedals dynamically
//   $("#pedalFilterInput").on("input", function () {
//     const filterValue = $(this).val().toLowerCase();

//     $(".pedal-catalog").each(function () {
//       const $pedal = $(this);
//       const name = $pedal.data("pedal-id")?.toLowerCase() || "";
//       $pedal.toggle(name.includes(filterValue));
//     });

//     // Update counts after filtering
//     updatePedalCounts();
//   });
// }



// // Updates pedal counts including draft/private/reviewing/public-by-me
// function updatePedalCounts(activeFilter = null) {
//   const visiblePedals = $(".pedal-catalog:visible");
//   const allPedals = $(".pedal-catalog");
//   const totalVisible = visiblePedals.length;
//   const totalAbsolute = allPedals.length;

//   const statusCounts = { draft: 0, private: 0, reviewing: 0, publicByMe: 0 };
//   let userPedalsCount = 0;

//   const currentUsername = (window.currentUser?.username || "").toLowerCase();

//   allPedals.each(function() {
//     const status = ($(this).data("published") || "").toLowerCase();
//     const author = ($(this).data("author") || "").toLowerCase();

//     if (status in statusCounts) statusCounts[status]++;
//     if (status === "public" && author === currentUsername) {
//       statusCounts.publicByMe++;
//     }

//     // Count pedals created by non-admin users (author literal not "admin")
//     if (author && author !== "admin") {
//       userPedalsCount++;
//     }
//   });

//   // Badge for reviewing
//   const reviewingBadge = statusCounts.reviewing > 0
//     ? `<span class="status-filter ${activeFilter === "reviewing" ? "active-filter" : ""}" data-filter="reviewing" style="
//         background:#ff0000;
//         color:white;
//         border-radius:50%;
//         padding:1px 5px;
//         font-size:0.75rem;
//         font-weight:bold;
//         min-width:18px;
//         text-align:center;
//       ">${statusCounts.reviewing}</span>`
//     : `<span class="status-filter ${activeFilter === "reviewing" ? "active-filter" : ""}" data-filter="reviewing">0</span>`;

//   // Build counters
//   let countsHtml =
//     `${totalVisible} gear${totalVisible === 1 ? "" : "s"} available ` +
//     `(All: <span class="status-filter ${activeFilter === "all" ? "active-filter" : ""}" data-filter="all">${totalAbsolute}</span>, 
//      Draft: <span class="status-filter ${activeFilter === "draft" ? "active-filter" : ""}" data-filter="draft">${statusCounts.draft}</span>, 
//      Private: <span class="status-filter ${activeFilter === "private" ? "active-filter" : ""}" data-filter="private">${statusCounts.private}</span>, 
//      Reviewing: ${reviewingBadge}, 
//      Published by me: <span class="status-filter ${activeFilter === "publicByMe" ? "active-filter" : ""}" data-filter="publicByMe">${statusCounts.publicByMe}</span>`;

//   // Add user pedal counter only for admins (inside parentheses), and make it clickable/filterable
//   if (window.currentUser?.role === "admin") {
//     countsHtml += `, Published by Users: <span class="status-filter ${activeFilter === "user" ? "active-filter" : ""}" data-filter="user">${userPedalsCount}</span>`;
//   }

//   countsHtml += `)`;

//   $("#pedalCount").html(countsHtml);

//   // Attach click handler
//   $(".status-filter").off("click").on("click", function() {
//     const filter = $(this).data("filter");
//     filterPedalsByStatus(filter);
//   });
// }



// // Unified filtering function (single definition — replaces duplicates)
// function filterPedalsByStatus(filter) {
//   const currentUsername = (window.currentUser?.username || "").toLowerCase();

//   $(".pedal-catalog").each(function() {
//     const status = ($(this).data("published") || "").toLowerCase();
//     const author = ($(this).data("author") || "").toLowerCase();

//     const isMine = (status === "public" && author === currentUsername);
//     const isUserCreated = author && author !== "admin"; // non-admin authors

//     if (filter === "all") {
//       $(this).show();
//     } else if (filter === "publicByMe") {
//       $(this).toggle(isMine);
//     } else if (filter === "user") {
//       // Show pedals created by regular users (non-admin authors)
//       $(this).toggle(isUserCreated);
//     } else {
//       // filter is one of: "draft", "private", "reviewing", "public"
//       $(this).toggle(status === filter);
//     }
//   });

//   // Update counts after filtering (keeps UI in sync)
//   updatePedalCounts(filter);
// }


// // CSS for link look + active highlight
// const style = document.createElement("style");
// style.textContent = `
//   .status-filter {
//     cursor: pointer;
//     text-decoration: underline;
//     color: #ddd;
//   }
//   .status-filter.active-filter {
//     font-weight: bold;
//     color: #fff;
//     text-decoration: none;
//     border-bottom: 2px solid #fff;
//   }
// `;
// document.head.appendChild(style);



// // Initialize catalog after pedals are loaded
// function initCatalog(userRole) {
//   const resultsDiv = document.getElementById("catalog");

//   resultsDiv.innerHTML = `
//       <div class="bx--loading-overlay">
//         <div class="bx--loading" role="status">
//           <svg class="bx--loading__svg" viewBox="-75 -75 150 150">
//             <circle class="bx--loading__background" cx="0" cy="0" r="37.5"/>
//             <circle class="bx--loading__stroke" cx="0" cy="0" r="37.5"/>
//           </svg>
//         </div>     
//       </div>`;

//   fetch(`https://www.cineteatrosanluigi.it/plex/GET_CATALOG.php?role=${userRole}&username=${window.currentUser.username}`)
//     .then(response => {
//       if (!response.ok) throw new Error("Network response was not ok");
//       return response.json();
//     })
//     .then(pedals => {
//       resultsDiv.innerHTML = ""; // Clear loader
//       $("#pedalCount").text(`${pedals.length} gears`); // temporary before full update

//       pedals.sort((a, b) => a._id - b._id);

//       pedals.forEach(pedal => {
//         const $pedalDiv = renderPedal(pedal, userRole);
//         // Add author + published to data attributes so counts work
//         $pedalDiv.attr("data-author", pedal.author || "");
//         $pedalDiv.attr("data-published", (pedal.published || "draft").toLowerCase());
//         $(resultsDiv).append($pedalDiv);
//       });

//       // Update counts including statuses after pedals are rendered
//       updatePedalCounts();

//       // Setup edit button handlers
//       setupEditPedalHandler(pedals);
//     })
//     .catch(error => {
//       console.error("Error fetching pedals:", error);
//       resultsDiv.innerHTML = `<p style="color:red;">Error loading pedals: ${error.message}</p>`;
//     });
// }



// nav-catalog.js

// Initialize navigation catalog
function initNavCatalog(userRole) {
  const isAdmin = (userRole === "admin");
  const subtitleText = `Gears Catalog${isAdmin ? " Manager" : ""}`;

  // Nav HTML
  const navHtml = `
    <header style="display: flex; align-items: center; justify-content: space-between;">
      <div style="display: flex; align-items: center; gap: 1rem;">
        <button class="menu-toggle" id="menuToggle" aria-label="Open menu">
          <div class="pedalplex-logo"></div>
        </button>

        <div class="title">PedalPlex</div>
        <span class="subtitle" style="font-size: 1.25rem; color: #aaa; font-weight: 600">${subtitleText}</span>
      </div>

      <div style="display: flex; align-items: center; gap: 1rem;">
        <span id="pedalCount" style="font-size: 0.75rem; color:#aaa"></span>

        <button id="toggleFilterBtn" aria-label="Toggle search" style="background:none; border:none; cursor:pointer; padding:4px;">
          <svg fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
              viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
              <circle cx="11" cy="11" r="7"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </button>

        <input 
          type="text" 
          id="pedalFilterInput" 
          placeholder="Filter gears..." 
          style="font-size: 0.875rem; padding: 6px 12px; border: 1px solid #8c8c8c; border-radius: 4px; outline-offset: 2px; width: 120px; display: none;" 
          aria-label="Filter pedals"/>

        ${isAdmin ? `
          <button id="createPedalBtn" class="bx--btn bx--btn--primary bx--btn--sm" type="button" aria-label="Create New Gear" style="display: flex; align-items: center; gap: 0.5rem;">
            <svg focusable="false" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32" aria-hidden="true" class="bx--btn__icon">
              <path d="M16 4v24M4 16h24" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            Add gear
          </button>` : ''}

        ${!isAdmin ? `
          <button id="createOwnPedalBtn" class="bx--btn bx--btn--primary bx--btn--sm" type="button" aria-label="Add Your Own Gear" style="display: flex; align-items: center; gap: 0.5rem;">
            <svg focusable="false" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32" aria-hidden="true" class="bx--btn__icon">
              <path d="M16 4v24M4 16h24" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            Add Your Own Gear
          </button>` : ''}
      </div>
    </header>
  `;

  $("body").prepend(navHtml);

  function isTokenValid() {
    const token = localStorage.getItem("authToken");
    if (!token) return false;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp && payload.exp > now;
    } catch (err) {
      console.error("Invalid JWT:", err);
      return false;
    }
  }

  function handleCreatePedalClick() {
    if (!isTokenValid()) {
      Swal.fire({
        icon: 'warning',
        title: 'Login Required',
        text: 'Please log in to create a pedal.',
        confirmButtonText: 'Login',
        customClass: { confirmButton: 'bx--btn bx--btn--primary' }
      }).then(() => { window.location.href = "/PedalPlex/"; });
      return;
    }
    createNewPedal();
  }

  $(document).on('click', '#createPedalBtn', handleCreatePedalClick);
  $(document).on('click', '#createOwnPedalBtn', handleCreatePedalClick);

  $("body").append(window.fullscreenMenuHtml);

  $("#menuToggle").on("click", function () {
    const randomQuote = songQuotes[Math.floor(Math.random() * songQuotes.length)];
    $("#song-quote").html(`<span style='font-style:italic'>${randomQuote}</span>`);
    $("#fullscreenMenu").addClass("active");
  });
  $("#closeMenu").on("click", () => $("#fullscreenMenu").removeClass("active"));

  $("#toggleFilterBtn").on("click", function () {
    const input = $("#pedalFilterInput");
    input.is(":visible") ? input.hide().val("") : input.show().focus();
  });
  $("#pedalFilterInput").on("input", function () {
    const filterValue = $(this).val().toLowerCase();
    $(".pedal-catalog").each(function () {
      const name = $(this).data("pedal-id")?.toLowerCase() || "";
      $(this).toggle(name.includes(filterValue));
    });
    updatePedalCounts();
  });
}

// Updates pedal counts including draft/private/reviewing/public-by-me
function updatePedalCounts(activeFilter = null) {
  const visiblePedals = $(".pedal-catalog:visible");
  const allPedals = $(".pedal-catalog");
  const totalVisible = visiblePedals.length;
  const totalAbsolute = allPedals.length;

  const statusCounts = { draft: 0, private: 0, reviewing: 0, publicByMe: 0 };
  let userPedalsCount = 0;
  const currentUsername = (window.currentUser?.username || "").toLowerCase();

  allPedals.each(function() {
    const status = ($(this).data("published") || "").toLowerCase();
    const author = ($(this).data("author") || "").toLowerCase();
    if (status in statusCounts) statusCounts[status]++;
    if (status === "public" && author === currentUsername) statusCounts.publicByMe++;
    if (author && author !== "admin") userPedalsCount++;
  });

  const reviewingBadge = statusCounts.reviewing > 0
    ? `<span class="status-filter ${activeFilter === "reviewing" ? "active-filter" : ""}" data-filter="reviewing" style="
        background:#ff0000;
        color:white;
        border-radius:50%;
        padding:1px 5px;
        font-size:0.75rem;
        font-weight:bold;
        min-width:18px;
        text-align:center;
      ">${statusCounts.reviewing}</span>`
    : `<span class="status-filter ${activeFilter === "reviewing" ? "active-filter" : ""}" data-filter="reviewing">0</span>`;

  let countsHtml =
    `${totalVisible} gear${totalVisible === 1 ? "" : "s"} available ` +
    `(All: <span class="status-filter ${activeFilter === "all" ? "active-filter" : ""}" data-filter="all">${totalAbsolute}</span>, 
     Draft: <span class="status-filter ${activeFilter === "draft" ? "active-filter" : ""}" data-filter="draft">${statusCounts.draft}</span>, 
     Private: <span class="status-filter ${activeFilter === "private" ? "active-filter" : ""}" data-filter="private">${statusCounts.private}</span>, 
     Reviewing: ${reviewingBadge}, 
     Published by me: <span class="status-filter ${activeFilter === "publicByMe" ? "active-filter" : ""}" data-filter="publicByMe">${statusCounts.publicByMe}</span>`;

  if (window.currentUser?.role === "admin") {
    countsHtml += `, Published by Users: <span class="status-filter ${activeFilter === "user" ? "active-filter" : ""}" data-filter="user">${userPedalsCount}</span>`;
  }
  countsHtml += `)`;

  $("#pedalCount").html(countsHtml);

  $(".status-filter").off("click").on("click", function() {
    const filter = $(this).data("filter");
    filterPedalsByStatus(filter);
  });
}

// Unified filtering function
function filterPedalsByStatus(filter) {
  const currentUsername = (window.currentUser?.username || "").toLowerCase();
  $(".pedal-catalog").each(function() {
    const status = ($(this).data("published") || "").toLowerCase();
    const author = ($(this).data("author") || "").toLowerCase();
    const isMine = (status === "public" && author === currentUsername);
    const isUserCreated = author && author !== "admin";
    if (filter === "all") $(this).show();
    else if (filter === "publicByMe") $(this).toggle(isMine);
    else if (filter === "user") $(this).toggle(isUserCreated);
    else $(this).toggle(status === filter);
  });
  updatePedalCounts(filter);
}

// CSS for link look + active highlight + mobile hide counters except total
const style = document.createElement("style");
style.textContent = `
  .status-filter {
    cursor: pointer;
    text-decoration: underline;
    color: #ddd;
  }
  .status-filter.active-filter {
    font-weight: bold;
    color: #fff;
    text-decoration: none;
    border-bottom: 2px solid #fff;
  }

  /* Mobile: hide all counters except total (All) */
  @media (max-width: 768px) {
    .status-filter:not([data-filter="all"]) {
      display: none !important;
    }
  }
`;
document.head.appendChild(style);

// Initialize catalog loader
function initCatalog(userRole) {
  const resultsDiv = document.getElementById("catalog");
  resultsDiv.innerHTML = `
      <div class="bx--loading-overlay">
        <div class="bx--loading" role="status">
          <svg class="bx--loading__svg" viewBox="-75 -75 150 150">
            <circle class="bx--loading__background" cx="0" cy="0" r="37.5"/>
            <circle class="bx--loading__stroke" cx="0" cy="0" r="37.5"/>
          </svg>
        </div>     
      </div>`;

  fetch(`https://www.cineteatrosanluigi.it/plex/GET_CATALOG.php?role=${userRole}&username=${window.currentUser.username}`)
    .then(res => res.ok ? res.json() : Promise.reject("Network error"))
    .then(pedals => {
      resultsDiv.innerHTML = "";
      $("#pedalCount").text(`${pedals.length} gears`);

      pedals.sort((a,b) => a._id - b._id);
      pedals.forEach(pedal => {
        const $pedalDiv = renderPedal(pedal, userRole);
        $pedalDiv.attr("data-author", pedal.author || "");
        $pedalDiv.attr("data-published", (pedal.published || "draft").toLowerCase());
        $(resultsDiv).append($pedalDiv);
      });

      updatePedalCounts();
      setupEditPedalHandler(pedals);
    })
    .catch(err => {
      console.error("Error fetching pedals:", err);
      resultsDiv.innerHTML = `<p style="color:red;">Error loading pedals: ${err}</p>`;
    });
}
