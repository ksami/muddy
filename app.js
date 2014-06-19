/*
 * Server-side JS - Main file
 */

// Environment configurables
var port = 3000;
var _filepwd = __dirname + '/.private/pwd';
var _fileindex = __dirname + '/public/index.html';
var _fileregister = __dirname + '/public/register.html';
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

app.get('/register',function(req, res){
	res.sendfile(_fileregister);
});

//===============================
// Read data files asynchronously
//===============================

fs.readFile(_filemaps, 'utf8', function (err, data) {
	if(err) {
		console.log('Map file error: ' + err);
		return;
	}
	maps = JSON.parse(data);
	//console.dir(maps);
	
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
	});
});

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
});


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
	io.to(socket.id).emit('socketid', socket.id);
	

	//==============================================
	// Event handlers for events triggered by client
	//==============================================

	// Request a login
	socket.on('reqlogin', function(login){
		console.log(login.username + ': ' + login.password);

		// if username already exists in database
		if(users.hasOwnProperty(login.username)){
			if(verifyPassword(login, socket.id) === true){
				//update user's socketid
				users[login.username].socketid = socket.id;

				//update users file
				fs.writeFile(_fileusers, JSON.stringify(users, null, 4), function(err) {
					if(err) {
						console.log("User file error: " + err);
					}
					else {
						console.log("Users.JSON save to " + _fileusers);
						io.to(socket.id).emit('map', maps[users[login.username].at]);
					}
				});

				//assign globals
				socketid[socket.id] = login.username;
				player = users[login.username];

				//join own room
				socket.join(login.username);

				//trigger events
				io.to(socket.id).emit('loginverified', login.username);
				io.to(socket.id).emit('message', 'Welcome ' + login.username + '!');
			}
			else{
				//wrong password
				io.to(socket.id).emit('loginfailed');
			}
		}
		else{
			//user does not exist
			io.to(socket.id).emit('loginfailed');
		}
	});

	// Register a new user
	socket.on('register', function(login){
		// if username already exists in database
		if(users.hasOwnProperty(login.username)){
			io.to(socket.id).emit('regfailed');
		}
		else {
			//create the new user
			users[login.username] = {"nick": login.username, "socketid": socket.id, "at": "m0-12"};

			//update users file
			fs.writeFile(_fileusers, JSON.stringify(users, null, 4), function(err) {
				if(err) {
					console.log("User file error: " + err);
				}
				else {
					console.log("Users.JSON save to " + _fileusers);
					io.to(socket.id).emit('map', maps[users[login.username].at]);
				}
			});

			//update pwd file
			var pwds = {};
			fs.readFile(_filepwd, 'utf8', function (err, data) {
				if(err) {
					console.log('Password file error: ' + err);
					return;
				}
				pwds = JSON.parse(data);
				pwds[login.username] = login.password;

				console.dir(pwds);

				fs.writeFile(_filepwd, JSON.stringify(pwds, null, 4), function(err) {
					if(err) {
						console.log("Password file error: " + err);
					}
					else {
						console.dir(pwds);
						console.log("Password save");
					}
				});
			});

			//trigger event to redirect client back to / to login
			io.to(socket.id).emit('regpass');
		}
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

//use synchronous file read to verify password
var verifyPassword = function(login, id) {
	var pwds = {};
	pwds = JSON.parse(fs.readFileSync(_filepwd, 'utf8'));
	console.dir(pwds);

	if(pwds.hasOwnProperty(login.username)) {
		console.log("hashed: " + pwds[login.username]);
		var pwd = id + pwds[login.username];
		console.log("salted hash: " + pwd);
		pwd = String(hash(pwd));
		console.log("hashed salted hash: " + pwd);
		console.log("comp: " + (pwd === login.password));

		if(pwd === login.password) {
			return true;
		}
	}
	return false;
};

setInterval(function() {
	io.to('/hints').emit('message', 'Remember to leave feedback at github.com/ksami/muddy');
}, 60000);
