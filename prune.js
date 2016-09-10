var config = require('./config')
var twitter = require('./twitter')
var t = new twitter(config.twitter)

var interval = 1000 * 60 * 5 // Once 5 minutes

t.pruneFriends()
