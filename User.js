// Class declaration for User class

var Actor = require(__dirname + '/Actor.js');

//inherit from virtual Actor class
User.prototype = Actor;
User.prototype.parent = Actor;

//add on/overwrite properties initialised in Actor
//overload constructor based on type of first param
function User(data, socketid) {
	//if using constructor to create a new user during registration
	if((typeof data) === 'string') {
		this.name = data;
		this.id = socketid;
		this.desc = 'Much plain. Such nondescript. Wow.';
	}
	//if taking user data from users.json to init new users
	//because json doesn't store functions
	else {
		//rmb to update properties from Actor
		//13 properties
		this.name = data.name;
		this.id = data.socketid;
		this.at = data.at;
		this.desc = data.desc;
		this.maxhp = data.maxhp;
		this.hp = data.hp;
		this.spd = data.spd;
		this.recovery = data.recovery;
		this.def = data.def;
		this.inCombat = data.inCombat;
		this.isDead = data.isDead;
		this.skills = data.skills;
		this.defaultSkill = data.defaultSkill;
	}
}

// Own all inherited properties for storing in JSON
User.prototype.toJSON = function() {
	var result = Object.create(this);
    for(var key in result) {
        result[key] = result[key];
    }
    return result;
};

// Expose User class to main module app.js
module.exports = User;