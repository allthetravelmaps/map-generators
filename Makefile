# http://clarkgrubb.com/makefile-style-guide
MAKEFLAGS += --warn-undefined-variables
SHELL := bash
.SHELLFLAGS := -eu -o pipefail -c
.DEFAULT_GOAL := all
.DELETE_ON_ERROR:
.SUFFIXES:
.SECONDARY:
.SECONDEXPANSION:


# -> list of layers
get-layers = $(notdir $(basename $(wildcard conf/*)))

# list of layers -> list of paths to layer mbtiles files
get-layer-mbtiles-paths = $(addprefix layer-mbtiles/, $(addsuffix .mbtiles, $(1)))

# layer -> path to layer conf
get-layer-conf = conf/$(1).yaml

# layer -> number of entities this layer has
get-number-of-entities = $(shell yq '.entities | length' $(call get-layer-conf,$(1)))

# layer -> list of all the layer-relative entity ids for this layer
get-entity-ids = $(shell seq 1 $(call get-number-of-entities,$(1)))

# layer, list of entity_ids -> list of paths to entity geojson files
get-entity-geojson-paths = $(addprefix entity-geojson/$(1)/, $(addsuffix .geojson, $(2)))

# layer, entity id -> list of osm ids included in this entity
get-included-osm-ids = $(shell yq '.entities[$(2)-1].osmids[]' $(call get-layer-conf,$(1)))

# layer, entity id -> list of osm ids excluded in this entity
get-excluded-osm-ids = $(shell yq '(.entities[$(2)-1].excluded_osmids // [])[]' $(call get-layer-conf,$(1)))

# layer, entity id -> list of all osm ids either included or excluded in this entity
get-all-osm-ids = $(call get-included-osm-ids,$(1),$(2)) $(call get-excluded-osm-ids,$(1),$(2))

# list of osm ids -> list of paths to osm geojson files
get-osm-geojson-paths = $(addprefix osm-downloads/, $(addsuffix .geojson, $(1)))


osm-downloads/%.geojson:
	mkdir -p $(dir $@)
	get-overpass relation/$(notdir $(basename $@)) > $@


# TODO: fetch the geojson for the excluded-osmids, and remove those polygons from the
# 			generated entity geojson

entity-geojson/%.geojson: $$(call get-osm-geojson-paths, $$(call get-included-osm-ids,$$(*D),$$(*F)))
	mkdir -p $(dir $@)
	mapshaper -i combine-files $^ -drop fields=* -merge-layers -dissolve -o geojson-type=Feature - | \
		geojson-cli-bbox add | \
		jq -c '. + {"id": $(*F)}' > $@


layer-mbtiles/%.mbtiles: $$(call get-entity-geojson-paths,$$(*), $$(call get-entity-ids,$$(*)))
	mkdir -p layer-mbtiles
	cat $^ | tippecanoe -f -zg --detect-shared-borders --detect-longitude-wraparound -l $* -o $@


all.mbtiles: $(call get-layer-mbtiles-paths, $(call get-layers))
	tile-join -f -o $@ -pk -n "All the Travel Maps" -N "All the Travel Maps" $^


all-static: all.mbtiles
	tile-join -e $@ $<


.PHONY: all
all: all.mbtiles


.PHONY: upload
upload: all-static
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
	rm -rf entity-geojson
	rm -rf layer-mbtiles
	rm -f all.mbtiles
	rm -rf all-static


.PHONY: fullclean
fullclean: clean
	rm -rf osm-downloads
