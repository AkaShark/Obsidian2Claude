import esbuild from "esbuild";
import process from "process";
import builtins from "builtin-modules";

const banner = `/* Obsidian2Claude — bundled with esbuild. Source: src/main.ts */`;

const mode = process.argv[2] ?? "dev";

// Build the pure logic as ESM so node --test can import it directly.
if (mode === "test") {
	await esbuild.build({
		entryPoints: ["src/reference.ts"],
		bundle: true,
		format: "esm",
		target: "es2020",
		outfile: "test/_reference.mjs",
		logLevel: "warning",
	});
	process.exit(0);
}

const prod = mode === "production";

const ctx = await esbuild.context({
	entryPoints: ["src/main.ts"],
	bundle: true,
	external: [
		"obsidian",
		"electron",
		"@codemirror/autocomplete",
		"@codemirror/collab",
		"@codemirror/commands",
		"@codemirror/language",
		"@codemirror/lint",
		"@codemirror/search",
		"@codemirror/state",
		"@codemirror/view",
		"@lezer/common",
		"@lezer/highlight",
		"@lezer/lr",
		...builtins,
	],
	format: "cjs",
	target: "es2018",
	logLevel: "info",
	sourcemap: prod ? false : "inline",
	treeShaking: true,
	outfile: "main.js",
	banner: { js: banner },
});

if (prod) {
	await ctx.rebuild();
	await ctx.dispose();
	process.exit(0);
} else {
	await ctx.watch();
	console.log("watching for changes…");
}
