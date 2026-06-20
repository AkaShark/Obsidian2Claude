// Copies the built plugin artifacts into the Obsidian vault's plugin folder.
// Run after `npm run build`.
import { mkdirSync, copyFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

// Target plugin folder inside your vault. Provide it via the OBSIDIAN_PLUGIN_DIR
// env var or as the first CLI arg — never hardcode a personal path in the repo.
const VAULT_PLUGIN_DIR = process.argv[2] || process.env.OBSIDIAN_PLUGIN_DIR;

if (!VAULT_PLUGIN_DIR) {
	console.error(
		"No target folder. Point at your vault's plugin folder, e.g.\n" +
			'  OBSIDIAN_PLUGIN_DIR="/path/to/Vault/.obsidian/plugins/obsidian2claude" npm run deploy\n' +
			"  npm run deploy -- /path/to/Vault/.obsidian/plugins/obsidian2claude"
	);
	process.exit(1);
}

const files = ["main.js", "manifest.json", "styles.css"];

mkdirSync(VAULT_PLUGIN_DIR, { recursive: true });

for (const f of files) {
	const src = join(projectRoot, f);
	if (!existsSync(src)) {
		console.error(`! missing ${f} — run "npm run build" first`);
		process.exit(1);
	}
	copyFileSync(src, join(VAULT_PLUGIN_DIR, f));
	console.log(`✓ ${f}  →  ${VAULT_PLUGIN_DIR}`);
}

console.log(
	'\nDone. In Obsidian: Settings → Community plugins → enable "Obsidian2Claude",' +
		"\nthen Settings → Hotkeys → search “Obsidian2Claude” to bind a key."
);
