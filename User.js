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
		this.items = {};
		this.equipSlots = {
			head: '',
			body: '',
			legs: '',
			rarm: '',
			rhand: '',
			rcalf: '',
			rfoot: '',
			larm: '',
			lhand: '',
			lcalf: '',
			lfoot: ''
		};
		this.atk = {min: 0, max: 0};
		this.crit = {chance: 0.01, time: 1000};
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
		this.items = data.items;
		this.equipSlots = data.equipSlots;
		this.atk = data.atk;
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
	
	//TODO: no check for space yet
	this.pickItem = function(item) {
		//check if item of same name already exists
		if(this.items.hasOwnProperty(item.name)){
			//check if can still stack
			if((this.items[item.name].quantity + item.quantity) <= this.items[item.name].quantityLimit){
				this.items[item.name].quantity = this.items[item.name].quantity + item.quantity;
			}
			else{
				return 'unstackable';
			}
		}
		else{
			this.items[item.name] = item;
		}
		return;
	};

	//TODO: no check for space yet
	this.equipItem = function(targetname, targetslot) {
		var item;

		//check if target item exists
		for(var itemname in this.items){
			if(itemname.slice(0, targetname.length) === targetname){
				item = this.items[itemname];
				break;
			}
		}

		//equip item in correct slot
		if(typeof item === 'object'){
			if(item.isEquipped === false || ((item.isEquipped === true) && (item.numEquipped < item.quantity))){
				if(item.isWieldable === true || item.isWearable === true){
					
					if(targetslot !== 'undefined'){
						for(var i=0; i<item.equipSlot.length; i++){
							if(item.equipSlot[i].slice(0, targetslot.length) === targetslot){
								//if nothing in slot
								if(this.equipSlots[item.equipSlot[i]] === ''){
									this.equipSlots[item.equipSlot[i]] = item.name;
									item.isEquipped = true;
									item.numEquipped += 1;

									//apply stats
									this.equipItemStats(item, 'apply');

									return item.name;
								}
								else{
									return 'slotfilled';
								}
							}
						}
						return 'slotnotfound';
					}
					else{
						for(var i=0; i<item.equipSlot.length; i++){
							//if nothing in slot
							if(this.equipSlots[item.equipSlot[i]] === ''){
								this.equipSlots[item.equipSlot[i]] = item.name;
								item.isEquipped = true;
								item.numEquipped += 1;

								//apply stats
								this.equipItemStats(item, 'apply');

								return item.name;
							}
						}
						return 'slotfilled';
					}
				}
				else{
					return 'notequipable';
				}
			}
			else{
				return 'isequipped';
			}
		}
		else{
			return 'noitem';
		}
	};

	//to be called from equipItem
	//applies or takes away stats of item equipped
	this.equipItemStats = function(item, toapply) {
		var apply = 1;
		
		if(toapply === 'apply'){
			apply = 1;
		}
		else{
			apply = -1;
		}

		//TODO: add on stats
		this.atk.min += apply * item.atk.min;
		this.atk.max += apply * item.atk.max;
		this.crit.chance += apply * item.crit.chance;
		this.crit.time += apply * item.crit.time;
		this.spd += apply * item.spd;

		this.def.min += apply * item.def.min;
		this.def.max += apply * item.def.max;
		this.maxhp += apply * item.maxhp;
		this.recovery.spd += apply * item.recovery.spd;
		this.recovery.min += apply * item.recovery.min;
		this.recovery.max += apply * item.recovery.max;
	}

	this.unequipItem = function(slotname) {
		var item;
		var itemname;

		for(var slot in this.equipSlots){
			if(slot.slice(0, slotname.length) === slotname){
				if(this.equipSlots[slot] !== ''){
					itemname = this.equipSlots[slot];
					this.equipSlots[slot] = '';

					item = this.items[itemname];
					item.numEquipped -= 1;
					if(item.numEquipped < 1){
						item.isEquipped = false;
					}

					//take away stats
					this.equipItemStats(item, 'takeaway');

					return item.name;
				}
				else{
					return 'slotempty';
				}
			}
		}
		return 'slotnotfound';
	};

	//================
	// Common with Mob
	// count: 5
	
	//pass in target Actor object, skill name
	//NOTE: no check for if skill exists
	//NOTE: differs from Mob by calculation of dmg take into acct item and base stats
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
			rawDamage = Math.floor((Math.random() * (skill.atk.max + this.atk.max)) + (skill.atk.min + this.atk.min));
		}
		else {
			rawDamage = critMult * Math.floor((Math.random() * (skill.atk.max + this.atk.max)) + (skill.atk.min + this.atk.min));
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
	};

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
	};

	var self = this;
	//Timer for recovery
	var timer;
	//Starts timer
	this.startRecovery = function(){
		timer = setInterval(function(){
			self.recover(self);
		},this.recovery.spd);
	};
	//Stops timer
	this.stopRecovery = function(){
		if(typeof timer !== 'undefined') {
			clearInterval(timer);
		}
	};

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
	};

	this.respawn = function() {
		this.isDead = false;
		this.startRecovery();
	};
}

// Expose User class to main module app.js
module.exports = User;