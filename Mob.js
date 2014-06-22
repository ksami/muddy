// Class declaration for Mob

var mapprefix = 'm';		//for prefixing maps
var Actor = require(__dirname + '/Actor.js');

var mobs = [];
var id = 0;

//inherit from virtual Actor class
Mob.prototype = Actor;
Mob.prototype.parent = Actor;

function Mob(id, index, area) {
	this.index = index;		//like pokedex
	this.area = area;
	this.id = id;
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
function Slimelet(id) {
	//extend Mob constructor
	Mob.call(this,id,1,0);

	this.name = 'slimelet';
	this.desc = 'Young of a slime. Duh.';
	this.at = mapprefix + this.area + '-' + Math.floor(Math.random() * 25);		//places this at a random map from m0-0 to m0-24
	this.maxhp = 50;		//gets harder the longer the fight draws on
	this.hp = 30;
	this.spd = 500;
	this.def = {'min': 0, 'max': 4};
	this.recovery.max = 2;
	this.recovery.spd = 1000;
}

for(var i=0; i<10; i++) {
	mobs.push(new Slimelet(i));
}

module.exports = mobs;