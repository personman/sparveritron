var MongoClient = require('mongodb').MongoClient;

var config = require('./config')
var twitterJs = require('./twitter')
var t = new twitterJs(config.twitter)
var _ = require('lodash')

var Log = function()
{
  this.MongoClient = MongoClient
  this.collectionName = 'interactions'
  this.twitter = t
  this.screen_names = []
  this.dbUrl = config.dbUrl
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
  var url = this.dbUrl
  
  this.MongoClient.connect(url, function(err, db) {
    if (err) {
      console.log(err)
    }

    if (!db) {
      console.log("Cannot connect to db.")
      process.exit()
    } else {
        callback(db)
    }
    
    
    
    //db.close()
  })
}

Log.prototype.checkAndUpdateFollowBack = function(callback)
{
  var self = this
  this.whileConnected(function(db) {
    var collection = self.getLogCollection(db)
    self.collection = collection
    
    var searchDate = new Date()
    var hoursBack = 6
    searchDate.setTime(searchDate.getTime() - (1000*60*60*hoursBack))
    
    var findParams = {
      follows_you: false,
      $or: [
        {lastChecked: {$exists: false}},        
        {lastChecked: {$lte: searchDate}}
      ]
    }
    
    var options = {
      "limit": 100,
    }
  
    self.db = db    
    collection.find(findParams, options).sort({lastChecked: 1}).toArray(function(err, docs) {
      if (err) {
        console.log(err)
      }
      
      
      if (!docs || docs.length == 0) {
        db.close()
        console.log("Nothing to check.")
        return
      }
      
      
      var screen_names = docs.map(function(doc) {
        return doc.screen_name
      })
      
      
      screen_names = self._.uniq(screen_names)
      //console.log(screen_names.length)
      
      if (screen_names.length > 100) {
        screen_names = screen_names.slice(0, 100)
      }
      
      screen_names_string = screen_names.join(',')
      //console.log(screen_names_string)
      
      self.twitter.getFriendShips(screen_names_string, function(err, friendships) {
        if (err || friendships.length == 0) {
          db.close()
          console.log('Nothing to check')
          return
        
        }

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
          
          updateCount--
          
          if (updateCount == 0) {
            self.db.close()
            
            // Say goodbye
            var msg = "Checked " + checkCount + " users and " + followCount + " now follow you."
            var details = " @" + followers.join(', @')
            if (followCount) {
              msg = msg + details
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

Log.prototype.report = function(hoursBack)
{
  var self = this
  
  if (hoursBack) {
    var searchDate = new Date()
    searchDate.setTime(searchDate.getTime() - (1000*60*60*hoursBack))  
  }
  
  var title = "Interaction Report for Previous " + hoursBack + " Hours"
  console.log(title.bold.green)
  
  this.whileConnected(function(db) {
    var collection = self.getLogCollection(db)
    self.collection = collection
    
    // Get totals for each search
    collection.aggregate([
      {$match: {lastChecked: {$exists: true}, created: {$gt: searchDate}}},
      {$group: {_id: '$trigger_search', count: {$sum: 1}}}
    ]).toArray(function(err, docs) {
      //console.log(docs)
      
      var totalsBySearch = docs
      
      collection.aggregate([
        {$match: {lastChecked: {$exists: true}, follows_you: true, created: {$gt: searchDate}}},
        {$group: {_id: '$trigger_search', count: {$sum: 1}}},
        {$sort: {count: 1}}
      ]).toArray(function(err, docs) {
        //console.log(docs)
      
        var followsBySearch = docs
        
        var report = []
        // Loop over the totals
        self._.each(totalsBySearch, function(interaction) {
          var reportRow = {
            search: interaction._id,
            count: interaction.count,
            follows: 0,
            follow_rate: 0
          }
                   
          report[interaction._id] = reportRow
        })

        // Now the follows
        self._.each(followsBySearch, function(interaction) {
          var reportRow = report[interaction._id]
          reportRow.follows = interaction.count
          reportRow.follow_rate = interaction.count / reportRow.count * 100
          report[interaction._id] = reportRow
        })
        
        
        var Table = require('cli-table');
        var table = new Table({
          head: ['Search', 'Interactions', 'Follow You', 'Follow Rate']
        })
        
        // Change to an array
        var reportRows = []
        self._.forIn(report, function(row, key) {
          reportRows.push(row)          
        })
        
        // Sort
        report = self._.sortBy(reportRows, function(o) {
          return o.follow_rate
        })
    
      
        self._.forIn(report, function(row, key) {
          //console.log('hi')
          var toPush = [row.search, row.count, row.follows, Math.round(row.follow_rate) + '%']
          table.push(toPush)
          
        })
        
        
        console.log(table.toString())//.toString())
                
        
        db.close()
      })
      
      
      

    })
    
  })
  
}

Log.prototype.interactionsInfo = function(hoursBack)
{
  var self = this
  
  this.recentFollowCount(hoursBack, function(count) {
    var count = count
    
    self.recentFollowYouCount(hoursBack, count, function(count, followCount) {

      var rate = Math.round(followCount / count * 100)
      var msg = "In the last " + hoursBack + " hours this app followed " + count + " and generated " + followCount + " new followers. Rate: " + rate + "%."
      console.log(msg.yellow)
    })
    
    self.db.close()
  })
  

}

Log.prototype.recentFollowCount = function(hoursBack, callback)
{
  var self = this
  var searchDate = new Date()
  searchDate.setTime(searchDate.getTime() - (1000*60*60*hoursBack))
  
  this.whileConnected(function(db) {
    var collection = self.getLogCollection(db)
    self.collection = collection
    //console.log(searchDate)

    var findParams = {
      created: {$gte: searchDate}
    }    

    self.db = db
    collection.find(findParams).count().then(function(count) {
      callback(count)      
    })
      
  })
}

Log.prototype.recentFollowYouCount = function(hoursBack, count, callback)
{
  var self = this
  self.count = count
  
  var searchDate = new Date()
  searchDate.setTime(searchDate.getTime() - (1000*60*60*hoursBack))
  
  this.whileConnected(function(db) {
    var collection = self.getLogCollection(db)
    self.collection = collection
    
    var findParams = {
      created: {$gte: searchDate},
      follows_you: true
    }    
    
    self.db = db
    var count = count
    
    collection.find(findParams).count().then(function(followCount) {
      callback(self.count, followCount)
      db.close()      
    })
      
  })
}

return module.exports = Log