// Strings
// use sprintf format eg. sprintf('%s world', 'hello');
var strings = {
	//system
	help: 'Help: "/all <message>" to talk to everyone, "n","s","e","w" to move, "poke <target>" to fight',
	hint: ['Welcome to muddy! Type @help for help.', 'Try not to disturb the ghostlets ;)', 'If you die, you respawn back at the starting map m0-12'],
	logout: '%s has logged out.',
	welcome: 'Welcome %s!',

	//movement
	movebad: 'You cannot move in that direction',
	moveincombat: '* No escape! *',

	//combat
	playerdefeat_o: '--- %s has been defeated by %s! ---',
	playerdefeat_p: '*** You have been defeated by %s! ***',
	playerhit_o: '%s %ss %s for %s damage!',
	playerhit_p: 'You %s %s for %s damage!',
	playerincombat: 'You are already in combat!',
	playercritmiss_o: '- %s crit but missed %s! -',
	playercritmiss_p: '* You crit but missed %s! *',
	playercrithit_o: '- %s CRIT %s for %s damage!! -',
	playercrithit_p: '* You CRIT %s for %s damage!! *',
	playermiss_o: '%s missed %s!',
	playermiss_p: 'You missed %s!',
	targetdead: 'Targets are all dead',
	targetdefeat_o: '-- %s has defeated %s! --',
	targetdefeat_p: '** Victory! You have defeated %s! **',
	targethit_o: '%s %ss %s for %s damage!',
	targethit_p: '%s %ss you for %s damage!',
	targetmiss_o: '%s missed %s!',
	targetmiss_p: '%s missed you!',
	targetmissing: 'Target missing'
}

module.exports = strings;