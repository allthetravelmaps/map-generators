#!/usr/bin/env node
/**
 * Generate topojson file for the 50 states and DC.
 *
 * Designed to generate an output file of around 100kb,
 * with as much detail retained as practical.
 *
 * Run 'generate.js --help' for available options.
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
const defaultMinFeature = '1'
const minFeatureOpts = ['1', '10', '100']
commander
  .version('0.1.0')
  .option('-o, --out <filename>', `Output filename [${defaultFilename}]`, defaultFilename)
  .option('-c, --clear', 'Clear cache of WOF geojson')
  .option(`-m, --min <${minFeatureOpts.join('|')}>`,
          `Approx. min feature size, in km^2 [${defaultMinFeature}]`, defaultMinFeature)
  .parse(process.argv)

const outputFilename = commander.out
const wofIdsFile = 'wof-ids'
const wofAlternateGeom = 'uscensus-display-terrestrial-zoom-10'
const concurrency = 4

// If given a min feature size, ensure it's one of our allowed values
// Is this validation/parsing of input really not built into commander already?
if (!minFeatureOpts.includes(commander.min)) {
  // copying commander error format
  console.error()
  console.error("  error: invalid value `%s' for argument `%s'", commander.min, 'min')
  console.error()
  process.exit(1)
}

const tjsonSimplification = {
  1: 0.01 * 0.01,
  10: 0.03 * 0.03,
  100: 0.1 * 0.1
}[commander.min]

const tjsonQuantization = {
  1: 1e5,
  10: 1e4,
  100: 1e4
}[commander.min]

async function readWofIdsFile () {
  winston.info('Reading WOF Ids from %s ', wofIdsFile)
  const contents = await fs.readFileAsync(wofIdsFile, 'utf8')
  return contents.trim().split('\n')
}

async function getCachedWofGeojsonStr (wofId) {
  const cacheEntry = await cache.get(wofId)
  if (cacheEntry.isCached) {
    winston.info('Using cached geojson for %s', wofId)
    return cacheEntry.value
  }

  winston.info('Calling out to WOF for %s', wofId)
  const url = wof.uri.id2abspath(wofId, {alt: true, source: wofAlternateGeom})
  const gjsonStr = await request.get(url)

  winston.info('Filling cache for %s', wofId)
  await cache.set(wofId, gjsonStr)
  return gjsonStr
}

function parseGeojson (gjsonStr) {
  const gjson = JSON.parse(gjsonStr)
  // pass on only the minimal parts we need
  const {type, id, geometry} = gjson
  return {type, id, geometry}
}

function buildTopojson (gjsons) {
  winston.info('Merging together %d geojsons into one topojson', gjsons.length)
  let tjson = topojson.topology(gjsons)

  winston.info('Simplifying topojson to features of at least ~%s km^2', commander.min)
  tjson = topojson.presimplify(tjson)
  tjson = topojson.simplify(tjson, tjsonSimplification)
  tjson = topojson.quantize(tjson, tjsonQuantization)
  return tjson
}

async function writeOutTopojson (tjson) {
  winston.info('Writing out topojson to %s', outputFilename)
  return fs.writeFileAsync(outputFilename, JSON.stringify(tjson))
}

async function main () {
  // clear cache if requested
  if (commander.clear) {
    winston.info('Clearing cache of WOF geojson')
    await cache.clear()
  }

  const wofIds = await readWofIdsFile()
  const gjsons = await Promise.map(wofIds, async wofId => {
    const gjsonStr = await getCachedWofGeojsonStr(wofId)
    return parseGeojson(gjsonStr)
  }, {concurrency: concurrency}).all()

  const tjson = buildTopojson(gjsons)
  return writeOutTopojson(tjson)
}

main()
