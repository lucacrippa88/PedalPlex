let presets = null;

async function fetchPresets() {
  try {
    const response = await fetch('https://lucacrippa88.github.io/PedalPlex/presets.json');
    presets = await response.json();
    populatePresets(presets);
    loadSelectedPreset(presets);
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
      pedalDiv.style.borderColor = pedal.color || "#333";
      const fontColor = pedal["font-color"] || "#000";
      const insideColor = pedal["inside-color"] || "#000";
      const knobColor = pedal["knobs-color"] || "#ccc";
      const knobBorder = pedal["knobs-border"] || "#333";
      const knobIndicator = pedal["knobs-indicator"] || "#fff";

      pedalDiv.style.background = `${insideColor}`;
      pedalDiv.style.color = `${fontColor}`;

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
          knob.style.background = `${knobColor}`;
          knob.style.borderColor = `${knobBorder}`;

          const indicator = document.createElement("div");
          indicator.className = "knob-indicator";
          indicator.style.backgroundColor = knobIndicator;
          knob.appendChild(indicator);



          const valueLabel = document.createElement("div");
          valueLabel.className = "value-label";

          // Handle discrete knob with span: all (0–360°)
          if (Array.isArray(control.values) && control.span === "all") {
            const steps = control.values.length;
            const angleStep = 360 / steps;
            let index = control.value || 0;
            let angle = index * angleStep;
            knob.style.transform = `rotate(${angle}deg)`;
            valueLabel.textContent = control.values[index];
            knobContainer.appendChild(valueLabel);

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
              let deg = (rad * 180) / Math.PI;
              deg = (deg + 360) % 360;
              let newIndex = Math.round(deg / angleStep) % steps;
              knob.style.transform = `rotate(${newIndex * angleStep}deg)`;
              control.value = newIndex;
              valueLabel.textContent = control.values[newIndex];
            });

          } else if (Array.isArray(control.values)) {
            // Handle discrete knob with 270° range (default)
            const steps = control.values.length;
            const angleStep = 270 / (steps - 1);
            let index = control.value || 0;
            let angle = index * angleStep - 135;
            knob.style.transform = `rotate(${angle}deg)`;
            valueLabel.textContent = control.values[index];
            knobContainer.appendChild(valueLabel);

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
              let deg = (rad * 180) / Math.PI;
              deg = Math.max(-135, Math.min(135, deg));
              let relDeg = deg + 135;
              let newIndex = Math.round(relDeg / angleStep);
              newIndex = Math.max(0, Math.min(steps - 1, newIndex));
              knob.style.transform = `rotate(${newIndex * angleStep - 135}deg)`;
              control.value = newIndex;
              valueLabel.textContent = control.values[newIndex];
            });

          } else {
            // Analog knob with continuous value
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
              let deg = (rad * 180) / Math.PI;
              deg = Math.max(-135, Math.min(135, deg));
              knob.style.transform = `rotate(${deg}deg)`;
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
          label.className = "switch"
          label.textContent = control.label + ": ";

          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.checked = control.value;
          checkbox.className = "switch";

          const slider = document.createElement("span");
          slider.className = "slider";

          label.appendChild(checkbox);
          label.appendChild(slider);
          switchRow.appendChild(label);
        } 

  

        if (control.type === "3way") {
  const switchContainer = document.createElement("div");
  switchContainer.className = "three-way-switch";

  const label = document.createElement("div");
  label.className = "control-label";
  label.textContent = control.label;
  switchContainer.appendChild(label);

  const stateLabel = document.createElement("div");
  stateLabel.className = "switch-state-label";

  let currentIndex = control.values.indexOf(control.value);
  if (currentIndex === -1) currentIndex = 0;

  stateLabel.textContent = control.values[currentIndex];

  const toggleTrack = document.createElement("div");
  toggleTrack.className = "toggle-track";

  const toggleThumb = document.createElement("div");
  toggleThumb.className = "toggle-thumb";

  function updateThumb() {
    const percent = (100 / (control.values.length - 1)) * currentIndex;
    toggleThumb.style.left = `${percent}%`;
    stateLabel.textContent = control.values[currentIndex];
  }

  toggleTrack.addEventListener("click", () => {
    currentIndex = (currentIndex + 1) % control.values.length;
    control.value = control.values[currentIndex];
    updateThumb();
  });

  updateThumb();
  toggleTrack.appendChild(toggleThumb);
  switchContainer.appendChild(stateLabel);
  switchContainer.appendChild(toggleTrack);
  switchRow.appendChild(switchContainer);
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

window.onload = () => {
  fetchPresets();
};
