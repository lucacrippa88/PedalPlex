$(document).ready(function() {
  const cloudFunctionUrl = 'https://www.cineteatrosanluigi.it/plex/GET_CATALOG.php';

  fetch(cloudFunctionUrl, { method: 'POST' })
    .then(response => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    })
    .then(data => {
      if(data.error) {
        console.error("Cloud Function error:", data.error);
      } else {
        console.log("Pedals from Cloudant:", data.pedals);
      }
    })
    .catch(error => {
      console.error('Error fetching pedals:', error);
    });
});
