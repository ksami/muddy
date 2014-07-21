// Class description for Items

var mapprefix = 'm';
var itemprefix = 'i';
var weaponprefix = 'w';

var items = [];

function Item() {
	// Basic
	this.name = 'item';
	this.id = itemprefix + '0';
	this.desc = 'Default item description';
	this.owner = this;
	this.at = mapprefix + '0-12';
	this.type = 'item';
	this.quantity = 1;
	this.quantityLimit = 1;
	this.space = 1;

	//bools
	this.isPickable = false;
	this.isWieldable = false;
	this.isWearable = false;
	this.isConsumable = false;
	this.isInvestigable = false;
	this.isReadable = false;

	// Wieldable
	this.atk = {min: 0, max: 0};
	this.crit = {chance: 0, time: 0};
	
	this.accuracy = 0;
	this.coolness = 0;

	// Wearable
	this.def = {min: 0, max: 0};
	this.maxhp = 0;
	this.recovery = {spd: 0, min: 0, max: 0};

	this.dodge = 0;
	this.part = null;

	// Consumable
	this.hp = 0;

	this.effect = null;

}


// Weapons
Katana.prototype = Item.prototype;
Katana.prototype.parent = Item;

function Katana() {
	Item.call(this);

	this.name = 'katana';
	this.id = weaponprefix + '1';
	this.type = 'sword';
	this.desc = 'A sharp and precise weapon';

	this.at = mapprefix + '0-' + Math.floor(Math.random() * 25);

	this.isWieldable = true;
	this.atk.min = 20;
	this.atk.max = 22;
	this.crit.chance = 0.1;
	this.crit.time = 1700;
	this.accuracy = 0.9;
	this.coolness = 9001;
}

for(var i=0; i<10; i++) {
	items.push(new Katana());
}

module.exports = items;