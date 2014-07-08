var skills = {
	poke: {
		name: 'poke',
		id: 1,				//unique across all skills
		desc: '*poke poke*',
		atk: {min: 1, max: 5}
	},
	kick: {
		name: 'kick',
		id: 2,				//unique across all skills
		desc: 'oww!',
		atk: {min: 4, max: 8}
	},
	chill: {
		name: 'chill',
		id: 3,				//unique across all skills
		desc: 'brr...',
		atk: {min: 3, max: 12}
	}
};

module.exports = skills;