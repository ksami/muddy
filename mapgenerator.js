var _filemaps = __dirname + '/json/mapss.json';

var fs = require('fs');

function map(area, id, name, desc) {
	this.area = area,
	this.id = id,
	this.name = name,
	this.desc = desc,
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
	var prefix = 'm';
	var area = 0;
	var newmap = new map(area, i, "name", "desc");
	
	var exits = {};
	if((i%5)-1>=0) {
		exits['w'] = prefix + area + '-' + (i-1);
	}
	if((i%5)+1<=4) {
		exits['e'] = prefix + area + '-' + (i+1);
	}
	if((Math.floor(i/5))-1>=0) {
		exits['n'] = prefix + area + '-' + (i-5);
	}
	if((Math.floor(i/5))+1<=4) {
		exits['s'] = prefix + area + '-' + (i+5);
	}
	newmap['exits'] = exits;

	var playerpos = "vvvvv";
	playerpos = playerpos.substr(0,i%5) + 'X' + playerpos.substr((i%5)+1);
	newmap.map[Math.floor(i/5)] = playerpos;
	console.dir(newmap);
	maps[prefix + area + '-' + i] = newmap;
}

fs.writeFile(_filemaps, JSON.stringify(maps, null, 4), function(err) {
	if(err) {
		console.log("User file error: " + err);
	}
	else {
		console.log("Users.JSON save to " + _filemaps);
	}
})