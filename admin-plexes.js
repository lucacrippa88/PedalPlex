/**
 * admin-plexes.js
 * Admin-only page: browse all users' Plexes with a full rendered preview.
 *
 * Requires (loaded before this file):
 *   utils.js        → renderFullPedalboard(), renderPedalControls(), etc.
 *   subplexes.js    → subplex helpers
 *   helpers.js, labels.js
 *
 * applyPresetToPedalboard is defined in plexes.js which is NOT loaded here
 * (it depends on the full plexes page DOM). We inline a minimal version below.
 */

'use strict';

const ADMIN_API = 'https://api.pedalplex.com/ADMIN_GET_USER_PLEXES.php';

// resultsDiv must exist as a global var so renderFullPedalboard() in utils.js
// can find it. (plexes.js is not loaded on this page.)
// eslint-disable-next-line no-var
var resultsDiv = null;

// ─── State ────────────────────────────────────────────────────────────────────
let _adminToken   = '';
let _allUsers     = [];     // full user list as returned by the API
let _currentSort  = 'plexes'; // 'plexes' | 'update'
let _previewUser  = null;   // { user_id, plexes[], boards[] }
let _previewPlex  = null;   // currently selected plex doc

// ─── Entry point ─────────────────────────────────────────────────────────────
async function initAdminPlexes(token) {
  _adminToken = token;

  // Set the global resultsDiv required by renderFullPedalboard (utils.js guard)
  resultsDiv = document.getElementById('admin-preset-container');

  // Wire up sort buttons
  document.getElementById('sort-plexes-btn')?.addEventListener('click', () => setSortMode('plexes'));
  document.getElementById('sort-update-btn')?.addEventListener('click', () => setSortMode('update'));

  try {
    const res  = await fetch(ADMIN_API + '?mode=list', {
      headers: { Authorization: 'Bearer ' + token }
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    _allUsers = data.users || [];
    renderUserList(_allUsers);
  } catch (err) {
    document.getElementById('admin-list-inner').innerHTML =
      `<p style="color:#ff5252;">Error: ${err.message}</p>`;
  }
}

// ─── Sort ─────────────────────────────────────────────────────────────────────
function setSortMode(mode) {
  _currentSort = mode;

  // Update button styles: active = tertiary, inactive = ghost
  const plexBtn   = document.getElementById('sort-plexes-btn');
  const updateBtn = document.getElementById('sort-update-btn');
  if (plexBtn && updateBtn) {
    const isPlexes = mode === 'plexes';
    plexBtn.className   = `bx--btn bx--btn--sm ${isPlexes  ? 'bx--btn--tertiary' : 'bx--btn--ghost'}`;
    updateBtn.className = `bx--btn bx--btn--sm ${!isPlexes ? 'bx--btn--tertiary' : 'bx--btn--ghost'}`;
    plexBtn.textContent   = '# Plexes' + (isPlexes  ? ' ↓' : '');
    updateBtn.textContent = 'Last update' + (!isPlexes ? ' ↓' : '');
  }

  renderUserList(_allUsers);
}

// ─── Render user list ─────────────────────────────────────────────────────────
function renderUserList(users) {
  // Sort a copy — never mutate _allUsers
  const sorted = users.slice().sort((a, b) => {
    if (_currentSort === 'update') {
      const ta = a.last_update ? new Date(a.last_update).getTime() : 0;
      const tb = b.last_update ? new Date(b.last_update).getTime() : 0;
      return tb - ta; // newest first
    }
    // default: sort by plex_count desc
    return b.plex_count - a.plex_count;
  });

  const container = document.getElementById('admin-list-inner');
  if (!sorted.length) {
    container.innerHTML = '<p style="opacity:0.5;">No users with plexes found.</p>';
    return;
  }

  const rows = sorted.map(u => {
    const uid     = u.user_id.replace(/^user_/, '');
    const boards  = (u.board_names || []).join(', ') || '—';
    const updated = u.last_update ? new Date(u.last_update).toLocaleDateString() : '—';
    return `
      <div class="admin-user-row">
        <div class="admin-user-info">
          <div class="admin-user-id">${escHtml(uid)}</div>
          <div class="admin-user-meta">${u.plex_count} plex${u.plex_count !== 1 ? 'es' : ''} · rigs: ${escHtml(boards)} · last edit: ${updated}</div>
        </div>
        <button
          class="bx--btn bx--btn--tertiary bx--btn--sm admin-preview-btn"
          data-uid="${escHtml(u.user_id)}">
          View Plexes
        </button>
      </div>`;
  }).join('');

  container.innerHTML = rows;

  container.querySelectorAll('.admin-preview-btn').forEach(btn => {
    btn.addEventListener('click', () => openPreview(btn.dataset.uid));
  });
}

// ─── Open preview modal ───────────────────────────────────────────────────────
async function openPreview(userId) {
  const modal = document.getElementById('admin-preview-modal');
  modal.classList.add('active');

  // Reset
  document.getElementById('admin-preview-title').textContent   = userId.replace(/^user_/, '');
  document.getElementById('admin-preview-subtitle').textContent = 'Loading…';
  document.getElementById('admin-plex-select').innerHTML = '';
  document.getElementById('preset').innerHTML = '';
  window.pedalboard   = { pedals: [] };
  window.catalog      = [];
  window.catalogMap   = {};

  try {
    const res  = await fetch(
      `${ADMIN_API}?mode=plexes&user_id=${encodeURIComponent(userId)}`,
      { headers: { Authorization: 'Bearer ' + _adminToken } }
    );
    const data = await res.json();
    if (data.error) throw new Error(data.error);

    const plexes = data.plexes || [];
    const boards = data.boards || [];

    if (!plexes.length) {
      document.getElementById('admin-preview-subtitle').textContent = 'No plexes found.';
      return;
    }

    _previewUser = { userId, plexes, boards };

    document.getElementById('admin-preview-subtitle').textContent =
      `${plexes.length} plex${plexes.length !== 1 ? 'es' : ''} · ${boards.length} rig${boards.length !== 1 ? 's' : ''}`;

    // Populate plex select
    const sel = document.getElementById('admin-plex-select');
    sel.innerHTML = '';
    plexes.forEach(p => {
      const opt = document.createElement('option');
      opt.value       = p._id;
      opt.textContent = `${p.preset_name || '(unnamed)'}  [${p.board_name || p.board_id || '?'}]`;
      sel.appendChild(opt);
    });

    sel.onchange = () => loadPlex(sel.value);

    // Auto-load first plex
    await loadPlex(plexes[0]._id);

  } catch (err) {
    document.getElementById('admin-preview-subtitle').textContent = 'Error: ' + err.message;
  }
}

// ─── Load a specific plex into the preview ───────────────────────────────────
async function loadPlex(plexId) {
  if (!_previewUser) return;

  const plex = _previewUser.plexes.find(p => p._id === plexId);
  if (!plex) return;
  _previewPlex = plex;

  // Find the board that owns this plex
  const board = _previewUser.boards.find(b => b._id === plex.board_id)
    || { _id: plex.board_id, board_name: plex.board_name || '?', pedals: [] };

  // Collect all gear IDs from the plex pedals object + rig pedals
  const plexGearIds  = Object.keys(plex.pedals || {});
  const rigGearIds   = (board.pedals || []).map(p => p.pedal_id);
  const allIds       = [...new Set([...plexGearIds, ...rigGearIds])].filter(Boolean);

  // Reset global state used by renderFullPedalboard
  window.catalog    = [];
  window.catalogMap = {};
  window.presetMap  = {};

  // Fetch gear data
  if (allIds.length) {
    try {
      const res  = await fetch('https://api.pedalplex.com/GET_GEARS_BY_IDS.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + _adminToken
        },
        body: JSON.stringify({ ids: allIds })
      });
      const data = await res.json();
      window.catalog = data.docs || [];
      window.catalog.forEach(g => { window.catalogMap[g._id] = g; });
    } catch (err) {
      console.error('[admin-plexes] gear fetch error:', err);
    }
  }

  // Build a synthetic pedalboard from the rig.
  // If the rig has no pedals, synthesise one entry per gear referenced by the plex.
  let pedalEntries = board.pedals || [];
  if (!pedalEntries.length && plexGearIds.length) {
    pedalEntries = plexGearIds.map((id, i) => ({ pedal_id: id, row: 1, rotation: 0 }));
  }

  window.pedalboard = {
    _id:        board._id   || 'admin-preview',
    board_name: board.board_name || '?',
    pedals:     pedalEntries
  };

  // Render the pedalboard (full plex-style: images + knobs)
  await renderFullPedalboard(window.pedalboard);

  // Apply the plex knob values on top
  adminApplyPreset(plex);
}

