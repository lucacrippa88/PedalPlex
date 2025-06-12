$(document).ready(function () {
  $.getJSON("https://lucacrippa88.github.io/PedalPlex/pedals.json", function (data) {
    const pedals = data["Pedalboard 1"];

    pedals.forEach(pedal => {
      const $pedalDiv = $("<div>").addClass("pedal").css({
        background: pedal.color,
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
              .css("--indicator-color", pedal["knobs-indicator"])
              .data("rotation", getRotationFromValue(control, control.value));

            knob.css("transform", `rotate(${knob.data("rotation")}deg)`);
            knob.get(0).style.setProperty("--knob-indicator", pedal["knobs-indicator"]);

            knob.get(0).style.setProperty("--knob-indicator", pedal["knobs-indicator"]);
            knob.get(0).style.setProperty("--knob-border", pedal["knobs-border"]);

            knob.get(0).style.setProperty("--knob-color", pedal["knobs-color"]);

            knob.css({
              backgroundColor: pedal["knobs-color"]
            });

            knob.get(0).style.setProperty("--knob-indicator", pedal["knobs-indicator"]);
            knob.get(0).style.setProperty("--knob-border", pedal["knobs-border"]);

            knob.find('::after');

            knob.on("mousedown", function (e) {
              const startY = e.pageY;
              const startValue = control.value;

              $(document).on("mousemove.knob", function (e2) {
                const delta = startY - e2.pageY;
                const steps = Math.round(delta / 5);
                const newValue = Math.min(Math.max(startValue + steps, control.min), control.max);
                control.value = newValue;

                const rotation = getRotationFromValue(control, newValue);
                knob.data("rotation", rotation);
                knob.css("transform", `rotate(${rotation}deg)`);
              });

              $(document).on("mouseup.knob", function () {
                $(document).off(".knob");
              });
            });

            const $label = $("<div>").addClass("label-top").text(control.label);
            $row.append($("<div>").append($label, knob));
          }

          if (control.type === "led") {
            const led = $("<div>").addClass("led").css("background", control.color);
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
      case "standard": return "160px";
      case "large": return "220px";
      case "xlarge": return "300px";
      default: return "160px";
    }
  }

  function getRotationFromValue(control, value) {
    const min = control.min ?? 0;
    const max = control.max ?? (control.values?.length - 1 ?? 1);
    const range = max - min;
    const angleRange = 270;
    const angleOffset = -135;

    const ratio = (value - min) / range;
    return angleOffset + ratio * angleRange;
  }
});
