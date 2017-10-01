BUILD_DIR := build
DL_DIR := downloads
COUNTY_GEOMS_DIR := $(DL_DIR)/county-geoms
CA_GEOM_DIR := $(DL_DIR)/ca-geom

BIN_DIR := ../../bin
WOF_DOWNLOAD_BIN := $(BIN_DIR)/wof-download
GENERATE_META := $(BIN_DIR)/generate-meta

WOF_IDS_FILE := wofids
META_TEMPLATE_FILE := meta-template.json
CA_WOF_ID := 85688637
CA_WOF_OPTS := "-A -S uscensus -F display -E terrestrial-zoom-10"

TITLE_SLUG := counties-of-california
META_FILENAME := $(TITLE_SLUG).meta.json
MAP_FILENAME := $(TITLE_SLUG).map.svg

.DEFAULT_GOAL := all

.PHONY: clean
clean: clean-meta clean-map
	rm -rf ./$(BUILD_DIR)
	rm -rf ./$(DL_DIR)

.PHONY: clean-meta
clean-meta:
	rm -f ./$(META_FILENAME)

.PHONY: clean-map
clean-map:
	rm -f ./$(MAP_FILENAME)

downloads:
	$(WOF_DOWNLOAD_BIN) -d ./$(COUNTY_GEOMS_DIR) -f ./$(WOF_IDS_FILE)
	$(WOF_DOWNLOAD_BIN) -d ./$(CA_GEOM_DIR) -o $(CA_WOF_OPTS) $(CA_WOF_ID)

.PHONY: meta
meta: clean-meta downloads
	$(GENERATE_META) -t $(TITLE_SLUG) -d ./$(COUNTY_GEOMS_DIR) -f ./$(META_TEMPLATE_FILE) \
		         ./$(WOF_IDS_FILE) > ./$(META_FILENAME)

.PHONY: map
map: clean-map downloads
	./generate-map > ./$(MAP_FILENAME)

.PHONY: .all
all: meta map
