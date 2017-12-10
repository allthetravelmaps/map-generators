# Tiles

## Goals

* Configure which OSM features will be present in the MVT tiles
* Generate the MVT tiles
* Serve the MVT tiles locally
* Push the generated MVT tiles out to Google cloud buckets
* Push the config data out to external Firestore instances

## Quickstart

```sh
make        # will take a while...
make serve  # open http://localhost:8080/ in a browser
```

## Dependencies

* [get-overpass](https://github.com/mfogel/get-overpass)
* [tippecanoe](https://github.com/mapbox/tippecanoe)
* [tileserver-gl-light](https://www.npmjs.com/package/tileserver-gl-light)

## Cleaning up

Note that `make clean` cleans out everything except the raw downloaded data. To delete the raw downloads as well, use `make fullclean`.
