// Class description for Items

var itemsdata = require(__dirname + '/items.js');

var mapprefix = 'm';
var itemprefix = 'i';
var weaponprefix = 'w';

var items = [];

//constructor makes sure all items have the same properties so can test in other areas
function Item(itemid) {
	// Basic
	this.name = itemsdata[itemid].name || 'item';
	this.id = itemsdata[itemid].id || itemprefix + '0';
	this.desc = itemsdata[itemid].desc || 'Default item description';
	this.owner = itemsdata[itemid].owner || null;
	this.at = itemsdata[itemid].at || mapprefix + '0-12';
	this.type = itemsdata[itemid].type || 'item';
	this.quantity = itemsdata[itemid].quantity || 1;
	this.quantityLimit = itemsdata[itemid].quantityLimit || 1;
	this.space = itemsdata[itemid].space || 1;

	//bools
	this.isPickable = itemsdata[itemid].isPickable || false;
	this.isWieldable = itemsdata[itemid].isWieldable || false;
	this.isWearable = itemsdata[itemid].isWearable || false;
	this.isConsumable = itemsdata[itemid].isConsumable || false;
	this.isInvestigable = itemsdata[itemid].isInvestigable || false;
	this.isReadable = itemsdata[itemid].isReadable || false;

	// Wieldable
	this.atk = itemsdata[itemid].atk || {min: 0, max: 0};
	this.crit = itemsdata[itemid].crit || {chance: 0, time: 0};
	
	this.accuracy = itemsdata[itemid].accuracy || 0;
	this.coolness = itemsdata[itemid].coolness || 0;

	// Wearable
	this.def = itemsdata[itemid].def || {min: 0, max: 0};
	this.maxhp = itemsdata[itemid].maxhp || 0;
	this.recovery = itemsdata[itemid].recovery || {spd: 0, min: 0, max: 0};

	this.dodge = itemsdata[itemid].dodge || 0;
	this.part = itemsdata[itemid].part || null;

	// Consumable
	this.hp = itemsdata[itemid].hp || 0;

	this.effect = itemsdata[itemid].effect || null;

}

for(var i=0; i<2; i++) {
	items.push(new Item('e001'));
}

module.exports = items;
module.exports.Item = Item;