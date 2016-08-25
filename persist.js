var logger = require('./log')
var log = new logger()


log.checkAndUpdateFollowBack()

//log.getLog(function(log) {
  //console.log(log)
//})

/*
var MongoClient = require('mongodb').MongoClient;
//var assert = require('assert');

var url = 'mongodb://localhost:27017/test';
MongoClient.connect(url, function(err, db) {
  console.log("Connected correctly to server.");
  
  
  var collection = db.collection('log');
    var doc1 = {'hello':'doc1'};
    var doc2 = {'hello':'doc2'};
    var lotsOfDocs = [{'hello':'doc3'}, {'hello':'doc4'}];

    collection.insert(doc1);

    collection.insert(doc2, {w:1}, function(err, result) {});

    collection.insert(lotsOfDocs, {w:1}, function(err, result) {});
  
  
  db.close();
});*/