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
meta: clean-meta downloads
	$(generateMeta) -t $(titleSlug) -d ./$(wofDefaultGeomsDir) -f ./$(metaTemplateFile) \
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
	rm -rf ./$(downloadDir)
