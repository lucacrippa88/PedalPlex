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
