// Items

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
		atk: {min: 3, max: 5},
		crit: {chance: 0.1, time: -200},
		accuracy: 0.9,
		coolness: 9001
	}
}

module.exports = items;