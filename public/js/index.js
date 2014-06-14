var socket = io();
$('form').submit(function(){
  var msg = $('#m').val();
  
  var cmdtest = msg.split(" ");
  if(cmdtest[0] === "@nick") {
    socket.emit('nick', cmdtest[1]);
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
  $('#map0').text(data['map'][0]);
  $('#map1').text(data['map'][1]);
  $('#map2').text(data['map'][2]);
  $('#map3').text(data['map'][3]);
  $('#map4').text(data['map'][4]);
});



var buffer = 100;
var scrollToBottom = function(id) {
  if( $('#messages li').length > buffer*2) {
    $('#messages li').slice(0,buffer).remove();
  }
  $(id).scrollTop($(id)[0].scrollHeight);
}