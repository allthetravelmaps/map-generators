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

defaultWofIdsFile := default.wofids
altWofIdsFile := alt.wofids
metaTemplateFile := meta-template.json
altWofOpts := "-A -S naturalearth"

titleSlug := countries-of-the-world
metaFilename := $(titleSlug).meta.json
mapFilename := $(titleSlug).map.svg

downloads:
	$(wofDownload) -d ./$(geomsDir) -f ./$(defaultWofIdsFile)
	$(wofDownload) -d ./$(geomsDir) -o $(altWofOpts) -f ./$(altWofIdsFile)

$(metaFilename): downloads $(generateMeta) $(metaTemplateFile) $(wofIdsFile)
	$(generateMeta) -t $(titleSlug) -d ./$(geomsDir) -f ./$(metaTemplateFile) \
		         ./$(defaultWofIdsFile) > ./$(metaFilename)

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
