var validCmds = {
	moveCmds: ['north', 'south', 'east', 'west'],
	chatCmds: ['/all'],
	settingsCmds: ['@help'],
	fightCmds: ['poke', 'kick', 'chill'],
};

validCmds.allSortedCmds = validCmds.moveCmds.concat(validCmds.chatCmds, validCmds.settingsCmds, validCmds.fightCmds).sort();

module.exports = validCmds;