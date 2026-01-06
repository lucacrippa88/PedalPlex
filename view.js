(async function () {

  const resultsDiv = document.getElementById('results');
  window.resultsDiv = resultsDiv;

  // /* ================= LOGIN ================= */
  // async function doLogin(username, password) {
  //   const res = await fetch(
  //     'https://www.cineteatrosanluigi.it/plex/USER_LOGIN.php',
  //     {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ username, password })
  //     }
  //   );
  //   if (!res.ok) throw new Error('Login failed');
  //   const data = await res.json();
  //   localStorage.setItem('authToken', data.token);
  //   return data.user;
  // }

  // let token = localStorage.getItem('authToken');

  // if (token) {
  //   try {
  //     const res = await fetch(
  //       'https://www.cineteatrosanluigi.it/plex/USER_CHECK_AUTH_JWT.php',
  //       {
  //         method: 'POST',
  //         headers: { 'Authorization': 'Bearer ' + token }
  //       }
  //     );
  //     if (!res.ok) throw new Error();
  //     window.currentUser = await res.json();
  //   } catch {
  //     localStorage.removeItem('authToken');
  //     token = null;
  //   }
  // }

  // if (!token) {
  //   const { value } = await Swal.fire({
  //     title: 'Login',
  //     html:
  //       '<input id="u" class="swal2-input" placeholder="Username">' +
  //       '<input id="p" type="password" class="swal2-input" placeholder="Password">',
  //     preConfirm: () => [
  //       document.getElementById('u').value,
  //       document.getElementById('p').value
  //     ]
  //   });
  //   if (!value) return;
  //   await doLogin(value[0], value[1]);
  //   token = localStorage.getItem('authToken');
  // }

  /* ================= DATA ================= */
  const pedalId = new URLSearchParams(location.search).get('id');
  if (!pedalId) {
    resultsDiv.textContent = 'Usa ?id=<PEDAL_ID>';
    return;
  }

  async function fetchPedals(ids) {
    try {
      const res = await fetch(
        'https://www.cineteatrosanluigi.it/plex/GET_PEDALS_BY_IDS.php',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({ ids })
        }
      );
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return (await res.json()).docs || [];
    } catch (err) {
      console.error('[TEST-PLEX] Error fetching pedals:', err);
      resultsDiv.textContent = 'Errore nel fetch dei pedali: ' + err.message;
      return [];
    }
  }

  // Fetch pedale principale
  const [pedal] = await fetchPedals([pedalId]);
  if (!pedal) {
    resultsDiv.textContent = 'Pedale non trovato';
    return;
  }

  // Fetch subplex
  let subplexDocs = [];
  if (pedal.subplex?.length) {
    const subIds = pedal.subplex.map(s => s.pedal_id);
    subplexDocs = await fetchPedals(subIds);
  }

  /* ================= CATALOG ================= */
  window.catalogMap = {};
  window.catalogMap[pedalId] = pedal;
  subplexDocs.forEach(p => window.catalogMap[p._id] = p);

  window.catalog = [pedal, ...subplexDocs]; // necessario per renderFullPedalboard

  /* ================= FAKE BOARD ================= */
  const fakeBoard = {
    _id: 'test-board',
    name: 'TEST',
    pedals: [{
      pedal_id: pedalId,
      row: 1,
      rotation: 0,
      subplex: pedal.subplex || []
    }]
  };

  /* ================= RENDER ================= */
  try {
    await renderFullPedalboard(fakeBoard);
  } catch (err) {
    console.error('[TEST-PLEX] Render error:', err);
    resultsDiv.textContent = 'Errore nel render: ' + err.message;
  }

})();