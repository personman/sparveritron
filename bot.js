var config = require('./config')
var twitter = require('./twitter')
var t = new twitter(config.twitter)
var logger = require('./log')
var log = new logger()

var Bot = function()
{
  this.config = config
  this.collectionName = 'interactions'
  this.twitter = t
  this.screen_names = []
  this.log = log
}

/**
 * Search is the "track" parameter: https://dev.twitter.com/streaming/overview/request-parameters#track
 * The API method used: https://dev.twitter.com/streaming/overview/request-parameters#track
 */
Bot.prototype.interactWithSearch = function(search, follow, favorite, replyGrammar, skipRatio)
{
  var self = this

  console.log("Watching stream '" + search + "' and following users who mention it. (Press ctrl-C to stop.)")
  
  
  t.watchStream(search, function(tweet) {
    // Skip retweets
    if (tweet.text.indexOf('RT @') == -1) {
    	// Don't bother them if we've ever interacted before. We're just looking for new folks
      log.interactionsExist(tweet.user.screen_name, function(exists) {
    
        // Slow it down a bit
        if (typeof skipRatio == 'undefined' || skipRatio == null) skipRatio = 0
        var ratio = 1 - skipRatio
        if (Math.random() < 1) {
          if (!exists) {
            console.log('--------------------------------------')
            t.showTweet(tweet)
            
            if (follow) {
              t.followUser(tweet.user)
            }

            if (favorite) {
              t.favoriteTweet(tweet)
            }
        		
            // @todo: handle replyGrammar
            
        		
            log.logInteraction(tweet, search, favorite, false, null)
            
          } else {
            //console.log('You have already interacted with @' + tweet.user.screen_name + '. Skipping.')
          }
        
        }
      })
    
    } else {
      //console.log('RT skipped. ' + tweet.text)
    }
  
  })

  
}

return module.exports = Bot