# Tiles

## Goals

* Configure which OSM features will be present in the MVT tiles
* Generate the MVT tiles
* Serve the MVT tiles locally
* Push the generated MVT tiles out to Google cloud buckets
* Push the config data out to external Firestore instances

## Quickstart

Ensure all the executables from the [dependencies](#dependencies) section are accessible in your `PATH`. Then:

```sh
jake        # will take a while...
jake serve  # open http://localhost:8080/ in a browser
jake clean  # deletes everything except the raw downloads
```

To see a full list of available tasks, run `jake -T`

## Dependencies

* [jake](https://www.npmjs.com/package/jake)
* [yaml2json](https://github.com/bronze1man/yaml2json)
* [get-overpass](https://www.npmjs.com/package/get-overpass)
* [geojson-cli-difference](https://www.npmjs.com/package/geojson-cli-difference)
* [mapshapper](https://www.npmjs.com/package/mapshaper)
* [geojson-cli-bbox](https://www.npmjs.com/package/geojson-cli-bbox)
* [jq](https://stedolan.github.io/jq/)
* [tippecanoe](https://github.com/mapbox/tippecanoe)
* [tileserver-gl-light](https://www.npmjs.com/package/tileserver-gl-light) - for serving locally
* [gsutil](https://cloud.google.com/storage/docs/gsutil) - for uploading

## Building an individual layer

To see available layers, run `jake list-layers`.

```sh
jake build-layer/my-cool-layer
jake serve-layer/my-cool-layer  # opens webserver on http://localhost:8080
jake clean-layer/my-cool-layer  # deletes all layer build products, except raw downloads
```

## Uploading to a Google Cloud Storage Bucket

### Configuring the bucket

These settings will allow your GC storage bucket to serve uploaded tiles via a public url such that the the mapbox-gl sdk can consume them. Note that these settings are permissive - they allow any website or unauthenticated user read access to the whole bucket. Use with care.

1. Create the cloud bucket

    ```sh
    gsutil mb gs://my-new-bucket-with-a-unique-name
    ```

1. Give everyone read access to the bucket

    ```sh
    gsutil iam ch allUsers:objectViewer gs://my-new-bucket-with-a-unique-name
    ```

1. Open up CORS all the way on the bucket

    ```sh
    echo '[{"origin": ["*"],"method": ["*"]}' > cors.json
    gsutil cors set cors.json gs://my-new-bucket-with-a-unique-name
    rm cors.json
    ```

### Building and uploading to the bucket

It's technically sufficient to just run `jake upload-static` alone, but since that prompts for user input, and since `jake build-static` takes a while, you probably want to break the process up into two separate commands:

```sh
jake build-static
jake upload-static
```

## Changelog

### Master

 * switched from `make` to `jake` to manage build process

### 0.2

 * switched to OSM (Open Street Map) as data source
 * Makefile to manage build process

### 0.1

 * WOF (Who's on First) as data source
 * shell scripts to manage build process
