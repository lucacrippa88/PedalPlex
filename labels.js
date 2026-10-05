// ---- Global label configuration ----
// Set USE_PRESET_LABELS = true  → show "Preset" / "Gear Preset" to users
// Set USE_PRESET_LABELS = false → show "Plex" / "SubPlex" to users (original branding)

const USE_PRESET_LABELS = true;

const L = USE_PRESET_LABELS
  ? {
      // singular
      Plex:    "Preset",
      plex:    "preset",
      SubPlex: "Gear Preset",
      subplex: "gear preset",
      // plural
      Plexes:    "Presets",
      plexes:    "presets",
      SubPlexes: "Gear Presets",
      subplexes: "gear presets",
    }
  : {
      // singular
      Plex:    "Plex",
      plex:    "plex",
      SubPlex: "SubPlex",
      subplex: "subplex",
      // plural
      Plexes:    "Plexes",
      plexes:    "plexes",
      SubPlexes: "SubPlexes",
      subplexes: "subplexes",
    };
