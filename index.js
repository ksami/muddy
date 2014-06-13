var port = 3000;

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/',function(req, res){
	res.sendfile('index.html');
});

io.on('connection', function(socket){
	socket.join(socket.id);
	console.log('user ' + socket.id + ' connected');
	console.log(socket.rooms);
	io.to(socket.id).emit('messageBroad', 'Welcome!');
	
	socket.on('message', function(msg){
		console.log(socket.id + ' sends: ' + msg);
		io.to(socket.id).emit('messageBroad', msg);
	});
});

http.listen(port, function(){
	console.log('listening on *:' + port);
});
