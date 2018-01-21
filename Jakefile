const assert = require('assert')
const { execSync, spawn } = require('child_process')
const fs = require('fs')
const process = require('process')
const readline = require('readline')

/* double check we don't rm -rf anything we don't want to */
const assertAndRm = (val, ref) => {
  assert.equal(val, ref)
  jake.rmRf(val)
}

/* fail the task if an exitCode is non-zero */
const onFail = (task, childProcess, deleteTarget = true) => {
  const childCMD = childProcess.spawnargs.join(' ')
  const target = task.name
  const msg = `'${target}' failed while executing '${childCMD}'`
  return exitCode => {
    if (exitCode === 0) return
    if (deleteTarget && fs.existsSync(target)) fs.unlinkSync(target)
    fail(msg)
  }
}

/* log a success message and mark task done */
const onSuccess = task => exitCode => {
  if (exitCode !== 0) return
  jake.logger.log(`Finished ${task.name}`)
  task.complete()
}

/* directory structure */
const allMBTiles = 'all.mbtiles'
const allStaticDir = 'all-static'
const confDir = 'conf'
const getLayerConfPath = layer => `${confDir}/${layer}.yaml`
const layerMBTilesDir = 'layer-mbtiles'
const getLayerMBTilesPath = layer => `${layerMBTilesDir}/${layer}.mbtiles`
const entityGeojsonDir = 'entity-geojson'
const getEntityGeojsonLayerDir = layer => `${entityGeojsonDir}/${layer}`
const getEntityGeojsonPath = (layer, entityId) => {
  const dir = getEntityGeojsonLayerDir(layer)
  return `${dir}/${entityId}.geojson`
}
const osmDownloadsDir = 'osm-downloads'
const getOSMGeojsonPath = osmId => `${osmDownloadsDir}/${osmId}.geojson`

/* parsing config files */
const getLayers = () => fs.readdirSync(confDir).map(fn => fn.slice(0, -5))
const getConf = layer =>
  JSON.parse(execSync(`yaml2json < ${getLayerConfPath(layer)}`).toString())

/* downloading features from OSM */
desc(`Create ${osmDownloadsDir} dir`)
directory(osmDownloadsDir)

desc('Download a feature as geojson from OSM')
rule(
  /^osm-downloads\/relation-[0-9]+.geojson$/,
  'osm-downloads',
  { async: true },
  function () {
    const osmId = this.name
      .slice('osm-downloads/'.length, -'.geojson'.length)
      .replace('-', '/')
    jake.logger.log(`Downloading ${this.name} ...`)

    const getOverpass = spawn('get-overpass', [osmId])
    const streamOut = fs.createWriteStream(this.name)
    getOverpass.stdout.pipe(streamOut)

    getOverpass.on('exit', onFail(this, getOverpass))
    streamOut.on('finish', () => onSuccess(this)(0))
  }
)

const layers = getLayers()
layers.forEach(layer => {
  const entities = getConf(layer).entities
  const entityGeojsons = []
  entities.forEach((entity, i) => {
    const entityId = i + 1
    const entityGeojson = getEntityGeojsonPath(layer, entityId)

    /* TODO: rules for computed geojsons */

    const relationGeojsons = (entity['relations'] || []).map(relationID =>
      getOSMGeojsonPath(`relation-${relationID}`)
    )

    /* TODO: add computed geojsons to dependencies, mapshaper command */

    /* builing geojson file for each entity with layer */
    desc(`Build ${entityGeojson}`)
    file(
      entityGeojson,
      relationGeojsons,
      function () {
        jake.logger.log(`Building ${this.name} ...`)
        jake.mkdirP(getEntityGeojsonLayerDir(layer))

        const mapshaper = spawn('mapshaper', [
          '-i',
          'combine-files',
          ...relationGeojsons,
          '-drop',
          'fields=*',
          '-merge-layers',
          '-dissolve',
          '-o',
          'geojson-type=Feature',
          '-'
        ])
        const geojsonCliBBox = spawn('geojson-cli-bbox', ['add'])
        const jq = spawn('jq', ['-c', `. + {"id": ${entityId}}`])
        const streamOut = fs.createWriteStream(this.name)
        mapshaper.stdout.pipe(geojsonCliBBox.stdin)
        geojsonCliBBox.stdout.pipe(jq.stdin)
        jq.stdout.pipe(streamOut)

        mapshaper.on('exit', onFail(this, mapshaper))
        geojsonCliBBox.on('exit', onFail(this, geojsonCliBBox))
        jq.on('exit', onFail(this, jq))
        streamOut.on('finish', () => onSuccess(this)(0))
      },
      {
        async: true,
        parallelLimit: 8
      }
    )

    entityGeojsons.push(entityGeojson)
  })

  /* build one mbtiles file for each map */
  const layerMBTilesPath = getLayerMBTilesPath(layer)
  desc(`Build ${layerMBTilesPath}`)
  file(
    layerMBTilesPath,
    entityGeojsons,
    function () {
      jake.logger.log(`Building ${this.name} ...`)
      jake.mkdirP(layerMBTilesDir)

      const tippecanoe = spawn('tippecanoe', [
        '-f',
        '-zg',
        '--detect-shared-borders',
        '--detect-longitude-wraparound',
        '-l',
        layer,
        '-o',
        this.name,
        ...entityGeojsons
      ])
      tippecanoe.on('exit', onFail(this, tippecanoe))
      tippecanoe.on('exit', onSuccess(this))
    },
    {
      async: true,
      parallelLimit: 8
    }
  )
})

