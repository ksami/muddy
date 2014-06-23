// Class declaration for Mobs

var mapprefix = 'm';		//for prefixing maps

var mobs = [];
var id = 0;

function Mob(id, index, area) {
	//************
	// PROPERTIES
	//************

	//================
	// Common with User
	// count: 13
	this.name = 'mob';
	this.id = id;
	this.desc = 'Much plain. Such nondescript. Wow.';
	this.at = 'm0-12';
	this.maxhp = 100;
	this.hp = 100;
	this.spd = 1000;
	this.def = {min: 1, max: 5};
	this.recovery = {spd: 2000, min: 0, max: 1};
	this.isDead = false;
	this.inCombat = false;
	this.skills = {
		poke: {
			name: 'poke',
			id: 1,				//unique across all skills
			desc: '*poke poke*',
			atk: {min: 1, max: 5}
		}
	};
	this.defaultSkill = 'poke';
	
	//=============
	// Mob-specific
	//
	this.index = index;		//like pokedex
	this.area = area;


	//*********
	// METHODS
	//*********
	
	//================
	// Common with User
	// count: 2
	
	//pass in target Actor object, skill name
	//NOTE: no check for if skill exists
	this.damageOther = function(other, skill) {
		//if no skill param, default to defaultSkill
		if(typeof skill === 'undefined') {
			skill = this.skills[this.defaultSkill];
		}
		else{
			skill = this.skills[skill];
		}
		//damage is discrete
		var rawDamage = Math.floor((Math.random() * skill.atk.max) + skill.atk.min);
		var reducedDamage = rawDamage - (Math.floor((Math.random() * other.def.max) + other.def.min));
		
		if(reducedDamage < 0) {
			reducedDamage = 0;
		}
		other.hp = other.hp - reducedDamage;

		if(other.hp < 0) {
			other.hp = 0;
			other.isDead = true;
		}

		return reducedDamage;
	}
	this.recover = function() {
		if(this.hp < this.maxhp) {
			if(this.recovery.max < 2) {
				this.hp += 1;		//newbie help? until they decide to increase max recovery
			}
			else {
				this.hp += (Math.floor((Math.random() * this.recovery.max) + this.recovery.min));
			}

			if(this.hp > this.maxhp) {
				this.hp = this.maxhp;
			}
		}
	}

	//==============
	// Mob-specific
	//
	this.onDeath = function(map) {
		//remove this from map
		var i = map.mobs.indexOf(this);
		map.mobs.splice(i, 1);
	}
}

//++++++++++++++++
// SLIMELET CLASS
//++++++++++++++++

//inherit from Mob class
Slimelet.prototype = Mob.prototype;
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

//create mobs
for(var i=0; i<10; i++) {
	mobs.push(new Slimelet(i));
}

//expose to main module
module.exports = mobs;