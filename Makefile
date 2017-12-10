# http://clarkgrubb.com/makefile-style-guide
MAKEFLAGS += --warn-undefined-variables
SHELL := bash
.SHELLFLAGS := -eu -o pipefail -c
.DEFAULT_GOAL := all
.DELETE_ON_ERROR:
.SUFFIXES:
.SECONDARY:

downloads/%.geojson:
	mkdir -p $(dir $@)
	get-overpass -m $(notdir $(basename $@)) > $@

.SECONDEXPANSION:
# build/provinces-of-canada.mbtiles: downloads/provinces-of-canada/$(cat-and-remove-comments osmids/provinces-of-canada).geojson
build/%.mbtiles: $$(addprefix downloads/$$(basename $$(@F))/, $$(addsuffix .geojson, $$(shell sed s/\#.*$$$$// osmids/$$(basename $$(@F))))) \
	               osmids/$$(basename $$(@F))
	mkdir -p build
	cat $^ | tippecanoe -f -o $@ -zg --detect-shared-borders --detect-longitude-wraparound -l $(basename $(@F))

osm.mbtiles: $(addprefix build/, $(addsuffix .mbtiles, $(notdir $(wildcard osmids/*))))
	tile-join -f -o $@ -pk -n "All the Travel Maps" -N "All the Travel Maps" $^

osm.static.compressed: osm.mbtiles
	tile-join -e $@ $<

.PHONY: static
static: osm.static.compressed

.PHONY: all
all: osm.mbtiles

.PHONY: serve
serve: osm.mbtiles
	tileserver-gl-light $<

.PHONY: clean
clean:
	rm -rf build
	rm -f osm.mbtiles

.PHONY: fullclean
fullclean: clean
	rm -rf downloads