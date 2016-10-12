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
  this.lastInteractionTime = null;
  this.skipCount = 0;
  this.interactionDelay = 5000; // ms
}

/**
 * Search is the "track" parameter: https://dev.twitter.com/streaming/overview/request-parameters#track
 * The API method used: https://dev.twitter.com/streaming/overview/request-parameters#track
 */
Bot.prototype.interactWithSearch = function(search, follow, favorite, replyGrammar, waitMs)
{
  var self = this

  console.log("Watching stream '" + search + "' and following users who mention it. (Press ctrl-C to stop.)")


  t.watchStream(search, function(tweet) {
    // Skip retweets
    if (tweet.text.indexOf('RT @') == -1) {

      if (self.waitCheck(waitMs)) {

      	// Don't bother them if we've ever interacted before. We're just looking for new folks
        log.interactionsExist(tweet.user.screen_name, function(exists) {

          if (!exists) {
            setTimeout(function() {
              console.log('--------------------------------------')

              self.showSkipCount();

              t.showTweet(tweet)

              if (follow) {
                t.followUser(tweet.user)
              }

              if (favorite) {
                t.favoriteTweet(tweet)
              }

              // @todo: handle replyGrammar
              replied = reply = null
              if (replyGrammar) {
                try {
                  if (reply = t.getResultFromGrammar(replyGrammar)) {
                    t.replyToTweetWithGrammar(tweet, replyGrammar)
                    replied = true
                  } else {
                    throw "Error processing reply grammar."
                  }
                } catch (e) {
                  console.log("Problem tweeting: " + e)
                }

              }


              log.logInteraction(tweet, search, favorite, replied, reply)
            },
            self.interactionDelay
          )



            self.lastInteractionTime = Date.now()
            self.skipCount = 0;
          }
        })
      }
    }

  })

  Bot.prototype.waitCheck = function(waitMs)
  {
    var go = false;
    if (!this.lastInteractionTime || (Date.now() - this.lastInteractionTime) > waitMs) {

      var elapsed = Date.now() - this.lastInteractionTime
      go = true




    } else {
      var elapsed = Date.now() - this.lastInteractionTime
      var secondsToGo = Math.floor((waitMs - elapsed) / 1000)
      var msg = "Waiting " + secondsToGo + " seconds."
      //console.log(msg.grey)

      this.skipCount++;
    }



    return go;
  }

  Bot.prototype.showSkipCount = function()
  {
    var msg = ''
    if (self.skipCount) {
      msg = msg +  self.skipCount + " skipped."
      console.log(msg.grey)
    }
  }
}


return module.exports = Bot
