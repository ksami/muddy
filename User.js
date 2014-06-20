// Class declaration for User class
var _fileskills = __dirname + '/json/skills.json';

var fs = require('fs');
var skills = [];

skills = JSON.parse(fs.readFileSync(_fileskills, 'utf8'));

//overload constructor based on type of first param
function User(data, socketid) {
	if(typeof data === String) {
		this.name = data;
		this.socketid = socketid;
		this.at = 'm0-12';									//starting map
		this.desc = 'Much plain. Such nondescript. Wow.';	//description shown when using look command on user
		this.hp = 100;
		this.spd = 1000;
		this.atk = {'min': 1, 'max': 5};					//basic atk: poke
		this.def = {'min': 1, 'max': 5};
		this.isDead = false;
		//this.crit = {'multiplier': 1.1, 'chance': 0.1};
		this.skills = {
			'kick': skills['kick']
		}
		this.defaultSkill = this.skills.kick;
	}
	else {
		this.name = data.name;
		this.socketid = data.socketid;
		this.at = data.at;
		this.desc = data.desc;
		this.hp = data.hp;
		this.spd = data.spd;
		this.atk = data.atk;
		this.def = data.def;
		this.isDead = data.isDead;
		this.skills = data.skills;
		this.defaultSkill = data.defaultSkill;
	}
}

// Return damage caused to other
User.prototype.damageOther = function(target, skill) {
	//if no skill param, default to defaultSkill
	if(typeof skill !== 'undefined') {
		skill = this.defaultSkill;
	}
	//damage is discrete
	var rawDamage = Math.floor((Math.random() * this.atk.max) + this.atk.min);
	console.log('raw is ' + rawDamage);
	var reducedDamage = rawDamage - (Math.floor((Math.random() * target.def.max) + target.def.min));
	
	if(reducedDamage < 0) {
		reducedDamage = 0;
	}
	target.hp = target.hp - reducedDamage;

	if(target.hp < 0) {
		target.hp = 0;
		target.isDead = true;
	}

	return reducedDamage;
}

// Expose User class to main module app.js
module.exports = User;