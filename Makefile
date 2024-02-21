PAGE_DIR := .
WASM_DIRS := $(wildcard src/lib/wasm/*)

all: wasm_build static_build

wasm_build: $(WASM_DIRS)

$(WASM_DIRS):
	@echo "Building $@"
	@(cd $@/src && wasm-pack build --target web)
	@TMP_FILE=$$(mktemp) && \
		jq '. + {"type": "module"}' $@/pkg/package.json > $$TMP_FILE && \
		mv $$TMP_FILE $@/pkg/package.json

static_build:
	@echo "Building static"
	@(cd $(PAGE_DIR) && npm ci && npm run build)

.PHONY: all wasm_build $(WASM_DIRS) static_build
