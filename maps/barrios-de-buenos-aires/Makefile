DL_DIR := downloads
GEOMS_DIR := $(DL_DIR)/geoms

BIN_DIR := ../../bin
WOF_DOWNLOAD_BIN := $(BIN_DIR)/wof-download
GENERATE_META := $(BIN_DIR)/generate-meta

WOF_IDS_FILE := wofids
META_TEMPLATE_FILE := meta-template.json

TITLE_SLUG := barrios-de-buenos-aires
META_FILENAME := $(TITLE_SLUG).meta.json
MAP_FILENAME := $(TITLE_SLUG).map.svg

.DEFAULT_GOAL := all

.PHONY: clean
clean: clean-meta clean-map
	rm -rf ./$(DL_DIR)

.PHONY: clean-meta
clean-meta:
	rm -f ./$(META_FILENAME)

.PHONY: clean-map
clean-map:
	rm -f ./$(MAP_FILENAME)

downloads:
	$(WOF_DOWNLOAD_BIN) -d ./$(GEOMS_DIR) -f ./$(WOF_IDS_FILE)

.PHONY: meta
meta: clean-meta downloads
	$(GENERATE_META) -t $(TITLE_SLUG) -d ./$(GEOMS_DIR) -f ./$(META_TEMPLATE_FILE) \
		         ./$(WOF_IDS_FILE) > ./$(META_FILENAME)

.PHONY: map
map: clean-map downloads
	./generate-map > ./$(MAP_FILENAME)

.PHONY: .all
all: meta map
