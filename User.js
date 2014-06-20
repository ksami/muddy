// Class declaration for User class
var _fileskills = __dirname + '/json/skills.json';

var fs = require('fs');
var skills = [];

skills = JSON.parse(fs.readFileSync(_fileskills, 'utf8'));

//overload constructor based on type of first param
function User(data, socketid) {
	if(typeof data === String) {
		this.nick = data;
		this.socketid = socketid;
		this.at = 'm0-12';									//starting map
		this.desc = 'Much plain. Such nondescript. Wow.';	//description shown when using look command on user
		this.hp = 100;
		this.atk = {'min': 1, 'max': 5};					//basic atk: poke
		this.def = {'min': 1, 'max': 5};
		//this.crit = {'multiplier': 1.1, 'chance': 0.1};
		this.skills = {
			'kick': skills['kick']
		}
		this.defaultSkill = this.skills.kick;
	}
	else {
		this.nick = data.nick;
		this.socketid = data.socketid;
		this.at = data.at;
		this.desc = data.desc;
		this.hp = data.hp;
		this.atk = data.atk;
		this.def = data.def;
		this.skills = data.skills;
		this.defaultSkill = data.defaultSkill;
	}
}

User.prototype.fight = function(target, skill) {
	if(typeof skill !== 'undefined') {
		skill = this.defaultSkill;
	}
	//skeleton
	if((this.atk.max)*3 >= target.hp) {
		return 'win';
	}
	else {
		return 'lose';
	}
}

// Expose User class to main module app.js
module.exports = User;