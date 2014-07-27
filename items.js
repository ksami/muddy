// Items

var items = {
	e001: {
		id: 'e001',
		name: 'katana',
		type: 'sword',
		desc: 'A sharp and precise weapon',
	
		//at: mapprefix + '0-' + Math.floor(Math.random() * 25),
		at: 'm0-12',
	
		isPickable: true,
		isWieldable: true,
	
		quantityLimit: 1,
	
		atk: {min: 20, max: 22},
		crit: {chance: 0.1, time: 1700},
		accuracy: 0.9,
		coolness: 9001
	}
}

module.exports = items;