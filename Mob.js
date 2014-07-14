// Class declaration for Mobs

var skills = require(__dirname + '/skills.js');

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
		poke: skills.poke
	};
	this.defaultSkill = 'poke';
	
	//=============
	// Mob-specific
	//
	this.inithp = 100;
	this.index = index;		//like pokedex
	this.area = area;
	this.respawnTime = 20000;


	//*********
	// METHODS
	//*********
	
	//================
	// Common with User
	// count: 5
	
	//pass in target Actor object, skill name
	//NOTE: no check for if skill exists
	this.damageOther = function(other, skill, critMult) {
		//if no skill param, default to defaultSkill
		if(typeof skill === 'undefined') {
			skill = this.skills[this.defaultSkill];
		}
		else{
			skill = this.skills[skill];
		}

		var rawDamage = 0;

		if(typeof critMult === 'undefined') {
			//damage is discrete
			rawDamage = Math.floor((Math.random() * skill.atk.max) + skill.atk.min);
		}
		else {
			rawDamage = critMult * (Math.floor((Math.random() * skill.atk.max) + skill.atk.min));
		}

		var reducedDamage = rawDamage - (Math.floor((Math.random() * other.def.max) + other.def.min));
		
		if(reducedDamage < 0) {
			reducedDamage = 0;
		}
		other.hp = other.hp - reducedDamage;

		//kill other
		if(other.hp <= 0) {
			other.onDeath();
			this.inCombat = false;
		}

		return reducedDamage;
	}

	//Recover hp
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

	var self = this;
	//Timer for recovery
	var timer;
	//Starts timer
	this.startRecovery = function(){
		timer = setInterval(function(){
			self.recover(self);
		},this.recovery.spd);
	}
	//Stops timer
	this.stopRecovery = function(){
		if(typeof timer !== 'undefined') {
			clearInterval(timer);
		}
	}

	//==
	// Same name, diff function from User
	//
	this.onDeath = function() {
		//die
		this.hp = 0;
		this.isDead = true;
		this.inCombat = false;
		this.stopRecovery();

		//drop items etc.

		//respawn
		setTimeout(function(){self.respawn(self);}, self.respawnTime);
	}

	this.respawn = function(self) {
		self.hp = self.inithp;
		self.isDead = false;
	}
}

//index 1
//++++++++++++++++
// SLIMELET CLASS
//++++++++++++++++

//inherit from Mob class
Slimelet.prototype = Mob.prototype;
Slimelet.prototype.parent = Mob;

function Slimelet(id) {
	//extend Mob constructor
	Mob.call(this,id,1,0);

	this.name = 'slimelet';
	this.desc = 'Young of a slime. Duh.';
	this.at = mapprefix + this.area + '-' + Math.floor(Math.random() * 25);		//places this at a random map from m0-0 to m0-24
	this.maxhp = 50;		//gets harder the longer the fight draws on
	this.inithp = 30;
	this.hp = this.inithp;
	this.spd = 500;
	this.def = {'min': 0, 'max': 4};
	this.recovery.max = 2;
	this.recovery.spd = 1000;
}


//index 2
//++++++++++++++++
// GHOSTLET CLASS
//++++++++++++++++

//inherit from Mob class
Ghostlet.prototype = Mob.prototype;
Ghostlet.prototype.parent = Mob;

function Ghostlet(id) {
	//extend Mob constructor
	Mob.call(this,id,2,0);

	this.name = 'ghostlet';
	this.desc = 'Young of a ghost. Duh.';
	this.at = mapprefix + this.area + '-' + Math.floor(Math.random() * 25);		//places this at a random map from m0-0 to m0-24
	this.maxhp = 100;		//gets harder the longer the fight draws on
	this.inithp = 65;
	this.hp = this.inithp;
	this.spd = 1200;
	this.def = {'min': 2, 'max': 4};
	this.recovery.max = 3;
	this.recovery.spd = 1000;
	this.skills.chill = skills.chill;
	this.defaultSkill = 'chill';
	this.respawnTime = 35000;
}

//create mobs
var i;
for(i=0; i<10; i++) {
	mobs.push(new Slimelet(i));
}
for(; i<15; i++) {
	mobs.push(new Ghostlet(i));
}

//expose to main module
module.exports = mobs;