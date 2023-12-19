WASM_DIRS := $(wildcard wasm/*)
TAILWIND_DIR := tailwind

all: wasm_build tailwind_build

wasm_build: $(WASM_DIRS)

$(WASM_DIRS):
	@echo "Building $@"
	@(cd $@/src && wasm-pack build --target web)
	@rm -rf static/scripts/$(@F)-pkg
	@mv $@/pkg static/scripts/$(@F)-pkg

tailwind_build:
	@echo "Building Tailwind"
	@(cd $(TAILWIND_DIR) && npm run build)

.PHONY: all wasm_build tailwind_build $(WASM_DIRS)
