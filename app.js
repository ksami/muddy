/*
 * Server-side JS - Main file
 */

// Environment configurables
var port = process.env.OPENSHIFT_NODEJS_PORT || 8080;
var ipaddress = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
var _filepwd = __dirname + '/.private/pwd';
var _fileindex = __dirname + '/public/index.html';
var _fileregister = __dirname + '/public/register.html';
var _filemaps = __dirname + '/json/maps.json';
var _fileusers = __dirname + '/json/users.json';

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

//magic
app.all('/*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

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

fs.readFile(_filemaps, 'utf8', function (err, data) {
	if(err) {
		console.log('Map file error: ' + err);
		return;
	}
	maps = JSON.parse(data);
	
	//add mobs to maps
	for(var i=0; i<mobs.length; i++) {
		(maps[mobs[i].at].mobs).push(mobs[i]);
		//console.dir(maps[mobs[i].at]);
		//console.log(maps[mobs[i].at].mobs[0].isDead);
	}
});

fs.readFile(_fileusers, 'utf8', function (err, data) {
	if(err) {
		console.log('User file error: ' + err);
		return;
	}
	var obj = JSON.parse(data);
	
	for(var key in obj) {
		users[key] = new User(obj[key]);
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

				//join channels
				socket.join('/hints');
				socket.join('/all');
				socket.join(login.username);
				socket.join(player.at);

				//trigger events
				console.log(login.username + ' has logged in');
				io.to(socket.id).emit('loginverified', login.username);
				io.to(socket.id).emit('message', 'Welcome ' + login.username + '!');
				
				//trigger map refresh every 1 second
				var intMapRefresh = setInterval(function() {
					io.to(socket.id).emit('map', maps[player.at]);
				}, 1000);

				//start player recovery
				var intPlayerRecovery = setInterval(function() {
					player.recover();
				}, player.recovery.spd);

				//update player stats every 1 second
				var intStatsRefresh = setInterval(function() {
					io.to(socket.id).emit('stats', player);
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

			player.at = maps[player.at].exits[direction[0]];
			io.to(socket.id).emit('map', maps[player.at]);
			
			//join this map's channel
			socket.join(player.at);
		}
		else {
			io.to(socket.id).emit('message', 'You cannot move in that direction');
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
						io.to(socket.id).emit('message', 'You' + msg);
					}, player.spd);
					
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
						io.to(socket.id).emit('message', msg);
					}, target.spd);

					var intHpCheck = setInterval(function(){
						io.to(socket.id).emit('combatInfo', {'playername': player.name, 'playerhp': player.hp, 'targetname': target.name, 'targethp': target.hp});

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

							target.onDeath(maps[target.at]);
							io.to(socket.id).emit('message', 'Victory! You have defeated ' + target.name);
						}
					}, 300);
				}
			}
			else {
				io.to(socket.id).emit('message', 'Target missing');
			}
		}
		else {
			io.to(socket.id).emit('message', 'You are already in combat!');
		}
	});

	// Save user data on disconnect
	socket.on('disconnect', function() {
		console.log('user ' + socket.id + ' disconnected');

		//clear timers started on login
		if(typeof intMapRefresh !== 'undefined') clearInterval(intMapRefresh);
		if(typeof intStatsRefresh !== 'undefined') clearInterval(intStatsRefresh);
		if(typeof intPlayerRecovery !== 'undefined') clearInterval(intPlayerRecovery);

		updateUsersFile();
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
	var usersToJSON = {};

	for(var user in users) {
		usersToJSON[user] = users[user].toJSON();
	}

	fs.writeFile(_fileusers, JSON.stringify(usersToJSON, null, 4), function(err) {
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