# Introduction to WebAssembly and Rust

## Introduction

In the evolving landscape of web development, applications keep growing in complexity and resource usage, making so that developers continually seek technologies to handle performance problems and improve user experience. Following this challenge, WebAssembly (Wasm) is introduced in [2015](https://github.com/WebAssembly/design/releases/tag/public-announcement) as a potential game changer and powerful companion to JavaScript, enabling high-performance applications directly in the browser. Unlike JavaScript, Wasm operates as bytecode generated from compiled languages, offering a more efficient and robust way to handle complex tasks.

Among the languages compatible with WebAssembly, Rust pairs very well with Wasm's ideals. Renowned for its emphasis on memory safety and performance, Rust is a strong choose when creating WebAssembly modules. This synergy between them opens new frontiers in web application development, allowing for faster, more responsible, and resource-efficient web experiences.

In this article, we will explore the basics of WebAssembly and Rust, providing a step-by-step guide to setting up and creating your first WebAssembly project with Rust.

## Getting Started with Rust and WebAssembly

### Rust Setup

Rust itself is a powerful, **BLAZINGLY FAST**, memory-safe, programming language, ideal for application where performance and reliability are critical. Due to these qualities, it's specially well-suited for WebAssembly.

Rustup, the Rust installer and version management tool, simplifies the installation process and makes it very easy to get started.

The Rust toolchain is composed of the following tools:

- `rustc` (Rust compiler)
- `cargo` (Rust package manager)
- `rustup` (Rust version manager)

#### Linux or macOS

To install Rust, open your terminal and execute:

```sh
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

**Optional**: Once installed, activate Rust in your current shell:

```sh
source "$HOME/.cargo/env"
```

Add Rust tools to your PATH in `.bashrc` or `.zshrc` to access it in future sessions:

```sh
export PATH="$HOME/.cargo/bin:$PATH"
```

#### Windows

**Prerequisites**: Install [Build Tools for Visual Studio 2022](https://visualstudio.microsoft.com/downloads/). These tools are necessary for compiling some of Rust's dependencies.

During the installation, you must check the following workloads when asked by the installer:

- Desktop Development with C++
- The Windows 10 or 11 SDK
- The English language pack component.

**Rust Installation**: Navigate to [Rust's official installation page](https://www.rust-lang.org/tools/install) and download the appropriate installer for your system.

### WebAssembly Setup

`wasm-pack` is a key tool that compiles Rust code into WebAssembly and prepares it for web deployment. To install it we use cargo, running the following command:

```sh
cargo install wasm-pack
```

### Your First WebAssembly Project

There are two main ways to initialize a WebAssembly project:

##### Using `wasm-pack`

`wasm-pack` simplifies the project setup and is ideal for beginners. We can create a new project with the following command:

```sh
wasm-pack new project_name
```

##### Using `cargo`

Cargo offers more control over the project setup, but the overall result for this simple application is roughly the same. First we create a new library project with the following command:

```sh
cargo new --lib project_name
```

Then modify `Cargo.toml` to include the necessary crate type for a WebAssembly library:

```toml
[lib]
crate-type = ["cdylib", "rlib"]
```

- `cdylib`: This tells Cargo that the project shall produce a "C dynamic library", which is a shared library that can be loaded in other languages.
- `rlib`: This tells Cargo that the project shall produce a "Rust library", which is a shared library that can be shared to other Rust crates.

Having this done, we now include the dependencies. For now, we are only going to use `wasm-bindgen`, which is a crate that handles the interface between JavaScript and Rust in the generated package.

In order to include this crate in our project, we use the following command:

```sh
cargo add wasm-bindgen
```

#### Writing our code

After having the dependencies in place and the project ready, we can start writing our code.

Before actually using `wasm-bindgen` to communicate our application to the browser we need to import the symbols from the crate to our scope. To do this we use the following line at the top of our file:

```rust
use wasm_bindgen::prelude::*;
```

Now we need to understand the `wasm_bindgen` crate. Basically we have two actions to worry about: importing and exporting.

In order to import functions from JavaScript to Rust, we need to use the following syntax:

```rust
#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
}
```

> Note that more complex cases may arise, in this scenario, the first place to search is the [wasm-bindgen documentation](https://rustwasm.github.io/docs/wasm-bindgen/).

In order to export functions from Rust to JavaScript, we need to use the following syntax:

```rust
#[wasm_bindgen(js_name = sayYouArePretty)]
pub fn say_you_are_pretty(name: &str) {
    alert(&format!("You are pretty, {}!", name));
}
```

> `js_name` is an optional attribute that allows you to specify the name of the exported function in JavaScript.

In the example above, we are exporting the `say_you_are_pretty` function as `sayYouArePretty` from Rust to JavaScript.

Our final code (under `src/lib.rs`) will look like this:

```rust
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
}

