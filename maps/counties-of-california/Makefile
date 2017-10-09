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
wofDownload := $(binDir)/wof-download
generateMeta := $(binDir)/generate-meta
generateMap := ./generate-map

wofIdsFile := wofids
metaTemplateFile := meta-template.json
caWofId := 85688637
caWofOpts := "-A -S uscensus -F display -E terrestrial-zoom-10"

titleSlug := counties-of-california
metaFilename := $(titleSlug).meta.json
mapFilename := $(titleSlug).map.svg

downloads:
	$(wofDownload) -d ./$(countyGeomsDir) -f ./$(wofIdsFile)
	$(wofDownload) -d ./$(caGeomDir) -o $(caWofOpts) $(caWofId)

$(metaFilename): downloads $(generateMeta) $(metaTemplateFile) $(wofIdsFile)
	$(generateMeta) -t $(titleSlug) -d ./$(countyGeomsDir) -f ./$(metaTemplateFile) \
		         ./$(wofIdsFile) > ./$(metaFilename)

$(mapFilename):  downloads $(generateMap)
	$(generateMap) > ./$(mapFilename)

.PHONY: all
all: $(mapFilename) $(metaFilename)

.PHONY: clean
clean:
	rm -f ./$(metaFilename)
	rm -f ./$(mapFilename)

.PHONY: fullclean
fullclean: clean
	rm -rf ./$(buildDir)
	rm -rf ./$(downloadDir)
