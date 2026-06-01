let isLogin = true;
let recaptchaWidgetId = null;

// --- Toggle Login/Register ---
$(document).on('click', '#toggleForm', function (e) {
  e.preventDefault();
  isLogin = !isLogin;

  $('#formTitle').text(isLogin ? 'Login' : 'Register');
  $('#submitBtn').html(isLogin ? "<svg focusable='false' preserveAspectRatio='xMidYMid meet' xmlns='http://www.w3.org/2000/svg' fill='currentColor' width='16' height='16' viewBox='0 0 32 32' aria-hidden='true' class='bx--btn__icon'><path d='M26,30H14a2,2,0,0,1-2-2V25h2v3H26V4H14V7H12V4a2,2,0,0,1,2-2H26a2,2,0,0,1,2,2V28A2,2,0,0,1,26,30Z'></path><path d='M14.59 20.59 18.17 17 4 17 4 15 18.17 15 14.59 11.41 16 10 22 16 16 22 14.59 20.59z'></path></svg>Login" 
                               : "<svg focusable='false' preserveAspectRatio='xMidYMid meet' xmlns='http://www.w3.org/2000/svg' fill='currentColor' width='16' height='16' viewBox='0 0 32 32' aria-hidden='true' class='bx--btn__icon'><path d='M28,25H20a2.0027,2.0027,0,0,1-2-2V20h2v3h8V9H20v3H18V9a2.0023,2.0023,0,0,1,2-2h8a2.0023,2.0023,0,0,1,2,2V23A2.0027,2.0027,0,0,1,28,25Z'></path><path d='M8 15H12V17H8z'></path><path d='M20 15H24V17H20z'></path><path d='M14 15H18V17H14z'></path><path d='M12,25H4a2.0023,2.0023,0,0,1-2-2V9A2.002,2.002,0,0,1,4,7h8a2.002,2.002,0,0,1,2,2v3H12V9H4V23h8V20h2v3A2.0023,2.0023,0,0,1,12,25Z'></path></svg>Free Registration");
  $('#email').toggle(!isLogin);
  $('#recaptchaContainer').toggle(!isLogin);
  $('#newsletterContainer').toggle(!isLogin); // checkbox solo in registrazione

  $('#toggleText').html(
    isLogin
      ? `Don't have an account? <a href="#" id="toggleForm">Register here</a>`
      : `Already have an account? <a href="#" id="toggleForm">Login here</a>`
  );

  // Render reCAPTCHA solo se non è già stato renderizzato
// 👉 SOLO qui gestisci reCAPTCHA
  if (!isLogin) {
    if (recaptchaWidgetId === null) {
      if (typeof grecaptcha !== 'undefined') {
        grecaptcha.ready(function () {
          recaptchaWidgetId = grecaptcha.render('recaptchaContainer', {
            sitekey: '6LerYkksAAAAAMbhqqezJ-JOvmUVyZkQMT9Q6fm1'
          });
        });
      } else {
        console.error('grecaptcha not loaded');
      }
    }
  } else {
    // opzionale: reset quando torni a login
    if (recaptchaWidgetId !== null && typeof grecaptcha !== 'undefined') {
      grecaptcha.reset(recaptchaWidgetId);
    }
  }
});

