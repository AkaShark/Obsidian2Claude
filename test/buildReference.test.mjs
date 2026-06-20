import { test } from "node:test";
import assert from "node:assert/strict";
import { buildReference, DEFAULT_SETTINGS } from "./_reference.mjs";

const S = DEFAULT_SETTINGS;

test("multi-line selection → range", () => {
	const ref = buildReference("技术/iOS/KVO 笔记.md", { line: 9, ch: 0 }, { line: 19, ch: 5 }, S, {
		hasSelection: true,
	});
	assert.equal(ref, "@技术/iOS/KVO 笔记.md#10-20");
});

test("single-line selection → line template", () => {
	const ref = buildReference("a/b.md", { line: 4, ch: 2 }, { line: 4, ch: 8 }, S, {
		hasSelection: true,
	});
	assert.equal(ref, "@a/b.md#5");
});

test("no selection (cursor) → whole file", () => {
	// cursor parked on line 5, nothing selected → whole-file reference
	const ref = buildReference("a/b.md", { line: 4, ch: 2 }, { line: 4, ch: 2 }, S, {
		hasSelection: false,
	});
	assert.equal(ref, "@a/b.md");
});

test("whole file", () => {
	const ref = buildReference("a/b.md", { line: 0, ch: 0 }, { line: 0, ch: 0 }, S, {
		wholeFile: true,
	});
	assert.equal(ref, "@a/b.md");
});

test("path prefix applied", () => {
	const ref = buildReference("a/b.md", { line: 0, ch: 0 }, { line: 2, ch: 1 }, { ...S, pathPrefix: "Obsidian/" }, {
		hasSelection: true,
	});
	assert.equal(ref, "@Obsidian/a/b.md#1-3");
});

test("selection ending at column 0 drops the trailing line", () => {
	const ref = buildReference("a/b.md", { line: 9, ch: 0 }, { line: 20, ch: 0 }, S, {
		hasSelection: true,
	});
	assert.equal(ref, "@a/b.md#10-20");
});

test("space handling: backslash", () => {
	// single-line selection so the #line path is exercised alongside escaping
	const ref = buildReference("a b/c d.md", { line: 0, ch: 0 }, { line: 0, ch: 4 }, { ...S, spaceHandling: "backslash" }, {
		hasSelection: true,
	});
	assert.equal(ref, "@a\\ b/c\\ d.md#1");
});

test("space handling: quote", () => {
	const ref = buildReference("a b.md", { line: 0, ch: 0 }, { line: 0, ch: 0 }, { ...S, spaceHandling: "quote" }, {
		wholeFile: true,
	});
	assert.equal(ref, '@"a b.md"');
});

test("alternate (L..) range template", () => {
	const ref = buildReference("a/b.md", { line: 9, ch: 0 }, { line: 19, ch: 5 }, { ...S, templateRange: "@{path} (L{start}-{end})" }, {
		hasSelection: true,
	});
	assert.equal(ref, "@a/b.md (L10-20)");
});

test("{basename} placeholder", () => {
	const ref = buildReference("技术/iOS/KVO 笔记.md", { line: 0, ch: 0 }, { line: 0, ch: 0 }, { ...S, templateFile: "{basename}" }, {
		wholeFile: true,
	});
	assert.equal(ref, "KVO 笔记.md");
});
