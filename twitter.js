var Twit = require('twit')
var tracery = require('tracery-grammar')
var colors = require('colors');
var _ = require('lodash')

var Twitter = function(config)
{
	this.T = new Twit(config);
	this.colors = colors
	this.lastTimestamp = null
	this.friendIds = []
  this.followerIds = []
  this.toUnfollow = []
  this.unfollowInterval = 1000 / 2
  this._ = _
}

Twitter.prototype.showTweet = function(tweet)
{
  var user = "@" + tweet.user.screen_name + ": "
	console.log(user.bold + tweet.text)
}

Twitter.prototype.favoriteTweet = function(tweet)
{
  var self = this
	this.T.post('favorites/create', { id: tweet.id_str }, function() {
		console.log('Favorited.'.grey)
	})
}

Twitter.prototype.replyToTweet = function(tweet, reply)
{
	var name = tweet.user.screen_name;
	var status = '@' + name + ' ' + reply;

	this.T.post(
		'statuses/update', 
		{
			in_reply_to_status_id: tweet.id_str, 
			status: status
		}, 
		function(err, data, response) { 
			console.log("Reply: ".blue + status)
		}
	)
	this.lastTimestamp = new Date()
}

Twitter.prototype.followUser = function(user)
{
	this.T.post(
		'friendships/create', 
		{ 
			id: user.id_str 
		}, 
		function(err, data, response)
		{
      if (err) {
        var msg = "Error attempting to follow @" + user.screen_name
        console.log(msg.green)
        console.log(err)
      } else {
        var now = new Date()
        var msg = now.getHours() + ':' + now.getMinutes() + ' - Followed: @' + user.screen_name
        console.log(msg.green)
        
      }
		}
	);
}

Twitter.prototype.replyToTweetWithGrammar = function(tweet, grammar)
{
  var grammar = tracery.createGrammar(grammar)
  var reply = grammar.flatten('#origin#')
  this.replyToTweet(tweet, reply)
}

Twitter.prototype.sayYoureWelcome = function(tweet)
{
	var grammar = this.getYoureWelcomeGrammar()
	var reply = grammar.flatten('#origin#')
	this.replyToTweet(tweet, reply)
}

Twitter.prototype.getYoureWelcomeGrammar = function()
{
	var grammar = tracery.createGrammar(
		{
			'welcome-one': [
				"You're welcome", 
				"You are very welcome",
				"No problem", 
				"Don't mention it", 
				"My pleasure",
				"It was nothing",
				"Sure thing", 
				"De nada"
			],
			'happy': [
				"Happy to help", 
				"Just doing my job", 
				"The least I could do", 
				"You've always been there for me, so it only seemed right",
				"I wasn't busy anyway",
				"I'm always there for you",
				"Hardly any children starved while I was helping you with that",
				"I aim to please",
				"Don't forget to send me 10% of your income"
			],
			'origin': ['#welcome-one#! #happy#.']
		}
	)
	
	return grammar
}

Twitter.prototype.sayNoHate = function(tweet)
{
	var grammar = this.getNoHateGrammar()
	var reply = grammar.flatten('#origin#')
	this.replyToTweet(tweet, reply)
}


Twitter.prototype.getNoHateGrammar = function()
{
	var grammar = tracery.createGrammar(
		{
			'i-am-love': [
				"I am love", 
				"God is love", 
				"The LORD is pure love", 
			],
			'no-hate': [
				"I don't hate anything (except #do-hate#)",
				"I only hate #do-hate#"
			],
			'do-hate': [
				"shellfish",
				"bacon",
				"televangelists",
				"@tperkins",
				"history-mangling dingus @DavidBartonWB"
			],
			'origin': ['#i-am-love#. #no-hate#!']
		}
	)
	
	return grammar
}

Twitter.prototype.watchStream = function(track, callback)
{
	var stream = this.T.stream('statuses/filter', { track: track })
 
	stream.on('tweet', callback)
	
}

Twitter.prototype.randIndex = function(arr) {
  var index = Math.floor(arr.length*Math.random());
  return arr[index];
};

Twitter.prototype.getAllFollowerIds = function(cursor, callback)
{	
	var self = this
	
  var params = {count: 5000}
  if (cursor) {
    params.cursor = cursor
  }
	this.T.get('followers/ids', params, function(err, reply) {
    if (err) {
      console.log(err)
    }
    
		self.followerIds = self.followerIds.concat(reply.ids)
    console.log(self.followerIds.length)
    
		if (reply.next_cursor && reply.next_cursor != cursor) {
			self.getAllFollowerIds(reply.next_cursor, callback)
      //console.log(cursor)
      //console.log(reply.next_cursor)
		} else {
			callback(self.followerIds)
		}
	});
}


