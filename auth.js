let isLogin = true;
let recaptchaWidgetId = null;

// --- Toggle Login/Register ---
$(document).on('click', '#toggleForm', function (e) {
  e.preventDefault();
  isLogin = !isLogin;

  $('#formTitle').text(isLogin ? 'Login' : 'Register');
  $('#submitBtn').text(isLogin ? 'Login' : 'Register');
  $('#email').toggle(!isLogin);
  $('#recaptchaContainer').toggle(!isLogin);
  $('#newsletterContainer').toggle(!isLogin); // checkbox solo in registrazione
  $('#toggleText').html(
    isLogin
      ? `Don't have an account? <a href="#" id="toggleForm">Register here</a>`
      : `Already have an account? <a href="#" id="toggleForm">Login here</a>`
  );

  // Render reCAPTCHA solo se non è già stato renderizzato
  if (!isLogin && recaptchaWidgetId === null) {
    recaptchaWidgetId = grecaptcha.render('recaptchaContainer', {
      sitekey: '6LerYkksAAAAAMbhqqezJ-JOvmUVyZkQMT9Q6fm1'
    });
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
      console.log('Response:', res);

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
          confirmButtonText: 'Try Again',
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
