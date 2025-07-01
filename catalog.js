document.addEventListener("DOMContentLoaded", function () {
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
      </div>
    `;

    fetch("https://www.cineteatrosanluigi.it/plex/GET_CATALOG.php")
        .then(response => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.json();
        })
        .then(pedals => {
            resultsDiv.innerHTML = ""; // Clear loader
            $("#pedalCount").text(`${pedals.length} gears`);

            // Sort pedals alphabetically by _id
            pedals.sort((a, b) => a._id - b._id);


            pedals.forEach(pedal => {

                console.log(pedal);
                
                const pedalName = pedal.name || pedal.id;
                const pedalId = pedal._id || pedal.id;
                const angle = 0;

                const insideColorRaw = pedal["inside-color"];
                let inside = "";
                let colorOnly = insideColorRaw;

                const match = insideColorRaw.match(/(#(?:[0-9a-fA-F]{3,6}))(?:\s+(.+))?/);
                if (match) {
                    colorOnly = match[1];
                    inside = match[2] || "";
                }

                const baseCss = {
                    background: colorOnly,
                    border: `10px solid ${pedal["color"]}`,
                    color: pedal["font-color"],
                    width: getPedalWidth(pedal.width),
                    height: getPedalHeight(pedal.height),
                    transform: `rotate(${angle}deg)`,
                    display: 'inline-block'
                };

                let $pedalDiv;

                if (pedal.type === "pedal") {
                    if (inside === "full") {
                        $pedalDiv = $("<div>").addClass("pedal").css(baseCss).attr("data-pedal-name", pedal.name).attr("data-pedal-id", pedal._id);
                    } else {
                        $pedalDiv = $("<div>").addClass("pedal").css({
                            ...baseCss,
                            boxShadow: `0 8px 16px rgba(0, 0, 0, 0.3), inset 0 -36px 0 0 ${pedal["color"]}`
                        }).attr("data-pedal-name", pedal.name).attr("data-pedal-id", pedal._id);
                    }
                } else if ((pedal.type === "head") || (pedal.type === "pedal-inverted")) {
                    if (inside === "full") {
                        $pedalDiv = $("<div>").addClass("pedal").css(baseCss).attr("data-pedal-name", pedal.name).attr("data-pedal-id", pedal._id);;
                    } else {
                        $pedalDiv = $("<div>").addClass("pedal").css({
                            ...baseCss,
                            boxShadow: `0 8px 16px rgba(0, 0, 0, 0.3), inset 0 80px 0 0 ${pedal["color"]}`
                        }).attr("data-pedal-name", pedal.name).attr("data-pedal-id", pedal._id);
                    }
                }


                // Manage head and pedal-inverted logos
                if ((pedal.type === "head") || (pedal.type === "pedal-inverted")) {
                    const $nameDiv = $("<div>").addClass("head-name").text(pedal.name).attr("style", pedal.logo || "");
                    $pedalDiv.append($nameDiv);
                }

                // Render pedal controls
                renderPedalControls(pedal, $pedalDiv);

                // Manage pedal logos
                const $nameDiv = $("<div>")
                if (pedal.type === "pedal") {
                    const $nameDiv = $("<div>").addClass("pedal-name").text(pedal.name).attr("style", pedal.logo || "");
                    $pedalDiv.append($nameDiv);
                }

                // Edit icon button (just create the button without the .on("click") here)
                const $editBtn = $("<button>")
                    .addClass("edit-btn")
                    .attr("title", "Edit pedal JSON")
                    .data("pedal", pedal)
                    .html(`
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="16" height="16">
                        <path d="M28.7 19.4l-2.1-.5a11.3 11.3 0 000-5.8l2.1-.5a1 1 0 00.7-1.2 13.4 13.4 0 00-1.7-4.2 1 1 0 00-1.4-.4l-2 1.2a11.3 11.3 0 00-5-2.9V2.3A1 1 0 0018 2h-4a1 1 0 00-1 1v2.2a11.3 11.3 0 00-5 2.9l-2-1.2a1 1 0 00-1.4.4 13.4 13.4 0 00-1.7 4.2 1 1 0 00.7 1.2l2.1.5a11.3 11.3 0 000 5.8l-2.1.5a1 1 0 00-.7 1.2 13.4 13.4 0 001.7 4.2 1 1 0 001.4.4l2-1.2a11.3 11.3 0 005 2.9v2.2a1 1 0 001 1h4a1 1 0 001-1v-2.2a11.3 11.3 0 005-2.9l2 1.2a1 1 0 001.4-.4 13.4 13.4 0 001.7-4.2 1 1 0 00-.7-1.2zM16 21a5 5 0 110-10 5 5 0 010 10z"/>
                        </svg>
                    `);

                // Setup the edit button handler
                setupEditPedalHandler(pedals);

                // Append elements to the pedal div
                $pedalDiv.append($editBtn);
                $pedalDiv.append($nameDiv);

                // Append to results
                $(resultsDiv).append($pedalDiv);
            });
        })
        .catch(error => {
            console.error("Error fetching pedals:", error);
            resultsDiv.innerHTML = `<p style="color:red;">Error loading pedals: ${error.message}</p>`;
        });


});
