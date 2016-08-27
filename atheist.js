var config = require('./config')
var twitter = require('./twitter')
var t = new twitter(config)
var logger = require('./log')
var log = new logger()



var search = '#atheist,#atheism'

t.watchStream(search, function(tweet) {
  // Skip retweets
  if (tweet.text.indexOf('RT @') == -1) {
  	// Don't bother them if we've ever interacted before. We're just looking for new folks
    log.interactionsExist(tweet.user.screen_name, function(exists) {
    
      // Slow it down a bit
      if (Math.random() < 1) {
        if (!exists) {
      		t.followUser(tweet.user)
      		t.favoriteTweet(tweet)	
      		t.showTweet(tweet)
          log.logInteraction(tweet, search, true, false, null)
        } else {
          //console.log('You have already interacted with @' + tweet.user.screen_name + '. Skipping.')
        }
        
      }
    })
    
  } else {
    //console.log('RT skipped. ' + tweet.text)
  }
  
})

