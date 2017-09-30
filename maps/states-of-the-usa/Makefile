DEFAULT_GEOMS_DIR := default-geoms
ALT_GEOMS_DIR := alt-geoms

TITLE_SLUG := states-of-the-usa
META_FILENAME := $(TITLE_SLUG).meta.json
MAP_FILENAME := $(TITLE_SLUG).map.svg

.DEFAULT_GOAL := all

.PHONY: clean
clean: clean-alt-geoms clean-default-geoms clean-meta clean-map

.PHONY: clean-alt-geoms
clean-alt-geoms:
	rm -rf ./$(ALT_GEOMS_DIR)

.PHONY: clean-default-geoms
clean-default-geoms:
	rm -rf ./$(DEFAULT_GEOMS_DIR)

.PHONY: clean-meta
clean-meta:
	rm -f ./$(META_FILENAME)

.PHONY: clean-map
clean-map:
	rm -f ./$(MAP_FILENAME)

alt-geoms:
	./download-alt-geoms

default-geoms:
	./download-default-geoms

.PHONY: meta
meta: clean-meta default-geoms
	./generate-meta -s $(TITLE_SLUG) > ./$(META_FILENAME)

.PHONY: map
map: clean-map alt-geoms
	./generate-map > ./$(MAP_FILENAME)

.PHONY: .all
all: meta map
