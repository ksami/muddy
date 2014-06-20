var _filemaps = __dirname + '/json/mobs.json';

var fs = require('fs');

var mobs = []

function Mob(id, name, desc, area) {
	this.id = id;
	this.name = name;
	this.desc = desc;
	this.area = area;
	this.isDead = false;
}

//generate 10 slimelets
for(var i=0; i<10; i++) {
	var area = 0;
	var mapprefix = 'm';
	var mob = new Mob(i, "slimelet", "young of a slime", area);
	//places the mob at a random map from m0-0 to m0-24
	mob.at = mapprefix + area + '-' + Math.floor(Math.random() * 25);
	mob.hp = 30;
	mob.atk = {'min': 2, 'max': 5};
	mob.def = {'min': 0, 'max': 2};
	mobs[i] = mob;
}

fs.writeFile(_filemaps, JSON.stringify(mobs, null, 4), function(err) {
	if(err) {
		console.log("Mobs file error: " + err);
	}
	else {
		console.log("Mobs.JSON save to " + _filemaps);
	}
})