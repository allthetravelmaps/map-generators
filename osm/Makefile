# http://clarkgrubb.com/makefile-style-guide
MAKEFLAGS += --warn-undefined-variables
SHELL := bash
.SHELLFLAGS := -eu -o pipefail -c
.DEFAULT_GOAL := all
.DELETE_ON_ERROR:
.SUFFIXES:

layers := \
	provinces-of-argentina \
	provinces-of-canada

downloads/%.geojson:
	mkdir -p $(dir $@)
	get-overpass -m $(notdir $(basename $@)) > $@

.SECONDEXPANSION:
# build/provinces-of-canada.mbtiles: downloads/provinces-of-canada/$(cat-and-remove-comments osmids/provinces-of-canada).geojson
build/%.mbtiles: $$(addprefix downloads/$$(basename $$(@F))/, $$(addsuffix .geojson, $$(shell sed s/\#.*$$$$// osmids/$$(basename $$(@F)))))
	mkdir -p build
	cat $^ | tippecanoe -f -o $@ -zg --detect-shared-borders --detect-longitude-wraparound -l $(basename $(@F))

osm.mbtiles: $(addprefix build/, $(addsuffix .mbtiles, $(layers)))
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
