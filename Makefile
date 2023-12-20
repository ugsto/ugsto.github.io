SCRIPTS_DIR := "app/static/scripts"
WASM_DIRS := $(wildcard wasm/*)

all: wasm_build

wasm_build: $(WASM_DIRS)

$(WASM_DIRS):
	@echo "Building $@"
	@(cd $@/src && wasm-pack build --target web)
	@rm -rf $(SCRIPTS_DIR)/$(@F)-pkg
	@mv $@/pkg $(SCRIPTS_DIR)/$(@F)-pkg

.PHONY: all wasm_build $(WASM_DIRS)
