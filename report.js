var logger = require('./log')
var log = new logger()


log.interactionsInfo(24)
setTimeout(function() {log.interactionsInfo(12)}, 500)
setTimeout(function() {log.interactionsInfo(6)}, 1000)

setTimeout(function() {log.report()}, 2500)
