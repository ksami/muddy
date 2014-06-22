// Class declaration for Mob

var mapprefix = 'm';		//for prefixing maps
var Actor = require(__dirname + '/Actor.js');

var mobs = [];

//inherit from virtual Actor class
Mob.prototype = Actor;
Mob.prototype.parent = Actor;

function Mob(index, area) {
	this.index = index;		//like pokedex
	this.area = area;
	this.onDeath = function(map) {
		//remove this from map
		var i = map.mobs.indexOf(this);
		map.mobs.splice(i, 1);
	}
}

//inherit from virtual Actor class
Slimelet.prototype = Actor;
Slimelet.prototype.parent = Mob;

//index 1
function Slimelet() {
	//extend Mob constructor
	Mob.call(this,1,0);

	this.name = 'slimelet';
	this.desc = 'Young of a slime. Duh.';
	//places this at a random map from m0-0 to m0-24
	this.at = mapprefix + this.area + '-' + Math.floor(Math.random() * 25);
	this.hp = 30;
	this.spd = 500;
	this.def = {'min': 0, 'max': 2};
}

for(var i=0; i<10; i++) {
	mobs.push(new Slimelet());
}

module.exports = mobs;