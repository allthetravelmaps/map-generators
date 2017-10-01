MAKEFLAGS += --warn-undefined-variables
SHELL := bash
.SHELLFLAGS := -eu -o pipefail -c
.DEFAULT_GOAL := all
.DELETE_ON_ERROR:
.SUFFIXES:

buildDir := build
downloadDir := downloads
countyGeomsDir := $(downloadDir)/county-geoms
caGeomDir := $(downloadDir)/ca-geom

binDir := ../../bin
wofDownloadBin := $(binDir)/wof-download
generateMeta := $(binDir)/generate-meta

wofIdsFile := wofids
metaTemplateFile := meta-template.json
caWofId := 85688637
caWofOpts := "-A -S uscensus -F display -E terrestrial-zoom-10"

titleSlug := counties-of-california
metaFilename := $(titleSlug).meta.json
mapFilename := $(titleSlug).map.svg

downloads:
	$(wofDownloadBin) -d ./$(countyGeomsDir) -f ./$(wofIdsFile)
	$(wofDownloadBin) -d ./$(caGeomDir) -o $(caWofOpts) $(caWofId)

.PHONY: meta
meta: clean-meta downloads
	$(generateMeta) -t $(titleSlug) -d ./$(countyGeomsDir) -f ./$(metaTemplateFile) \
		         ./$(wofIdsFile) > ./$(metaFilename)

.PHONY: map
map: clean-map downloads
	./generate-map > ./$(mapFilename)

.PHONY: all
all: meta map

.PHONY: clean-meta
clean-meta:
	rm -f ./$(metaFilename)

.PHONY: clean-map
clean-map:
	rm -f ./$(mapFilename)

.PHONY: clean
clean: clean-meta clean-map
	rm -rf ./$(buildDir)
	rm -rf ./$(downloadDir)
