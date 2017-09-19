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

function parseCommandOptions (argv) {
  const defaultOpts = {
    outputFile: 'out.topojson',
    minFeatureSize: '1',
    wofIdsFile: 'wof-ids',
    wofAlternateGeom: 'uscensus-display-terrestrial-zoom-10',
    networkConcurrency: 4
  }
  const allowedMinFeatureSizes = ['1', '10', '100']

  commander
    .version('0.1.0')
    .option('-c, --clear-cache', 'Clear cache of WOF geojson')
    .option('-n, --network-concurrency <concurrency>',
            `Concurrency of network requests to WOF [${defaultOpts['networkConcurrency']}]`,
             defaultOpts['networkConcurrency'])
    .option(`-m, --min-feature-size <${allowedMinFeatureSizes.join('|')}>`,
            `Approx. min feature size, in km^2 [${defaultOpts['minFeatureSize']}]`,
            defaultOpts['minFeatureSize'])
    .option('-o, --output-filename-topojson <filename>',
            `Output filename of Topojson [${defaultOpts['outputFile']}]`,
            defaultOpts['outputFile'])
    .option('-i, --input-filename-wof-ids <filename>',
            `Input filename of WOF ids [${defaultOpts['wofIdsFile']}]`,
            defaultOpts['wofIdsFile'])
    .option('-w, --wof-alternate-geometry <altnerate-geometry>',
            `WOF alternate geoemtry [${defaultOpts['wofAlternateGeom']}]`,
            defaultOpts['wofAlternateGeom'])
    .parse(process.argv)

  // If given a min feature size, ensure it's one of our allowed values
  // Is this validation/parsing of input really not built into commander already?
  if (!allowedMinFeatureSizes.includes(commander.minFeatureSize)) {
    // copying commander error format
    console.error()
    console.error("  error: invalid value `%s' for argument `%s'", commander.minFeatureSize, 'min')
    console.error()
    process.exit(1)
  }

  return commander
}

async function readWofIdsFile (filename) {
  winston.info('Reading WOF Ids from %s ', filename)
  const contents = await fs.readFileAsync(filename, 'utf8')
  return contents.trim().split('\n')
}

async function getCachedWofGeojsonStr (wofId, wofAlternateGeom) {
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

async function main () {
  let commander = parseCommandOptions(process.argv)

  if (commander.clearCache) {
    winston.info('Clearing cache of WOF geojson')
    await cache.clear()
  }

  const wofIds = await readWofIdsFile(commander.inputFilenameWofIds)
  const gjsons = await Promise.map(wofIds, async wofId => {
    const gjsonStr = await getCachedWofGeojsonStr(wofId, commander.wofAlternateGeometry)
    return parseGeojson(gjsonStr)
  }, {concurrency: parseInt(commander.networkConcurrency)}).all()

  const tjson = buildTopojson(gjsons, commander.minFeatureSize)
  return writeOutTopojson(tjson, commander.outputFilenameTopojson)
}

main()
