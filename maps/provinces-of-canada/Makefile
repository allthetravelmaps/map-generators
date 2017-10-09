MAKEFLAGS += --warn-undefined-variables
SHELL := bash
.SHELLFLAGS := -eu -o pipefail -c
.DEFAULT_GOAL := all
.DELETE_ON_ERROR:
.SUFFIXES:

buildDir := build
downloadDir := downloads
provinceGeomsDir := $(downloadDir)/province-geoms
caGeomDir := $(downloadDir)/ca-geom

binDir := ../../bin
wofDownload := $(binDir)/wof-download
generateMeta := $(binDir)/generate-meta
generateMap := ./generate-map

wofIdsFile := wofids
metaTemplateFile := meta-template.json
caWofId := 85633041

titleSlug := provinces-of-canada
metaFilename := $(titleSlug).meta.json
mapFilename := $(titleSlug).map.svg

downloads:
	$(wofDownload) -d ./$(provinceGeomsDir) -f ./$(wofIdsFile)
	$(wofDownload) -d ./$(caGeomDir) $(caWofId)

$(metaFilename): downloads $(generateMeta) $(metaTemplateFile) $(wofIdsFile)
	$(generateMeta) -t $(titleSlug) -d ./$(provinceGeomsDir) -f ./$(metaTemplateFile) \
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
