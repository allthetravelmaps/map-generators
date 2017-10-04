MAKEFLAGS += --warn-undefined-variables
SHELL := bash
.SHELLFLAGS := -eu -o pipefail -c
.DEFAULT_GOAL := all
.DELETE_ON_ERROR:
.SUFFIXES:

# https://stackoverflow.com/a/17845120/103909
targets:= all clean fullclean
subdirs := $(wildcard */.)
MAKECMDGOALS ?= all  # avoids an undefined variable warning

$(targets): $(subdirs)
$(subdirs):
	$(MAKE) -C $@ $(MAKECMDGOALS)

.PHONY: $(targets) $(subdirs)
