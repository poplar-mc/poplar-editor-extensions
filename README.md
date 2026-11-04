# Poplar for Gram

The Gram (Zed) extension for [Poplar](https://github.com/poplar-mc/poplar), the language that compiles to Minecraft datapacks. It gives syntax highlighting, brackets, indents, an outline, and the Poplar language server (errors, hover, go to definition and completion).

## Install

1. Install Poplar, so that `poplar` is on your PATH. On Linux and macOS:

   ```sh
   curl -fsSL https://raw.githubusercontent.com/poplar-mc/poplar/main/install.sh | sh
   ```

   On Windows and for other options, see [Install](https://github.com/poplar-mc/poplar#install).

2. In Gram, open Extensions > Install From URL and enter `https://github.com/poplar-mc/poplar-gram-extension`. Gram compiles the extension and the grammar to WebAssembly, so it needs [rustup](https://rustup.rs).

## Development

- The grammar comes from the Poplar repo (`editors/tree-sitter-poplar`), at the commit `rev` in `extension.toml`. When the grammar changes, set `rev` to the new Poplar commit.
- `languages/poplar/` has the queries: highlights, brackets, indents and outline.
- `src/lib.rs` starts `poplar lsp` from the PATH.
- To test local changes, use Install Dev Extension with this folder.

## License

[MIT](LICENSE)
