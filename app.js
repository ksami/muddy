/*
 * Server-side JS - Main file
 */

// Environment configurables
var port = process.env.OPENSHIFT_NODEJS_PORT || 8080;
var ipaddress = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
var _filepwd = (process.env.OPENSHIFT_DATA_DIR || __dirname) + '/.private/pwd';
var _fileindex = __dirname + '/public/index.html';
var _fileregister = __dirname + '/public/register.html';
var _filemaps = __dirname + '/json/maps.json';
var _fileusers = (process.env.OPENSHIFT_DATA_DIR || __dirname) + '/json/users.json';

// Dependencies
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var User = require(__dirname + '/User.js');
var Command = require(__dirname + '/Command.js');
app.use(express.static(__dirname + '/public'));

// Globals
var maps = {};
var users = {};
var socketid = {};
var mobs = require(__dirname + '/Mob.js');
var validCmds = require(__dirname + '/validCmds.js');

// Listen to <port>
http.listen(port, ipaddress, function(){
	console.log('listening on ' + ipaddress + ':' + port);
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

//read stored maps data
fs.readFile(_filemaps, 'utf8', function (err, data) {
	if(err) {
		console.log('Map file error: ' + err);
		return;
	}
	maps = JSON.parse(data);
	
	//add mobs to maps
	for(var i=0; i<mobs.length; i++) {
		(maps[mobs[i].at].mobs).push(mobs[i]);
	}
});

//read stored user data
fs.readFile(_fileusers, 'utf8', function (err, data) {
	if(err) {
		console.log('User file error: ' + err);
		return;
	}
	//add to users global
	var obj = JSON.parse(data);
	for(var name in obj) {
		users[name] = new User(obj[name]);
	}
});


//=========
// Session
//=========
io.on('connection', function(socket){
	var player;
	
	// When user first connects
	socket.join(socket.id);
	console.log('user ' + socket.id + ' connected');
	io.to(socket.id).emit('socketid', socket.id);
	

	//==============================================
	// Event handlers for events triggered by client
	//==============================================

	// Request a login
	socket.on('reqlogin', function(login){
		
		// if username already exists in database
		if(users.hasOwnProperty(login.username)){
			if(verifyPassword(login, socket.id) === true){
				//update user's socketid
				users[login.username].id = socket.id;

				//update users file
				updateUsersFile();

				//assign globals
				socketid[socket.id] = login.username;
				player = users[login.username];
				
				//add player to map
				(maps[player.at]).users[player.name] = player;

				//join channels
				socket.join('/hints');
				socket.join('/all');
				socket.join(player.name);
				socket.join(player.at);

				//trigger events
				console.log(player.name + ' has logged in');
				io.to(player.name).emit('loginverified', player.name);
				io.to('/all').emit('message', 'Welcome ' + player.name + '!');
				
				//trigger map refresh every 1 second
				var intMapRefresh = setInterval(function() {
					io.to(player.name).emit('map', maps[player.at]);
				}, 1000);

				//update player stats every 1 second
				var intStatsRefresh = setInterval(function() {
					io.to(player.name).emit('stats', player);
				}, 1000);

				//start recovery of hp
				player.startRecovery();
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
			users[login.username] = new User(login.username, socket.id);
			console.dir(users[login.username]);

			//update users file
			updateUsersFile();

			//update pwd file
			var pwds = {};
			fs.readFile(_filepwd, 'utf8', function (err, data) {
				if(err) {
					console.log('Password file error: ' + err);
					return;
				}
				pwds = JSON.parse(data);
				pwds[login.username] = login.password;

				fs.writeFile(_filepwd, JSON.stringify(pwds, null, 4), function(err) {
					if(err) {
						console.log('Password file error: ' + err);
					}
					else {
						console.log('Password save');
					}
				});
			});

			//trigger event to redirect client back to / to login
			io.to(socket.id).emit('regpass');
		}
	});

	// Save user data on disconnect
	socket.on('disconnect', function() {
		console.log('user ' + socket.id + ' disconnected');

		//clear timers started on login
		if(typeof intMapRefresh !== 'undefined') clearInterval(intMapRefresh);
		if(typeof intStatsRefresh !== 'undefined') clearInterval(intStatsRefresh);

		//if logged in
		if(typeof player !== 'undefined') {
			io.to('/all').emit(player.name + ' has logged out');
			updateUsersFile();
		}
	});

	// Any other input, echo back
	socket.on('command', function(msg){
		console.log(player.name + ' sends: ' + msg);
		io.to(player.name).emit('message', msg);
	});

	// Parser
	socket.on('input', function(msg){
		var sortedValidCmds = validCmds.allSortedCmds;

		//var sortedValidCmds = ['aaa','aab','aba','abb'];
		//var sortedValidCmds = ['aaa','bbb','ddd','eee'];

		var i=0, j=0;
		var foundIndex=null;
		var isFound = false;

		var input = msg.split(' ');
		var command = input[0].toLowerCase();

		//match starting of command
		for(i=0; i<sortedValidCmds.length; i++) {

			//char by char comparison
			for(j=0; command[j] === sortedValidCmds[i][j]; j++) {
				if(j === command.length-1) {
					isFound = true;
					break;
				}
			}

			//stop searching if past the char since sorted array
			//eg. key: ccc; arr: aaa, bbb, ddd, eee; expected: break at ddd
			//eg. key: aac; arr: aaa, aab, aba, abb; expected: break at aba
			if(command.charCodeAt(j) < sortedValidCmds[i].charCodeAt(j)) {
				break;
			}

			//found
			if(isFound === true) {
				foundIndex = i;
				break;
			}
		}

		//choose correct function to execute
		if(foundIndex !== null) {
			command = new Command(sortedValidCmds[foundIndex], msg);

			if(command.type === 'move') {
				Controller.move(command, socket, player);
			}
			else if(command.type === 'fight') {
				Controller.fight(command, socket, player);
			}
			else if(command.type === 'chat') {
				Controller.chat(command, player);
			}
			else if(command.type === 'settings') {
				Controller.settings(command, player);
			}
		}
		else {
			console.log('could not find command');
		}
	});
});


//===========
// Controller
//===========
var Controller = {

	//requires data.skill, data.target
	fight: function(data, socket, player) {

		//allow for attacking one but being attacked by many
		//but due to the mysterious nature of mobs 
		//they can attack many at once since players are the one who start combat
		if(player.inCombat === false) {
			//check if target exists in map
			var mobsInMap = maps[player.at].mobs.filter(function(mob){
				//include in array if mob.name starts with data.target
				return mob.name.slice(0, data.target.length) === data.target;
			});

			if(mobsInMap.length > 0) {

				//assign target as the Mob object not just its name
				var target;
				for(var i=0; i<mobsInMap.length; i++) {
					if(mobsInMap[i].isDead === false) {
						target = mobsInMap[i];
						break;
					}
				}
				
				if(typeof target !== 'undefined'){
					target.inCombat = true;
					player.inCombat = true;

					//start target recovery
					target.startRecovery();

					//start player combat
					var intPlayerCombat = setInterval(function(){
						var dmg = player.damageOther(target, data.skill);
						var msg;
						if(dmg === 0){
							msg = ' missed ' + target.name + '!';
						}
						else{
							msg = ' ' + data.skill + ' ' + target.name + ' for ' + dmg + ' damage!';
						}
						socket.broadcast.to(player.at).emit('message', {'msg': player.name + msg, 'class': 'blue'});
						io.to(player.name).emit('message', 'You' + msg);
					}, player.spd);
					
					//start target combat
					var intTargetCombat = setInterval(function(){
						var dmg = target.damageOther(player);	//using target's default skill
						var msg = {};
						if(dmg === 0){
							msg = target.name + ' missed you!';
						}
						else{
							msg.class = 'red';
							msg.msg = target.name + ' ' + target.defaultSkill + 's you for ' + dmg + ' damage!';
						}
						io.to(player.name).emit('message', msg);
					}, target.spd);

					//start hp check for both
					var intHpCheck = setInterval(function(){
						io.to(player.name).emit('combatInfo', {'playername': player.name, 'playerhp': player.hp, 'targetname': target.name, 'targethp': target.hp});

						//death
						if(player.isDead === true) {
							//stop fighting dammit
							clearInterval(intTargetCombat);
							clearInterval(intPlayerCombat);
							clearInterval(intHpCheck);

							io.to(player.name).emit('combatInfo', {'playername': player.name, 'playerhp': player.hp});
							socket.broadcast.to(player.at).emit('message', {'msg': player.name + ' has been defeated by ' + target.name + '!', 'class': 'blue'});
							io.to(player.name).emit('message', {'msg': '*** You have been defeated by ' + target.name + '! ***', 'class': 'red bold'});

							//respawn at map m0-12
							Controller.moveTo({map: 'm0-12'}, socket, player);
						}
						else if(target.isDead === true) {
							//stop fighting dammit
							clearInterval(intTargetCombat);
							clearInterval(intPlayerCombat);
							clearInterval(intHpCheck);

							io.to(player.name).emit('combatInfo', {'playername': player.name, 'playerhp': player.hp});
							socket.broadcast.to(player.at).emit('message', {'msg': player.name + ' has defeated ' + target.name, 'class': 'blue'});
							io.to(player.name).emit('message', 'Victory! You have defeated ' + target.name);
						}
					}, 300);
				}
				else {
					io.to(player.name).emit('message', 'Targets all dead');
				}
			}
			else {
				io.to(player.name).emit('message', 'Target missing');
			}
		}
		else {
			io.to(player.name).emit('message', 'You are already in combat!');
		}
	},

	//requires command.direction
	move: function(command, socket, player) {
		if(player.inCombat === false) {
			if(maps[player.at].exits.hasOwnProperty(command.direction[0])) {
				//leave previous map's channel
				socket.leave(player.at);

				//leave previous map
				delete (maps[player.at]).users[player.name];

				//move position to next map
				player.at = maps[player.at].exits[command.direction[0]];

				//add player to map
				(maps[player.at]).users[player.name] = player;

				//update map
				io.to(player.name).emit('map', maps[player.at]);
				
				//join next map's channel
				socket.join(player.at);
			}
			else {
				io.to(player.name).emit('message', 'You cannot move in that direction');
			}
		}
		else {
			io.to(player.name).emit('message', 'No escape!');
		}
	},

	//requires command.map
	moveTo: function(command, socket, player) {
		if(player.inCombat === false) {
			if(maps.hasOwnProperty(command.map)) {
				//leave previous map's channel
				socket.leave(player.at);

				//leave previous map
				delete (maps[player.at]).users[player.name];

				//move position to next map
				player.at = command.map;

				//add player to map
				(maps[player.at]).users[player.name] = player;

				//update map
				io.to(player.name).emit('map', maps[player.at]);
				
				//join next map's channel
				socket.join(player.at);
			}
			else {
				io.to(player.name).emit('message', 'You cannot move to that map');
			}
		}
		else {
			io.to(player.name).emit('message', 'No escape!');
		}
	},

	//requires msg.to, msg.content
	chat: function(msg, player) {
		msg.from = player.name;
		io.to(msg.to).emit('chat', msg);
	},

	//requires data.setting
	settings: function(data, player) {
		if(data.setting === 'help') {
			io.to(player.name).emit('message', 'Help: "/all <message>" to talk to everyone, "n","s","e","w" to move, "poke <target>" to fight');
		}
	}

};


//=======
// Other
//=======

// Hashing function
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

// Use synchronous file read to verify password
var verifyPassword = function(login, id) {
	var pwds = {};
	pwds = JSON.parse(fs.readFileSync(_filepwd, 'utf8'));

	if(pwds.hasOwnProperty(login.username)) {
		var pwd = id + pwds[login.username];
		pwd = String(hash(pwd));

		if(pwd === login.password) {
			return true;
		}
	}
	return false;
};


//update users file
var updateUsersFile = function() {
	fs.writeFile(_fileusers, JSON.stringify(users, null, 4), function(err) {
		if(err) {
			console.log('User file error: ' + err);
		}
		else {
			console.log('Users.JSON save to ' + _fileusers);
		}
	});
};

setInterval(function() {
	io.to('/hints').emit('message', 'Welcome to muddy! Type @help for help');
}, 60000);

//server shutdown
var serverShutdown = function() {
	console.log('Received kill signal, shutting down gracefully');
	io.sockets.emit('servershutdown');

	//prevent new connections, close existing
	http.close(function() {
		console.log('Closing connections');
		process.exit();
	});

	//if after 10 seconds, force close
	setTimeout(function() {
		console.error('Could not close connections in time, forcefully shutting down');
		process.exit();
	}, 10*1000);
};

//does not capture on cygwin windows
//need to do a better check
//possibly on startup redirect everyone?
process.on('SIGINT', serverShutdown);
process.on('SIGTERM', serverShutdown);