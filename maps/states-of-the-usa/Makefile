DEFAULT_GEOMS_DIR := default-geoms
ALT_GEOMS_DIR := alt-geoms

BIN_DIR := ../../bin
WOF_DOWNLOAD_BIN := $(BIN_DIR)/wof-download
GENERATE_META := $(BIN_DIR)/generate-meta

WOF_IDS_FILE := wofids
META_TEMPLATE_FILE := meta-template.json
WOF_ALT_GEOMS_OPTS := "-A -S uscensus -F display -E terrestrial-zoom-10"

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
	$(WOF_DOWNLOAD_BIN) -d ./$(ALT_GEOMS_DIR) -o $(WOF_ALT_GEOMS_OPTS) -f ./$(WOF_IDS_FILE)

default-geoms:
	$(WOF_DOWNLOAD_BIN) -d ./$(DEFAULT_GEOMS_DIR) -f ./$(WOF_IDS_FILE)

.PHONY: meta
meta: clean-meta default-geoms
	$(GENERATE_META) -t $(TITLE_SLUG) -d ./$(DEFAULT_GEOMS_DIR) -f ./$(META_TEMPLATE_FILE) \
		         ./$(WOF_IDS_FILE) > ./$(META_FILENAME)

.PHONY: map
map: clean-map alt-geoms
	./generate-map > ./$(MAP_FILENAME)

.PHONY: .all
all: meta map
