// Class description for Items

var itemsjs = require(__dirname + '/items.js');

var mapprefix = 'm';
var itemprefix = 'i';
var weaponprefix = 'w';

var items = [];

//constructor makes sure all items have the same properties so can test in other areas
function Item(itemdata) {
	// Basic
	this.name = itemdata.name || 'item';
	this.id = itemdata.id || itemprefix + '0';
	this.desc = itemdata.desc || 'Default item description';
	this.owner = itemdata.owner || null;
	this.at = itemdata.at || mapprefix + '0-12';
	this.type = itemdata.type || 'item';
	this.quantity = itemdata.quantity || 1;
	this.quantityLimit = itemdata.quantityLimit || 1;
	this.space = itemdata.space || 1;

	//bools
	this.isPickable = itemdata.isPickable || false;
	this.isWieldable = itemdata.isWieldable || false;
	this.isWearable = itemdata.isWearable || false;
	this.isConsumable = itemdata.isConsumable || false;
	this.isInvestigable = itemdata.isInvestigable || false;
	this.isReadable = itemdata.isReadable || false;

	// Wieldable
	this.atk = itemdata.atk || {min: 0, max: 0};
	this.crit = itemdata.crit || {chance: 0, time: 0};
	
	this.accuracy = itemdata.accuracy || 0;
	this.coolness = itemdata.coolness || 0;

	// Wearable
	this.def = itemdata.def || {min: 0, max: 0};
	this.maxhp = itemdata.maxhp || 0;
	this.recovery = itemdata.recovery || {spd: 0, min: 0, max: 0};

	this.dodge = itemdata.dodge || 0;
	this.part = itemdata.part || null;

	// Consumable
	this.hp = itemdata.hp || 0;

	this.effect = itemdata.effect || null;

}

for(var i=0; i<2; i++) {
	items.push(new Item(itemsjs['e001']));
}

module.exports = items;