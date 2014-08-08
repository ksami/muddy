// Items
//Note: any prop added here must be cross ref to Item.js

var items = {
	e001: {
		id: 'e001',
		name: 'katana',
		type: 'sword',
		desc: 'A sharp and precise weapon',
	
		isPickable: true,
		isWieldable: true,
	
		equipSlot: ['rhand', 'lhand'],
		quantityLimit: 2,
	
		spd: -250,
		atk: {min: 2, max: 3},
		crit: {chance: 0.07, time: -200},
		accuracy: 0.9,
		coolness: 9001
	},
	e002: {
		id: 'e002',
		name: 'cardboard box',
		type: 'armor',
		desc: 'A soggy cardboard box somebody threw away. If there was a pity stat, this would totally increase it.',

		isPickable: true,
		isWieldable: true,

		equipSlot: ['head', 'body', 'legs', 'rarm', 'rcalf', 'rfoot', 'larm', 'lcalf', 'lfoot'],
		quantityLimit: 99,

		maxhp: 1
	},
	c001: {
		id: 'c001',
		name: 'cola',
		type: 'drink',
		desc: 'A drink that is a bit too sweet',

		isPickable: true,
		isConsumable: true,

		quantityLimit: 100,

		hp: 5
	}
};

module.exports = items;