// --- Form submit (Login / Register) ---
$('#authForm').on('submit', function (e) {
  e.preventDefault();

  const username = $('#username').val().trim();
  const password = $('#password').val();
  const email = $('#email').val().trim();
  const subscribe_newsletter = !isLogin ? $('#subscribeNewsletter').is(':checked') : undefined;


  const endpoint = isLogin
    ? 'https://api.pedalplex.com/USER_LOGIN_JWT.php'
    : 'https://api.pedalplex.com/USER_REGISTER_JWT.php';

  // const data = isLogin
  //   ? { username, password }
  //   : { username, password, email };
  const data = isLogin
  ? { username, password }
  : { 
      username, 
      password, 
      email, 
      recaptcha: grecaptcha.getResponse(recaptchaWidgetId),
      subscribe_newsletter: $('#subscribeNewsletter').is(':checked') // ✅ checkbox
    };



  // --- reCAPTCHA check only for registration ---
  if (!isLogin) {
    const recaptchaResponse = grecaptcha.getResponse(recaptchaWidgetId);
    if (!recaptchaResponse) {
      Swal.fire({
        icon: 'error',
        title: 'Verification required',
        text: 'Please complete the reCAPTCHA to register.'
      });
      return;
    }
    data['recaptcha'] = recaptchaResponse;
  }

  $.ajax({
    url: endpoint,
    method: 'POST',
    contentType: 'application/json',
    dataType: 'json',
    data: JSON.stringify(data),
    success: function (res) {
      // console.log('Response:', res);

      if (isLogin && res.token) {
        // Login success
        localStorage.setItem('authToken', res.token);
        
        // Award badges on login
        $.ajax({
          url: 'https://api.pedalplex.com/USER_AWARD_BADGES.php',
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + res.token },
          success: function(badgeRes) {
            console.log('Badge API Response:', badgeRes);
            
            // Check if new badges were awarded
            if (badgeRes.badges_awarded && badgeRes.badges_awarded.length > 0) {
              console.log('New badges awarded:', badgeRes.badges_awarded);
              
              // Load badge definitions to get images and descriptions
              $.getJSON('badges.json', function(badgeConfig) {
                console.log('Badges config loaded:', badgeConfig);
                showBadgeAwardPopup(badgeRes.badges_awarded, badgeConfig.badges);
              }).fail(function(jqxhr, textStatus, error) {
                console.error('Failed to load badges.json:', textStatus, error);
                // Fallback if badges.json fails to load
                showSimpleBadgeNotification(badgeRes.badges_awarded);
              });
            } else {
              // No new badges, show normal login message
              Swal.fire({
                icon: 'success',
                title: 'Login Successful',
                text: 'Welcome, ' + (res.username || username) + '!',
                timer: 1000,
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false,
                customClass: { confirmButton: 'bx--btn bx--btn--primary' },
                buttonsStyling: false
              });
              setTimeout(() => { window.location.href = 'plexes'; }, 1000);
            }
          },
          error: function() {
            // If badge check fails, still show login success
            Swal.fire({
              icon: 'success',
              title: 'Login Successful',
              text: 'Welcome, ' + (res.username || username) + '!',
              timer: 1000,
              showConfirmButton: false,
              allowOutsideClick: false,
              allowEscapeKey: false,
              customClass: { confirmButton: 'bx--btn bx--btn--primary' },
              buttonsStyling: false
            });
            setTimeout(() => { window.location.href = 'plexes'; }, 1000);
          }
        });

      } else if (!isLogin) {
        // Registration success
        Swal.fire({
          icon: 'success',
          title: 'Registration successful',
          text: 'You can now log in.',
          confirmButtonText: 'Continue',
          customClass: { confirmButton: 'bx--btn bx--btn--primary' },
          allowOutsideClick: false,
          allowEscapeKey: false,
          buttonsStyling: false
        }).then(() => { $('#toggleForm').click(); });
      } else {
        // Error
        Swal.fire({
          icon: 'error',
          title: isLogin ? 'Login failed' : 'Registration failed',
          text: res.error || 'Invalid credentials.',
          confirmButtonText: "<svg focusable='false' preserveAspectRatio='xMidYMid meet' xmlns='http://www.w3.org/2000/svg' fill='currentColor' width='16' height='16' viewBox='0 0 32 32' aria-hidden='true' class='bx--btn__icon'><path d='M20,10H7.8149l3.5874-3.5859L10,5,4,11,10,17l1.4023-1.4146L7.8179,12H20a6,6,0,0,1,0,12H12v2h8a8,8,0,0,0,0-16Z'></path></svg>Try again",
          customClass: { confirmButton: 'bx--btn bx--btn--danger' },
          buttonsStyling: false
        });
      }
    },
    error: function (xhr) {
      let msg = 'Server error. Please try again.';
      try {
        const json = JSON.parse(xhr.responseText);
        if (json.error) msg = json.error;
      } catch (e) {}
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: msg,
        confirmButtonText: 'OK',
        customClass: { confirmButton: 'bx--btn bx--btn--danger' },
        buttonsStyling: false
      });
    }
  });
});

