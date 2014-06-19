/*
 * Client-side JS for registration
 */

var socket = io();

$('#register').submit(function(){
  var username = $('#username').val();
  var password = $('#password').val();
  $('#password').val('');
  var confirm = $('#confirm').val();
  $('#confirm').val('');

  if(username.length < 2) {
    alert('Username has to be 3 or more characters');
  }
  else if(!(password === confirm)) {
    alert('Passwords do not match');
  }
  else{
    //success
    password = String(hash(password));
    socket.emit('register', {'username': username, 'password': password});
  }
  return false;
});

socket.on('regfailed', function(){
  alert('Username already exists, please try again');
});

socket.on('regpass', function(){
  alert('User successfully registered');
  document.location.href = '/';
});

var hash = function(str) {
  var hash = 0, i, chr, len;
  if (str.length == 0) return hash;
  for (i = 0, len = str.length; i < len; i++) {
    chr   = str.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return hash;
};