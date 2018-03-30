/* global jake:false, desc:false, directory:false, fail:false, file:false */
/* global rule:false, task:false */

const assert = require('assert')
const fs = require('fs')
const os = require('os')
const path = require('path')
const process = require('process')
const readline = require('readline')
const { execSync, spawn } = require('child_process')

const maxConcurrency = os.cpus().length

/* Defaults to 10.
 * The most readables we have piped to stderr within a
 * task is 3 (currently).
 * One additional for node itself. */
process.stderr.setMaxListeners(maxConcurrency * 3 + 1)

/* double check we don't rm -rf anything we don't want to */
const assertAndRm = (val, ref) => {
  assert.equal(val, ref)
  jake.rmRf(val)
}

/* fail the task if an exitCode is non-zero */
const onFail = (task, childProcesses, deleteTarget = true) => {
  const failedExe = childProcesses[childProcesses.length - 1].spawnargs[0]
  const fullCmd = childProcesses.map(cp => cp.spawnargs.join(' ')).join(' | ')
  const target = task.name
  const msg = `'${target}' failed. ${failedExe} failed while excecuting '${fullCmd}'`
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

/* serve an MBTiles file via a webserver */
const serveMBTiles = mbtiles => {
  jake.logger.log(`Serving ${mbtiles} ... (cntrl-c to quit)`)

  const cmd = spawn('tileserver-gl-light', [mbtiles], { stdio: 'inherit' })
  cmd.on('exit', onFail(this, [cmd], false))
}

/* directory structure */
const downloadsDir = 'downloads'
const osmDownloadsDir = `${downloadsDir}/osm`
const getDownloadsOSMPath = osmId =>
  `${osmDownloadsDir}/${osmId.replace('/', '.')}.geojson`
const waterDownloadsPath = `${downloadsDir}/water/water-polygons-split-4326.zip`
const waterRemoteUrl =
  'http://data.openstreetmapdata.com/water-polygons-split-4326.zip'

const allMBTiles = 'all.mbtiles'
const allStaticDir = 'all.static'

const confDir = 'conf'
const getLayerConfPath = layer => `${confDir}/${layer}.yaml`

const waterDir = 'water'
const waterFeaturesDir = `${waterDir}/features`
const waterShpPath = `${waterDir}/water-polygons-split-4326/water_polygons.shp`
const waterGeojsonPath = `${waterDir}/water.geojson`

const layersDir = 'layers'
const getLayerDir = layer => `${layersDir}/${layer}`
const getLayerMBTilesPath = layer => `${getLayerDir(layer)}/${layer}.mbtiles`
const getLayerEntityPath = (layer, entityId) =>
  `${getLayerDir(layer)}/entities/${entityId}.geojson`
const getLayerFeaturePath = (layer, entityId, featureId) =>
  `${getLayerDir(layer)}/features/${entityId}-${featureId}.geojson`

/* parsing config files */
const getLayers = () => fs.readdirSync(confDir).map(fn => fn.slice(0, -5))
const getConf = layer =>
  JSON.parse(execSync(`yaml2json < ${getLayerConfPath(layer)}`).toString())
const normalizeOsmId = osmid =>
  typeof osmid === 'number' ? `relation/${osmid}` : osmid

/* executable we need to run with extra mem */
const geojsonClipping = execSync(`which geojson-clipping`, {
  encoding: 'utf-8'
}).trim()

/* downloading OSM water: http://openstreetmapdata.com/data/water-polygons */
desc('Download OSM water from openstreetmapdata.com')
file(
  waterDownloadsPath,
  [],
  function () {
    jake.logger.log(`Downloading ${this.name} ...`)
    jake.mkdirP(path.dirname(this.name))
    const cmd = spawn('curl', [waterRemoteUrl])
    const streamOut = fs.createWriteStream(this.name)
    cmd.stderr.pipe(process.stderr)
    cmd.stdout.pipe(streamOut)

    cmd.on('exit', onFail(this, [cmd]))
    streamOut.on('finish', () => onSuccess(this)(0))
  },
  { async: true }
)

desc('Unzip downloaded water data zipfile')
file(
  waterShpPath,
  [waterDownloadsPath],
  function () {
    jake.logger.log(`Unzipping water ...`)
    jake.mkdirP(waterDir)

    const cmd = spawn('unzip', [waterDownloadsPath, '-d', waterDir], {
      stdio: 'inherit'
    })
    cmd.on('exit', onFail(this, [cmd]))
    cmd.on('exit', exitCode => {
      if (exitCode !== 0) return
      /* update file timestamps so jake doesn't re-do this step unnecessarily */
      const cmd2 = spawn('touch', [this.name])
      cmd2.on('exit', onFail(this, [cmd]))
      cmd2.on('exit', onSuccess(this))
    })
  },
  { async: true }
)

desc('Convert water data to geojson')
file(
  waterGeojsonPath,
  [waterShpPath],
  function () {
    jake.logger.log(`Converting water data to geojson ...`)

    const cmd = spawn('mapshaper', [
      waterShpPath,
      '-o',
      'format=geojson',
      waterGeojsonPath
    ])
    const streamOut = fs.createWriteStream(this.name)
    cmd.stderr.pipe(process.stderr)
    cmd.stdout.pipe(streamOut)

    cmd.on('exit', onFail(this, [cmd]))
    streamOut.on('finish', () => onSuccess(this)(0))
  },
  { async: true }
)

/* downloading features from OSM */
desc(`Create ${osmDownloadsDir} dir`)
directory(osmDownloadsDir)

desc('Download a feature as geojson from OSM')
rule(
  /^downloads\/osm\/(node|way|relation).[0-9]+.geojson$/,
  osmDownloadsDir,
  { async: true },
  function () {
    const osmId = this.name
      .slice('downloads/osm/'.length, -'.geojson'.length)
      .replace('.', '/')
    jake.logger.log(`Downloading ${this.name} ...`)

    const cmd = spawn('get-overpass', [osmId])
    const streamOut = fs.createWriteStream(this.name)
    cmd.stderr.pipe(process.stderr)
    cmd.stdout.pipe(streamOut)

    cmd.on('exit', onFail(this, [cmd]))
    streamOut.on('finish', () => onSuccess(this)(0))
  }
)

const layers = getLayers()
layers.forEach(layer => {
  const entities = getConf(layer).entities
  const entityPaths = []
  entities.forEach((entity, i) => {
    const entityId = i + 1
    const entityPath = getLayerEntityPath(layer, entityId)

    const featurePaths = []
    const features = entity['features'] || []
    features.forEach((featureConf, j) => {
      const featureId = j + 1
      const featurePath = getLayerFeaturePath(layer, entityId, featureId)
      const osmid =
        typeof featureConf === 'object' ? featureConf.osmid : featureConf
      const osmPath = getDownloadsOSMPath(normalizeOsmId(osmid))
      const excludePaths = (featureConf.excludes || [])
        .map(normalizeOsmId)
        .map(getDownloadsOSMPath)

      desc(`Build ${featurePath}`)
      file(
        featurePath,
        [osmPath, ...excludePaths],
        function () {
          jake.logger.log(`Building ${this.name} ...`)
          jake.mkdirP(path.dirname(featurePath))

          // in the event that we need to subract both some land features
          // and water, do the land features first to the bounding box can
          // be smaller for the water subtraction
          let cmd1
          if (excludePaths.length > 0) {
            cmd1 = spawn(
              geojsonClipping,
              ['difference', '-s', osmPath, ...excludePaths],
              { stdio: ['inherit', 'pipe', 'pipe'] } // without this it waits for input in stdin
            )
          } else {
            cmd1 = spawn('cat', [osmPath])
          }

          const cmd2 = spawn('node', [
            '--max_old_space_size=8192',
            geojsonClipping,
            'difference',
            '-b',
            waterFeaturesDir,
            '-o',
            this.name
          ])

          cmd1.stdout.pipe(cmd2.stdin)
          cmd1.stderr.pipe(process.stderr)
          cmd2.stderr.pipe(process.stderr)

          cmd1.on('exit', onFail(this, [cmd1]))
          cmd2.on('exit', onFail(this, [cmd1, cmd2]))
          cmd2.on('exit', onSuccess(this))
        },
        { async: true }
      )

      featurePaths.push(featurePath)
    })

    /* builing geojson file for each entity with layer */
    desc(`Build ${entityPath}`)
    file(
      entityPath,
      featurePaths,
      function () {
        jake.logger.log(`Building ${this.name} ...`)
        jake.mkdirP(path.dirname(entityPath))

        const cmd = spawn(
          'node',
          [
            '--max_old_space_size=8192',
            geojsonClipping,
            'union',
            '-i',
            entityId,
            '-o',
            this.name,
            ...featurePaths
          ],
          { stdio: 'inherit' } // without this it waits for input in stdin
        )

        cmd.on('exit', onFail(this, [cmd]))
        cmd.on('exit', onSuccess(this))
      },
      { async: true }
    )

    entityPaths.push(entityPath)
  })

  /* build one mbtiles file for each map */
  const layerMBTilesPath = getLayerMBTilesPath(layer)
  desc(`Build ${layerMBTilesPath}`)
  file(
    layerMBTilesPath,
    entityPaths,
    function () {
      jake.logger.log(`Building ${this.name} ...`)
      jake.mkdirP(path.dirname(layerMBTilesPath))

      const cmd = spawn(
        'tippecanoe',
        [
          '-f',
          '-zg',
          '--detect-shared-borders',
          '--detect-longitude-wraparound',
          '-l',
          layer,
          '-o',
          this.name,
          ...entityPaths
        ],
        { stdio: 'inherit' }
      )
      cmd.on('exit', onFail(this, [cmd]))
      cmd.on('exit', onSuccess(this))
    },
    {
      async: true,
      parallelLimit: maxConcurrency
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
    const cmd = spawn(
      'tile-join',
      [
        '-f',
        '-o',
        this.name,
        '-pk',
        '-n',
        layerName,
        '-N',
        layerName,
        ...layerMBTilesPaths
      ],
      { stdio: 'inherit' }
    )
    cmd.on('exit', onFail(this, [cmd]))
    cmd.on('exit', onSuccess(this))
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

    const cmd = spawn('tile-join', ['-e', allStaticDir, allMBTiles], {
      stdio: 'inherit'
    })
    cmd.on('exit', onFail(this, [cmd]))
    cmd.on('exit', onSuccess(this))
  },
  { async: true }
)

layers.forEach(layer => {
  desc(`Build layer ${layer}`)
  task(`build-layer/${layer}`, [getLayerMBTilesPath(layer)])
})

desc('Explode water feature collection to individual features')
task(
  'build-water',
  [waterGeojsonPath],
  function () {
    jake.logger.log('Exploding water feature collection')

    const cmd1 = spawn('cat', [waterGeojsonPath])
    const cmd2 = spawn('geojson-cli-explode', [
      '-d',
      waterFeaturesDir,
      '--include-bboxes-in-filenames'
    ])

    cmd1.stdout.pipe(cmd2.stdin)

    cmd1.stderr.pipe(process.stderr)
    cmd2.stderr.pipe(process.stderr)

    cmd1.on('exit', onFail(this, [cmd1]))
    cmd2.on('exit', onFail(this, [cmd1, cmd2]))
    cmd2.on('exit', onSuccess(this))
  },
  { async: true }
)

desc(`Build all layers in one mbtiles file, ${allMBTiles}`)
task('build', [allMBTiles])

layers.forEach(layer => {
  const layerMBTiles = getLayerMBTilesPath(layer)
  desc(`Serve layer ${layer}`)
  task(`serve-layer/${layer}`, [layerMBTiles], function () {
    serveMBTiles(layerMBTiles)
  })
})

desc(`Serve ${allMBTiles} via a local webserver`)
task('serve', [allMBTiles], function () {
  serveMBTiles(allMBTiles)
})

layers.forEach(layer => {
  desc(`Delete build products for layer ${layer}`)
  task(`clean-layer/${layer}`, [], function () {
    assertAndRm(getLayerDir(layer), `${layersDir}/${layer}`)
  })
})

desc('Delete build products for water')
task('clean-water', [], function () {
  assertAndRm(waterDir, 'water')
})

desc(`Delete ${allMBTiles} and ${layersDir}`)
task('clean', [], function () {
  assertAndRm(allMBTiles, 'all.mbtiles')
  assertAndRm(layersDir, 'layers')
})

desc(`Build all layers in one static directory, ${allStaticDir}`)
task('build-static', [allStaticDir])

desc(`Upload ${allStaticDir} to Google Cloud Storage`)
task(
  'upload-static',
  ['build-static'],
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

          const cmd = spawn(
            'gsutil',
            [
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
            ],
            { stdio: 'inherit' }
          )

          cmd.on('exit', onFail(this, [cmd], false))
          cmd.on('exit', exitCode => {
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

desc(`Delete ${allStaticDir}`)
task('clean-static', [], function () {
  assertAndRm(allStaticDir, 'all.static')
})

desc('List layers')
task('list-layers', [], function () {
  layers.forEach(layer => console.log(layer))
})

desc('Delete the downloads dir')
task('clean-downloads', [], function () {
  assertAndRm(downloadsDir, 'downloads')
})

desc('Delete all build products')
task('clean-everything', ['clean-static', 'clean', 'clean-downloads'])

desc(`Build master mbtiles file, ${allMBTiles}`)
task('default', ['build'])
