/*
 * Server-side JS - Main file
 */

// Environment configurables
var port = 3000;
var _fileindex = __dirname + '/public/index.html';
var _filemaps = __dirname + '/json/mapss.json';
var _fileusers = __dirname + '/json/users.json';
var _filemobs = __dirname + '/json/mobs.json';

// Dependencies
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
app.use(express.static(__dirname + '/public'));

// Globals
var maps = {};
var users = {};
var socketid = {};
var mobs = [];

// Listen to <port>
http.listen(port, function(){
	console.log('listening on *:' + port);
});

// Route handler
app.get('/',function(req, res){
	res.sendfile(_fileindex);
});


//================
// Read data files
//===============

fs.readFile(_filemaps, 'utf8', function (err, data) {
	if(err) {
		console.log('Map file error: ' + err);
		return;
	}
	maps = JSON.parse(data);
	//console.dir(maps);
})
fs.readFile(_filemobs, 'utf8', function (err, data) {
	if(err) {
		console.log('Mob file error: ' + err);
		return;
	}
	mobs = JSON.parse(data);
	console.dir(mobs);

	for(var i=0; i<mobs.length; i++) {
		console.log("mob at: " + mobs[i].at);
		(maps[mobs[i].at].mobs).push(mobs[i]);
		console.log(maps[mobs[i].at].mobs);
	}
})
fs.readFile(_fileusers, 'utf8', function (err, data) {
	if(err) {
		console.log('User file error: ' + err);
		return;
	}
	users = JSON.parse(data);
	console.dir(users);

	for(user in users){
		socketid[user.socketid] = user.nick;
	}
})


//=========
// Session
//=========
io.on('connection', function(socket){
	var player;
	
	// When user first connects
	socket.join(socket.id);
	socket.join('/hints');
	socket.join('/all');
	console.log('user ' + socket.id + ' connected');
	io.to(socket.id).emit('message', 'Welcome! Please login by typing your nick with @nick');
	

	//==============================================
	// Event handlers for events triggered by client
	//==============================================

	// Bind nick and socket.id
	socket.on('nick', function(nick){
		socketid[socket.id] = nick;

		if(users.hasOwnProperty(nick)) {
			users[nick].socketid = socket.id;
		}
		else {
			users[nick] = {"nick": nick, "socketid": socket.id, "at": "m0-12"};
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
		player = users[socketid[socket.id]];
	});

	// Add msg.from and send to msg.to
	socket.on('chat', function(msg) {
		msg.from = player.nick;
		console.dir(msg);
		io.to(msg.to).emit('chat', msg);
	});

	// Boundary checking then move player
	socket.on('move', function(direction) {
		if(maps[player.at].exits.hasOwnProperty(direction[0])) {
			player.at = maps[player.at].exits[direction[0]];
			io.to(socket.id).emit('map', maps[player.at]);
			console.log(socketid[socket.id] + " moves: " + direction + " to " + player.at);
		}
		else {
			io.to(socket.id).emit('message', 'You cannot move in that direction');
		}
	});

	// Save user data on disconnect
	socket.on('disconnect', function() {
		console.log("user " + socket.id + " disconnected");
		fs.writeFile(_fileusers, JSON.stringify(users, null, 4));
	});

	// Any other input, echo back
	socket.on('command', function(msg){
		console.log(socket.id + ' sends: ' + msg);
		io.to(socket.id).emit('message', msg);
	});
});

//=======
// Other
//=======
setInterval(function() {
	io.to('/hints').emit('message', 'Remember to leave feedback at github.com/ksami/muddy');
}, 60000);
