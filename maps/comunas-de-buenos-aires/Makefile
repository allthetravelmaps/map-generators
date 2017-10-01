MAKEFLAGS += --warn-undefined-variables
SHELL := bash
.SHELLFLAGS := -eu -o pipefail -c
.DEFAULT_GOAL := all
.DELETE_ON_ERROR:
.SUFFIXES:

downloadDir := downloads
geomsDir := $(downloadDir)/geoms

binDir := ../../bin
wofDownloadBin := $(binDir)/wof-download
generateMeta := $(binDir)/generate-meta

wofIdsFile := wofids
metaTemplateFile := meta-template.json

titleSlug := comunas-de-buenos-aires
metaFilename := $(titleSlug).meta.json
mapFilename := $(titleSlug).map.svg

downloads:
	$(wofDownloadBin) -d ./$(geomsDir) -f ./$(wofIdsFile)

.PHONY: meta
meta: clean-meta downloads
	$(generateMeta) -t $(titleSlug) -d ./$(geomsDir) -f ./$(metaTemplateFile) \
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
