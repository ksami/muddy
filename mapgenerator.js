var _filemaps = __dirname + '/json/mapss.json';

var fs = require('fs');

function map(area, id, name, desc, exits) {
	this.area = area,
	this.id = id,
	this.name = name,
	this.desc = desc,
	this.exits = exits,
	this.map = [
		"vvvvv",
		"vvvvv",
		"vvvvv",
		"vvvvv",
		"vvvvv"
	]
}

var maps = {};

for(var i=0; i<25; i++) {
	var exits = {};
	if((i%5)-1>=0) {
		exits['w'] = i-1;
	}
	if((i%5)+1<=4) {
		exits['e'] = i+1;
	}
	if((Math.floor(i/5))-1>=0) {
		exits['n'] = i-5;
	}
	if((Math.floor(i/5))+1<=4) {
		exits['s'] = i+5;
	}

	var newmap = new map(0, i, "name", "desc", exits);
	var playerpos = "vvvvv";
	playerpos = playerpos.substr(0,i%5) + 'X' + playerpos.substr((i%5)+1);
	newmap.map[Math.floor(i/5)] = playerpos;
	console.dir(newmap);
	maps['0-' + i] = newmap;
}

fs.writeFile(_filemaps, JSON.stringify(maps, null, 4), function(err) {
	if(err) {
		console.log("User file error: " + err);
	}
	else {
		console.log("Users.JSON save to " + _filemaps);
	}
})