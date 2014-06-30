/*
 * Client-side JS
 */

var socket = io();
//if using websockets
//var socket = io.connect('http://muddy-ksami.rhcloud.com:8000');
var socketid;
var nick;

//==========================
// Trigger events on server
//==========================

// When user logs in
$('#login').submit(function(){
  var username = $('#username').val();
  var password = $('#password').val();
  $('#password').val('');
  
  password = String(hash(password));
  password = socketid + password;
  password = String(hash(password));

  socket.emit('reqlogin', {'username': username, 'password': password});

  return false;
});

// When user enters a command
// [command] [<param1> <param2> ...]
$('#command').submit(function(){
  var msg = $('#m').val();
  msg = msg.trim();

  //echo everything typed in, whitespaced trimmed
  $('#messages').append($('<li>').text('> '+ msg));
  scrollToBottom('#messages');
  
  socket.emit('input', msg);

  /*
  //sorry excuse of a parser
  var cmdtest = msg.split(' ');
  if(cmdtest[0].length === 0) {
    socket.emit('command', msg);
  }
  else if(cmdtest[0] === '/all') {
    msg = msg.slice(cmdtest[0].length);
    socket.emit('chat', {'to': '/all', 'content': msg.trim()});
  }
  else if(cmdtest[0] === '@help') {
    $('#messages').append($('<li>').text('Help: "/all <message>" to talk to everyone, "n","s","e","w" to move, "poke" to fight'));
  }
  else if('north'.slice(0, cmdtest[0].length) === cmdtest[0]) {
    socket.emit('move', 'north');
  }
  else if('south'.slice(0, cmdtest[0].length) === cmdtest[0]) {
    socket.emit('move', 'south');
  }
  else if('east'.slice(0, cmdtest[0].length) === cmdtest[0]) {
    socket.emit('move', 'east');
  }
  else if('west'.slice(0, cmdtest[0].length) === cmdtest[0]) {
    socket.emit('move', 'west');
  }
  else if('poke'.slice(0, cmdtest[0].length) === cmdtest[0]) {
    socket.emit('fight', {'skill': 'poke', 'target': 'slimelet'});
  }
  else {
    socket.emit('command', msg);  
  }
  */

  $('#m').val('');
  return false;
});

//==============================================
// Event handlers for events triggered by server
//==============================================
socket.on('servershutdown' ,function(){
  alert('server restarting');
  document.location.href = '/';
});

socket.on('socketid', function(id){
  socketid = id;
});

socket.on('loginverified', function(username){
  nick = username;
  //$('#login').toggleClass('hide');
  //$('#main').toggleClass('hide');
  $('#login').slideUp(400, function(){$('#main').slideDown(600);});
});

socket.on('loginfailed', function(){
  alert('Wrong username/password, please try again');
});

socket.on('message', function(msg){
  if(typeof msg.class === 'undefined') {
    $('#messages').append($('<li>').text(msg));  
  }
  else {
    $('#messages').append($('<li>').text(msg.msg).addClass(msg.class));
  }
  scrollToBottom('#messages');
});

socket.on('map', function(data){
  $('#mapname').text('=== ' + data['name'] + ' ===');
  $('#mapdesc').text(data['desc']);
  
  var mapexits = [];
  for(var k in data['exits']) mapexits.push(k);
  $('#mapexits').text('exits: ' + mapexits);

  var mapusers = [];
  for(var i in data['users']) mapusers.push(i);
  $('#mapusers').text('players: ' + mapusers);
  
  var mapmobs = [];
  for(var j=0; j<data['mobs'].length; j++) {
    if(data['mobs'][j].isDead === false) {
      mapmobs.push(data['mobs'][j].name);
    }
  }
  $('#mapmobs').text('mobs: ' + mapmobs);

  $('#map0').text(data['map'][0]);
  $('#map1').text(data['map'][1]);
  $('#map2').text(data['map'][2]);
  $('#map3').text(data['map'][3]);
  $('#map4').text(data['map'][4]);
});

socket.on('combatInfo', function(data){
  var pdead = '';
  if(data.playerhp <= 0) {pdead = '(dead)';}
  $('#player').text(data.playername + pdead + ': ' + data.playerhp);

  var tdead = '';
  if(data.targethp <= 0) {tdead = '(dead)';}
  $('#target').text(data.targetname + tdead + ': ' + data.targethp);
});

socket.on('stats', function(player){
  var pdead = '';
  if(player.hp <= 0) {pdead = '(dead)';}
  $('#player').text(player.name + pdead + ': ' + player.hp);
});

socket.on('chat', function(msg){
  var chatmsg = msg.from + ': ' + msg.content;
  $('#messages').append($('<li>').text(chatmsg));
  scrollToBottom('#messages');
});


//====================================
// Helper functions running on client
//====================================
var buffer = 100;
var scrollToBottom = function(id) {
  if( $('#messages li').length > buffer*2) {
    $('#messages li').slice(0,buffer).remove();
  }
  $(id).scrollTop($(id)[0].scrollHeight);
};

var hash = function(str) {
  var hash = 0, i, chr, len;
  if (str.length === 0) return hash;
  for (i = 0, len = str.length; i < len; i++) {
    chr   = str.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return hash;
};