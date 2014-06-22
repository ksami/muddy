// Virtual class Actor from which Player and Mob inherit from

Actor = {
	name: 'default name',
	id: 'default id',			//unique across actors
	desc: 'default desc',
	at: 'm0-12',
	hp: 100,
	spd: 1000,
	atk: {min: 1, max: 5},
	def: {min: 1, max: 5},
	isDead: false,
	skills: {
		poke: {
			name: 'poke',
			id: 1,				//unique across all skills
			desc: '*poke poke*',
			atk: {min: 3, max: 7}
		}
	},
	defaultSkill: 'poke',

	damageOther: function(other, skill) {
			//if no skill param, default to defaultSkill
		if(typeof skill !== 'undefined') {
			skill = this.defaultSkill;
		}
		//damage is discrete
		var rawDamage = Math.floor((Math.random() * this.atk.max) + this.atk.min);
		console.log('raw is ' + rawDamage);
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
}

module.exports = Actor;