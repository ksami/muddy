// Combat class

function Combat(player1, player2) {
	console.dir(player1);
	console.dir(player2);
	var player1Combat = setInterval(function(){player1.damageOther(player2);}, player1.spd);
	//var player2Combat = setInterval(function(){player2.damageOther(player1);}, player2.spd);
	var hpCheck = setInterval(function(){
		console.log('player1 hp: ' + player1.hp + ' player2 hp: ' + player2.hp);
		if(player1.hp <= 0 || player2.hp <= 0) {
			clearInterval(player1Combat);
			//clearInterval(player2Combat);
			clearInterval(hpCheck);
		}
	}, 500);
}

module.exports = Combat;