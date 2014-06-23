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
app.use(express.static(__dirname + '/public'));

// Globals
var maps = {};
var users = {};
var socketid = {};
var mobs = require(__dirname + '/Mob.js');

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

				//start player recovery
				var intPlayerRecovery = setInterval(function() {
					player.recover();
				}, player.recovery.spd);

				//update player stats every 1 second
				var intStatsRefresh = setInterval(function() {
					io.to(player.name).emit('stats', player);
				}, 1000);
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

	
	// Add msg.from and send to msg.to
	socket.on('chat', function(msg) {
		msg.from = player.name;
		io.to(msg.to).emit('chat', msg);
	});

	// Boundary checking then move player
	socket.on('move', function(direction) {
		if(maps[player.at].exits.hasOwnProperty(direction[0])) {
			//leave previous map's channel
			socket.leave(player.at);

			//leave previous map
			delete (maps[player.at]).users[player.name];

			//move position to next map
			player.at = maps[player.at].exits[direction[0]];

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
	});

	// Combat
	socket.on('fight', function(data){
		//allow for attacking one but being attacked by many
		//but due to the mysterious nature of mobs 
		//they can attack many at once since players are the one who start combat
		if(player.inCombat === false) {
			//check if target exists in map
			var mobsInMap = maps[player.at].mobs.filter(function(mob){return mob.name === data.target});

			if(mobsInMap.length > 0) {
				//assign target as the Mob object not just its name
				var target = mobsInMap[0];

				if(target.isDead === false){
					target.inCombat = true;
					player.inCombat = true;

					//start target recovery
					var intTargetRecovery = setInterval(function(){
						target.recover();
					}, target.recovery.spd);

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

						//NOTE: assuming player does not die...

						//death
						if(target.isDead === true) {
							//stop fighting dammit
							clearInterval(intTargetCombat);
							clearInterval(intTargetRecovery);
							clearInterval(intPlayerCombat);
							clearInterval(intHpCheck);

							player.inCombat = false;
							target.inCombat = false;

							socket.broadcast.to(player.at).emit('message', {'msg': player.name + ' has defeated ' + target.name, 'class': 'blue'});
							io.to(player.name).emit('message', 'Victory! You have defeated ' + target.name);
						}
					}, 300);
				}
			}
			else {
				io.to(player.name).emit('message', 'Target missing');
			}
		}
		else {
			io.to(player.name).emit('message', 'You are already in combat!');
		}
	});

	// Save user data on disconnect
	socket.on('disconnect', function() {
		console.log('user ' + socket.id + ' disconnected');

		//clear timers started on login
		if(typeof intMapRefresh !== 'undefined') clearInterval(intMapRefresh);
		if(typeof intStatsRefresh !== 'undefined') clearInterval(intStatsRefresh);
		if(typeof intPlayerRecovery !== 'undefined') clearInterval(intPlayerRecovery);

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
});

//=======
// Other
//=======

// Hashing function
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
}

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
		process.exit()
	});

	//if after 10 seconds, force close
	setTimeout(function() {
		console.error('Could not close connections in time, forcefully shutting down');
		process.exit()
	}, 10*1000);
}

//does not capture on cygwin windows
process.on('SIGINT', serverShutdown);
process.on('SIGTERM', serverShutdown);