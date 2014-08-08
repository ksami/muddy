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

  $('#m').val('');
  return false;
});

$(window).on('beforeunload', function(){
  socket.emit('dc');
  console.log('dc');
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
  $('#login').slideUp(400, function(){
    $('#main').slideDown(600);
    $('#m').focus();
  });
});

socket.on('loggedin', function(){
  alert('That user is already logged in.');
})

socket.on('loginfailed', function(){
  alert('Wrong username/password, please try again');
});

socket.on('critStart', function(){
  alert('CRITICAL STRIKE! - Type the name of one of your skills as many times as possible, a crit multiplier will be added to your damage roll');
  $('#critWindow').toggleClass('hide center');
  $('#crit').focus();
  socket.emit('critStartAck');

  //NOTE: disable copy paste?
});

socket.on('critEnd', function(){
  $('#critWindow').toggleClass('hide center');

  var crit = $('#crit').val();
  crit = crit.trim();

  //echo everything typed in, whitespaced trimmed
  $('#messages').append($('<li>').text('> '+ crit));
  scrollToBottom('#messages');

  $('#crit').val('');
  socket.emit('critEndAck', crit);
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

  var mapitems = [];
  for(var l=0; l<data['items'].length; l++) {
    mapitems.push(data['items'][l].name);
  }
  $('#mapitems').text('items: ' + mapitems);

  $('#map0').text(data['map'][0]);
  $('#map1').text(data['map'][1]);
  $('#map2').text(data['map'][2]);
  $('#map3').text(data['map'][3]);
  $('#map4').text(data['map'][4]);
});

socket.on('inventory', function(inv){
  $('#inventory li').remove();
  for(var i in inv){
    $('#inventory').append($('<li>').text(i + ' (' + inv[i].quantity + '/' + inv[i].quantityLimit + ')'));
  }
});

socket.on('equipment', function(eqp){
  $('#equipment li').remove();
  for(var e in eqp){
    $('#equipment').append($('<li>').text(e + ': ' + eqp[e]));
  }
});

socket.on('combatInfo', function(data){
  var pdead = '';
  if(data.playerhp <= 0) {pdead = '(dead)';}
  $('#player').text(data.playername + pdead + ': ' + data.playerhp);

  if(typeof data.targetname !== 'undefined') {
    var tdead = '';
    if(data.targethp <= 0) {tdead = '(dead)';}
    $('#target').text(data.targetname + tdead + ': ' + data.targethp);
  }
  else {
    $('#target').text('');
  }
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