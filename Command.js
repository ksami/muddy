// Class declaration for Command Class
// command types now are chat move fight

var moveCmds = ['west', 'east', 'south', 'north'];
var chatCmds = ['/all'];
var settingsCmds = ['@help'];
var fightCmds = ['poke'];

function Command(cmd, input) {
	if(moveCmds.indexOf(cmd) >= 0) {
		this.type = 'move';
		this.direction = cmd;
	}
	else if(fightCmds.indexOf(cmd) >= 0) {
		//var params = input.slice(' ');

		this.type = 'fight';
		this.skill = cmd;
		//this.target = params[1];
		//DEBUG
		this.target = 'slimelet';
	}
	else if(chatCmds.indexOf(cmd) >= 0) {
		this.type = 'chat';
		this.to = cmd;
		this.content = input.slice(cmd.length).trim();
	}
	else if(settingsCmds.indexOf(cmd) >= 0) {
		this.type = 'settings';
		this.setting = cmd.slice(1);
	}
}

module.exports = Command;