// --- Forgot Password ---
$(document).ready(function () {
  $('#forgotPasswordLink').on('click', function (e) {
    e.preventDefault();
    Swal.fire({
      title: 'Forgot Password',
      input: 'text',
      inputLabel: 'Enter your username or email',
      inputPlaceholder: 'Username or Email',
      showCancelButton: true,
      confirmButtonText: 'Send reset link',
      cancelButtonText: 'Cancel',
      customClass: {
        confirmButton: 'bx--btn bx--btn--primary',
        cancelButton: 'bx--btn bx--btn--secondary'
      },
      inputValidator: (value) => {
        if (!value || !value.trim()) return 'You need to enter your username or email!';
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        $.ajax({
          url: 'https://api.pedalplex.com/USER_FORGOT_PASSWORD.php',
          method: 'POST',
          contentType: 'application/json',
          data: JSON.stringify({ identifier: result.value.trim() }),
          success: function () {
            Swal.fire({
              title: 'Success',
              icon: 'success',
              text: 'Password reset link sent to your email.',
              timer: 1000,
              showConfirmButton: false,
              allowOutsideClick: false,
              allowEscapeKey: false
            });
          },
          error: function (xhr) {
            let errMsg = 'Unknown error';
            try { const errJson = JSON.parse(xhr.responseText); errMsg = errJson.error || errMsg; } catch {}
            Swal.fire({
              title: 'Error',
              text: errMsg,
              icon: 'error',
              confirmButtonText: 'OK',
              customClass: { confirmButton: 'bx--btn bx--btn--primary' }
            });
          }
        });
      }
    });
  });
});

// --- Google Login ---
function onGoogleLogin(response) {
  const id_token = response.credential;

  $.ajax({
    url: "https://api.pedalplex.com/USER_LOGIN_GOOGLE.php",
    method: "POST",
    contentType: "application/json",
    dataType: "json",
    data: JSON.stringify({ id_token }),
    xhrFields: { withCredentials: true },
    success: function(res) {
      if (res.token) {
        localStorage.setItem("authToken", res.token);
        Swal.fire({
          icon: "success",
          title: "You are logged in!",
          timer: 1000,
          showConfirmButton: false
        }).then(() => { window.location.href = "plexes"; });
      } else {
        Swal.fire("Login error", res.error || "", "error");
      }
    },
    error: function(xhr) {
      let msg = "Errore server";
      try { const json = JSON.parse(xhr.responseText); if (json.error) msg = json.error; } catch {}
      Swal.fire("Errore", msg, "error");
    }
  });
}

