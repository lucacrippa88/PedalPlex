async function handlePendingPedalAdd() {
  const pending = localStorage.getItem('pendingPedalAdd');
  if (!pending) return;

  const pedalData = JSON.parse(pending);
  const boardIndex = parseInt(localStorage.getItem('lastPedalboardId'), 10);

  if (isNaN(boardIndex)) {
    console.warn('Invalid pedalboard index');
    cleanupPendingPedalAdd();
    return;
  }

  // ASSUMIAMO che le pedalboard siano già caricate
  // e disponibili come array globale (es: window.pedalboards)
  if (!window.pedalboards || !window.pedalboards[boardIndex]) {
    console.error('Pedalboard not ready yet');
    return; // verrà ritentato
  }

  const board = window.pedalboards[boardIndex];

  // Inserisci il pedale
  board.pedals.push({
    pedal_id: pedalData.pedal_id,
    rotation: pedalData.rotation || 0,
    row: pedalData.row || 1
  });

  // Salva la pedaliera
  await savePedalboard(board);

  cleanupPendingPedalAdd();

  Swal.fire({
    icon: 'success',
    title: 'Pedal added!',
    text: 'The pedal has been added to your Rig.',
    timer: 1200,
    showConfirmButton: false,
    toast: true,
    position: 'top-end'
  });
}

function cleanupPendingPedalAdd() {
  localStorage.removeItem('pendingPedalAdd');
  localStorage.removeItem('lastPedalboardId');
}
