var Bot = require('./bot')
var bot = new Bot()

var search = process.argv[2]
search = search.replace(/['"]+/g, '');

try {
  bot.interactWithSearch(search, true, true, null, 0)
} catch (e) {
  console.log(e)
}


