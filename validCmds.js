var validCmds = {
	moveCmds: ['n', 's', 'e', 'w'],
	chatCmds: ['/all'],
	settingsCmds: ['@help', '@commands'],
	fightCmds: ['poke', 'kick', 'chill'],
	skillCmds: ['take', 'pick', 'wield', 'wear', 'equip', 'unequip']
};

validCmds.allSortedCmds = validCmds.moveCmds.concat(validCmds.chatCmds, validCmds.settingsCmds, validCmds.fightCmds, validCmds.skillCmds).sort();

module.exports = validCmds;