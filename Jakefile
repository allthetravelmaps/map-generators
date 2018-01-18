const assert = require('assert')
const child_process = require('child_process')
const fs = require('fs')

/* double check we don't rm -rf anything we don't want to */
const assertAndRm = (val, ref) => {
  assert.equal(val, ref)
  jake.rmRf(val)
}

const allMBTiles = 'all.mbtiles'

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

const getLayers = () => fs.readdirSync(confDir).map(fn => fn.slice(0, -5))
const getConf = layer =>
  JSON.parse(
    child_process.execSync(`yaml2json < ${getLayerConfPath(layer)}`).toString()
  )

desc(`Create ${osmDownloadsDir} dir`)
directory(osmDownloadsDir)

desc('Download a feature as geojson from OSM')
rule(
  /^osm-downloads\/[0-9]+.geojson$/,
  'osm-downloads',
  { async: true },
  function () {
    const osmId = this.name.slice('osm-downloads/'.length, -'.geojson'.length)
    const target = this.name
    jake.logger.log(`Downloading ${target} ...`)
    jake.exec(`get-overpass relation/${osmId} > ${target}`, () => {
      jake.logger.log(`Downloaded ${target}`)
      this.complete()
    })
  }
)

const layers = getLayers()
layers.forEach(layer => {
  const entities = getConf(layer).entities
  const entityGeojsons = []
  entities.forEach((entity, i) => {
    const entityId = i + 1
    const entityGeojson = getEntityGeojsonPath(layer, entityId)

    const includedOSMGeojsons = entity['osmids'].map(getOSMGeojsonPath)

    /* TODO: remove excluded geojson
    const excludedOSMGeojsons = (entity['excluded_osmids'] || []).map(getOSMGeojsonPath)
    */

    desc(`Build ${entityGeojson}`)
    file(
      entityGeojson,
      includedOSMGeojsons,
      function () {
        const includedGeojsonsSS = includedOSMGeojsons.join(' ')
        const target = this.name
        jake.logger.log(`Building ${target} ...`)
        jake.mkdirP(getEntityGeojsonLayerDir(layer))
        jake.exec(
          `mapshaper -i combine-files ${includedGeojsonsSS} -drop fields=* -merge-layers -dissolve -o geojson-type=Feature - | geojson-cli-bbox add | jq -c '. + {"id": ${entityId}}' > ${target}`,
          () => {
            jake.logger.log(`Built ${target}`)
            this.complete()
          }
        )
      },
      {
        async: true,
        parallelLimit: 8
      }
    )

    entityGeojsons.push(entityGeojson)
  })

  const layerMBTilesPath = getLayerMBTilesPath(layer)
  desc(`Build ${layerMBTilesPath}`)
  file(
    layerMBTilesPath,
    entityGeojsons,
    function () {
      const entityGeojsonsSS = entityGeojsons.join(' ')
      const target = this.name
      jake.logger.log(`Building ${target} ...`)
      jake.mkdirP(layerMBTilesDir)
      jake.exec(
        `cat ${entityGeojsonsSS} | tippecanoe -f -zg --detect-shared-borders --detect-longitude-wraparound -l ${layer} -o ${target}`,
        () => {
          jake.logger.log(`Built ${target}`)
          this.complete()
        }
      )
    },
    {
      async: true,
      parallelLimit: 8
    }
  )
})

const layerMBTilesPaths = layers.map(getLayerMBTilesPath)
desc(`Build master mbtiles file, ${allMBTiles}`)
file(
  allMBTiles,
  layerMBTilesPaths,
  function () {
    const layerMBTilesPathsSS = layerMBTilesPaths.join(' ')
    const target = this.name
    jake.logger.log(`Building ${target} ...`)
    jake.exec(
      `tile-join -f -o ${target} -pk -n "All the Travel Maps" -N "All the Travel Maps" ${layerMBTilesPathsSS}`,
      () => {
        jake.logger.log(`Built ${target}`)
        this.complete()
      }
    )
  },
  { async: true }
)

desc(`Default command, builds allMBTiles}`)
task('default', [allMBTiles])

desc('Delete all build products except the raw downloads')
task('clean', [], function () {
  assertAndRm(entityGeojsonDir, 'entity-geojson')
  assertAndRm(layerMBTilesDir, 'layer-mbtiles')
  assertAndRm(allMBTiles, 'all.mbtiles')
})

desc('Delete all build products')
task('fullclean', ['clean'], function () {
  assertAndRm(osmDownloadsDir, 'osm-downloads')
})
