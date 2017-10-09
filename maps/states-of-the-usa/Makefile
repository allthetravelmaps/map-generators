MAKEFLAGS += --warn-undefined-variables
SHELL := bash
.SHELLFLAGS := -eu -o pipefail -c
.DEFAULT_GOAL := all
.DELETE_ON_ERROR:
.SUFFIXES:

downloadDir := downloads
wofDefaultGeomsDir := $(downloadDir)/wof-default-geoms
wofAltGeomsDir := $(downloadDir)/wof-alt-geoms

binDir := ../../bin
wofDownload := $(binDir)/wof-download
generateMeta := $(binDir)/generate-meta
generateMap := ./generate-map

wofIdsFile := wofids
metaTemplateFile := meta-template.json
wofAltGeomsOpts := "-A -S uscensus -F display -E terrestrial-zoom-10"

titleSlug := states-of-the-usa
metaFilename := $(titleSlug).meta.json
mapFilename := $(titleSlug).map.svg

downloads:
	$(wofDownload) -d ./$(wofAltGeomsDir) -o $(wofAltGeomsOpts) -f ./$(wofIdsFile)
	$(wofDownload) -d ./$(wofDefaultGeomsDir) -f ./$(wofIdsFile)

$(metaFilename): downloads $(generateMeta) $(metaTemplateFile) $(wofIdsFile)
	$(generateMeta) -t $(titleSlug) -d ./$(wofDefaultGeomsDir) -f ./$(metaTemplateFile) \
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
	rm -rf ./$(downloadDir)
