// Class declaration for Command Class
// command types now are chat move fight

var validCmds = require(__dirname + '/validCmds.js');

function Command(cmd, input) {
	if(validCmds.moveCmds.indexOf(cmd) >= 0) {
		this.type = 'move';
		this.direction = cmd;
	}
	else if(validCmds.fightCmds.indexOf(cmd) >= 0) {
		//var params = input.slice(' ');

		this.type = 'fight';
		this.skill = cmd;
		//this.target = params[1];
		//DEBUG
		this.target = 'slimelet';
	}
	else if(validCmds.chatCmds.indexOf(cmd) >= 0) {
		this.type = 'chat';
		this.to = cmd;
		this.content = input.slice(cmd.length).trim();
	}
	else if(validCmds.settingsCmds.indexOf(cmd) >= 0) {
		this.type = 'settings';
		this.setting = cmd.slice(1);
	}
}

module.exports = Command;