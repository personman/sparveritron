var config = require('./config')
var twitter = require('./twitter')
var t = new twitter(config)
var logger = require('./log')
var log = new logger()



var search = '#atheist,#atheism'

t.watchStream(search, function(tweet) {
	// Don't bother them if we've ever interacted before. We're just looking for new folks
  log.interactionsExist(tweet.user.screen_name, function(exists) {
    if (!exists) {
  		t.followUser(tweet.user)
  		t.favoriteTweet(tweet)	
  		t.showTweet(tweet)
      log.logInteraction(tweet, search, true, false, null)
    } else {
      console.log('You have already interacted with @' + tweet.user.screen_name + '. Skipping.')
    }
  })
})

