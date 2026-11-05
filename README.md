# Poplar editor extensions

Editor support for [Poplar](https://github.com/poplar-mc/poplar), a language that compiles to Minecraft datapacks.

| Folder | What it is |
|---|---|
| `gram/` | The Gram (Zed) extension: syntax highlighting, brackets, indents, an outline, and the Poplar language server |
| `tree-sitter-poplar/` | The Tree-sitter grammar |
| `textmate/` | A TextMate grammar, used by the Poplar website |

## Install the Gram extension

Gram has no extension store, so you install the extension from a local copy of this repo.

1. [Install Poplar](https://github.com/poplar-mc/poplar#install), so that `poplar` is on your `PATH`.
2. Install [rustup](https://rustup.rs). Gram uses it to compile the extension.
3. Clone this repo:

   ```sh
   git clone https://github.com/poplar-mc/poplar-editor-extensions.git
   ```

4. In Gram, open Extensions > Install Dev Extension and choose the `gram/` folder.

To update, run `git pull` and install it again. Gram shows the version you have.

## Change the grammar

Edit `tree-sitter-poplar/grammar.js`, then run `tree-sitter generate` in that folder. The generated parser in `src/` is committed, because editors compile it and don't generate it.

Every Poplar file must parse. From `tree-sitter-poplar/`, with the Poplar repo next to this one:

```sh
tree-sitter parse -p . --quiet ../../poplar/tests/e2e/*/src/*.poplar ../../poplar/examples/*/src/*.poplar
```

`gram/extension.toml` fetches the grammar from this repo at the commit in `rev`, so a grammar change takes two commits:

1. Commit and push the grammar.
2. Set `rev` to that commit, set `version` in `gram/extension.toml` and `gram/Cargo.toml`, then commit and push.

The highlight, bracket, indent and outline queries are in `gram/languages/poplar/`. `gram/src/lib.rs` starts `poplar lsp` from the `PATH`.

## License

[MIT](LICENSE)
