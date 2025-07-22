let isLogin = true;

    $(document).on('click', '#toggleForm', function (e) {
      e.preventDefault();
      isLogin = !isLogin;

      $('#formTitle').text(isLogin ? 'Login' : 'Register');
      $('#submitBtn').text(isLogin ? 'Login' : 'Register');
      $('#email').toggle(!isLogin);
      $('#toggleText').html(
        isLogin
          ? `Don't have an account? <a href="#" id="toggleForm">Register here</a>`
          : `Already have an account? <a href="#" id="toggleForm">Login here</a>`
      );
    });






$('#authForm').on('submit', function (e) {
  e.preventDefault();

  const username = $('#username').val().trim();
  const password = $('#password').val();
  const email = $('#email').val().trim();

  const endpoint = isLogin
    ? 'https://www.cineteatrosanluigi.it/plex/USER_LOGIN_JWT.php'
    : 'https://www.cineteatrosanluigi.it/plex/USER_REGISTER.php';

  const data = isLogin ? { username: username, password: password } : { username: username, password: password, email: email };

  $.ajax({
    url: endpoint,
    method: 'POST',
    contentType: 'application/json',
    dataType: 'json',
    data: JSON.stringify(data),
    // Remove this since no cookies anymore:
    // xhrFields: { withCredentials: true },
    success: function (res) {
      console.log('Login response:', res);

      if (isLogin && res.token) {
        // Store JWT token in localStorage
        localStorage.setItem('authToken', res.token);

        Swal.fire({
          icon: 'success',
          title: 'Login Successful',
          text: 'Welcome, ' + (res.username || username) + '!',
          timer: 2000, 
          showConfirmButton: false,
          customClass: {
            confirmButton: 'bx--btn bx--btn--primary'
          },
          buttonsStyling: false
        });

        // Redirect after 2 seconds
        setTimeout(function () {
          window.location.href = 'pedalboard.html';
        }, 2000);

      } else if (!isLogin) {
        Swal.fire({
          icon: 'success',
          title: 'Registration successful',
          text: 'You can now log in.',
          confirmButtonText: 'Continue',
          customClass: {
            confirmButton: 'bx--btn bx--btn--primary'
          },
          buttonsStyling: false
        }).then(function () {
          $('#toggleForm').click(); // Switch to login form
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Login failed',
          text: res.error || 'Invalid credentials.',
          confirmButtonText: 'Try Again',
          customClass: {
            confirmButton: 'bx--btn bx--btn--danger'
          },
          buttonsStyling: false
        });
      }
    },
    error: function (xhr) {
      var msg = 'Server error. Please try again.';
      try {
        var json = JSON.parse(xhr.responseText);
        if (json.error) msg = json.error;
      } catch (e) {}
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: msg,
        confirmButtonText: 'OK',
        customClass: {
          confirmButton: 'bx--btn bx--btn--danger'
        },
        buttonsStyling: false
      });
    }
  });
});



    // $('#authForm').on('submit', function (e) {
    //   e.preventDefault();

    //   const username = $('#username').val().trim();
    //   const password = $('#password').val();
    //   const email = $('#email').val().trim();

    //   const endpoint = isLogin
    //     ? 'https://www.cineteatrosanluigi.it/plex/USER_LOGIN.php'
    //     : 'https://www.cineteatrosanluigi.it/plex/USER_REGISTER.php';

    //   const data = isLogin ? { username: username, password: password } : { username: username, password: password, email: email };

    //   $.ajax({
    //     url: endpoint,
    //     method: 'POST',
    //     contentType: 'application/json',
    //     dataType: 'json',
    //     data: JSON.stringify(data),
    //     xhrFields: { withCredentials: true },  // always send cookies
    //     success: function (res) {
    //       console.log('Login response:', res);

    //       if (isLogin && res.success) {
    //         Swal.fire({
    //           icon: 'success',
    //           title: 'Login Successful',
    //           text: 'Welcome, ' + (res.username || username) + '!',
    //           timer: 2000, 
    //           showConfirmButton: false, 
    //           customClass: {
    //             confirmButton: 'bx--btn bx--btn--primary'
    //           },
    //           buttonsStyling: false
    //         });

    //         // Redirect after 2 seconds (same as Swal timer)
    //         setTimeout(function () {
    //           window.location.href = 'pedalboard.html';
    //         }, 2000);

    //       } else if (!isLogin) {
    //         Swal.fire({
    //           icon: 'success',
    //           title: 'Registration successful',
    //           text: 'You can now log in.',
    //           confirmButtonText: 'Continue',
    //           customClass: {
    //             confirmButton: 'bx--btn bx--btn--primary'
    //           },
    //           buttonsStyling: false
    //         }).then(function () {
    //           $('#toggleForm').click(); // Switch to login form
    //         });
    //       } else {
    //         Swal.fire({
    //           icon: 'error',
    //           title: 'Login failed',
    //           text: res.error || 'Invalid credentials.',
    //           confirmButtonText: 'Try Again',
    //           customClass: {
    //             confirmButton: 'bx--btn bx--btn--danger'
    //           },
    //           buttonsStyling: false
    //         });
    //       }
    //     },
    //     error: function (xhr) {
    //       var msg = 'Server error. Please try again.';
    //       try {
    //         var json = JSON.parse(xhr.responseText);
    //         if (json.error) msg = json.error;
    //       } catch (e) {}
    //       Swal.fire({
    //         icon: 'error',
    //         title: 'Error',
    //         text: msg,
    //         confirmButtonText: 'OK',
    //         customClass: {
    //           confirmButton: 'bx--btn bx--btn--danger'
    //         },
    //         buttonsStyling: false
    //       });
    //     }
    //   });
    // });





$(document).ready(function () {
  // Forgot password link click handler
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
        if (!value || !value.trim()) {
          return 'You need to enter your username or email!';
        }
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        $.ajax({
          url: 'https://www.cineteatrosanluigi.it/plex/USER_FORGOT_PASSWORD.php',
          method: 'POST',
          contentType: 'application/json',
          data: JSON.stringify({ identifier: result.value.trim() }),
          success: function (response) {
            Swal.fire({
              title: 'Success',
              icon: 'success',
              text: 'Password reset link sent to your email.',
              timer: 2000,
              showConfirmButton: false,
              allowOutsideClick: false,
              allowEscapeKey: false
            });
          },
          error: function (xhr) {
            let errMsg = 'Unknown error';
            try {
              const errJson = JSON.parse(xhr.responseText);
              errMsg = errJson.error || errMsg;
            } catch {
              errMsg = xhr.statusText || errMsg;
            }
            Swal.fire({
              title: 'Error',
              text: errMsg,
              icon: 'error',
              confirmButtonText: 'OK',
              customClass: {
                confirmButton: 'bx--btn bx--btn--primary'
              }
            });
          }
        });
      }
    });
  });
});
