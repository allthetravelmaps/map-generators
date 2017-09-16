#!/usr/bin/env node

var fs = require('fs')
var wof = require('mapzen-whosonfirst')

var wofIdsFile = 'wof-ids'
var wofIds = fs.readFileSync(wofIdsFile, 'utf8').trim().split('\n')
wofIds.forEach(function (wofId) {
  var path = wof.uri.id2abspath(wofId)
  console.log(wofId, path)
})
