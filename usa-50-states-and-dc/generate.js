#!/usr/bin/env node
/**
 * Generate topojson file for the 50 states and DC.
 *
 * Run 'generate.js --help' for available options.
 */

const request = require('request-promise')
const topojson = require('topojson')
const winston = require('winston')
const wof = require('mapzen-whosonfirst')

const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs'))

const Cache = require('async-disk-cache')
const cache = new Cache('wof-geojson')

const argv = require('yargs')
  .usage('Usage: $0 [options]')
  .help('h')
  .alias('h', 'help')
  .group('h', 'General Options')
  .version('v')
  .alias('v', 'version')
  .group('v', 'General Options')
  .option('c', {
    alias: 'clear-cache',
    boolean: true,
    desc: 'Clear local cache of WOF geojson',
    group: 'Processing Options'
  })
  .option('n', {
    alias: 'network-concurrency',
    default: 4,
    desc: 'Concurrency of network requests to WOF',
    group: 'Processing Options',
    requiresArg: true,
    type: 'number'
  })
  .option('i', {
    alias: 'input-filename-wof-ids',
    demandOption: true,
    desc: 'Input filename to read WOF ids from',
    group: 'Input/Output Files',
    requiresArg: true,
    type: 'string'
  })
  .option('o', {
    alias: 'output-filename-topojson',
    default: 'out.topojson',
    desc: 'Output filename to write topojson to',
    group: 'Input/Output Files',
    requiresArg: true,
    type: 'string'
  })
  .option('m', {
    alias: 'min-feature-size',
    choices: [1, 10, 100],
    default: 1,
    desc: 'Approx. min feature size, in km^2',
    group: 'Geometry Options',
    nargs: 1,
    type: 'number'
  })
  .option('w', {
    alias: 'wof-alternate-geometry',
    desc: 'WOF alternate geometry',
    group: 'Geometry Options',
    requiresArg: true,
    type: 'string'
  })
  .showHelpOnFail(false, 'Specify --help for available options')
  .strict()
  .argv

async function readWofIdsFile (filename) {
  winston.info('Reading WOF Ids from %s ', filename)
  const contents = await fs.readFileAsync(filename, 'utf8')
  return contents.trim().split('\n').filter(x => !x.startsWith('#'))
}

async function getCachedWofGeojsonStr (wofId, wofAlternateGeom) {
  const cacheKey = [wofId, wofAlternateGeom].join('-')
  const cacheEntry = await cache.get(cacheKey)
  if (cacheEntry.isCached) {
    winston.info('Using cached geojson for %s', wofId)
    return cacheEntry.value
  }

  winston.info('Calling out to WOF for %s', wofId)
  const urlOpts = (wofAlternateGeom ? {alt: true, source: wofAlternateGeom} : {})
  const url = wof.uri.id2abspath(wofId, urlOpts)
  const gjsonStr = await request.get(url)

  winston.info('Filling cache for %s', wofId)
  await cache.set(cacheKey, gjsonStr)
  return gjsonStr
}

function parseGeojson (gjsonStr) {
  const gjson = JSON.parse(gjsonStr)
  // pass on only the minimal parts we need
  const {type, id, geometry} = gjson
  return {type, id, geometry}
}

function buildTopojson (gjsons, minFeatureSize) {
  winston.info('Merging together %d geojsons into one topojson', gjsons.length)
  let tjson = topojson.topology(gjsons)

  // lookup tables developed via trial-and-error
  const tjsonSimplification = {
    1: 0.01 * 0.01,
    10: 0.03 * 0.03,
    100: 0.1 * 0.1
  }[minFeatureSize]

  const tjsonQuantization = {
    1: 1e5,
    10: 1e4,
    100: 1e4
  }[minFeatureSize]

  winston.info('Simplifying topojson to features of at least ~%s km^2', minFeatureSize)
  tjson = topojson.presimplify(tjson)
  tjson = topojson.simplify(tjson, tjsonSimplification)
  tjson = topojson.quantize(tjson, tjsonQuantization)
  return tjson
}

async function writeOutTopojson (tjson, filename) {
  winston.info('Writing out topojson to %s', filename)
  return fs.writeFileAsync(filename, JSON.stringify(tjson))
}

async function main (argv) {
  if (argv.clearCache) {
    winston.info('Clearing cache of WOF geojson')
    await cache.clear()
  }

  const wofIds = await readWofIdsFile(argv.inputFilenameWofIds)
  const gjsons = await Promise.map(wofIds, async wofId => {
    const gjsonStr = await getCachedWofGeojsonStr(wofId, argv.wofAlternateGeometry)
    return parseGeojson(gjsonStr)
  }, {concurrency: parseInt(argv.networkConcurrency)}).all()

  const tjson = buildTopojson(gjsons, argv.minFeatureSize)
  return writeOutTopojson(tjson, argv.outputFilenameTopojson)
}

main(argv)
