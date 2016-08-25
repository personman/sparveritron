var MongoClient = require('mongodb').MongoClient;

var config = require('./config')
var twitterJs = require('./twitter')
var t = new twitterJs(config)
var _ = require('lodash')

var Log = function()
{
	//]]this.db =

  this.MongoClient = MongoClient
  this.collectionName = 'twitterbot-log'
  this.twitter = t
  this.screen_names = []
  this._ = _
}

Log.prototype.logInteraction = function(tweet, search, favorited, replied, reply)
{
  var self = this
  this.whileConnected(function(db) {
    var collection = self.getLogCollection(db)
    
    var interaction = {}
    interaction.screen_name = tweet.user.screen_name
    interaction.trigger_tweet = tweet.text
    interaction.trigger_search = search
    interaction.favorited = favorited
    interaction.follows_you = false
    interaction.replied = replied 
    interaction.reply = reply
    interaction.created = new Date()
    
    collection.insert(interaction)
  })
}

Log.prototype.getLogCollection = function(db)
{
  return db.collection(this.collectionName)
}

Log.prototype.whileConnected = function(callback)
{
  var url = 'mongodb://localhost:27017/test';
  this.MongoClient.connect(url, function(err, db) {
    if (err) {
      console.log(err)
    }
    
    callback(db)
    
    //db.close()
  })
}

Log.prototype.checkAndUpdateFollowBack = function(callback)
{
  var self = this
  this.whileConnected(function(db) {
    //console.log(db)
    //console.log(db[self.collectionName])
    var collection = self.getLogCollection(db)
    self.collection = collection
    //console.log(typeof collection)
    
    var findParams = {
      //$or: [
        lastChecked: {$exists: false},        
//        follows_you: {$exists: false}},      
      //]
    }
      //lastChecked: {$exists: false}
    
      var options = {
        "limit": 100,
      }
    
    self.db = db
    // Clear bad ones (one time)
    //collection.remove(findParams)
    //return
    
    collection.find(findParams, options).sort({lastChecked: 1}).toArray(function(err, docs) {
      if (err) {
        console.log(err)
      }
      var screen_names = docs.map(function(doc) {
        return doc.screen_name
      })
      
      console.log(screen_names.length)
      
      screen_names = self._.uniq(screen_names)
      //console.log(screen_names.length)
      
      if (screen_names.length > 100) {
        screen_names = screen_names.slice(0, 100)
      }
      
      screen_names_string = screen_names.join(',')
      //console.log(screen_names_string)
      
      self.twitter.getFriendShips(screen_names_string, function(err, friendships) {
        
        var updateCount = friendships.length
        var checkCount = friendships.length
        var followCount = 0
        var followers = []
        
        self._.forEach(friendships, function(friendship) {
          // Are you followed by them?
          var follows_you = (friendship.connections && friendship.connections.indexOf('followed_by') > -1)
          var screen_name = friendship.screen_name
          
          if (follows_you) {
            followCount++
            followers.push(screen_name)
          }
          
          self.updateLogItem(screen_name, follows_you)
          
          updateCount--// = updateCount - 1
          
          if (updateCount == 0) {
            self.db.close()
            
            // Say goodbye
            var msg = "Checked " + checkCount + " users and " + followCount + " now follow you: @" + followers.join(', @')
            if (followCount) {
              console.log(msg.green)
            } else {
              console.log(msg.red)
            }
            
          }
        })

      })
    })
    
  
  })
}

Log.prototype.updateLogItem = function(screen_name, follows_you) {
  var now = new Date()
  this.collection.findAndModify(
    {screen_name: screen_name},
    [['lastChecked', 'asc']],
    {$set: {follows_you: follows_you, lastChecked: now}},
    {},
    function(err, object) {
      if (err) {
        console.log(err)
      } else {
        //console.log('updated ' + screen_name + ', set lastChecked = ' + now)
      }
    }
  )
}

Log.prototype.interactionsExist = function(screen_name, callback)
{
  var self = this
  var name = screen_name
  this.whileConnected(function(db) {
    var collection = self.getLogCollection(db)
    self.collection = collection
    
    var findParams = {
      screen_name: name
    }
    
    collection.find(findParams).toArray(function(err, docs) {
      var exists = (docs.length > 0)
      
      callback(exists)
      db.close()
    })
  })
}

Log.prototype.report = function()
{
  var self = this
  this.whileConnected(function(db) {
    var collection = self.getLogCollection(db)
    self.collection = collection
    
    // Get totals for each search
    collection.aggregate([
      {$match: {lastChecked: {$exists: true}}},
      {$group: {_id: '$trigger_search', count: {$sum: 1}}}
    ]).toArray(function(err, docs) {
      console.log(docs)
      
      var totalsBySearch = docs
      
      collection.aggregate([
        {$match: {lastChecked: {$exists: true}, follows_you: true}},
        {$group: {_id: '$trigger_search', count: {$sum: 1}}}
      ]).toArray(function(err, docs) {
        console.log(docs)
      
        var followsBySearch = docs
        
        var report = []
        // Loop over the totals
        self._.each(totalsBySearch, function(interaction) {
          var reportRow = {
            search: interaction.trigger_search,
            count: interaction.count
          }
          
          report[interaction.trigger_search] = reportRow
        })

        // Now the follows
        self._.each(followsBySearch, function(interaction) {
          var reportRow = report[interaction.trigger_search]
          reportRow.follows = interaction.count
          reportRow.follow_rate = interaction.count / reportRow.count * 100
          report[interaction.trigger_search] = reportRow
        })
        
        console.log(report)
      
      
        db.close()
      })
      
      
      

    })
    
  })
  
}

return module.exports = Log