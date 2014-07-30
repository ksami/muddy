// Class declaration for Mobs

var skills = require(__dirname + '/skills.js');
var mobsdata = require(__dirname + '/mobs.js');
var Item = require(__dirname + '/Item.js').Item;

var mapprefix = 'm';		//for prefixing maps

var mobs = [];

function Mob(mobdata) {
	//************
	// PROPERTIES
	//************

	//================
	// Common with User
	// count: 13
	this.name = mobdata.name || 'mob';
	this.id = mobdata.id || id;
	this.desc = mobdata.desc ||'Much plain. Such nondescript. Wow.';
	this.at = mapprefix + mobdata.area + '-' + Math.floor(Math.random() * 25);
	this.maxhp = mobdata.maxhp ||100;
	this.hp = mobdata.hp ||100;
	this.spd = mobdata.spd ||1000;
	this.def = mobdata.def ||{min: 1, max: 5};
	this.recovery = mobdata.recovery ||{spd: 2000, min: 0, max: 1};
	this.isDead = false;
	this.inCombat = false;
	this.skills = mobdata.skills ||{
		poke: skills.poke
	};
	this.defaultSkill = mobdata.defaultSkill ||'poke';
	
	//=============
	// Mob-specific
	//
	this.inithp = mobdata.inithp ||100;
	this.area = mobdata.area ||0;
	this.respawnTime = mobdata.respawnTime ||20000;
	this.items = mobdata.items ||{};

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

	//==
	// Mob-specific
	//

	//return an array of Item
	this.dropItems = function() {
		var drops = [];
		for(var id in this.items){
			//roll for drop chance
			if(Math.random() > 1-this.items[id]){
				drops.push(new Item(id));
			}
		}
		return drops;
	}
}

//create mobs
var i;
for(i=0; i<10; i++) {
	mobs.push(new Mob(mobsdata['m001']));
}
for(; i<15; i++) {
	mobs.push(new Mob(mobsdata['m002']));
}

//expose to main module
module.exports = mobs;