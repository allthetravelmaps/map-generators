PROJECT_ROOT := ..
include make-preamble.mk

# https://stackoverflow.com/a/17845120/103909
targets:= downloads meta.json map.svg all clean fullclean
subdirs := $(wildcard */.)
MAKECMDGOALS ?= all  # avoids an undefined variable warning

$(targets): $(subdirs)
$(subdirs):
	$(MAKE) -C $@ $(MAKECMDGOALS)

.PHONY: $(targets) $(subdirs)
