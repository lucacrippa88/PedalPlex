const presetURL = "https://lucacrippa88.github.io/guitar-pedal-presets/presets.json";
    let presets = [];

    async function fetchPresets() {
      try {
        const res = await fetch(presetURL);
        presets = await res.json();
        populatePresets();
        loadSelectedPreset();
      } catch (e) {
        console.error("Failed to load presets:", e);
        alert("Could not load presets.json");
      }
    }

    function populatePresets() {
      const select = document.getElementById("preset-select");
      presets.forEach((preset, i) => {
        const option = document.createElement("option");
        option.value = i;
        option.textContent = preset.name;
        select.appendChild(option);
      });
      select.onchange = loadSelectedPreset;
    }

    function loadSelectedPreset() {
      const idx = document.getElementById("preset-select").value;
      const preset = presets[idx];
      const board = document.getElementById("pedal-board");
      board.innerHTML = "";
      const pedal = createPedal(preset);
      board.appendChild(pedal);
    }

    function createPedal(preset) {
      const container = document.createElement("div");
      container.className = "pedal";
      container.style.backgroundColor = preset.color;

      const name = document.createElement("div");
      name.className = "pedal-name";
      name.textContent = preset.name;
      container.appendChild(name);

      const row = document.createElement("div");
      row.className = "control-row";

      preset.controls.forEach(control => {
        row.appendChild(createControl(control, preset.controls));
      });

      container.appendChild(row);
      return container;
    }

    function createControl(control, allControls) {
      const wrapper = document.createElement("div");
      wrapper.className = "control-wrapper";

      if (control.type === "knob-out") {
        const outer = createKnob(control, "outer");
        wrapper.appendChild(outer);

        const innerControl = allControls.find(c => c.type === "knob-in");
        if (innerControl) {
          const inner = createKnob(innerControl, "inner");
          outer.appendChild(inner);
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

    function createKnob(control, variant) {
      const knob = document.createElement("div");
      knob.className = `knob ${variant || ""}`;
      knob.title = `${control.label}: ${control.value}`;
      knob.style.setProperty("--rotation", `${(control.value / control.max) * 270 - 135}deg`);

      knob.onclick = () => {
        control.value = (control.value + 1) % (control.max + 1);
        knob.style.setProperty("--rotation", `${(control.value / control.max) * 270 - 135}deg`);
        knob.title = `${control.label}: ${control.value}`;
      };

      return knob;
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

    function createSwitch(control) {
      const sw = document.createElement("div");
      sw.className = "switch";
      sw.textContent = control.value ? "On" : "Off";

      sw.onclick = () => {
        control.value = !control.value;
        sw.textContent = control.value ? "On" : "Off";
      };

      return sw;
    }

    window.onload = fetchPresets;