// Badge Award Popup Functions
function showBadgeAwardPopup(earnedBadges, badgeDefinitions) {
  // Build HTML for each badge
  let badgesHtml = '<div style="display: flex; flex-direction: column; gap: 20px; margin: 20px 0;">';
  
  earnedBadges.forEach(earned => {
    const badgeDef = badgeDefinitions.find(b => b.id === earned.id);
    if (!badgeDef) return;
    
    badgesHtml += `
      <div style="
        display: flex;
        align-items: center;
        gap: 20px;
        padding: 20px;
        background: linear-gradient(135deg, #f4f4f4 0%, #ffffff 100%);
        border: 2px solid #0f62fe;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(15, 98, 254, 0.2);
      ">
        <img src="${badgeDef.image}" alt="${badgeDef.name}" 
             style="width: 80px; height: 80px; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));">
        <div style="text-align: left; flex: 1;">
          <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #161616;">${badgeDef.name}</h3>
          <p style="margin: 0; font-size: 14px; color: #525252; line-height: 1.4;">${badgeDef.description}</p>
        </div>
      </div>
    `;
  });
  
  badgesHtml += '</div>';
  
  const title = earnedBadges.length === 1 ? 'Achievement Unlocked!' : 'Achievements Unlocked!';
  
  Swal.fire({
    title: title,
    html: badgesHtml,
    icon: null,
    showCloseButton: true,
    showCancelButton: true,
    confirmButtonText: `
      <svg focusable="false" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32" aria-hidden="true" style="vertical-align: middle; margin-right: 8px;">
        <path d="M16,4A12,12,0,1,1,4,16,12,12,0,0,1,16,4m0-2A14,14,0,1,0,30,16,14,14,0,0,0,16,2Z"></path>
        <path d="M16,10a2,2,0,1,0,2,2A2,2,0,0,0,16,10Z"></path>
        <path d="M16,16a1,1,0,0,0-1,1v8a1,1,0,0,0,2,0V17A1,1,0,0,0,16,16Z"></path>
      </svg>
      View Profile
    `,
    cancelButtonText: 'Continue',
    allowOutsideClick: true,
    allowEscapeKey: true,
    customClass: {
      popup: 'badge-award-popup',
      confirmButton: 'bx--btn bx--btn--primary',
      cancelButton: 'bx--btn bx--btn--secondary',
      closeButton: 'badge-close-button'
    },
    buttonsStyling: false,
    width: '600px',
    didOpen: () => {
      // Add custom styling for close button
      const closeBtn = document.querySelector('.badge-close-button');
      if (closeBtn) {
        closeBtn.style.cssText = `
          position: absolute;
          top: 16px;
          right: 16px;
          width: 32px;
          height: 32px;
          padding: 0;
          background: transparent;
          border: none;
          cursor: pointer;
          color: #525252;
          transition: color 0.2s;
        `;
        closeBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 32 32" fill="currentColor">
            <path d="M24 9.4L22.6 8 16 14.6 9.4 8 8 9.4 14.6 16 8 22.6 9.4 24 16 17.4 22.6 24 24 22.6 17.4 16 24 9.4z"/>
          </svg>
        `;
        closeBtn.addEventListener('mouseenter', () => closeBtn.style.color = '#161616');
        closeBtn.addEventListener('mouseleave', () => closeBtn.style.color = '#525252');
      }
    }
  }).then((result) => {
    if (result.isConfirmed) {
      // Go to profile page
      window.location.href = 'profile';
    } else {
      // Continue to plexes
      window.location.href = 'plexes';
    }
  });
}

function showSimpleBadgeNotification(earnedBadges) {
  const badgeNames = earnedBadges.map(b => {
    return b.id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }).join(', ');
  
  Swal.fire({
    icon: 'success',
    title: 'Achievement Unlocked!',
    text: `You earned: ${badgeNames}`,
    showCloseButton: true,
    showCancelButton: true,
    confirmButtonText: 'View Profile',
    cancelButtonText: 'Continue',
    allowOutsideClick: true,
    allowEscapeKey: true,
    customClass: {
      confirmButton: 'bx--btn bx--btn--primary',
      cancelButton: 'bx--btn bx--btn--secondary'
    },
    buttonsStyling: false
  }).then((result) => {
    if (result.isConfirmed) {
      window.location.href = 'profile';
    } else {
      window.location.href = 'plexes';
    }
  });
}

// --- Google Login ---
function onGoogleLogin(response) {
  const id_token = response.credential;

  $.ajax({
    url: "https://api.pedalplex.com/USER_LOGIN_GOOGLE.php",
    method: "POST",
    contentType: "application/json",
    dataType: "json",
    data: JSON.stringify({ id_token }),
    xhrFields: { withCredentials: true },
    success: function(res) {
      if (res.token) {
        localStorage.setItem("authToken", res.token);
        Swal.fire({
          icon: "success",
          title: "You are logged in!",
          timer: 1000,
          showConfirmButton: false
        }).then(() => { window.location.href = "plexes"; });
      } else {
        Swal.fire("Login error", res.error || "", "error");
      }
    },
    error: function(xhr) {
      let msg = "Errore server";
      try { const json = JSON.parse(xhr.responseText); if (json.error) msg = json.error; } catch {}
      Swal.fire("Errore", msg, "error");
    }
  });
}
