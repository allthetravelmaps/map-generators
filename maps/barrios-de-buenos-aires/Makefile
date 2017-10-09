MAKEFLAGS += --warn-undefined-variables
SHELL := bash
.SHELLFLAGS := -eu -o pipefail -c
.DEFAULT_GOAL := all
.DELETE_ON_ERROR:
.SUFFIXES:

downloadDir := downloads
geomsDir := $(downloadDir)/geoms

binDir := ../../bin
wofDownload := $(binDir)/wof-download
generateMeta := $(binDir)/generate-meta
generateMap := ./generate-map

wofIdsFile := wofids
metaTemplateFile := meta-template.json

titleSlug := barrios-de-buenos-aires
metaFilename := $(titleSlug).meta.json
mapFilename := $(titleSlug).map.svg

downloads:
	$(wofDownload) -d ./$(geomsDir) -f ./$(wofIdsFile)

$(metaFilename): downloads $(generateMeta) $(metaTemplateFile) $(wofIdsFile)
	$(generateMeta) -t $(titleSlug) -d ./$(geomsDir) -f ./$(metaTemplateFile) \
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
