$(document).ready(function () {
  let pedals = [];
  let presets = {};
  let pedalboard = {};

  const loadJSON = url => $.getJSON(url);

  // Step 1: Load presets and build dropdown
  readDB("user-0", "presets").then(presetData => {
    if (!presetData || !presetData.presets) {
      throw new Error("No presets found");
    }

    // Flatten Cloudant presets format
    presets = {};
    presetData.presets.forEach(presetObj => {
      Object.entries(presetObj).forEach(([songName, preset]) => {
        presets[songName] = preset;
      });
    });

    // Create dropdown
    const $selector = $("<select id='preset-selector' style='font-size:0.875rem;height:42px;'><option disabled selected>Select a song preset</option></select><br><br><br><br>");
    for (const songName in presets) {
      $selector.append($("<option>").val(songName).text(songName));
    }

    $selector.on("change", function () {
      const selected = $(this).val();
      applyPreset(selected);
    });

    $("#pedalboard").before($selector); // Insert dropdown

  }).then(() => {
    return readDB("user-0", "pedalboard");
  })
    .then(queryResult => {
      if (!queryResult) {
        throw new Error("No queried_pedalboard found");
      }

      pedalboard = queryResult; // Overwrite global `pedalboard` with the queried one

      // Load pedal catalog
      return loadJSON("https://lucacrippa88.github.io/PedalPlex/pedals.json");
    }).then(data => {
      pedals = data["Pedals"];

      // Render pedals after everything has loaded ---------------------------------------
      pedalboard.pedalboard.forEach(pedalEntry => {
        const pedalName = pedalEntry.name || pedalEntry.pedalName || pedalEntry.id || pedalEntry;
        const angle = Number(pedalEntry.angle ?? pedalEntry.rotation ?? 0);

        const pedal = pedals.find(p => p.name === pedalName || p.id === pedalName);
        if (!pedal) return;

        const insideColorRaw = pedal["inside-color"];
        let inside = "";
        let colorOnly = insideColorRaw;

        // Use regex to extract color and anything extra (like "full")
        const match = insideColorRaw.match(/(#(?:[0-9a-fA-F]{3,6}))(?:\s+(.+))?/);

        if (match) {
          colorOnly = match[1]; // just the hex color
          inside = match[2] || ""; // optional: "full" or empty
        }

        const baseCss = {
          background: colorOnly,
          border: `10px solid ${pedal["color"]}`,
          color: pedal["font-color"],
          width: getPedalWidth(pedal.width),
          height: getPedalHeight(pedal.height),
          transform: `rotate(${angle}deg)`  // <-- Apply pedal rotation here
        };

        let $pedalDiv;

        if (pedal.type === "pedal") {
          if (inside === "full") {
            $pedalDiv = $("<div>").addClass("pedal").css(baseCss)
              .attr("data-pedal-name", pedal.name);
          } else {
            $pedalDiv = $("<div>").addClass("pedal").css({
              ...baseCss,
              boxShadow: `0 8px 16px rgba(0, 0, 0, 0.3), inset 0 -36px 0 0 ${pedal["color"]}`
            }).attr("data-pedal-name", pedal.name);
          }
        } else if ((pedal.type === "head") || (pedal.type === "pedal-inverted")) {
          if (inside === "full") {
            $pedalDiv = $("<div>").addClass("pedal").css(baseCss)
              .attr("data-pedal-name", pedal.name);
          } else {
            $pedalDiv = $("<div>").addClass("pedal").css({
              ...baseCss,
              boxShadow: `0 8px 16px rgba(0, 0, 0, 0.3), inset 0 80px 0 0 ${pedal["color"]}`
            }).attr("data-pedal-name", pedal.name);
          }
        }


        if ((pedal.type === "head") || (pedal.type === "pedal-inverted")) {
          const $nameDiv = $("<div>").addClass("head-name").text(pedal.name).attr("style", pedal.logo || "");
          $pedalDiv.append($nameDiv);
        }


        // Controls rendering (same as original)
        pedal.controls.forEach(controlRow => {
          const $row = $("<div>").addClass("row");

          if (pedal.type === "head") {
            $row.addClass("lowest-row");
          }
          if (pedal.type === "pedal-inverted") {
            $row.addClass("lower-row");
          }


          controlRow.row.forEach(control => {
            if (control.type === "knob" || control.type === "smallknob" || control.type === "largeknob" || control.type === "xlargeknob") {
              const isSmall = control.type === "smallknob";
              const isLarge = control.type === "largeknob";
              const isXLarge = control.type === "xlargeknob";
              const knob = $("<div>")
                .addClass(isSmall ? "smallknob" : "knob")
                .addClass(isLarge ? "largeknob" : "knob")
                .addClass(isXLarge ? "xlargeknob" : "knob")
                .css({
                  background: pedal["knobs-color"],
                  border: `${control.border === "thick" ? "10px" : "2px"} solid ${pedal["knobs-border"]}`
                })
                .css("--indicator-color", pedal["knobs-indicator"])
                .attr("data-control-label", control.label);

              const rotation = getRotationFromValue(control, control.value);
              knob.data("rotation", rotation);
              knob.css("transform", `rotate(${rotation}deg)`);

              let $valueLabel = null;
              if (control.values && Array.isArray(control.values)) {
                $valueLabel = $("<div>").addClass("knob-value-label").text(control.value);
              }

              knob.on("mousedown", function (e) {
                const startY = e.pageY;
                const startValue = control.value;

                $(document).on("mousemove.knob", function (e2) {
                  const delta = startY - e2.pageY;
                  const steps = Math.round(delta / 5);

                  if (control.values && Array.isArray(control.values)) {
                    let currentIndex = control.values.indexOf(startValue);
                    if (currentIndex === -1) currentIndex = 0;
                    let newIndex = Math.min(Math.max(currentIndex + steps, 0), control.values.length - 1);
                    control.value = control.values[newIndex];
                  } else {
                    const min = control.min ?? 0;
                    const max = control.max ?? 100;
                    let newValue = startValue + steps;
                    newValue = Math.min(Math.max(newValue, min), max);
                    control.value = newValue;
                  }

                  const newRotation = getRotationFromValue(control, control.value);
                  knob.data("rotation", newRotation);
                  knob.css("transform", `rotate(${newRotation}deg)`);
                  if ($valueLabel) {
                    $valueLabel.text(control.value);
                  }
                });

                $(document).on("mouseup.knob", function () {
                  $(document).off(".knob");
                });
              });

              let $label;
              if (control.position === "under-top" && control.type === "smallknob") {
                $label = $("<div>").css({
                  position: "absolute",
                  "margin-left": "5px",
                  top: "110px",
                  transform: "translateY(-50%)",
                  "white-space": "nowrap",
                  "font-size": "10px"
                }).text(control.label);
              } else {
                $label = $("<div>").addClass("label-top").text(control.label);
              }

              const $container = $("<div>").addClass("knob-container").append(knob).css({ position: "relative" });
              $container.append($label);
              if ($valueLabel) $container.append($valueLabel);
              const $knobWrapper = $("<div>").append($label, $container);

              if (control.position === "under-top" && $row.children().length > 0) {
                const $prev = $row.children().last();
                $prev.append($("<div>").css("margin-top", "-53px").append($label, $container));
              } else if (control.position === "higher") {
                $knobWrapper.css("margin-top", "-30px");
                $row.append($knobWrapper);
              } else {
                $row.append($knobWrapper);
              }
            }

            if (control.type === "led") {
              const colors = Array.isArray(control.colors) ? control.colors : ["#000000"];
              const numColors = colors.length;
              let currentIndex = typeof control.value === "number" ? control.value : 0;

              const $label = $("<div>").addClass("label-top");

              const led = $("<div>")
                .addClass("led")
                .attr("data-control-label", control.label)
                .css("cursor", "pointer");

              const setColor = (index) => {
                const color = colors[index] || "#000000";
                led.css("background-color", color);
                led.css("box-shadow", color !== "#000000" ? `0 0 8px 3px ${color}` : "none");
                control.value = index; // update value in control object
                led.data("colorIndex", index);
              };

              setColor(currentIndex);

              led.on("click", function () {
                let index = (led.data("colorIndex") + 1) % numColors;
                setColor(index);
              });

              const $ledContainer = $("<div>").append($label, led);

              if (control.position === "under-top" && $row.children().length > 0) {
                const $prev = $row.children().last();
                $prev.append($("<div>").css("margin-top", "0px").append($label, led));
              } else if (control.position === "lower") {
                $ledContainer.css("margin-top", "25px");
                $row.append($ledContainer);
              } else if (control.position === "right") {
                $ledContainer.css({"right": "12px", position: "absolute"});
                $row.append($ledContainer);
              }else {
                $row.append($ledContainer);
              }
            }

            if (control.type === "slider") {
              const $label = $("<div>").addClass("slider-label").text(control.label);
              const $slider = $("<input type='range'>")
                .attr("min", control.min)
                .attr("max", control.max)
                .val(control.value)
                .addClass("vertical")
                .attr("data-control-label", control.label);

              $slider.on("input", function () {
                control.value = parseInt(this.value);
              });

              const $wrapper = $("<div>").addClass("slider-container").append($slider, $label);
              $row.append($wrapper);
            }




            if (control.type === "lcd") {
              const $label = $("<div>").addClass("label-top");

              const $lcd = $("<input type='text'>")
                .val(control.value)
                .attr("data-control-label", control.label)
                .css({
                  width: `${control.width * 5}px`,   // Customize this multiplier as needed
                  height: `${control.height * 5}px`,
                  fontFamily: "monospace",
                  fontSize: "16px",
                  textAlign: "center",
                  backgroundColor: "#111",
                  color: "#fc0000",
                  border: "2px solid #333",
                  borderRadius: "4px",
                  padding: "2px",
                  position: "relative",
                  top: "15px"
                });

              // Optional: Make it editable and reflect changes in control object
              $lcd.on("input", function () {
                control.value = $(this).val();
              });

              const $wrapper = $("<div>").addClass("lcd-wrapper").append($label, $lcd);
              $row.append($wrapper);
            }




            if (control.type === "multi") {

              const $label = $("<div>").addClass("label-top").text(control.label);
              const $select = $("<select>").attr("data-control-label", control.label);
              control.values.forEach(val => {
                const $option = $("<option>").val(val).text(val);
                if (val === control.value) $option.attr("selected", true);
                $select.append($option);
              });

              const $wrapper = $("<div>").append($label, $select);

              if (control.position === "left") {
                $wrapper.addClass("align-left");
              } else if (control.position === "higher") {
                console.log(control)
                $wrapper.addClass("align-top");
              }

              $row.append($wrapper);
            }

            if (control.type === "switch") {
              const $label = $("<div>").addClass("label-top").text(control.label);
              const $input = $("<input type='checkbox'>").prop("checked", control.value).attr("data-control-label", control.label);
              $row.append($("<div>").append($label, $input));
            }
          });

          $pedalDiv.append($row);
        });

        if (pedal.type === "pedal") {
          const $nameDiv = $("<div>").addClass("pedal-name").text(pedal.name).attr("style", pedal.logo || "");
          $pedalDiv.append($nameDiv);
        }


        $("#pedalboard").append($pedalDiv);

        $(".page-content").append("<br><br><br>");

        // After the presets dropdown is fully populated and inserted, add an edit preset button:
        if ($("#edit-btn").length === 0) {
          const $editBtn = $(`
          <button id="edit-btn" class="bx--btn bx--btn--primary" type="button">
            Edit preset
          </button>
        `);

          $(".page-content").append($editBtn);
        }

        // After the presets dropdown is fully populated and inserted, add a reset button:
        if ($("#refresh-btn").length === 0) {
          const $refreshBtn = $(`
          <button id="refresh-btn" class="bx--btn bx--btn--secondary" type="button">
            Reset controls
          </button>
        `);

          $("#preset-selector").after($refreshBtn);
          $(".page-content").append($refreshBtn);
          $refreshBtn.on("click", () => location.reload());
        }
      });
    });

  // Helper functions remain unchanged
  function applyPreset(songName) {
    const songPresetArray = presets[songName];
    if (!songPresetArray) return;

    const configuredPedals = new Set();

    // Build a quick lookup for each pedal's preset controls
    const presetMap = {};
    songPresetArray.forEach(p => {
      presetMap[p.name] = {};
      configuredPedals.add(p.name);
      p.controls.forEach(controlObj => {
        const [label, value] = Object.entries(controlObj)[0];
        presetMap[p.name][label] = value;
      });
    });


    const presetPedals = getPedalsInPreset(songPresetArray);
    const pedalsOnBoard = getPedalList();

    // Print if a pedal from the preset is missing on the pedalboard
    presetPedals.forEach(pedal => {
      if (!pedalsOnBoard.includes(pedal)) {

        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: `Missing pedal on pedalboard: ${pedal}`,
          confirmButtonText: 'Ok',
          buttonsStyling: false,
          customClass: {
            confirmButton: 'bx--btn bx--btn--danger'
          }
        });

      }
    });


    $(".pedal").each(function () {
      const $pedalDiv = $(this);
      const pedalName = $pedalDiv.data("pedal-name");
      const isInPreset = configuredPedals.has(pedalName);
      const defaultPedal = pedals.find(p => p.name === pedalName);
      if (!defaultPedal) return;

      defaultPedal.controls.forEach(row => {
        row.row.forEach(ctrl => {
          const $control = $pedalDiv.find(`[data-control-label="${ctrl.label}"]`);
          if (!$control.length) return;

          // Determine value to set: from preset if present, else default
          let newValue = ctrl.value;
          if (isInPreset && presetMap[pedalName]?.hasOwnProperty(ctrl.label)) {
            newValue = presetMap[pedalName][ctrl.label];
          }

          // Update visual and state
          if ($control.is("div.knob, div.smallknob, div.largeknob, div.xlargeknob")) {
            // Update knob's internal value and rotation
            ctrl.value = newValue;
            const rotation = getRotationFromValue(ctrl, newValue);
            $control.data("rotation", rotation);
            $control.css("transform", `rotate(${rotation}deg)`);
            $control.siblings(".knob-value-label").text(newValue);
          }

          if ($control.is("select")) {
            $control.val(newValue);
          }

          if ($control.is("input[type='text']")) {
            $control.val(newValue);
          }

          if ($control.is("input[type='range']")) {
            $control.val(newValue);
          }

          if ($control.is("div.led")) {
            const color = ctrl.colors?.[newValue] || "#000000";
            $control.css("background-color", color);
            $control.css("box-shadow", color.toLowerCase() !== "#000000" ? `0 0 8px 3px ${color}` : "none");
          }

          if ($control.is("input[type='checkbox']")) {
            $control.prop("checked", !!newValue);
          }
        });
      });
    });
  }


  function findControlObject(pedalName, controlLabel) {
    for (const pedal of pedals) {
      if (pedal.id === pedalName) {
        for (const row of pedal.controls) {
          for (const ctrl of row.row) {
            if (ctrl.label === controlLabel) {
              return ctrl;
            }
          }
        }
      }
    }
    return null;
  }




});







