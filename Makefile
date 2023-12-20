SCRIPTS_DIR := "app/src/lib"
WASM_DIRS := $(wildcard wasm/*)

all: wasm_build

wasm_build: $(WASM_DIRS)

$(WASM_DIRS):
	@echo "Building $@"
	@(cd $@/src && wasm-pack build --target web)
	@TMP_FILE=$$(mktemp) && \
		jq '. + {"type": "module"}' $@/pkg/package.json > $$TMP_FILE && \
		mv $$TMP_FILE $@/pkg/package.json
	@rm -rf $(SCRIPTS_DIR)/$(@F)-pkg
	@mv $@/pkg $(SCRIPTS_DIR)/$(@F)-pkg

.PHONY: all wasm_build $(WASM_DIRS)
