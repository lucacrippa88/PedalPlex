let presets = null;

async function fetchPresets() {
  try {
    const response = await fetch('https://lucacrippa88.github.io/PedalPlex/presets.json');
    presets = await response.json();
    populatePresets();
    loadSelectedPreset();
  } catch (e) {
    console.error("Failed to load presets:", e);
    alert("Could not load presets.json");
  }
}

function populatePresets() {
  const select = document.getElementById("presetSelect");
  select.innerHTML = "";
  for (const name in presets) {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
  }
}

function loadSelectedPreset() {
  const selected = document.getElementById("presetSelect").value;
  document.getElementById("jsonInput").value = JSON.stringify(presets[selected], null, 2);
  loadPedals();
}

function loadPedals() {
  const input = document.getElementById("jsonInput").value;
  const container = document.getElementById("pedalboard");
  container.innerHTML = "";

  try {
    const pedals = JSON.parse(input);

    pedals.forEach(pedal => {
      const pedalDiv = document.createElement("div");
      pedalDiv.className = "pedal";
      pedalDiv.style.backgroundColor = pedal.color || "#333";

      const title = document.createElement("h2");
      title.textContent = pedal.name;
      pedalDiv.appendChild(title);

      const knobRow = document.createElement("div");
      knobRow.className = "knob-row";
      const switchRow = document.createElement("div");
      switchRow.className = "control-row";

      pedal.controls.forEach(control => {
        if (control.type === "knob") {
          const knobContainer = document.createElement("div");
          knobContainer.className = "knob-container";

          const knob = document.createElement("div");
          knob.className = "knob";

          // Discrete knob with values array (modes)
          if (control.values) {
            const steps = control.values.length;
            const angleStep = 270 / (steps - 1);
            let angle = angleStep * control.value - 135;

            knob.style.transform = `rotate(${angle}deg)`;

            let dragging = false;

            knob.addEventListener("mousedown", () => dragging = true);
            document.addEventListener("mouseup", () => dragging = false);
            document.addEventListener("mousemove", e => {
              if (!dragging) return;

              const rect = knob.getBoundingClientRect();
              const centerX = rect.left + rect.width / 2;
              const centerY = rect.top + rect.height / 2;
              const dx = e.clientX - centerX;
              const dy = centerY - e.clientY;
              let rad = Math.atan2(dy, dx);
              let deg = rad * (180 / Math.PI);
              deg = Math.max(-135, Math.min(135, deg));

              knob.style.transform = `rotate(${deg}deg)`;

              let index = Math.round((deg + 135) / angleStep);
              index = Math.max(0, Math.min(steps - 1, index));
              control.value = index;

              knob.textContent = control.values[index];
              knob.style.color = "#fff";
              knob.style.fontSize = "0.6em";
              knob.style.textAlign = "center";
              knob.style.lineHeight = knob.style.height || "50px";
            });

            knob.textContent = control.values[control.value];
            knob.style.color = "#fff";
            knob.style.fontSize = "0.6em";
            knob.style.textAlign = "center";
            knob.style.lineHeight = knob.style.height || "50px";

          } 
          // Discrete full 360° knob
          else if (control.span === "all" && control.values && control.values.length > 1) {
            // Treat it like discrete with full 360°
            const steps = control.values.length;
            const angleStep = 360 / steps;
            let angle = angleStep * control.value; // control.value is index

            knob.style.transform = `rotate(${angle}deg)`;

            let dragging = false;

            knob.addEventListener("mousedown", () => dragging = true);
            document.addEventListener("mouseup", () => dragging = false);
            document.addEventListener("mousemove", e => {
              if (!dragging) return;

              const rect = knob.getBoundingClientRect();
              const centerX = rect.left + rect.width / 2;
              const centerY = rect.top + rect.height / 2;
              const dx = e.clientX - centerX;
              const dy = centerY - e.clientY;
              let rad = Math.atan2(dy, dx);
              let deg = rad * (180 / Math.PI);
              if (deg < 0) deg += 360;

              knob.style.transform = `rotate(${deg}deg)`;

              let index = Math.round(deg / angleStep) % steps;
              control.value = index;

              knob.textContent = control.values[index];
              knob.style.color = "#fff";
              knob.style.fontSize = "0.6em";
              knob.style.textAlign = "center";
              knob.style.lineHeight = knob.style.height || "50px";
            });

            knob.textContent = control.values[control.value];
            knob.style.color = "#fff";
            knob.style.fontSize = "0.6em";
            knob.style.textAlign = "center";
            knob.style.lineHeight = knob.style.height || "50px";

          } 
          // Continuous knob (default)
          else {
            let minAngle = -135;
            let maxAngle = 135;
            let range = control.max - control.min;

            let angle;
            if (control.span === "all") {
              minAngle = 0;
              maxAngle = 360;
              angle = ((control.value - control.min) / range) * 360;
            } else {
              angle = ((control.value - control.min) / range) * 270 - 135;
            }

            knob.style.transform = `rotate(${angle}deg)`;

            let dragging = false;

            knob.addEventListener("mousedown", () => dragging = true);
            document.addEventListener("mouseup", () => dragging = false);
            document.addEventListener("mousemove", e => {
              if (!dragging) return;

              const rect = knob.getBoundingClientRect();
              const centerX = rect.left + rect.width / 2;
              const centerY = rect.top + rect.height / 2;
              const dx = e.clientX - centerX;
              const dy = centerY - e.clientY;
              let rad = Math.atan2(dy, dx);
              let deg = rad * (180 / Math.PI);

              if (control.span === "all") {
                if (deg < 0) deg += 360;
                deg = Math.max(0, Math.min(360, deg));
              } else {
                deg = Math.max(-135, Math.min(135, deg));
              }

              knob.style.transform = `rotate(${deg}deg)`;

              let percent;
              if (control.span === "all") {
                percent = deg / 360;
              } else {
                percent = (deg + 135) / 270;
              }

              control.value = Math.round(control.min + percent * range);
            });
          }

          const label = document.createElement("div");
          label.className = "control-label";
          label.textContent = control.label;

          knobContainer.appendChild(knob);
          knobContainer.appendChild(label);
          knobRow.appendChild(knobContainer);
        }

        if (control.type === "switch") {
          const label = document.createElement("label");
          label.textContent = control.label + ": ";

          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.checked = control.value;
          checkbox.className = "switch";

          label.appendChild(checkbox);
          switchRow.appendChild(label);
        }
      });

      pedalDiv.appendChild(knobRow);
      pedalDiv.appendChild(switchRow);
      container.appendChild(pedalDiv);
    });
  } catch (e) {
    alert("Invalid JSON!");
  }
}

window.onload = () => {
  fetchPresets();

  document.getElementById("presetSelect").addEventListener("change", () => {
    loadSelectedPreset();
  });

  document.getElementById("loadJsonBtn")?.addEventListener("click", () => {
    loadPedals();
  });
};
