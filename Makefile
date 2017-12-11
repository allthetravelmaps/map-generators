# http://clarkgrubb.com/makefile-style-guide
MAKEFLAGS += --warn-undefined-variables
SHELL := bash
.SHELLFLAGS := -eu -o pipefail -c
.DEFAULT_GOAL := all
.DELETE_ON_ERROR:
.SUFFIXES:
.SECONDARY:

downloads/%.geojson:
	mkdir -p $(dir $@)
	get-overpass -m $(notdir $(basename $@)) > $@

.SECONDEXPANSION:
# build/provinces-of-canada.mbtiles: downloads/provinces-of-canada/$(cat-and-remove-comments osmids/provinces-of-canada).geojson
build/%.mbtiles: $$(addprefix downloads/$$(basename $$(@F))/, $$(addsuffix .geojson, $$(shell sed s/\#.*$$$$// osmids/$$(basename $$(@F))))) \
	               osmids/$$(basename $$(@F))
	mkdir -p build
	cat $^ | tippecanoe -f -o $@ -zg --detect-shared-borders --detect-longitude-wraparound -l $(basename $(@F))

all.mbtiles: $(addprefix build/, $(addsuffix .mbtiles, $(notdir $(wildcard osmids/*))))
	tile-join -f -o $@ -pk -n "All the Travel Maps" -N "All the Travel Maps" $^

build/all: all.mbtiles
	tile-join -e $@ $<

.PHONY: all
all: all.mbtiles

.PHONY: upload
upload: build/all
	@read -p "Target Google Cloud Storage path (ex: my-bucket-id/some-path): " gcpath; \
	localsource="$$(pwd)/$<"; \
	gcfullpath="$${gcpath}/all"; \
	gctarget="gs://$${gcfullpath}"; \
	echo ""; \
	echo "Preparing to sync the contents (with deletes) of the following directories:"; \
	echo ""; \
	echo "  $${localsource}    -->    $${gctarget}"; \
	echo ""; \
	read -p "Continue? This cannot be undone. (y/n): " resp; \
	[[ "$${resp}" != "y" ]] && echo "Exiting" && exit 0; \
	echo "Starting upload"; \
	uploadcmd="gsutil -m -h content-encoding:gzip -h content-type:application/octet-stream rsync -d -r $${localsource} $${gctarget}"; \
	echo "$${uploadcmd}"; \
	$${uploadcmd}; \
	echo "Upload finished"; \
	echo "To use these uploaded tiles via mapbox-gl, set the 'tiles' attribute of your vector layer source to"; \
	echo "https://storage.googleapis.com/$${gcfullpath}/{z}/{x}/{y}.pbf"

.PHONY: serve
serve: all.mbtiles
	tileserver-gl-light $<

.PHONY: clean
clean:
	rm -rf build
	rm -f all.mbtiles

.PHONY: fullclean
fullclean: clean
	rm -rf downloads
