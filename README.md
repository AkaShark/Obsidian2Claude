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

## Demo

<!-- Record a short clip (select lines → hotkey → paste into Claude Code),
     save it as docs/demo.gif, then uncomment the next line. -->
<!-- ![Obsidian2Claude demo](docs/demo.gif) -->

> _Demo GIF coming soon — drop a screen recording at `docs/demo.gif`._

## Installation

**Via BRAT (recommended — auto-updates):**
1. Install the [BRAT](https://github.com/TfTHacker/obsidian42-brat) community plugin.
2. BRAT → *Add Beta plugin* → enter this repo (`AkaShark/Obsidian2Claude`).
3. Enable **Obsidian2Claude** in Settings → Community plugins, then bind a hotkey under Settings → Hotkeys.

**Manual:**
1. Download `main.js`, `manifest.json`, `styles.css` from the latest [release](../../releases).
2. Drop them into `<your-vault>/.obsidian/plugins/obsidian2claude/`.
3. Reload Obsidian, enable the plugin, bind a hotkey.

## Usage

1. Open a note and **select the lines** you want to reference — or just place the cursor anywhere for a whole-file reference.
2. Press your hotkey (e.g. `⌘⇧C`), or right-click → **Copy reference for Claude Code**.
3. A toast confirms what was copied; paste it into your Claude Code prompt.

**Example** — selecting lines 10–20 of `技术/iOS/KVO 笔记.md` copies:

```
@技术/iOS/KVO 笔记.md#10-20
```

Then in Claude Code:

```text
> 帮我解释 @技术/iOS/KVO 笔记.md#10-20 这段
```

Claude reads that file (focused on lines 10–20) and answers. With nothing selected you'd instead get `@技术/iOS/KVO 笔记.md` — the whole file.

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
