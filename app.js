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
var sprintf = require('sprintf-js').sprintf;
var strings = require(__dirname + '/strings.js');
var User = require(__dirname + '/User.js');
var Command = require(__dirname + '/Command.js');
app.use(express.static(__dirname + '/public'));

// Globals
var maps = {};
var users = {};
var socketid = {};
var items = require(__dirname + '/Item.js');
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

	//add items to maps
	//testing only
	// for(var i=0; i<items.length; i++) {
	// 	(maps['m0-12'].items).push(items[i]);
	// }
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
	var intMapRefresh;
	var intStatsRefresh;
	
	// When user first connects
	socket.join(socket.id);
	console.log('user ' + socket.id + ' connected');
	io.to(socket.id).emit('socketid', socket.id);
	
	//update users global array
	readUsersFile();

	//==============================================
	// Event handlers for events triggered by client
	//==============================================

	// Request a login
	socket.on('reqlogin', function(login){
		//if username already exists in database
		if(users.hasOwnProperty(login.username) === true){
			if(users[login.username].hasOwnProperty('isLoggedin') === false) {
				if(verifyPassword(login, socket.id) === true){
					//update user's socketid
					users[login.username].id = socket.id;
					//note: not a property of User class,
					//hence shouldn't be in users[login.username]
					//deleted on disconnect anw
					users[login.username].isLoggedin = true;

					//assign globals
					socketid[socket.id] = login.username;
					player = users[login.username];
					
					//add player to map
					(maps[player.at]).users[player.name] = player;

					//join channels
					//TODO: add all channels as prop of user
					socket.join('/hints');
					socket.join('/all');
					socket.join(player.name);
					socket.join(player.at);

					//trigger events
					console.log(player.name + ' has logged in');
					io.to(player.name).emit('loginverified', player.name);
					var str = sprintf(strings.welcome, player.name);
					io.to('/all').emit('message', str);
					
					//trigger map refresh every 1 second
					intMapRefresh = setInterval(function() {
						io.to(player.name).emit('map', maps[player.at]);
					}, 1000);

					//update player stats every 1 second
					intStatsRefresh = setInterval(function() {
						io.to(player.name).emit('stats', player);
					}, 1000);

					//display inventory, equip
					var inventory = {};
					for(var i in player.items){
						inventory[i] = {
							'quantity': player.items[i].quantity,
							'quantityLimit': player.items[i].quantityLimit
						};
					}
					io.to(player.name).emit('inventory', inventory);
					io.to(player.name).emit('equipment', player.equipSlots);

					//start recovery of hp
					player.startRecovery();

					//take out of combat
					player.inCombat = false;
				}
				else{
					//wrong password
					io.to(socket.id).emit('loginfailed');
				}
			}
			else{
				//already logged in
				io.to(socket.id).emit('loggedin');
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

	// Acknowledge a crit start
	socket.on('critStartAck', function(){
		if(typeof player !== 'undefined') {
			setTimeout(function(){io.to(player.name).emit('critEnd');}, player.crit.time);
		}
	});

	// Calculate crit damage
	socket.on('critEndAck', function(crit){
		if(typeof player !== 'undefined') {

			//find number of times skill name is spelt correctly in string
			//NOTE: modifier for length of skill name? longer = more dmg
			var critMult = 0;
			var critSkill;
			for(var skill in player.skills) {
				var regex = new RegExp(skill, 'gi');
				var res = crit.match(regex);
				if(Array.isArray(res) === true) {
					critMult = res.length;
					critSkill = res[0];
					break;
				}
			}
			
			player.inCombat = false;
			Controller.fight({'skill': critSkill||player.currentSkill, 'target': player.currentTarget}, socket, player, critMult);
		}
	});

	// Save user data on disconnect
	socket.on('disconnect', function() {
		console.log('user ' + socket.id + ' disconnected');

		//if logged in
		if(typeof player !== 'undefined') {
			//leave combat
			player.stopRecovery();
			player.inCombat = false;
			delete player.isLoggedin;

			//leave channels
			socket.leave('/hints');
			socket.leave('/all');
			socket.leave(player.name);
			socket.leave(player.at);

			//clear timers started on login
			clearInterval(intMapRefresh);
			clearInterval(intStatsRefresh);

			//logout msg
			var str = sprintf(strings.logout, player.name);
			io.to('/all').emit('message', str);
			updateUsersFile('logout', player.name);

			//update globals
			//update users global is in the callback for users file
			delete socketid[socket.id];
			delete (maps[player.at]).users[player.name];
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
			else if(command.type === 'skill') {
				Controller.skill(command, socket, player);
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
	fight: function(data, socket, player, critMult) {

		//allow for attacking one but being attacked by many
		//but due to the mysterious nature of mobs 
		//they can attack many at once since players are the one who start combat
		if(player.inCombat === false) {
			//check if target exists in map
			var mobsInMap = maps[player.at].mobs.filter(function(mob){
				//include in array if mob.name starts with data.target
				return mob.name.slice(0, data.target.length) === data.target;
			});

			if(mobsInMap.length > 0 || typeof data.target === 'object') {

				//assign target as the Mob object not just its name
				var target;

				if(mobsInMap.length > 0) {
					for(var i=0; i<mobsInMap.length; i++) {
						if(mobsInMap[i].isDead === false) {
							target = mobsInMap[i];
							break;
						}
					}
				}
				else {
					target = data.target;
				}
				
				if(typeof target !== 'undefined'){
					target.inCombat = true;
					player.inCombat = true;

					//save target and skill for resuming after crit
					player.currentTarget = target;
					player.currentSkill = data.skill;

					//start target recovery
					target.startRecovery();

					//apply any crit damage
					if(typeof critMult !== 'undefined') {
						var dmg = player.damageOther(target, data.skill, critMult);
						var strplayer;
						var strothers;
						if(dmg === 0){
							strothers = sprintf(strings.playercritmiss_o, player.name, target.name);
							strplayer = sprintf(strings.playercritmiss_p, target.name);
						}
						else{
							strothers = sprintf(strings.playercrithit_o, player.name, target.name, dmg);
							strplayer = sprintf(strings.playercrithit_p, target.name, dmg);
						}
						socket.broadcast.to(player.at).emit('message', {'msg': strothers, 'class': 'blue'});
						io.to(player.name).emit('message', {'msg': strplayer, 'class': 'bold'});
					}

					//start player combat
					var intPlayerCombat = setInterval(function(){
						//roll crit
						var isCrit = (Math.random() >= (1 - player.crit.chance));

						if(isCrit === true) {
							clearInterval(intPlayerCombat);
							clearInterval(intTargetCombat);
							clearInterval(intHpCheck);
							target.stopRecovery();

							//crit
							//emit crit start
							//	client emits critStartAck
							io.to(player.name).emit('critStart');

							//timer to emit crit end after crit.time
							//	client emits back string from crit window

							//event handler for crit calculates crit damage
							//calls this fight function again
						}
						else {
							var dmg = player.damageOther(target, data.skill);
							var strplayer;
							var strothers;
							if(dmg === 0){
								strothers = sprintf(strings.playermiss_o, player.name, target.name);
								strplayer = sprintf(strings.playermiss_p, target.name);
							}
							else{
								strothers = sprintf(strings.playerhit_o, player.name, data.skill, target.name, dmg);
								strplayer = sprintf(strings.playerhit_p, data.skill, target.name, dmg);
							}
							socket.broadcast.to(player.at).emit('message', {'msg': strothers, 'class': 'blue'});
							io.to(player.name).emit('message', strplayer);
						}
					}, player.spd);
					
					//start target combat
					var intTargetCombat = setInterval(function(){
						var dmg = target.damageOther(player);	//using target's default skill
						var strplayer;
						var strothers;
						if(dmg === 0){
							strothers = sprintf(strings.targetmiss_o, player.name, target.name);
							strplayer = sprintf(strings.targetmiss_p, target.name);
						}
						else{
							strothers = sprintf(strings.targethit_o, target.name, target.defaultSkill, player.name, dmg);
							strplayer = sprintf(strings.targethit_p, target.name, target.defaultSkill, dmg);
						}
						socket.broadcast.to(player.at).emit('message', {'msg': strothers, 'class': 'blue'});
						io.to(player.name).emit('message', {'msg': strplayer, 'class': 'red'});
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
							player.currentTarget = {};

							//clear mob info after 3 seconds
							setTimeout(function(){io.to(player.name).emit('combatInfo', {'playername': player.name, 'playerhp': player.hp});}, 3000);

							var strplayer;
							var strothers;
							strothers = sprintf(strings.playerdefeat_o, player.name, target.name);
							strplayer = sprintf(strings.playerdefeat_p, target.name);
							
							socket.broadcast.to(player.at).emit('message', {'msg': strothers, 'class': 'blue'});
							io.to(player.name).emit('message', {'msg': strplayer, 'class': 'red bold'});

							//respawn at map m0-12
							Controller.moveTo({map: 'm0-12'}, socket, player);
						}
						else if(target.isDead === true) {
							//TODO: ONLY FOR MOBS!
							var drops = target.dropItems();
							for(var i=0; i < drops.length; i++){
								(maps[target.at].items).push(drops[i]);
							}

							//stop fighting dammit
							clearInterval(intTargetCombat);
							clearInterval(intPlayerCombat);
							clearInterval(intHpCheck);
							player.currentTarget = {};

							//clear mob info after 3 seconds
							setTimeout(function(){io.to(player.name).emit('combatInfo', {'playername': player.name, 'playerhp': player.hp});}, 3000);

							var strplayer;
							var strothers;
							strothers = sprintf(strings.targetdefeat_o, player.name, target.name);
							strplayer = sprintf(strings.targetdefeat_p, target.name);

							socket.broadcast.to(player.at).emit('message', {'msg': strothers, 'class': 'blue'});
							io.to(player.name).emit('message', {'msg': strplayer, 'class': 'green'});
						}
					}, 300);
				}
				else {
					io.to(player.name).emit('message', strings.targetdead);
				}
			}
			else {
				io.to(player.name).emit('message', strings.targetmissing);
			}
		}
		else {
			io.to(player.name).emit('message', strings.playerincombat);
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
				io.to(player.name).emit('message', strings.movebad);
			}
		}
		else {
			io.to(player.name).emit('message', strings.moveincombat);
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
				io.to(player.name).emit('message', strings.movebad);
			}
		}
		else {
			io.to(player.name).emit('message', strings.moveincombat);
		}
	},

	//executes skills/actions besides combat
	skill: function(command, socket, player) {
		if(command.skill === 'take'){
			//check if item exists in map
			var itemsInMap = maps[player.at].items.filter(function(item){
				//include in array if item.name starts with command.target
				return item.name.slice(0, command.target.length) === command.target;
			});

			//if found in map or target was already a valid object
			if(itemsInMap.length > 0 || typeof command.target === 'object'){
				//assign the target as the first item object itself
				var target = itemsInMap[0];

				//take first occurrence of item in map
				if(target.isPickable){

					//add to inventory
					if(player.pickItem(target) !== 'unstackable'){
						//remove first occurrence of item in map
						for (var i=0; i < maps[player.at].items.length; i++){
							if (maps[player.at].items[i].name === target.name){
								maps[player.at].items.splice(i,1);
								break;
							}
						}

						//display inventory
						var inventory = {};
						for(var i in player.items){
							inventory[i] = {
								'quantity': player.items[i].quantity,
								'quantityLimit': player.items[i].quantityLimit
							};
						}
						io.to(player.name).emit('inventory', inventory);
					}
					else{
						var str = sprintf(strings.itemtoomany, target.name);
						io.to(player.name).emit('message', str);
					}
				
				}
				else{
					var str = sprintf(strings.itemnotpickable, target.name);
					io.to(player.name).emit('message', str);
				}
			}
			else{
				io.to(player.name).emit('message', strings.itemmissing);
			}
		}
		else if(command.skill === 'equip'){
			var success = player.equipItem(command.target);
			if(success === 'noitem'){
				io.to(player.name).emit('message', strings.itemmissing);
			}
			else if(success === 'notequipable'){
				io.to(player.name).emit('message', strings.itemnotequipable);
			}
			else if(success === 'isequipped'){
				io.to(player.name).emit('message', strings.itemisequipped);
			}
			else if(success === 'slotfilled'){
				io.to(player.name).emit('message', strings.itemslotfilled);
			}
			else{
				var str = sprintf(strings.itemequipped, success);
				io.to(player.name).emit('message', str);
				io.to(player.name).emit('equipment', player.equipSlots);
			}
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
			io.to(player.name).emit('message', strings.help);
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
var updateUsersFile = function(logout, playername) {
	fs.writeFile(_fileusers, JSON.stringify(users, null, 4), function(err) {
		if(err) {
			console.log('User file error: ' + err);
		}
		else {
			console.log('Users.JSON save to ' + _fileusers);
			
			if(logout === 'logout'){
				delete users[playername];
			}
		}
	});
};

//read from users file
var readUsersFile = function() {
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
		console.log('Users updated');
	});
};

var hintiterator = 0;
setInterval(function() {
	var str = strings.hint[hintiterator];
	hintiterator = (hintiterator + 1) % strings.hint.length;
	io.to('/hints').emit('message', 'Hint: ' + str);
}, 60000);

//server shutdown after 3 seconds
var serverShutdown = function() {
	console.log('Received kill signal, shutting down gracefully');
	io.sockets.emit('servershutdown');

	//cannot save data
	//TODO: send a nicer kill signal which doesnt kill process till saved
	//fs.writeFileSync(_fileusers, JSON.stringify(users, null, 4));

	//doesnt execute past here

	//countdown
	var i=3;
	setInterval(function(i){
		console.log(i);
		i--;
	}, 1000);

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