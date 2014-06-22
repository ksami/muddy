// Virtual class Actor from which Player and Mob inherit from

Actor = {
	name: 'default name',
	id: 'default id',			//unique across actors
	desc: 'default desc',
	at: 'm0-12',
	maxhp: 100,
	hp: 100,
	spd: 1000,
	def: {min: 1, max: 5},
	recovery: {spd: 1000, amt: 1},
	isDead: false,
	skills: {
		poke: {
			name: 'poke',
			id: 1,				//unique across all skills
			desc: '*poke poke*',
			atk: {min: 1, max: 5}
		}
	},
	defaultSkill: 'poke',

	//pass in target Actor object, skill name
	//NOTE: no check for if skill exists
	damageOther: function(other, skill) {
		//if no skill param, default to defaultSkill
		if(typeof skill === 'undefined') {
			skill = this.skills[this.defaultSkill];
		}
		else{
			skill = this.skills[skill];
		}
		//damage is discrete
		var rawDamage = Math.floor((Math.random() * skill.atk.max) + skill.atk.min);
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
	},
	recover: function() {
		setInterval(function() {
			console.log('recovering');
			if(this.hp <= this.maxhp) {
				this.hp += this.recovery.amt;
			};
		}, this.recovery.spd);
	},
	stopRecovery: function() {
		clearInterval(this.recover);
	}
}

module.exports = Actor;