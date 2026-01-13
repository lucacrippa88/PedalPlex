$(document).ready(function () {
  const userRole = window.userRole || 'guest';
  const resultsDiv = document.getElementById("catalog");

  // Show loading spinner
  resultsDiv.innerHTML = `
    <div class="bx--loading-overlay">
      <div class="bx--loading" role="status">
        <svg class="bx--loading__svg" viewBox="-75 -75 150 150">
          <circle class="bx--loading__background" cx="0" cy="0" r="37.5"/>
          <circle class="bx--loading__stroke" cx="0" cy="0" r="37.5"/>
        </svg>
      </div>
    </div>`;

  fetch("https://api.pedalplex.com/GET_CATALOG.php")
    .then(response => {
      if (!response.ok) throw new Error("Network response was not ok");
      return response.json();
    })
    .then(pedals => {
      resultsDiv.innerHTML = ""; // Clear loader

      // Filter pedals that have "boss" in their name (case-insensitive) and are not 200-series/500-series (only standard)
      const filteredPedals = pedals.filter(pedal =>
        pedal._id &&
        pedal._id.toLowerCase().includes("boss") &&
        !pedal._id.toLowerCase().includes("200") &&
        !pedal._id.toLowerCase().includes("500")
      );

      if (filteredPedals.length < 2) {
        resultsDiv.innerHTML = `<p>Need at least 2 'boss' pedals to show.</p>`;
        return;
      }

      // Pick 2 unique random pedals
      let firstIndex = Math.floor(Math.random() * filteredPedals.length);
      let secondIndex;
      do {
        secondIndex = Math.floor(Math.random() * filteredPedals.length);
      } while (secondIndex === firstIndex);

      const pedalToRender = filteredPedals[firstIndex];
      const pedalForControls = filteredPedals[secondIndex];

      // Change the pedal name of the pedalToRender
      pedalToRender.name = "Gear does't exist";

      // Render pedals
      renderPedal(pedalToRender, userRole, pedalForControls);
    })
    .catch(error => {
      console.error("Error fetching pedals:", error);
      resultsDiv.innerHTML = `<p style="color:red;">Error loading pedals: ${error.message}</p>`;
    });
});

function renderPedal(pedal, userRole, controlsPedal) {
  const resultsDiv = document.getElementById("catalog");
  const angle = 0;

  const insideColorRaw = pedal["inside-color"];
  const insideBorder = pedal["inside-border"] || "";
  let inside = "";
  let colorOnly = insideColorRaw;

  const match = insideColorRaw.match(/(#(?:[0-9a-fA-F]{3,6}))(?:\s+(.+))?/);
  if (match) {
    colorOnly = match[1];
    inside = match[2] || "";
  }

  const baseCss = {
    background: colorOnly,
    border: `5px solid ${pedal["color"]}`,
    boxShadow: `inset 0 0 0 3px ${insideBorder}`,
    borderRadius: '10px',
    color: pedal["font-color"],
    width: getPedalWidth(pedal.width),
    height: getPedalHeight(pedal.height),
    transform: `rotate(${angle}deg)`,
    display: 'inline-block'
  };

  let $pedalDiv = $("<div>").addClass("pedal-catalog")
    .attr("data-pedal-name", pedal.name)
    .attr("data-pedal-id", pedal._id);

  // Determine type-specific shadow
  if (inside !== "full") {
    if (pedal.type === "pedal") {
      baseCss.boxShadow = `0 4px 8px rgba(0, 0, 0, 0.3), inset 0 -36px 0 0 ${pedal["color"]}`;
    } else if (pedal.type === "combo") {
      baseCss.boxShadow = `0 4px 8px rgba(0, 0, 0, 0.3), inset 0 -80px 0 0 ${pedal["color"]}`;
    } else if (pedal.type === "head" || pedal.type === "pedal-inverted") {
      baseCss.boxShadow = `0 4px 8px rgba(0, 0, 0, 0.3), inset 0 80px 0 0 ${pedal["color"]}`;
    }
  }

  $pedalDiv.css(baseCss);

  // Logo/text
  if (["pedal", "combo"].includes(pedal.type)) {
    const $nameDiv = $("<div>").addClass("pedal-name").html(pedal.name).attr("style", pedal.logo || "");
    $pedalDiv.append($nameDiv);
  } else if (["head", "pedal-inverted"].includes(pedal.type)) {
    const $nameDiv = $("<div>").addClass("head-name").html(pedal.name).attr("style", pedal.logo || "");
    $pedalDiv.append($nameDiv);
  }

  // Render controls using the second pedal
  renderPedalControls(controlsPedal, $pedalDiv);

  $(resultsDiv).append($pedalDiv);
}
