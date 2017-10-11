MAKEFLAGS += --warn-undefined-variables
SHELL := bash
.SHELLFLAGS := -eu -o pipefail -c
.DEFAULT_GOAL := all
.DELETE_ON_ERROR:
.SUFFIXES:

downloadsDir := downloads
configFile := config

binDir := ../../bin
wofDownload := $(binDir)/wof-download
generateMeta := $(binDir)/generate-meta
generateMap := ./generate-map

metaFilename := meta.json
mapFilename := map.svg

downloads: $(configFile)
	$(wofDownload) -d ./$(downloadsDir) -c ./$(configFile)

$(metaFilename): downloads $(generateMeta) $(configFile)
	$(generateMeta) -d ./$(downloadsDir) -c ./$(configFile) > ./$(metaFilename)

$(mapFilename):  downloads $(generateMap)
	$(generateMap) > ./$(mapFilename)

.PHONY: all
all: $(metaFilename) $(mapFilename)

.PHONY: clean
clean:
	rm -f ./$(metaFilename)
	rm -f ./$(mapFilename)

.PHONY: fullclean
fullclean: clean
	rm -rf ./$(downloadsDir)
