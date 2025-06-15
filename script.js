$(document).ready(function () {
  let pedals = [];
  let presets = {};
  let pedalboard = {};

  const loadJSON = url => $.getJSON(url);

// Step 1: Load presets and build dropdown
loadJSON("https://lucacrippa88.github.io/PedalPlex/presets.json").then(presetData => {
  // Flatten the array of preset objects into a single presets map
  presets = {};
  presetData.Presets.forEach(presetObj => {
    Object.entries(presetObj).forEach(([songName, preset]) => {
      presets[songName] = preset;
    });
  });

  // Create dropdown
  const $selector = $("<select id='preset-selector'><option disabled selected>Select a song preset</option></select><br><br>");
  for (const songName in presets) {
    $selector.append($("<option>").val(songName).text(songName));
  }

  $selector.on("change", function () {
    const selected = $(this).val();
    applyPreset(selected);
  });

  $("#pedalboard").before($selector); // Insert the dropdown

    // Load pedalboard next
    return loadJSON("https://lucacrippa88.github.io/PedalPlex/pedalboard.json");
  }).then(pedalboardData => {
    pedalboard = pedalboardData;

    // Load pedal catalog
    return loadJSON("https://lucacrippa88.github.io/PedalPlex/pedals.json");
  }).then(data => {
    pedals = data["Pedals"];

    // Render pedals after everything has loaded
    pedals.forEach(pedal => {
      if (pedalboard.pedalboard.some(item => item.includes(pedal.id))) {

        const $pedalDiv = $("<div>").addClass("pedal").css({
          background: pedal["inside-color"],
          border: `10px solid ${pedal["color"]}`,
          color: pedal["font-color"],
          width: getPedalWidth(pedal.width),
          height: getPedalHeight(pedal.height),
          boxShadow: `0 8px 16px rgba(0, 0, 0, 0.3), inset 0 -36px 0 0 ${pedal["color"]}`,
        }).attr("data-pedal-name", pedal.name);

        // Controls rendering (identical to your original)
        pedal.controls.forEach(controlRow => {
          const $row = $("<div>").addClass("row");

          controlRow.row.forEach(control => {
            if (control.type === "knob" || control.type === "smallknob" || control.type === "largeknob") {
              const isSmall = control.type === "smallknob";
              const isLarge = control.type === "largeknob";
              const knob = $("<div>")
                .addClass(isSmall ? "smallknob" : "knob")
                .addClass(isLarge ? "largeknob" : "knob")
                .css({
                  background: pedal["knobs-color"],
                  border: `2px solid ${pedal["knobs-border"]}`
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
                  left: "20px",
                  top: "110px",
                  transform: "translateY(-50%)",
                  "white-space": "nowrap",
                  "font-size": "10px"
                }).text(control.label);
              } 
 else {
                $label = $("<div>").addClass("label-top").text(control.label);
              }

              const $container = $("<div>").addClass("knob-container").append(knob).css({ position: "relative" });
              $container.append($label);
              if ($valueLabel) $container.append($valueLabel);
              const $knobWrapper = $("<div>").append($label, $container);

              if (control.position === "under-top" && $row.children().length > 0) {
                const $prev = $row.children().last();
                $prev.append($("<div>").css("margin-top", "-52px").append($label, $container));
              } else if (control.position === "higher" && $row.children().length > 0) {
                const $prev = $row.children().last();
                $prev.append($("<div>").css("margin-top", "-30px").append($label, $container));
              } else {
                $row.append($knobWrapper);
              }
            }

            if (control.type === "led") {
              const selectedColor = control.colors[control.value] || "#000000";
              const $label = $("<div>").addClass("label-top");
              const led = $("<div>")
                .addClass("led")
                .css("background-color", selectedColor)
                .attr("data-control-label", control.label);
              led.css("box-shadow", selectedColor.toLowerCase() !== "#000000" ? `0 0 8px 3px ${selectedColor}` : "none");

              const $ledContainer = $("<div>").append($label, led);
              if (control.position === "under-top" && $row.children().length > 0) {
                const $prev = $row.children().last();
                $prev.append($("<div>").css("margin-top", "0px").append($label, led));
              } else {
                $row.append($ledContainer);
              }
            }

            if (control.type === "multi") {
              const $label = $("<div>").addClass("label-top").text(control.label);
              const $select = $("<select>").attr("data-control-label", control.label);
              control.values.forEach(val => {
                const $option = $("<option>").val(val).text(val);
                if (val === control.value) $option.attr("selected", true);
                $select.append($option);
              });
              $row.append($("<div>").append($label, $select));
            }

            if (control.type === "switch") {
              const $label = $("<div>").addClass("label-top").text(control.label);
              const $input = $("<input type='checkbox'>").prop("checked", control.value).attr("data-control-label", control.label);
              $row.append($("<div>").append($label, $input));
            }
          });

          $pedalDiv.append($row);
        });

        const $nameDiv = $("<div>").addClass("pedal-name").text(pedal.name).attr("style", pedal.logo || "");
        $pedalDiv.append($nameDiv);

        $("#pedalboard").append($pedalDiv);

        // After the presets dropdown is fully populated and inserted, add a reset button:
        if ($("#refresh-btn").length === 0) {
        const $refreshBtn = $('<button id="refresh-btn" type="button" style="margin-left: 8px;">Reset controls</button>');
        $("#preset-selector").after($refreshBtn);
        $refreshBtn.on("click", () => location.reload());
        }

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
            if ($control.is("div.knob, div.smallknob, div.largeknob")) {
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

  function getPedalWidth(width) {
    switch (width) {
      case "small": return "100px";
      case "standard": return "190px";
      case "large": return "210px";
      case "xlarge": return "400px";
      default: return "190px";
    }
  }

  function getPedalHeight(height) {
    switch (height) {
      case "small": return "100px";
      case "standard": return "160px";
      case "large": return "200px";
      case "xlarge": return "265px";
      default: return "400px";
    }
  }

  function getRotationFromValue(control, value) {
    let index = 0, range = 1, min = 0, max = 1;

    if (control.values && Array.isArray(control.values)) {
      index = control.values.indexOf(value);
      if (index === -1) index = 0;
      min = 0;
      max = control.values.length - 1;
    } else {
      min = control.min ?? 0;
      max = control.max ?? 100;
      index = value;
    }

    range = max - min;

    let angleRange = control.span === "all" ? 360 : 270;
    let angleOffset = control.span === "all" ? 0 : -135;
    const ratio = (index - min) / range;

    return angleOffset + ratio * angleRange;
  }
});
