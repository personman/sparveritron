var logger = require('./log')
var log = new logger()


log.interactionsInfo(24)

setTimeout(function() {log.interactionsInfo(12)}, 500)
setTimeout(function() {log.interactionsInfo(6)}, 1000)
setTimeout(function() {log.interactionsInfo(24*365)}, 1100)

setTimeout(function() {log.report(24)}, 2500)

