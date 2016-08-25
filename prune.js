var config = require('./config')
var twitter = require('./twitter')
var t = new twitter(config)

var interval = 1000 * 60 * 5 // Once 5 minutes

t.pruneFriends()
//t.pruneFriendsTwoNope()

	
	

/*
t.pruneFriends(5)

setInterval(
	function() {
		t.pruneFriends(5)
	}, 
	interval
)*/