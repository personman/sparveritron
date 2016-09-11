Sparveritron
========

Sparveritron is a set of node.js scripts for interacting with Twitter. Created by Dan Ferguson @personman.


Installation
-----------
Check out the code and bring in the npm dependencies:
```
git clone git@github.com:personman/sparveritron.git
cd sparveritron
npm install
```


Setup
-----------

Copy the config file to config.js and enter your Twitter things. You'll also want to have MongoDB running and put the connection url in the config file.


Usage
-----------

To unfollow all users who don't follow you:
```
node prune
```

To watch a Twitter stream (based on the [track parameter](https://dev.twitter.com/streaming/overview/request-parameters#track)) and interact with it:
```
node interact "#hashtagIWantToWatch"
```

To see if anyone you followed using interact has followed you back:
```
node check
```

View the report showing the success rates for the hashtags you've been interacting with:
```
node report
```

