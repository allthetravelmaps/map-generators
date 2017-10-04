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
wofDownloadBin := $(binDir)/wof-download
generateMeta := $(binDir)/generate-meta

wofIdsFile := wofids
metaTemplateFile := meta-template.json
wofAltGeomsOpts := "-A -S uscensus -F display -E terrestrial-zoom-10"

titleSlug := states-of-the-usa
metaFilename := $(titleSlug).meta.json
mapFilename := $(titleSlug).map.svg

downloads:
	$(wofDownloadBin) -d ./$(wofAltGeomsDir) -o $(wofAltGeomsOpts) -f ./$(wofIdsFile)
	$(wofDownloadBin) -d ./$(wofDefaultGeomsDir) -f ./$(wofIdsFile)

.PHONY: meta
meta: clean downloads
	$(generateMeta) -t $(titleSlug) -d ./$(wofDefaultGeomsDir) -f ./$(metaTemplateFile) \
		         ./$(wofIdsFile) > ./$(metaFilename)

.PHONY: map
map: clean downloads
	./generate-map > ./$(mapFilename)

.PHONY: all
all: meta map

.PHONY: clean
clean:
	rm -f ./$(metaFilename)
	rm -f ./$(mapFilename)

.PHONY: fullclean
fullclean: clean
	rm -rf ./$(downloadDir)
