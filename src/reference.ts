// Pure, obsidian-free reference-building logic.
// Kept dependency-free so it can be unit-tested directly under node.

export type SpaceHandling = "none" | "backslash" | "quote";

export interface Obsidian2ClaudeSettings {
	/** Prepended to the vault-relative path. "" when Claude Code runs from the vault root. */
	pathPrefix: string;
	/** Used when a multi-line selection exists. Placeholders: {path} {start} {end} {basename} */
	templateRange: string;
	/** Used for a single line (cursor or one-line selection). Placeholders: {path} {line} {basename} */
	templateLine: string;
	/** Used for a whole-file reference. Placeholders: {path} {basename} */
	templateFile: string;
	/** How to keep spaces in paths from truncating Claude Code's @ picker. */
	spaceHandling: SpaceHandling;
	/** Show a Notice with the copied string. */
	showNotice: boolean;
}

export const DEFAULT_SETTINGS: Obsidian2ClaudeSettings = {
	pathPrefix: "",
	templateRange: "@{path}#{start}-{end}",
	templateLine: "@{path}#{line}",
	templateFile: "@{path}",
	spaceHandling: "none",
	showNotice: true,
};

export interface Pos {
	line: number;
	ch: number;
}

export interface BuildOpts {
	/** Whether the editor currently has a non-empty selection. */
	hasSelection?: boolean;
	/** Force a whole-file reference regardless of selection. */
	wholeFile?: boolean;
}

function basename(path: string): string {
	const i = path.lastIndexOf("/");
	return i === -1 ? path : path.slice(i + 1);
}

/** Apply the path prefix and space-handling policy to a vault-relative path. */
export function formatPath(vaultPath: string, settings: Obsidian2ClaudeSettings): string {
	let p = (settings.pathPrefix || "") + vaultPath;
	switch (settings.spaceHandling) {
		case "backslash":
			p = p.replace(/ /g, "\\ ");
			break;
		case "quote":
			if (p.includes(" ")) p = `"${p}"`;
			break;
	}
	return p;
}

function fill(template: string, vars: Record<string, string>): string {
	return template.replace(/\{(\w+)\}/g, (m, key) => (key in vars ? vars[key] : m));
}

/**
 * Build the clipboard string for the given file + selection.
 * Line numbers in `from`/`to` are 0-indexed (CodeMirror convention); output is 1-indexed.
 *
 * Behavior:
 *   - no selection (just a cursor) → whole-file reference (templateFile)
 *   - single-line selection        → line reference (templateLine)
 *   - multi-line selection         → range reference (templateRange)
 */
export function buildReference(
	vaultPath: string,
	from: Pos,
	to: Pos,
	settings: Obsidian2ClaudeSettings,
	opts: BuildOpts = {}
): string {
	const path = formatPath(vaultPath, settings);
	const base = basename(vaultPath);

	// Whole file when forced, or when nothing is selected.
	if (opts.wholeFile || !opts.hasSelection) {
		return fill(settings.templateFile, { path, basename: base });
	}

	const start = from.line + 1;

	// If the selection ends at column 0 of a line below the start, the trailing
	// line isn't really included — drop it (matches VS Code "Copy Path" behavior).
	let endLine = to.line;
	if (to.ch === 0 && to.line > from.line) {
		endLine = to.line - 1;
	}
	const end = endLine + 1;

	if (start === end) {
		return fill(settings.templateLine, { path, basename: base, line: String(start) });
	}

	return fill(settings.templateRange, {
		path,
		basename: base,
		start: String(start),
		end: String(end),
	});
}
