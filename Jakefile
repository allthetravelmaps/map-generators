const assert = require('assert')
const { execSync, spawn } = require('child_process')
const fs = require('fs')
const path = require('path')
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

/* serve an MBTiles file via a webserver */
const serveMBTiles = mbtiles => {
  jake.logger.log(`Serving ${mbtiles} ... (cntrl-c to quit)`)

  const cmd = spawn('tileserver-gl-light', [mbtiles], { stdio: 'inherit' })
  cmd.on('exit', onFail(this, cmd, false))
}

/* directory structure */
const downloadsDir = 'downloads'
const osmDownloadsDir = `${downloadsDir}/osm`
const getDownloadsOSMPath = osmId =>
  `${osmDownloadsDir}/${osmId.replace('/', '.')}.geojson`

const allMBTiles = 'all.mbtiles'
const allStaticDir = 'all.static'

const confDir = 'conf'
const getLayerConfPath = layer => `${confDir}/${layer}.yaml`

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
    cmd.stdout.pipe(streamOut)

    cmd.on('exit', onFail(this, cmd))
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
      const osmPath = getDownloadsOSMPath(
        featureConf.osmid || `relation/${featureConf}`
      )
      const excludePaths = (featureConf.excludes || []).map(getDownloadsOSMPath)

      desc(`Build ${featurePath}`)
      file(
        featurePath,
        [osmPath, ...excludePaths],
        function () {
          jake.logger.log(`Building ${this.name} ...`)
          jake.mkdirP(path.dirname(featurePath))

          const streamIn = fs.createReadStream(osmPath)
          const cmd = spawn('geojson-cli-difference', excludePaths)
          const streamOut = fs.createWriteStream(this.name)
          streamIn.pipe(cmd.stdin)
          cmd.stdout.pipe(streamOut)

          cmd.on('exit', onFail(this, cmd))
          streamOut.on('finish', () => onSuccess(this)(0))
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

        const cmd1 = spawn('mapshaper', [
          '-i',
          'combine-files',
          ...featurePaths,
          '-drop',
          'fields=*',
          '-merge-layers',
          '-dissolve',
          '-o',
          'geojson-type=Feature',
          '-'
        ])
        const cmd2 = spawn('geojson-cli-bbox', ['add'])
        const cmd3 = spawn('jq', ['-c', `. + {"id": ${entityId}}`])
        const streamOut = fs.createWriteStream(this.name)
        cmd1.stdout.pipe(cmd2.stdin)
        cmd2.stdout.pipe(cmd3.stdin)
        cmd3.stdout.pipe(streamOut)

        cmd1.on('exit', onFail(this, cmd1))
        cmd2.on('exit', onFail(this, cmd2))
        cmd3.on('exit', onFail(this, cmd3))
        streamOut.on('finish', () => onSuccess(this)(0))
      },
      {
        async: true,
        parallelLimit: 8
      }
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
      cmd.on('exit', onFail(this, cmd))
      cmd.on('exit', onSuccess(this))
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
    cmd.on('exit', onFail(this, cmd))
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
    cmd.on('exit', onFail(this, cmd))
    cmd.on('exit', onSuccess(this))
  },
  { async: true }
)

layers.forEach(layer => {
  desc(`Build layer ${layer}`)
  task(`build-layer/${layer}`, [getLayerMBTilesPath(layer)])
})

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

          cmd.on('exit', onFail(this, cmd, false))
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
