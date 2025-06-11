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


// 2. Fill dropdown with preset names
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

// 3. Load selected preset into textarea
function loadSelectedPreset() {
  const selected = document.getElementById("presetSelect").value;
  document.getElementById("jsonInput").value = JSON.stringify(presets[selected], null, 2);
  loadPedals();
}

// 4. Render pedals on screen from JSON textarea
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
          });

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








function createControl(control, parent) {
  const wrapper = document.createElement("div");
  wrapper.className = "control-wrapper";

  if (control.type === "knob-out") {
    const outer = createKnob(control, "outer");
    wrapper.appendChild(outer);

    // Look for a paired knob-in in the controls array
    const innerControl = parent.pairedKnobs?.find(k => k.label === control.label.replace("Manual", "Res"));
    if (innerControl) {
      const inner = createKnob(innerControl, "inner");
      outer.appendChild(inner); // append inside outer knob
    }
  } else if (control.type === "knob") {
    wrapper.appendChild(createKnob(control));
  } else if (control.type === "knob-select") {
    wrapper.appendChild(createKnobSelect(control));
  } else if (control.type === "switch") {
    wrapper.appendChild(createSwitch(control));
  }

  return wrapper;
}






function createKnobSelect(control) {
  const knob = document.createElement("div");
  knob.className = "knob select";
  knob.innerText = control.value;

  knob.onclick = () => {
    const index = control.modes.indexOf(control.value);
    control.value = control.modes[(index + 1) % control.modes.length];
    knob.innerText = control.value;
  };

  return knob;
}





function createKnob(control, variant) {
  const knob = document.createElement("div");
  knob.className = `knob ${variant || ""}`;
  knob.title = `${control.label}: ${control.value}`;

  knob.style.setProperty("--rotation", (control.value / control.max * 270 - 135) + "deg");

  knob.onclick = () => {
    control.value = (control.value + 1) % (control.max + 1);
    knob.style.setProperty("--rotation", (control.value / control.max * 270 - 135) + "deg");
    knob.title = `${control.label}: ${control.value}`;
  };

  return knob;
}









// THIS GOES AT THE BOTTOM
window.onload = () => {
  fetchPresets();
};