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
meta: clean downloads
	$(generateMeta) -t $(titleSlug) -d ./$(geomsDir) -f ./$(metaTemplateFile) \
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
