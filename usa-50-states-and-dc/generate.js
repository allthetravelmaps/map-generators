#!/usr/bin/env node
/**
 * Generate topojson file for the 50 states and DC.
 *
 * Optional arguments:
 *  -o <filename> : Output filename to write resulting topojson to.
 *                  Defaults to 'usa-50-states-and-dc.topojson'.
 */

const commander = require('commander')
const process = require('process')
const request = require('request-promise')
const topojson = require('topojson')
const winston = require('winston')
const wof = require('mapzen-whosonfirst')

const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs'))

const Cache = require('async-disk-cache')
const cache = new Cache('wof-geojson')

const defaultFilename = 'usa-50-states-and-dc.topojson'
commander
  .version('0.1.0')
  .option('-o, --out [filename]', `Output filename [${defaultFilename}]`, defaultFilename)
  .option('-c, --clear', 'Clear cache of WOF geojson')
  .parse(process.argv)

const outputFilename = commander.out
const wofIdsFile = 'wof-ids'
const alternateGeom = 'uscensus-display-terrestrial-zoom-10'
const concurrency = 4
const tjsonSimplificationCutoff = 0.01 // choosen to get a file size of ~100k

const parseWofIdsFile = function (contents) {
  winston.info('Reading and parsing %s ', wofIdsFile)
  return contents.trim().split('\n')
}

const getCachedWofGeojson = function (wofId) {
  return cache.get(wofId)
    .then(cacheEntry => {
      if (cacheEntry.isCached) {
        winston.info('Using cached geojson for %s', wofId)
        return cacheEntry.value
      }

      winston.info('Calling out to WOF for %s', wofId)
      const url = wof.uri.id2abspath(wofId, {alt: true, source: alternateGeom})
      return request.get(url).then(gjsonStr => {
        winston.info('Filling cache for %s', wofId)
        cache.set(wofId, gjsonStr)
        return gjsonStr
      })
    })
    .then(gjsonStr => JSON.parse(gjsonStr))
}

const mergeIntoTopojson = function (gjsons) {
  winston.info('Merging together %d geojsons into one topojson', gjsons.length)
  // Quantizatiing after composing topojson to avoid possible mismatches AMAP
  let tjson = topojson.topology(gjsons)
  return topojson.quantize(tjson, 1e6)
}

const simplifyTopojson = function (tjson) {
  winston.info('Simplifying topojson')
  tjson = topojson.presimplify(tjson)
  return topojson.simplify(tjson, tjsonSimplificationCutoff)
}

const writeOutTopojson = function (tjson) {
  winston.info('Writing out topojson to %s', outputFilename)
  return fs.writeFileAsync(outputFilename, JSON.stringify(tjson))
}

// clear cache if requested
let cacheCleared
if (commander.clear) {
  winston.info('Clearing cache of WOF geojson')
  cacheCleared = cache.clear()
}

Promise.resolve(cacheCleared)
  .then(() => fs.readFileAsync(wofIdsFile, 'utf8'))
  .then(parseWofIdsFile)
  .map(getCachedWofGeojson, {concurrency: concurrency})
  .then(mergeIntoTopojson)
  .then(simplifyTopojson)
  .then(writeOutTopojson)
