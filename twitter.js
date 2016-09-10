var Twit = require('twit')
var tracery = require('tracery-grammar')
var colors = require('colors');
var _ = require('lodash')

// Date formatting, why you so bad?
Date.prototype.getFullMinutes = function () {
   if (this.getMinutes() < 10) {
       return '0' + this.getMinutes();
   }
   return this.getMinutes();
};


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
        var msg = now.getHours() + ':' + now.getFullMinutes() + ' - Followed: @' + user.screen_name
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


/**
 * PruneFriends will unfollow everyone who doesn't follow you back
 */
Twitter.prototype.pruneFriends = function()
{
  var self = this;
  var followInterval = 1000
  
  this.getAllFriendIds(null, function(friendIds) {
  	console.log("You follow " + friendIds.length)
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
      followInterval 
    )
  })
}

Twitter.prototype.processUnfollows = function() 
{
  var self = this;
  if (this.toUnfollow.length > 0) {
    var toUnfollow = self.toUnfollow.pop()
    
    console.log(self.toUnfollow.length + " remaining to unfollow.")
  console.log(toUnfollow)
    self.T.post('friendships/destroy', { id: toUnfollow }, function(err, reply) {
      console.log(reply)
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