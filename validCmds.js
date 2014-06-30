var validCmds = {
	moveCmds: ['north', 'south', 'east', 'west'],
	chatCmds: ['/all'],
	settingsCmds: ['@help'],
	fightCmds: ['poke'],
};

validCmds.allSortedCmds = validCmds.moveCmds.concat(validCmds.chatCmds, validCmds.settingsCmds, validCmds.fightCmds).sort();

module.exports = validCmds;