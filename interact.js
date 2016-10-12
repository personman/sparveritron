var Bot = require('./bot')
var bot = new Bot()
var jsonfile = require('jsonfile')

var search = process.argv[2]
search = search.replace(/['"]+/g, '');

// If another argument is passed in, open the file as json and pass as a reply grammar (Tracery)
var replyGrammar = loadJsonGrammar(process.argv[3])

var follow = false
var favorite = true
var waitMs = 20 * 1000 // Don't interact any more often then once per minute


// Start.
try {
  bot.interactWithSearch(search, follow, favorite, replyGrammar, waitMs)
} catch (e) {
  console.log(e)
}


function loadJsonGrammar(file)
{
  var replyGrammar = null
  if (grammarFile = file) {
    try {
      replyGrammar = jsonfile.readFileSync(grammarFile)
    } catch (e) {
      console.log(e)
      replyGrammar = null
    }
  
  }
  
  if (file) {
    if (replyGrammar) {
      var grammarString = JSON.stringify(replyGrammar);
      console.log("Replying to tweets with the following Tracery grammar:".green)
      console.log(grammarString.replace("\\'", "'"))
    }
  }

  return replyGrammar
}

