let presets = null;

async function fetchPresets() {
  try {
    const response = await fetch('https://lucacrippa88.github.io/PedalPlex/presets.json');
    presets = await response.json();
    console.log("Presets loaded:", presets);
    populatePresets();
    loadSelectedPreset();
  } catch (e) {
    console.error("Failed to load presets:", e);
    alert("Could not load presets.json");
  }
}

// Fill dropdown with preset names
function populatePresets() {
  const select = document.getElementById("presetSelect");
  select.innerHTML = "";

  for (const name in presets) {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
  }

  // Optionally select first preset
  if (select.options.length > 0) select.selectedIndex = 0;
}

// Load selected preset JSON into textarea and render pedals
function loadSelectedPreset() {
  const selected = document.getElementById("presetSelect").value;
  if (!selected || !presets[selected]) return;
  document.getElementById("jsonInput").value = JSON.stringify(presets[selected], null, 2);
  loadPedals();
}

// Render pedals on screen from JSON textarea
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
          knobContainer.style.position = "relative";

          const knob = document.createElement("div");
          knob.className = "knob";

          const indicator = document.createElement("div");
          indicator.className = "knob-indicator";
          knob.appendChild(indicator);

          if (control.values) {
            // Discrete knob with fixed positions from values array
            const steps = control.values.length;
            let index = control.value || 0;
            knob.dataset.index = index;

            let angle = (index / (steps - 1)) * 270 - 135;
            knob.style.transform = `rotate(${angle}deg)`;

            // Show selected mode label on top
            const modeLabel = document.createElement("div");
            modeLabel.className = "mode-label";
            modeLabel.textContent = control.values[index];
            knobContainer.appendChild(modeLabel);

            // Rotate to next mode on click
            knob.addEventListener("click", () => {
              index = (index + 1) % steps;
              knob.dataset.index = index;
              control.value = index;
              modeLabel.textContent = control.values[index];
              angle = (index / (steps - 1)) * 270 - 135;
              knob.style.transform = `rotate(${angle}deg)`;
            });
          } else {
            // Continuous rotation knob
            const range = control.max - control.min;
            let angle = (control.value - control.min) / range * 270 - 135;
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
              let clamped = Math.max(-135, Math.min(135, deg));
              knob.style.transform = `rotate(${clamped}deg)`;

              const percent = (clamped + 135) / 270;
              control.value = Math.round(control.min + percent * (control.max - control.min));
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
    console.error(e);
  }
}

// Event listeners
window.onload = () => {
  fetchPresets();

  document.getElementById("presetSelect").addEventListener("change", () => {
    loadSelectedPreset();
  });

  document.getElementById("jsonInput").addEventListener("input", () => {
    loadPedals();
  });
};
