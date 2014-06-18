var socket = io();
$('form').submit(function(){
  var msg = $('#m').val();
  msg = msg.trim();
  
  var cmdtest = msg.split(" ");
  if(cmdtest[0] === "@nick") {
    socket.emit('nick', cmdtest[1]);
  }
  else if(cmdtest[0] === "/all") {
    msg = msg.slice(cmdtest[0].length);
    socket.emit('chat', {'to': '/all', 'content': msg.trim()});
  }
  else if("north".slice(0, cmdtest[0].length) === cmdtest[0]) {
    socket.emit('move', 'north');
  }
  else if("south".slice(0, cmdtest[0].length) === cmdtest[0]) {
    socket.emit('move', 'south');
  }
  else if("east".slice(0, cmdtest[0].length) === cmdtest[0]) {
    socket.emit('move', 'east');
  }
  else if("west".slice(0, cmdtest[0].length) === cmdtest[0]) {
    socket.emit('move', 'west');
  }
  else {
    socket.emit('command', msg);  
  }
  
  $('#m').val('');
  return false;
});

socket.on('message', function(msg){
  $('#messages').append($('<li>').text(msg));
  scrollToBottom('#messages');
});

socket.on('map', function(data){
  console.dir(data['map']);
  $('#mapname').text('=== ' + data['name'] + ' ===');
  $('#mapdesc').text(data['desc']);
  
  var mapexits = [];
  for(var k in data['exits']) mapexits.push(k);
  $('#mapexits').text('exits: ' + mapexits);
  
  var mapmobs = [];
  for(var j=0; j<data['mobs'].length; j++) mapmobs.push(data['mobs'][j].name);
  $('#mapmobs').text('mobs: ' + mapmobs);
  $('#map0').text(data['map'][0]);
  $('#map1').text(data['map'][1]);
  $('#map2').text(data['map'][2]);
  $('#map3').text(data['map'][3]);
  $('#map4').text(data['map'][4]);
});

socket.on('chat', function(msg){
  var chatmsg = msg.from + ': ' + msg.content;
  $('#messages').append($('<li>').text(chatmsg));
  scrollToBottom('#messages');
})


var buffer = 100;
var scrollToBottom = function(id) {
  if( $('#messages li').length > buffer*2) {
    $('#messages li').slice(0,buffer).remove();
  }
  $(id).scrollTop($(id)[0].scrollHeight);
}