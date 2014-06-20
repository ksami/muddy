// Class declaration for skills
var _filemaps = __dirname + '/json/skills.json';

var fs = require('fs');

var skills = {};
var id = 0;

function Skill(id, name, desc, isAttack) {
	this.id = id;
	this.name = name;
	this.desc = desc;
	this.isAttack = isAttack;
}

var kick = new Skill(id++, 'kick', 'Kick your opponent quite hard', true);
kick.atk = {'min': 3, 'max': 7};
//kick.crit = {'multiplier': 1 + (this.name.length * 0.1), 'chance': 0.1};

skills[kick.name] = kick;

fs.writeFile(_filemaps, JSON.stringify(skills, null, 4), function(err) {
	if(err) {
		console.log("Skills file error: " + err);
	}
	else {
		console.log("Skills.JSON save to " + _filemaps);
	}
})