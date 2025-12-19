// Recupera tutti i preset guest per la pedalboard corrente
function getGuestPresets(boardId) {
  const stored = localStorage.getItem("guestPresets");
  let presets = stored ? JSON.parse(stored) : [];
  return presets.filter(p => p.board_id === boardId);
}

// Salva un preset guest nel localStorage
function saveGuestPreset(preset) {
  const stored = localStorage.getItem("guestPresets");
  let presets = stored ? JSON.parse(stored) : [];

  const existingIndex = presets.findIndex(p => p._id === preset._id);
  if (existingIndex >= 0) {
    presets[existingIndex] = preset; // aggiorna
  } else {
    presets.push(preset); // aggiunge
  }

  localStorage.setItem("guestPresets", JSON.stringify(presets));
}

// Genera un nuovo ID guest univoco
function generateGuestPresetId() {
  const stored = localStorage.getItem("guestPresets");
  const presets = stored ? JSON.parse(stored) : [];
  let maxId = presets.reduce((max, p) => {
    if (p._id.startsWith("guest_preset_")) {
      const n = parseInt(p._id.replace("guest_preset_", ""));
      return Math.max(max, n);
    }
    return max;
  }, 0);
  return `guest_preset_${maxId + 1}`;
}

// Esporta tutti i preset guest di una pedalboard in JSON
function exportGuestPresets(boardId) {
  const presets = getGuestPresets(boardId);
  const jsonStr = JSON.stringify(presets, null, 2);
  return jsonStr;
}

// Importa preset guest da JSON
function importGuestPresets(jsonStr) {
  try {
    const imported = JSON.parse(jsonStr);
    if (!Array.isArray(imported)) throw new Error("JSON non valido");

    const stored = localStorage.getItem("guestPresets");
    let presets = stored ? JSON.parse(stored) : [];

    imported.forEach(preset => {
      // Assicurati di avere un _id valido
      if (!preset._id) preset._id = generateGuestPresetId();
      const existingIndex = presets.findIndex(p => p._id === preset._id);
      if (existingIndex >= 0) presets[existingIndex] = preset;
      else presets.push(preset);
    });

    localStorage.setItem("guestPresets", JSON.stringify(presets));
    return true;
  } catch (err) {
    console.error("Errore import preset guest:", err);
    return false;
  }
}
