/**
 * Generate topojson file for the 50 states and DC.
 *
 * Writes output topojson file to ?????
 */

const rp = require('request-promise')
const Promise = require('bluebird')
const winston = require('winston')
const wof = require('mapzen-whosonfirst')

const fs = Promise.promisifyAll(require('fs'))

const wofIdsFile = 'wof-ids'
const alternateGeom = 'uscensus-display-terrestrial-zoom-10'
const concurrency = 4

const parseWofIdsFile = function (contents) {
  winston.info('Reading and parsing %s ', wofIdsFile)
  return contents.trim().split('\n').slice(0, 2) // TODO: remove the 'slice'
}

const getWofGeojson = function (wofId) {
  const url = wof.uri.id2abspath(wofId, {alt: true, source: alternateGeom})
  winston.info('Calling %s', url)
  return rp.get(url, {json: true})
}

const processGeojsons = function (geojsons) {
  winston.info('Got %d geojsons!', geojsons.length)
  // TODO: join geojsons, transform topojson, save to file
}

fs.readFileAsync(wofIdsFile, 'utf8')
  .then(parseWofIdsFile)
  .map(getWofGeojson, {concurrency: concurrency})
  .then(processGeojsons)
