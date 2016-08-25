var config = require('./config')
var twitter = require('./twitter')
var t = new twitter(config)


t.watchStream('#TrumpPence16', function(tweet) {
	t.showTweet(tweet)

	if (Math.random() < 1) {
		//t.sayYoureWelcome(tweet)
		//t.sayNoHate(tweet)
		t.followUser(tweet.user)
    t.replyToTrumpkin(tweet)
		//t.favoriteTweet(tweet)	
	} else {
		console.log('...Skipped...')
	}

})

