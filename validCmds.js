var validCmds = {
	moveCmds: ['north', 'south', 'east', 'west'],
	chatCmds: ['/all'],
	settingsCmds: ['@help'],
	fightCmds: ['poke', 'kick', 'chill'],
	skillCmds: ['take', 'equip']
};

validCmds.allSortedCmds = validCmds.moveCmds.concat(validCmds.chatCmds, validCmds.settingsCmds, validCmds.fightCmds, validCmds.skillCmds).sort();

module.exports = validCmds;