Twitter.prototype.getAllFriendIds = function(cursor, callback)
{	
	var self = this
	
  var params = {count: 5000}
  if (cursor) {
    params.cursor = cursor
  }
  
	this.T.get('friends/ids', params, function(err, reply) {
    if (err) {
      console.log(err)
    }
    
		self.friendIds = self.friendIds.concat(reply.ids)
    console.log(self.friendIds.length)
    
		if (reply.next_cursor && reply.next_cursor != cursor) {
			self.getAllFriendIds(reply.next_cursor, callback)
      //console.log(cursor)
      //console.log(reply.next_cursor)
		} else {
			callback(self.friendIds)
		}
	});
}



// Returns the members of array1 that are not in array2
Twitter.prototype.diff = function(array1, array2)
{
  var d = this._.difference(array1, array2)

  return d;
}

Twitter.prototype.pruneFriendsTwoNope = function()
{
  var self = this;
  
	//this.getAllFollowerIds(null, function(followerIds) {
  this.getAllFollowerIds(null, function(followerIds) {
	  console.log(followerIds.length)
	})
  
}

Twitter.prototype.pruneFriends = function()
{
  var self = this;
  
  this.getAllFriendIds(null, function(friendIds) {
  	console.log("You follow " + friendIds.length)
    console.log("Sleeping for 25 minutes to avoid rate limits....")
    self.displayCountdown(25)
    var friends = friendIds
    
    setTimeout(
      function() {
        self.getAllFollowerIds(null, function(followerIds) {
          console.log(followerIds.length + " follow you")
      
          var followers = followerIds
          self.toUnfollow = self.diff(friends, followers)
          
          console.log(self.toUnfollow.length + " remaining to unfollow.")
      
          self.processUnfollows()
        })
      },
      1000 //* 60 * 25
    )
  })
}

Twitter.prototype.processUnfollows = function() 
{
  var self = this;
  if (this.toUnfollow.length > 0) {
    var toUnfollow = self.toUnfollow.pop()
    
    console.log(self.toUnfollow.length + " remaining to unfollow.")
  
    self.T.post('friendships/destroy', { id: toUnfollow }, function(err, reply) {
      var msg = "Unfriended @" + reply.screen_name + '.'
      console.log(msg.red) 
      // Again!
      setTimeout(
        function() {
          self.processUnfollows()
        },
        self.unfollowInterval
      )
    })
  } else {
    console.log('Finished! You have unfollowed everyone who does not follow back.')
  }
}

Twitter.prototype.msSinceLastTweet = function()
{
	var self = this;
	
	if (self.lastTimestamp) {
		var interval = new Date() - self.lastTimestamp
	} else {
		var interval = null
	}
	
	return interval
}

Twitter.prototype.replyToTrumpkin = function(tweet)
{
	var grammar = this.getTrumpkinGrammar()
	var reply = grammar.flatten('#origin#')
	this.replyToTweet(tweet, reply)
}

Twitter.prototype.getTrumpkinGrammar = function()
{
	var grammar = tracery.createGrammar(
		{
			'trumpkin': [
				"Why does Trump pretend to be a #faithhed#? #not-christian#", 
        "Trump is not a #faithhed#. #not-christian#",
        "Trump's not a #faithhed#. #not-christian#",
				"I've checked the Book of Life and @realDonaldTrump's name is not in it.", 
				"Take the quiz: Who said it, Trump or Jesus? http://trumporjesus.com/",
        "it is easier for a camel to go through the eye of a needle than for someone who is rich to enter the kingdom of God. Matthew 19:24" 
			],
			'faithhed': [
				"Christian",
				"follower of Christ",
        "believer",
        "Bible-believing Christian",
        "true disciple",
        "follower of the Way"
        
			],
			'not-christian': [
				"He's never read the Bible.",
				"'Two Corinthians!' LOL!",
				"He's faking. Don't be fooled.",
				"He is an unrepentant adulturer.",
				"He said he's never asked forgiveness from God. Can't be a #faithhed# without that.",
        "He runs casinos, dens of sin.",
        "He cheated on every woman he married.",
        "His 'church' says he's not a member.",
        "He's a fan of torture. As a former torture victim, Jesus does not approve.",
        "When asked for a his favorite Bible verse, Trump made one up!"
			],
			'origin': ['#trumpkin#']
		}
	)
	
	return grammar
}

Twitter.prototype.displayCountdown = function(minutes)
{
  var totalMinutes = minutes
  var timerPoints = _.range(1, minutes)
  _.forEach(timerPoints, function(value) {
    var minutesLeft = totalMinutes - value
    var minutesDelay = value
    setTimeout(
      function() {
        console.log(minutesLeft + ' minutes remaining...')
      },
      minutesDelay * 1000 * 60
    )
  })

}

Twitter.prototype.getFriendShips = function(screen_name, callback) {
  var self = this
  
  var params = {screen_name: screen_name}
	this.T.get('friendships/lookup', params, function(err, result) {
    callback(err, result)
  })
  
} 



return module.exports = Twitter