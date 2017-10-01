GEOMS_DIR := geoms
CA_GEOM_DIR := ca-geom
TRIMMED_DIR := trimmed-geoms

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
clean: clean-geoms clean-ca-geom clean-trimmed-geoms clean-meta clean-map

.PHONY: clean-geoms
clean-geoms:
	rm -rf ./$(GEOMS_DIR)

.PHONY: clean-trimmed
clean-trimmed-geoms:
	rm -rf ./$(TRIMMED_DIR)

.PHONY: clean-ca-geom
clean-ca-geom:
	rm -rf ./$(CA_GEOM_DIR)

.PHONY: clean-meta
clean-meta:
	rm -f ./$(META_FILENAME)

.PHONY: clean-map
clean-map:
	rm -f ./$(MAP_FILENAME)

geoms:
	$(WOF_DOWNLOAD_BIN) -d ./$(GEOMS_DIR) -f ./$(WOF_IDS_FILE)

ca-geom:
	$(WOF_DOWNLOAD_BIN) -d ./$(CA_GEOM_DIR) -o $(CA_WOF_OPTS) $(CA_WOF_ID)

.PHONY: meta
meta: clean-meta geoms
	$(GENERATE_META) -t $(TITLE_SLUG) -d ./$(GEOMS_DIR) -f ./$(META_TEMPLATE_FILE) \
		         ./$(WOF_IDS_FILE) > ./$(META_FILENAME)

.PHONY: map
map: clean-map geoms ca-geom
	./generate-map > ./$(MAP_FILENAME)

.PHONY: .all
all: meta map