// ─── Minimal applyPresetToPedalboard for read-only admin view ─────────────────
// (plexes.js is not loaded here; this is a self-contained copy for view-only)
function adminApplyPreset(presetDoc) {
  const pedalsFromPreset = presetDoc.pedals || {};

  document.querySelectorAll('#preset .pedal-catalog').forEach(pedalEl => {
    const $pedalDiv = $(pedalEl);
    const pedalId   = $pedalDiv.data('pedal-id') || pedalEl.dataset.pedalId;
    if (!pedalId) return;

    const defaultPedalFromCatalog = window.catalog.find(p => p._id === pedalId);
    if (!defaultPedalFromCatalog) return;

    // Deep-clone the catalog entry and overlay preset values
    const resetPedal = JSON.parse(JSON.stringify(defaultPedalFromCatalog));
    const presetPedal = pedalsFromPreset[pedalId];
    if (presetPedal && presetPedal.controls) {
      (resetPedal.controls || []).forEach(row => {
        (row.row || []).forEach(ctrl => {
          if (Object.prototype.hasOwnProperty.call(presetPedal.controls, ctrl.label)) {
            ctrl.value = presetPedal.controls[ctrl.label];
          }
        });
      });
    }

    // Re-render controls with preset values
    $pedalDiv.find('.row').remove();
    if (typeof renderPedalControls === 'function') {
      renderPedalControls(resetPedal, $pedalDiv);
    }

    // Pedal name
    const $existing = $pedalDiv.find('.pedal-name, .head-name').first();
    const nameClass  = $existing.hasClass('head-name') ? 'head-name' : 'pedal-name';
    const $after     = $existing.next();
    $existing.remove();
    const $nameDiv = $('<div>').addClass(nameClass).html(resetPedal.name).attr('style', resetPedal.logo || '');
    if ($after.length) $nameDiv.insertBefore($after); else $pedalDiv.prepend($nameDiv);

    // View-only: disable all interactive controls inside the pedal
    $pedalDiv.find('input, select, button').attr('disabled', true);
    $pedalDiv.css('pointer-events', 'none');
  });
}

// ─── Close modal ─────────────────────────────────────────────────────────────
document.getElementById('admin-preview-close')?.addEventListener('click', () => {
  document.getElementById('admin-preview-modal').classList.remove('active');
  // Clean up global state so the next preview starts fresh
  window.pedalboard = { pedals: [] };
  window.catalog    = [];
  window.catalogMap = {};
  document.getElementById('preset').innerHTML = '';
});

document.getElementById('admin-preview-modal')?.addEventListener('click', function (e) {
  if (e.target === this) {
    document.getElementById('admin-preview-close').click();
  }
});

// ─── Utility ──────────────────────────────────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
