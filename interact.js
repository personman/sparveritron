var Bot = require('./bot')
var bot = new Bot()
var jsonfile = require('jsonfile')

var search = process.argv[2]
search = search.replace(/['"]+/g, '');

// If another argument is passed in, open the file as json and pass as a reply grammar (Tracery)
var replyGrammar = loadJsonGrammar

var follow = true
var favorite = true


// Start.
try {
  bot.interactWithSearch(search, follow, favorite, replyGrammar, 0)
} catch (e) {
  console.log(e)
}


function loadJsonGrammar()
{
  var replyGrammar = null
  if (grammarFile = process.argv[3]) {
    try {
      replyGrammar = jsonfile.readFileSync()
    } catch (e) {
      console.log(e)
      replyGrammar = null
    }
  
  }
  
  return replyGrammar
}