#[wasm_bindgen(js_name = sayYouArePretty)]
pub fn say_you_are_pretty(name: &str) {
    alert(&format!("You are pretty, {}!", name));
}
```

#### Compiling and running

Having our code ready, we can compile and run it. We can do this using the following command:

```sh
wasm-pack build --target web
```

After that, a `pkg` directory shall be created, as follows:

```plaintext
.
|-- Cargo.lock
|-- Cargo.toml
|-- pkg
    |-- README.md
    |-- package.json
    |-- project_name.d.ts
    |-- project_name.js
    |-- project_name_bg.wasm
    `-- project_name_bg.wasm.d.ts
|-- src
`-- target
```

This `pkg` directories contains the compiled JavaScript and the WASM file, we can copy or move them to our front-end directory. Virtually any web page will work, but for the sake of simplicity, we are going to simply include an index.html in our project root, as follows:

```plaintext
.
|-- Cargo.lock
|-- Cargo.toml
|-- index.html
|-- pkg
    |-- README.md
    |-- package.json
    |-- project_name.d.ts
    |-- project_name.js
    |-- project_name_bg.wasm
    `-- project_name_bg.wasm.d.ts
|-- src
`-- target
```

To run the function we exported, we call it from a `<script type="module">` tag in our index.html like this:

```js
<script type="module">
    import init, { sayYouArePretty } from './pkg/project_name.js';

    init().then(() => {
        sayYouArePretty("Kurisu");
    });
</script>
```

> Note that this `init` function is mandatory, as it will pre allocate memory and perform setup for our Wasm module.

Our `index.html` should look like this:

```html
<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<title>Hi mom</title>
	</head>
	<body>
		<script type="module">
			import init, { sayYouArePretty } from './pkg/project_name.js';

			init().then(() => {
				sayYouArePretty('Kurisu');
			});
		</script>
	</body>
</html>
```

Next we just run a web server and access it from the browser, for example, I'm using Python's HTTP server:

```sh
python3 -m http.server
```

Finally, you only need to open your browser to see the result

> Note that you can use a different web server, but be sure that it supports the mime type `application/wasm`

**Congratulations, you just ran your first WebAssembly project!**

## Challenges

Wasm with Rust is simply great. However, it comes with its own challenges. We can list some of them here:

**Access to Web APIs**:

As WebAssembly allows for code usually not runnable in the browser, it is designed to run sandboxed, because of this, no direct access to the Web APIs is available, resulting in a potential overhead when dealing with these operations;

**Debugging**:

While there do are [ways to debug WebAssembly generated by Rust](https://rustwasm.github.io/docs/book/game-of-life/debugging.html), Wasm itself is still relatively new and debugging is certainly one of the things that can be improved as for now much of it need to be done cross-language, coding in the language that compiles to Wasm and debugging in JavaScript.

**Types**:

While may not be a challenge for many users, it is still a change from the browser environment, running JavaScript, when one has to make use of a strongly typed language, like Rust, which can potentially increase the learning curve to enter the Wasm world.

## Conclusion

## References

- [Mozilla WebAssembly documentation](https://developer.mozilla.org/en-US/docs/WebAssembly)
- [WebAssembly design repository](https://github.com/WebAssembly/design)
- [WebAssembly website](https://webassembly.org/)
- [Rust and WebAssembly blog](https://rustwasm.github.io/)
