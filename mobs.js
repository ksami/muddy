// Mobs

var skills = require(__dirname + '/skills.js');

var mobsdata = {
	m001: {
		name: 'slimelet',
		id: 'm001',
		desc: 'Young of a slime. Duh.',
		at: 'm0-12',
		area: 0,

		respawnTime: 20000,
		maxhp: 50,
		inithp: 30,
		hp: 30,
		spd: 750,
		def: {min: 0, max: 4},
		recovery: {spd: 1000, min: 0, max: 2},

		skills: {
			poke: skills.poke
		},
		defaultSkill: 'poke',
		items: {
			'e001': 0.15,
			'e002': 0.45
		}
	},
	m002: {
		name: 'ghostlet',
		id: 'm002',
		desc: 'Young of a ghost. Duh.',
		at: 'm0-12',
		area: 0,

		respawnTime: 35000,
		maxhp: 100,
		inithp: 65,
		hp: 65,
		spd: 1300,
		def: {min: 2, max: 4},
		recovery: {spd: 2000, min: 0, max: 3},

		skills: {
			poke: skills.poke,
			chill: skills.chill			
		},
		defaultSkill: 'chill',
		items: {'e001': 0.85}
	}
}

module.exports = mobsdata;