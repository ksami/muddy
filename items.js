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
	
		equipSlot: ['rightHand', 'leftHand'],
		quantityLimit: 2,
	
		spd: -250,
		atk: {min: 2, max: 3},
		crit: {chance: 0.07, time: -200},
		accuracy: 0.9,
		coolness: 9001
	}
}

module.exports = items;