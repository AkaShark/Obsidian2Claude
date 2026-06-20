# Obsidian2Claude

[![CI](https://github.com/AkaShark/Obsidian2Claude/actions/workflows/ci.yml/badge.svg)](https://github.com/AkaShark/Obsidian2Claude/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/AkaShark/Obsidian2Claude?sort=semver)](https://github.com/AkaShark/Obsidian2Claude/releases/latest)
[![License: MIT](https://img.shields.io/github/license/AkaShark/Obsidian2Claude)](LICENSE)

A small Obsidian plugin: press a hotkey to copy the **current note + selected line range** as a [Claude Code](https://claude.com/claude-code) `@`-mention reference, e.g.

```
@技术/iOS/KVO 笔记.md#10-20
```

Paste it into a Claude Code session (the [claudian](https://github.com/) in-vault integration, or a terminal CLI launched from the vault) and Claude can read exactly that file and line range.

There's a VS Code and a JetBrains "Copy for Claude Code" — this fills the same gap for Obsidian.

## Installation

**Via BRAT (recommended — auto-updates):**
1. Install the [BRAT](https://github.com/TfTHacker/obsidian42-brat) community plugin.
2. BRAT → *Add Beta plugin* → enter this repo (`AkaShark/Obsidian2Claude`).
3. Enable **Obsidian2Claude** in Settings → Community plugins, then bind a hotkey under Settings → Hotkeys.

**Manual:**
1. Download `main.js`, `manifest.json`, `styles.css` from the latest [release](../../releases).
2. Drop them into `<your-vault>/.obsidian/plugins/obsidian2claude/`.
3. Reload Obsidian, enable the plugin, bind a hotkey.

## Commands (bind a hotkey to either)

| Command | Output |
|---|---|
| **Copy reference for Claude Code (lines if selected, else whole file)** | no selection → `@{path}` (whole file); single-line selection → `@{path}#{line}`; multi-line selection → `@{path}#{start}-{end}` |
| **Copy whole-file reference for Claude Code** | `@{path}` (always, even with a selection) |

Also available via the editor right-click menu.

## How the path is built

The reference uses the **vault-relative** path (`file.path`). Claude Code resolves `@` mentions against its **working directory**, so this is correct as long as Claude Code is launched from the vault root (which is what `claudian`/`realclaudian` and a vault-root terminal do).

If instead you launch Claude Code from the git repo root one level up, set **Path prefix** to `Obsidian/` in settings.

## Settings

- **Path prefix** — prepended to every path (default empty).
- **Range / Single-line / Whole-file templates** — fully customizable. Placeholders: `{path}`, `{start}`, `{end}`, `{line}`, `{basename}`.
- **Space handling** — `none` / backslash-escape / wrap-in-quotes, for filenames with spaces.
- **Show notice on copy** — confirmation toast.

### Note on the `#10-20` format

Claude Code's `@` file mention is officially documented for whole files; line-range suffixes like `#10-20` match what the VS Code/JetBrains tools emit and double as a hint to the model, but the CLI's file picker *may* treat `#10-20` as part of the filename and fail to resolve it. If that happens, change the **Range template** to:

```
@{path} (L{start}-{end})
```

The `@` then points at a clean path (always resolves) and the line numbers ride along as a hint.

## Develop

```bash
npm install
npm run build     # typecheck + bundle → main.js
npm test          # unit-tests the reference builder
npm run dev        # esbuild watch mode

# Copy build output straight into a local vault for testing.
# Point at your own vault — the path is never committed.
OBSIDIAN_PLUGIN_DIR="/path/to/Vault/.obsidian/plugins/obsidian2claude" npm run deploy
```

### Cutting a release (for BRAT / manual install)

The `release` workflow builds and attaches `main.js` + `manifest.json` + `styles.css` to a draft GitHub release when you push a tag matching the manifest version:

```bash
git tag 1.1.0 && git push origin 1.1.0   # then publish the draft release on GitHub
```

## License

MIT — see [LICENSE](LICENSE).
