// Load pedals catalog
async function loadJSON(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
}

const catalogDiv = document.getElementById('catalog');
const selectedPedalsDiv = document.getElementById('selected-pedals');
const selector = document.getElementById('pedalboard-selector');

let pedalsCatalog = [];
let selectedPedals = [];



// Helper to extract only the color value from the "logo" CSS string
function extractColorFromLogo(logoStr) {
  const match = logoStr.match(/color\s*:\s*(#[0-9a-fA-F]{3,6})/);
  return match ? match[1] : '#000'; // fallback black if not found
}

// Render the catalog pedals (from pedals.json)
function renderCatalog(filter = '') {
  catalogDiv.innerHTML = '';

  // Do not render anything if filter is empty
  if (!filter.trim()) return;

  pedalsCatalog
    .filter(pedal => pedal.id.toLowerCase().includes(filter))
    .sort((a, b) => a.id.localeCompare(b.id))
    .forEach(pedal => {
      const item = document.createElement('div');
      item.className = 'pedal-item';
      item.textContent = pedal.id;
      item.title = pedal.id;

      item.style.backgroundColor = pedal.color || '#fff';
      item.style.color = extractColorFromLogo(pedal.logo);

      if (selectedPedals.find(p => p.id === pedal.id)) {
        item.style.opacity = '0.5';
        item.style.pointerEvents = 'none';
      }

      item.onclick = () => addPedal(pedal);
      catalogDiv.appendChild(item);
    });
}




// Render the selected pedals (from DB or user selection)
function renderSelectedPedals() {
  selectedPedalsDiv.innerHTML = '';
  selectedPedals.forEach((pedal, index) => {
    const item = document.createElement('div');
    item.className = 'pedal-item selected-board';
    item.textContent = pedal.id;
    item.title = pedal.id;

    // Background from pedal.color
    item.style.backgroundColor = pedal.color || '#fff';

    // Text color from logo extracted color only
    item.style.color = extractColorFromLogo(pedal.logo);

    item.setAttribute('draggable', 'true');
    item.dataset.index = index;

    // Drag handlers
    item.addEventListener('dragstart', (e) => {
      item.classList.add('dragging');
      e.dataTransfer.setData('text/plain', index);
    });
    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
      selectedPedalsDiv.querySelectorAll('.pedal-item').forEach(i => i.classList.remove('drag-over'));
    });
    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      item.classList.add('drag-over');
    });
    item.addEventListener('dragleave', () => {
      item.classList.remove('drag-over');
    });
    item.addEventListener('drop', (e) => {
      e.preventDefault();
      item.classList.remove('drag-over');
      const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
      const targetIndex = parseInt(item.dataset.index, 10);
      if (!isNaN(draggedIndex) && draggedIndex !== targetIndex) {
        const [draggedPedal] = selectedPedals.splice(draggedIndex, 1);
        selectedPedals.splice(targetIndex, 0, draggedPedal);
        renderSelectedPedals();
        renderCatalog(searchInput.value.toLowerCase());
      }
    });

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '×';
    deleteBtn.className = 'delete-btn';
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      if (confirm(`Remove "${pedal.id}" from your pedalboard?`)) {
        selectedPedals.splice(index, 1);
        renderSelectedPedals();
        renderCatalog(searchInput.value.toLowerCase());
      }
    };

    item.appendChild(deleteBtn);
    selectedPedalsDiv.appendChild(item);
  });
}

// Add pedal helper (no duplicates)
function addPedal(pedal) {
  if (selectedPedals.some(p => p.id === pedal.id)) return;
  selectedPedals.push(pedal);
  renderSelectedPedals();
  renderCatalog(searchInput.value.toLowerCase());
}





loadJSON('https://lucacrippa88.github.io/PedalPlex/pedals.json')
  .then(data => {
    if (data && Array.isArray(data.Pedals)) {
      pedalsCatalog = data.Pedals.sort((a, b) => a.id.localeCompare(b.id));
      //renderCatalog();
    } else {
      catalogDiv.textContent = 'No pedals found in the data.';
    }
  })
  .catch(err => {
    catalogDiv.textContent = 'Failed to load pedals.';
    console.error(err);
  });

// Waiting for query...
const resultsDiv = document.getElementById("results");
resultsDiv.textContent = "Loading pedals..."; 

// Get pedalboard from DB
async function loadPedalboardDB(userId) {

      // Build selector
      const selector = {
        user_id: { "$eq": userId }
      }

      const query = {
        selector,
        limit: 20
      };

      try {
        const response = await fetch("https://www.cineteatrosanluigi.it/plex/get_pedalboard.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(query)
        });

        const data = await response.json();
        if (!data.docs || data.docs.length === 0) {
          resultsDiv.textContent = "No pedalboards found.";
          return;
        }

        resultsDiv.innerHTML = "";

        const firstDoc = data.docs[0];
        if (firstDoc && Array.isArray(firstDoc.pedalboard)) {
        selectedPedals = firstDoc.pedalboard
            .map(id => pedalsCatalog.find(p => p.id === id))
            .filter(p => p); // Remove undefined (in case a pedal no longer exists)

        renderSelectedPedals();
        renderCatalog();
        }

      } catch (err) {
        alert('Failed to load pedalboard. '+err.message);
      }
    }

    userId = "user-0";

    window.addEventListener('DOMContentLoaded', loadPedalboardDB(userId));



// Reset (empty) pedalboard
document.getElementById('reset-button').addEventListener('click', () => {
  if (confirm('Clear all pedals from your pedalboard?')) {
    selectedPedals = [];
    renderSelectedPedals();
    renderCatalog();
  }
});

// Handle search filtering
const searchInput = document.getElementById('search');
searchInput.addEventListener('input', () => {
  const query = searchInput.value.toLowerCase();
  renderCatalog(query);
});




// Save pedalboard to DB
document.getElementById('save-button').addEventListener('click', async () => {

  const pedalIds = selectedPedals.map(p => p.id);

  const response = await fetch('https://www.cineteatrosanluigi.it/plex/save_pedalboard.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: 'user-0',
      pedalboard: pedalIds
    })
  });

  try {
    const result = await response.json();
    if (result.success) {
      alert("Pedalboard saved successfully!");
    } else {
      alert("Error saving pedalboard: " + result.error);
    }
  } catch (err) {
    console.error('Invalid response:', err);
    alert("Unexpected error saving pedalboard.");
  }
});