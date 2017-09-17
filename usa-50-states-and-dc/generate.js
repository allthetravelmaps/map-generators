#!/usr/bin/env node
/**
 * Generate topojson file for the 50 states and DC.
 *
 * Optional arguments:
 *  -o <filename> : Output filename to write resulting topojson to.
 *                  Defaults to 'usa-50-states-and-dc.topojson'.
 */

const Promise = require('bluebird')
const commander = require('commander')
const process = require('process')
const request = require('request-promise')
const topojson = require('topojson')
const winston = require('winston')
const wof = require('mapzen-whosonfirst')

const fs = Promise.promisifyAll(require('fs'))

const defaultFilename = 'usa-50-states-and-dc.topojson'
commander
  .version('0.1.0')
  .option('-o, --out [filename]', `Output filename [${defaultFilename}]`, defaultFilename)
  .parse(process.argv)

const outputFilename = commander.out
const wofIdsFile = 'wof-ids'
const alternateGeom = 'uscensus-display-terrestrial-zoom-10'
const concurrency = 4

const parseWofIdsFile = function (contents) {
  winston.info('Reading and parsing %s ', wofIdsFile)
  return contents.trim().split('\n')
}

const getWofGeojson = function (wofId) {
  const url = wof.uri.id2abspath(wofId, {alt: true, source: alternateGeom})
  winston.info('Calling %s', url)
  return request.get(url, {json: true})
}

const mergeIntoTopojson = function (geojsons) {
  winston.info('Merging together %d geojsons into one topojson', geojsons.length)
  return topojson.topology(geojsons)
}

const writeOutTopojson = function (topojson) {
  winston.info('Writing out topojson to %s', outputFilename)
  return fs.writeFileAsync(outputFilename, JSON.stringify(topojson))
}

fs.readFileAsync(wofIdsFile, 'utf8')
  .then(parseWofIdsFile)
  .map(getWofGeojson, {concurrency: concurrency})
  .then(mergeIntoTopojson)
  .then(writeOutTopojson)
