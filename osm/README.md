# map-generators OSM

Map generators that use [OpenStreetMap](https://www.openstreetmap.org/) as a data source.

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
