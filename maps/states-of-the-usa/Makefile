DEFAULT_GEOMS_DIR := "default-geoms"
ALT_GEOMS_DIR := "alt-geoms"

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
	rm -f ./states-of-the-usa.meta.json

.PHONY: clean-map
clean-map:
	rm -f ./states-of-the-usa.map.svg

alt-geoms:
	./download-alt-geoms

default-geoms:
	./download-default-geoms

.PHONY: meta
meta: clean-meta default-geoms
	./generate-meta

.PHONY: map
map: clean-map alt-geoms
	./generate-map

.PHONY: .all
all: meta map