/* combine each map's mbtiles file to one master one */
const layerMBTilesPaths = layers.map(getLayerMBTilesPath)
desc(`Build master mbtiles file, ${allMBTiles}`)
file(
  allMBTiles,
  layerMBTilesPaths,
  function () {
    jake.logger.log(`Building ${this.name} ...`)

    const layerName = 'All the Travel Maps'
    const tileJoin = spawn('tile-join', [
      '-f',
      '-o',
      this.name,
      '-pk',
      '-n',
      layerName,
      '-N',
      layerName,
      ...layerMBTilesPaths
    ])
    tileJoin.stdout.pipe(process.stdout)
    tileJoin.stderr.pipe(process.stderr)
    tileJoin.on('exit', onFail(this, tileJoin))
    tileJoin.on('exit', onSuccess(this))
  },
  { async: true }
)

desc(`Build ${allStaticDir} directory full of static MVT's`)
task(
  allStaticDir,
  [allMBTiles],
  function () {
    jake.logger.log(`Building ${this.name} ...`)

    if (fs.existsSync(allStaticDir)) {
      jake.logger.log(`${this.name} already exists, skipping`)
      this.complete()
      return
    }

    const tileJoin = spawn('tile-join', ['-e', allStaticDir, allMBTiles])
    tileJoin.stdout.pipe(process.stdout)
    tileJoin.stderr.pipe(process.stderr)
    tileJoin.on('exit', onFail(this, tileJoin))
    tileJoin.on('exit', onSuccess(this))
  },
  { async: true }
)

desc(`Default command, builds ${allMBTiles}`)
task('default', [allMBTiles])

desc(`Serve ${allMBTiles} via a local webserver`)
task('serve', [allMBTiles], function () {
  jake.logger.log(`Serving ${allMBTiles} ... (cntrl-c to quit)`)

  const tileServer = spawn('tileserver-gl-light', [allMBTiles])
  tileServer.stdout.pipe(process.stdout)
  tileServer.stderr.pipe(process.stderr)
  tileServer.on('exit', onFail(this, tileServer, false))
})

desc(`Upload ${allStaticDir} to Google Cloud Storage`)
task(
  'upload',
  [allStaticDir],
  function () {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    rl.question(
      'Target Google Cloud Storage path (ex: my-bucket-id/some-path): ',
      gcPath => {
        const localSource = `${__dirname}/${allStaticDir}`
        const gcFullPath = `${gcPath}/all`
        const gcTarget = `gs://${gcFullPath}`

        console.log()
        console.log(
          'Preparing to sync the contents (with deletes) of the following directories:'
        )
        console.log()
        console.log(`  ${localSource}    -->    ${gcTarget}`)
        console.log()

        rl.question('Continue? This cannot be undone. (y/n): ', resp => {
          if (resp !== 'y') {
            console.log('Exiting')
            process.exit(0)
          }
          rl.close()
          console.log('Starting upload')

          const gsutil = spawn('gsutil', [
            '-m',
            '-h',
            'content-encoding:gzip',
            '-h',
            'content-type:application/octet-stream',
            'rsync',
            '-d',
            '-r',
            localSource,
            gcTarget
          ])
          gsutil.stdout.pipe(process.stdout)
          gsutil.stderr.pipe(process.stderr)

          gsutil.on('exit', onFail(this, gsutil, false))
          gsutil.on('exit', exitCode => {
            if (exitCode !== 0) return
            console.log('Upload finished successfully')
            console.log('To use these uploaded tiles via mapbox-gl, set the')
            console.log("'tiles' attribute of your vector layer source to")
            console.log(
              `https://storage.googleapis.com/${gcFullPath}/{z}/{x}/{y}.pbf`
            )
            this.complete()
          })
        })
      }
    )
  },
  { async: true }
)

desc('Delete all build products except the raw downloads')
task('clean', [], function () {
  assertAndRm(entityGeojsonDir, 'entity-geojson')
  assertAndRm(layerMBTilesDir, 'layer-mbtiles')
  assertAndRm(allMBTiles, 'all.mbtiles')
  assertAndRm(allStaticDir, 'all-static')
})

desc('Delete all build products')
task('fullclean', ['clean'], function () {
  assertAndRm(osmDownloadsDir, 'osm-downloads')
})
