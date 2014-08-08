// Class declaration for Command Class
// command types now are chat move fight

var validCmds = require(__dirname + '/validCmds.js');

function Command(cmd, input) {
	if(validCmds.moveCmds.indexOf(cmd) >= 0) {
		this.type = 'move';
		this.direction = cmd;
	}
	else if(validCmds.fightCmds.indexOf(cmd) >= 0) {
		var params = input.split(' ');

		this.type = 'fight';
		this.skill = cmd;
		if(params.length > 1) {
			this.target = params[1];
		}
		else {
			this.target = 'undefined';
		}
	}
	else if(validCmds.skillCmds.indexOf(cmd) >= 0) {
		var params = input.split(' ');

		this.type = 'skill';
		this.skill = cmd;
		if(params.length > 2) {
			this.target = params[1];
			this.param = params[2];
		}
		else if(params.length > 1) {
			this.target = params[1];
			this.param = 'undefined';
		}
		else {
			this.target = 'undefined';
			this.param = 'undefined';
		}
	}
	else if(validCmds.chatCmds.indexOf(cmd) >= 0) {
		this.type = 'chat';
		this.to = cmd;
		this.content = input.slice(cmd.length).trim();
	}
	else if(validCmds.settingsCmds.indexOf(cmd) >= 0) {
		this.type = 'settings';
		//take away @ sign infront
		this.setting = cmd.slice(1);
	}
}

module.exports = Command;