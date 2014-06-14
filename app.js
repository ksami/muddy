var port = 3000;
var _fileindex = __dirname + '/public/index.html';
var _filemaps = __dirname + '/json/maps.json';
var _fileusers = __dirname + '/json/users.json';

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
app.use(express.static(__dirname + '/public'));

var maps = {};
var users = {};


//Read data files
fs.readFile(_filemaps, 'utf8', function (err, data) {
	if(err) {
		console.log('Map file error: ' + err);
		return;
	}
	maps = JSON.parse(data);
	console.dir(maps);
})
fs.readFile(_fileusers, 'utf8', function (err, data) {
	if(err) {
		console.log('User file error: ' + err);
		return;
	}
	users = JSON.parse(data);
	console.dir(users);
})



//Route handler
app.get('/',function(req, res){
	res.sendfile(_fileindex);
});



io.on('connection', function(socket){
	
	//When user first connects
	socket.join(socket.id);
	socket.join('/hints');
	socket.join('/world');
	console.log('user ' + socket.id + ' connected');
	io.to(socket.id).emit('message', 'Welcome! Please login by typing your nick with @nick');
	
	//Bind nick and socket.id
	socket.on('nick', function(nick){
		if(users.hasOwnProperty(nick)) {
			users[nick].socketid = socket.id;
		}
		else {
			users[nick] = {"nick": nick, "socketid": socket.id, "at": "0-12"};
		}
		fs.writeFile(_fileusers, JSON.stringify(users, null, 4), function(err) {
			if(err) {
				console.log("User file error: " + err);
			}
			else {
				console.log("Users.JSON save to " + _fileusers);
				io.to(socket.id).emit('message', 'Your nick has been set to ' + nick);
				io.to(socket.id).emit('map', maps[users[nick]['at']]);
			}
		})
	})

	socket.on('disconnect', function() {
		console.log("user " + socket.id + " disconnected");
		fs.writeFile(_fileusers, JSON.stringify(users, null, 4));
	})

	//Any other input, echo back
	socket.on('command', function(msg){
		console.log(socket.id + ' sends: ' + msg);
		io.to(socket.id).emit('message', msg);
	});
});

http.listen(port, function(){
	console.log('listening on *:' + port);
});

setInterval(function() {
	io.to('/hints').emit('message', 'Remember to leave feedback at github.com/ksami/muddy');
}, 60000);