// Waiting for query...
const resultsDiv = document.getElementById("results");

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


// Get pedalboard from DB
async function readDB(userId, read) {

  // Build selector
  const selector = {
    user_id: { "$eq": userId }
  }
  const query = {
    selector,
    limit: 20
  };

  try {
    const response = await fetch("https://www.cineteatrosanluigi.it/plex/get_pedalboard.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(query)
    });

    const data = await response.json();
    if (!data.docs || data.docs.length === 0) {
      resultsDiv.textContent = "No pedalboards found.";
      return;
    }

    resultsDiv.innerHTML = "";
    if (read == "pedalboard") {
      const queried_pedalboard = { pedalboard: data.docs[0].pedalboard };
      return queried_pedalboard;
    } else if (read == "presets") {
      const queried_presets = { presets: data.docs[0].presets };
      return queried_presets;
    }

  } catch (err) {

    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: "Failed to load." + err.message,
      confirmButtonText: 'Ok',
      buttonsStyling: false,
      customClass: {
        confirmButton: 'bx--btn bx--btn--danger'
      }
    });

  }
}


// Load pedals.json once and cache
let pedalsJsonCache = null;

fetch('https://lucacrippa88.github.io/PedalPlex/pedals.json')
  .then(res => {
    if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
    return res.json();
  })
  .then(data => {
    // Adjust this depending on your JSON structure:
    // If your JSON root is an object with a "pedals" array:
    if (data.pedals && Array.isArray(data.pedals)) {
      pedalsJsonCache = data.pedals;
    } else if (data.Pedals && Array.isArray(data.Pedals)) {
      pedalsJsonCache = data.Pedals; // <-- add this line to handle uppercase key
    } else if (Array.isArray(data)) {
      pedalsJsonCache = data;
    } else {
      console.warn("Unexpected pedals.json structure:", data);
      pedalsJsonCache = [];
    }

  })
  .catch(err => console.error('Failed to load pedals.json:', err));