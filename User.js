// Class declaration for User class

var skills = require(__dirname + '/skills.js');

//add on/overwrite properties initialised in Actor
//overload constructor based on type of first param
function User(data, socketid) {
	//************
	// PROPERTIES
	//************

	// New User
	if((typeof data) === 'string') {
		this.crit = {chance: 0.375, time: 1000};
		this.currentTarget = {};
		this.currentSkill = {};
		//================`
		// Common with Mob
		// count: 13
		this.name = data;
		this.id = socketid;
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
	}

	// Loading user data from JSON file
	else {
		this.crit = data.crit;
		this.currentTarget = data.currentTarget;
		this.currentSkill = data.currentSkill;
		//================
		// Common with Mob
		// count: 13
		this.name = data.name;
		this.id = data.socketid;
		this.at = data.at;
		this.desc = data.desc;
		this.maxhp = data.maxhp;
		this.hp = data.hp;
		this.spd = data.spd;
		this.recovery = data.recovery;
		this.def = data.def;
		this.inCombat = false;
		this.isDead = data.isDead;
		this.skills = data.skills;
		this.defaultSkill = data.defaultSkill;
	}

	//*********
	// METHODS
	//*********
	
	//================
	// Common with Mob
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
	this.recover = function(self) {
		if(self.hp < self.maxhp) {
			if(self.recovery.max < 2) {
				self.hp += 1;		//newbie help? until they decide to increase max recovery
			}
			else {
				self.hp += (Math.floor((Math.random() * self.recovery.max) + self.recovery.min));
			}

			if(self.hp > self.maxhp) {
				self.hp = self.maxhp;
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
	// Same name, diff function from Mob
	//
	this.onDeath = function() {
		this.hp = 0;
		this.isDead = true;
		this.inCombat = false;
		this.stopRecovery();

		//respawn in 2 seconds
		setTimeout(function(){self.respawn(self);}, 2000);
	}

	this.respawn = function() {
		this.isDead = false;
		this.startRecovery();
	}
}

// Expose User class to main module app.js
module.exports = User;