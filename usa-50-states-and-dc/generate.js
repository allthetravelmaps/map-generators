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

function readWofIdsFile (contents) {
  winston.info('Reading WOF Ids from %s ', wofIdsFile)
  return fs
    .readFileAsync(wofIdsFile, 'utf8')
    .then(contents => contents.trim().split('\n'))
}

function getCachedWofGeojson (wofId) {
  return cache
    .get(wofId)
    .then(cacheEntry => {
      if (cacheEntry.isCached) {
        winston.info('Using cached geojson for %s', wofId)
        return cacheEntry.value
      }

      winston.info('Calling out to WOF for %s', wofId)
      const url = wof.uri.id2abspath(wofId, {alt: true, source: alternateGeom})
      return request
        .get(url)
        .then(gjsonStr => {
          winston.info('Filling cache for %s', wofId)
          cache.set(wofId, gjsonStr)
          return gjsonStr
        })
    })
    .then(gjsonStr => JSON.parse(gjsonStr))
}

function buildTopojson (gjsons) {
  winston.info('Merging together %d geojsons into one topojson', gjsons.length)
  // Deferring quantizatiing till after composition and simplification
  let tjson = topojson.topology(gjsons)
  winston.info('Simplifying topojson')
  // tjson = topojson.presimplify(tjson)
  // tjson = topojson.simplify(tjson, tjsonSimplificationCutoff)
  // tjson = topojson.quantize(tjson, 1e6)
  return tjson
}

function writeOutTopojson (tjson) {
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
  .then(readWofIdsFile)
  .map(getCachedWofGeojson, {concurrency: concurrency})
  .then(buildTopojson)
  .then(writeOutTopojson)
