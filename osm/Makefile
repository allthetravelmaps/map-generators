# http://clarkgrubb.com/makefile-style-guide
MAKEFLAGS += --warn-undefined-variables
SHELL := bash
.SHELLFLAGS := -eu -o pipefail -c
.DEFAULT_GOAL := all
.DELETE_ON_ERROR:
.SUFFIXES:

downloads/provinces-of-canada/3908674.geojson downloads/provinces-of-canada/3911864.geojson:
	mkdir -p $(dir $@)
	get-overpass -m $(notdir $(basename $@)) > $@

downloads/provinces-of-argentina/30826684.geojson downloads/provinces-of-argentina/16321674.geojson:
	mkdir -p $(dir $@)
	get-overpass -m $(notdir $(basename $@)) > $@

build/provinces-of-canada.mbtiles: downloads/provinces-of-canada/3908674.geojson downloads/provinces-of-canada/3911864.geojson
	mkdir -p build
	cat $^ | tippecanoe -f -o $@ -zg --detect-shared-borders --detect-longitude-wraparound -l provinces-of-canada

build/provinces-of-argentina.mbtiles: downloads/provinces-of-argentina/30826684.geojson downloads/provinces-of-argentina/16321674.geojson
	mkdir -p build
	cat $^ | tippecanoe -f -o $@ -zg --detect-shared-borders --detect-longitude-wraparound -l provinces-of-argentina

osm.mbtiles: build/provinces-of-argentina.mbtiles build/provinces-of-canada.mbtiles
	tile-join -f -o $@ -pk -n "OSM TravelMapAddict" $^

.PHONY: all
all: osm.mbtiles

.PHONY: serve
serve: osm.mbtiles
	docker run -it -v $(CURDIR):/data:ro -p 8080:80 klokantech/tileserver-gl-light $<

.PHONY: clean
clean:
	rm -rf build

.PHONY: fullclean
fullclean: clean
	rm -rf downloads
