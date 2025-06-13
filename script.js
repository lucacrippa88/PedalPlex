$(document).ready(function () {
  let pedals = [];
  let presets = {};

  // Load presets first
  $.getJSON("https://lucacrippa88.github.io/PedalPlex/presets.json", function (presetData) {
    presets = presetData;

    // Populate preset dropdown
    const $selector = $("<select id='preset-selector'><option disabled selected>Select a song preset</option></select><br><br>");
    for (const songName in presets) {
      $selector.append($("<option>").val(songName).text(songName));
    }

    $selector.on("change", function () {
      const selected = $(this).val();
      applyPreset(selected);
    });

    $("#pedalboard").before($selector); // Add dropdown before pedalboard
  });

  // Load pedalboard
  $.getJSON("https://lucacrippa88.github.io/PedalPlex/pedals.json", function (data) {
    pedals = data["Pedalboard 1"];

    pedals.forEach(pedal => {
      const $pedalDiv = $("<div>").addClass("pedal").css({
        background: pedal["inside-color"],
        border: `15px solid ${pedal["color"]}`,
        color: pedal["font-color"],
        width: getPedalWidth(pedal.width),
        height: getPedalHeight(pedal.height),
        boxShadow: "0 8px 16px rgba(0, 0, 0, 0.3)", // <- Add this line
      }).attr("data-pedal-name", pedal.name);

      // Controls
      pedal.controls.forEach(controlRow => {
        const $row = $("<div>").addClass("row");

        controlRow.row.forEach(control => {
          if (control.type === "knob" || control.type === "smallknob") {
            const isSmall = control.type === "smallknob";
            const knob = $("<div>")
              .addClass(isSmall ? "smallknob" : "knob")
              .css({
                background: pedal["knobs-color"],
                border: `2px solid ${pedal["knobs-border"]}`
              })
              .css("--indicator-color", pedal["knobs-indicator"])
              .attr("data-control-label", control.label);

            if (control.position === "left") {
              knob.css("margin-left", "auto");
            }

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

                const rotation = getRotationFromValue(control, control.value);
                knob.data("rotation", rotation);
                knob.css("transform", `rotate(${rotation}deg)`);

                if ($valueLabel) {
                  $valueLabel.text(control.value);
                }
              });

              $(document).on("mouseup.knob", function () {
                $(document).off(".knob");
              });
            });

            const $label = $("<div>").addClass("label-top").text(control.label);
            const $container = $("<div>").addClass("knob-container").append(knob);
            if ($valueLabel) $container.append($valueLabel);
            $row.append($("<div>").append($label, $container));
          }

          if (control.type === "led") {
            const selectedColor = control.colors[control.value] || "#000000";
            const $label = $("<div>").addClass("label-top");//.text(control.label);
            const led = $("<div>").addClass("led").css("background-color", selectedColor).attr("data-control-label", control.label);
            led.css("box-shadow", selectedColor.toLowerCase() !== "#000000" ? `0 0 8px 3px ${selectedColor}` : "none");
            $row.append($("<div>").append($label, led));
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

      //$pedalDiv.append($("<div>").addClass("pedal-name").text(pedal.name));
      const $nameDiv = $("<div>")
        .addClass("pedal-name")
        .text(pedal.name)
        .attr("style", pedal.logo || ""); // Apply logo style if present
        $pedalDiv.append($nameDiv);

      $("#pedalboard").append($pedalDiv);
    });
  });

  function applyPreset(songName) {
    const songPreset = presets[songName];
    if (!songPreset) return;

    songPreset.forEach(presetPedal => {
      const $pedalDiv = $(`.pedal[data-pedal-name="${presetPedal.name}"]`);
      if (!$pedalDiv.length) return;

      presetPedal.controls.forEach(presetControl => {
        const label = presetControl.label;
        const value = presetControl.value;

        // Try to find knob or other matching control
        const $control = $pedalDiv.find(`[data-control-label="${label}"]`);
        //console.log($control)

        if (!$control.length) return;

        if ($control.is("div.knob, div.smallknob")) {
          const controlObj = findControlObject(presetPedal.name, label);
          if (!controlObj) return;

          controlObj.value = value;
          const rotation = getRotationFromValue(controlObj, value);
          $control.data("rotation", rotation);
          $control.css("transform", `rotate(${rotation}deg`) ;
          $control.siblings(".knob-value-label").text(value);
        }

        if ($control.is("select")) {
          $control.val(value);
        }

        if ($control.is("div.led")) {
            const controlObj = findControlObject(presetPedal.name, label);
            if (!controlObj || !controlObj.colors) return;

            const newColor = controlObj.colors[value] || "#000000";
            $control.css("background-color", newColor);
            if (newColor.toLowerCase() !== "#000000" && newColor.toLowerCase() !== "black") {
                $control.css("box-shadow", `0 0 8px 3px ${newColor}`);
            } else {
                $control.css("box-shadow", "none");
            }
        }

        if ($control.is("input[type='checkbox']")) {
          $control.prop("checked", value);
        }
      });
    });
  }

  function findControlObject(pedalName, controlLabel) {
    for (const pedal of pedals) {
      if (pedal.name === pedalName) {
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
      case "xlarge": return "300px";
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
