// nav-catalog.js

// Initialize navigation catalog
function initNavCatalog(userRole) {
  const isAdmin = (userRole === "admin");

  // Nav HTML
  const navHtml = `
    <header style="display: flex; align-items: center; justify-content: space-between;">
      <div style="display: flex; align-items: center; gap: 1rem;">
        <button class="menu-toggle" id="menuToggle" aria-label="Open menu">
          <div class="pedalplex-logo"></div>
        </button>

        <div class="title">PedalPlex</div>
        <span class="subtitle" style="font-size: 1.25rem; color: #aaa; font-weight: 600">Gears</span>
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

        <button id="createPedalBtn" class="bx--btn bx--btn--primary bx--btn--sm" type="button" aria-label="Create New Gear" style="display: flex; align-items: center; gap: 0.5rem;">
          <svg focusable="false" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32" aria-hidden="true" class="bx--btn__icon">
            <path d="M16 4v24M4 16h24" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          Add gear
        </button>
      </div>
    </header>
  `;

  $("body").prepend(navHtml);

  // Hide Add Gear button for guests
  if (userRole === "guest") {
    $("#createPedalBtn").hide();
    // Add Login button
    const loginBtnHtml = `
        <button id="loginBtn" class="bx--btn bx--btn--primary bx--btn--sm" type="button" aria-label="Create New Gear" style="display: flex; align-items: center; gap: 0.5rem;">
          <svg focusable="false" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32" aria-hidden="true" class="bx--btn__icon">
            <path d="M26,30H14a2,2,0,0,1-2-2V25h2v3H26V4H14V7H12V4a2,2,0,0,1,2-2H26a2,2,0,0,1,2,2V28A2,2,0,0,1,26,30Z"/>
            <path d="M14.59 20.59L18.17 17 4 17 4 15 18.17 15 14.59 11.41 16 10 22 16 16 22 14.59 20.59z"/>
          </svg>
          Login
        </button>
    `;
    $("#toggleFilterBtn").after(loginBtnHtml);  // ----------------------

    // Add click handler
    $(document).on("click", "#loginBtn", function() {
      window.location.href = "login"; // redirect to login page
    });
  } else {
    // Only attach click handlers for logged-in users
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
        }).then(() => { window.location.href = "login"; });
        return;
      }
      createNewPedal();
    }

    $(document).on('click', '#createPedalBtn', handleCreatePedalClick);
    $(document).on('click', '#createOwnPedalBtn', handleCreatePedalClick);
  }

  // Fullscreen menu
  $("body").append(window.fullscreenMenuHtml);

  $("#menuToggle").on("click", function () {
    const randomQuote = songQuotes[Math.floor(Math.random() * songQuotes.length)];
    $("#song-quote").html(`<span style='font-style:italic'>${randomQuote}</span>`);
    $("#fullscreenMenu").addClass("active");
  });
  $("#closeMenu").on("click", () => $("#fullscreenMenu").removeClass("active"));

  $("#toggleFilterBtn").on("click", function () {
    const input = $("#pedalFilterInput");
    if (input.is(":visible")) {
      input.hide().val("");
    } else {
      input.css("display", "flex").focus();
    }
  });
  $("#pedalFilterInput").on("input", function () {
    const filterValue = $(this).val().toLowerCase();
    $(".pedal-catalog").each(function () {
      const name = $(this).data("pedal-id")?.toLowerCase() || "";
      $(this).toggle(name.includes(filterValue));
    });
    updatePedalCounts();
  });

  // Apply guest mode filter visibility
  if (userRole === "guest") {
    $(".status-filter").not('[data-filter="all"]').hide();
  }
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
    `(All: <span class="status-filter ${activeFilter === "all" ? "active-filter" : ""}" data-filter="all">${totalAbsolute}</span>`;

  // Only show these if not a guest
  if (window.currentUser?.role !== "guest") {
    countsHtml += `, Draft: <span class="status-filter ${activeFilter === "draft" ? "active-filter" : ""}" data-filter="draft">${statusCounts.draft}</span>, 
     Private: <span class="status-filter ${activeFilter === "private" ? "active-filter" : ""}" data-filter="private">${statusCounts.private}</span>, 
     Reviewing: ${reviewingBadge}, 
     Published by me: <span class="status-filter ${activeFilter === "publicByMe" ? "active-filter" : ""}" data-filter="publicByMe">${statusCounts.publicByMe}</span>`;
    
    if (window.currentUser?.role === "admin") {
      countsHtml += `, Published by Users: <span class="status-filter ${activeFilter === "user" ? "active-filter" : ""}" data-filter="user">${userPedalsCount}</span>`;
    }
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

  /* Mobile: hide all pedal counters except total (All) */
  @media (max-width: 768px) {
    #pedalCount span.status-filter:not([data-filter="all"]) {
      display: none !important;
    }
  }
