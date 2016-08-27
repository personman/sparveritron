var config = require('./config')
var twitter = require('./twitter')
var t = new twitter(config)

var minInterval = 1000 * 60 * 5

if (true) {
	t.watchStream('thank you god', function(tweet) {

	
		if (Math.random() < 1) {
			if (!t.lastTimestamp || t.msSinceLastTweet() > minInterval) {
				t.showTweet(tweet)
				//t.sayYoureWelcome(tweet)
				t.replyToTweetWithGrammar(tweet, getGrammar())
				t.followUser(tweet.user)
				t.favoriteTweet(tweet)						
			} else {
				//console.log("----skipping since we just tweeted recently----")

			}
			
		} else {
			console.log('...Skipped...')
		}
		
	})
}

function getGrammar()
{
	var grammar = 
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
	
	return grammar
}