$(document).ready(function () {
  $.getJSON("https://lucacrippa88.github.io/PedalPlex/pedals.json", function (data) {
    const pedals = data["Pedalboard 1"];

    pedals.forEach(pedal => {
      const $pedalDiv = $("<div>").addClass("pedal").css({
        background: pedal["inside-color"],
        border: `15px solid ${pedal["color"]}`,
        color: pedal["font-color"],
        width: getPedalWidth(pedal.size)
      });

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
              .css("--indicator-color", pedal["knobs-indicator"]);

              if (control.position === "left") {
                //knob.css({}) // ADD HERE THE BEHAVIOUR
              }


            // Calculate rotation
            const rotation = getRotationFromValue(control, control.value);
            knob.data("rotation", rotation);
            knob.css("transform", `rotate(${rotation}deg)`);

            // Create value label if using discrete values
            let $valueLabel = null;
            if (control.values && Array.isArray(control.values)) {
              $valueLabel = $("<div>").addClass("knob-value-label").text(control.value);
            }

            // Mouse drag to change knob value
            knob.on("mousedown", function (e) {
              const startY = e.pageY;
              const startValue = control.value;

              $(document).on("mousemove.knob", function (e2) {
                const delta = startY - e2.pageY;
                const steps = Math.round(delta / 5);

                if (control.values && Array.isArray(control.values)) {
                  // Discrete values
                  let currentIndex = control.values.indexOf(startValue);
                  if (currentIndex === -1) currentIndex = 0;
                  let newIndex = Math.min(Math.max(currentIndex + steps, 0), control.values.length - 1);
                  control.value = control.values[newIndex];
                } else {
                  // Continuous values
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
            const $container = $("<div>").addClass("knob-container");
            $container.append(knob);
            if ($valueLabel) $container.append($valueLabel);
            $row.append($("<div>").append($label, $container));
          }

          if (control.type === "led") {
            const selectedColor = control.colors[control.value] || "#000000";
            const led = $("<div>").addClass("led").css("background-color", selectedColor);

            // Glow if not black
            if (selectedColor.toLowerCase() !== "#000000" && selectedColor.toLowerCase() !== "black") {
              led.css("box-shadow", `0 0 8px 3px ${selectedColor}`);
            } else {
              led.css("box-shadow", "none");
            }

            const $label = $("<div>").addClass("label-top").text(control.label);
            $row.append($("<div>").append($label, led));
          }

          if (control.type === "multi") {
            const $label = $("<div>").addClass("label-top").text(control.label);
            const $select = $("<select>");
            control.values.forEach(val => {
              const $option = $("<option>").val(val).text(val);
              if (val === control.value) $option.attr("selected", true);
              $select.append($option);
            });
            $row.append($("<div>").append($label, $select));
          }

          if (control.type === "switch") {
            const $label = $("<div>").addClass("label-top").text(control.label);
            const $input = $("<input type='checkbox'>").prop("checked", control.value);
            $row.append($("<div>").append($label, $input));
          }
        });

        $pedalDiv.append($row);
      });

      $pedalDiv.append($("<div>").addClass("pedal-name").text(pedal.name));
      $("#pedalboard").append($pedalDiv);
    });
  });

  function getPedalWidth(size) {
    switch (size) {
      case "small": return "100px";
      case "standard": return "190px";
      case "large": return "210px";
      case "xlarge": return "400px";
      default: return "190px";
    }
  }

  function getRotationFromValue(control, value) {
    let index = 0;
    let range = 1;
    let min = 0;
    let max = 1;

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

    let angleRange, angleOffset;
    if (control.span === "all") {
      angleRange = 360;
      angleOffset = 0;
    } else {
      angleRange = 270;
      angleOffset = -135;
    }

    const ratio = (index - min) / range;
    return angleOffset + ratio * angleRange;
  }
});
