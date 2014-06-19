/*
 * Client-side JS for registration
 */

var socket = io();

$('#register').submit(function(){
  var username = $('#username').val();
  var password = $('#password').val();
  var confirm = $('#confirm').val();
  console.log("user is " + username + ", pass is " + password + ", confirm is " + confirm);

  if(username.length < 2) {
    alert('Username has to be 3 or more characters');
  }
  else if(!(password === confirm)) {
    alert('Passwords do not match');
  }
  else{
    //success
    socket.emit('register', {"username": username, "password": password});
  }

  $('#password').val('');
  $('#confirm').val('');

  return false;
});

socket.on('regfailed', function(){
  alert("Username already exists, please try again");
});

socket.on('regpass', function(){
  alert("User successfully registered");
  document.location.href = "/";
})