`;
document.head.appendChild(style);

// Initialize catalog loader
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

//   const roleParam = userRole === "guest" ? "guest" : userRole;
//   const usernameParam = window.currentUser?.username || "";

//   const token = localStorage.getItem('authToken');

//   fetch(`https://www.cineteatrosanluigi.it/plex/GET_CATALOG.php?role=${roleParam}&username=${usernameParam}`, {
//     headers: {
//         'Authorization': 'Bearer ' + token
//       }
//     }) 
//     .then(async res => {
//     if (!res.ok) {
//       const text = await res.text();
//       console.error("Server error:", text);
//       throw new Error("Network error");
//     }

//     try {
//       return await res.json();
//     } catch (e) {
//       const text = await res.text();
//       console.error("Invalid JSON response:", text);
//       throw new Error("Invalid JSON from server");
//     }
//   })
//   .then(pedals => {
//     resultsDiv.innerHTML = "";
//     $("#pedalCount").text(`${pedals.length} gears`);

//     pedals.sort((a,b) => a._id.localeCompare(b._id));
//     pedals.forEach(pedal => {
//       const $pedalDiv = renderPedal(pedal, userRole);
//       $pedalDiv.attr("data-author", pedal.author || "");
//       $pedalDiv.attr("data-published", (pedal.published || "draft").toLowerCase());
//       $(resultsDiv).append($pedalDiv);
//     });

//     updatePedalCounts();
//     if (userRole !== "guest") setupEditPedalHandler(pedals);
//   })
//   .catch(err => {
//     console.error("Error fetching pedals:", err);
//     resultsDiv.innerHTML = `<p style="color:red;">Error loading pedals: ${err.message}</p>`;
//   });
   
// }

async function initCatalog(userRole) {

  const resultsDiv = document.getElementById("catalog");

  // Mostra subito loader visivo
  resultsDiv.innerHTML = `
      <div id="catalog-loader" class="bx--loading-overlay">
        <div class="bx--loading" role="status">
          <svg class="bx--loading__svg" viewBox="-75 -75 150 150">
            <circle class="bx--loading__background" cx="0" cy="0" r="37.5"/>
            <circle class="bx--loading__stroke" cx="0" cy="0" r="37.5"/>
          </svg>
        </div>     
      </div>`;

  const loaderEl = document.getElementById("catalog-loader");

  const roleParam = userRole === "guest" ? "guest" : userRole;
  const usernameParam = window.currentUser?.username || "";
  const token = localStorage.getItem("authToken");

  const response = await fetch(
    `https://www.cineteatrosanluigi.it/plex/GET_CATALOG.php?role=${roleParam}&username=${usernameParam}`,
    { headers: { "Authorization": "Bearer " + token } }
  );

  if (!response.ok) {
    resultsDiv.innerHTML = `<p style="color:red;">Error loading catalog</p>`;
    return;
  }

  // --- STREAMING ---
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let firstPedal = true;

  // Remove loader spinner
  loaderEl.remove();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Trova oggetti JSON completi fino alla chiusura di }
    let boundary = buffer.lastIndexOf("}");
    if (boundary === -1) continue;

    const chunk = buffer.slice(0, boundary + 1);
    buffer = buffer.slice(boundary + 1);

    // pulizia simboli array
    const objects = chunk
      .replace(/^\[/, "")
      .replace(/\]$/, "")
      .split("},");

    objects.forEach((obj, i) => {
      obj = obj.trim();
      if (!obj) return;

      if (!obj.endsWith("}")) obj += "}";

      try {
        const pedal = JSON.parse(obj);

        // PRIMO PEDALE → rimuove completamente overlay se esiste
        if (firstPedal) {
          firstPedal = false;
        }

        const $pedalDiv = renderPedal(pedal, userRole);
        $pedalDiv.attr("data-author", pedal.author || "");
        $pedalDiv.attr(
          "data-published",
          (pedal.published || "draft").toLowerCase()
        );
        $(resultsDiv).append($pedalDiv);

      } catch (e) {
        console.warn("Partial JSON not parseable:", obj);
      }
    });
  }

  updatePedalCounts();
  if (userRole !== "guest") {
    setupEditPedalHandler();
  }
}
