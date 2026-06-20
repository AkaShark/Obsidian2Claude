import {
	App,
	Editor,
	MarkdownFileInfo,
	MarkdownView,
	Menu,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";
import {
	buildReference,
	DEFAULT_SETTINGS,
	Obsidian2ClaudeSettings,
	SpaceHandling,
} from "./reference";

type EditorCtx = MarkdownView | MarkdownFileInfo;

export default class Obsidian2ClaudePlugin extends Plugin {
	settings!: Obsidian2ClaudeSettings;

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: "copy-reference",
			name: "Copy reference for Claude Code (lines if selected, else whole file)",
			editorCallback: (editor, ctx) => this.copySelectionReference(editor, ctx),
		});

		this.addCommand({
			id: "copy-file-reference",
			name: "Copy whole-file reference for Claude Code",
			editorCallback: (_editor, ctx) => this.copyFileReference(ctx),
		});

		this.registerEvent(
			this.app.workspace.on("editor-menu", (menu: Menu, editor: Editor, ctx: EditorCtx) => {
				menu.addItem((item) =>
					item
						.setTitle("Copy reference for Claude Code")
						.setIcon("clipboard-copy")
						.onClick(() => this.copySelectionReference(editor, ctx))
				);
			})
		);

		this.addSettingTab(new Obsidian2ClaudeSettingTab(this.app, this));
	}

	private resolvePath(ctx: EditorCtx): string | null {
		const file = ctx?.file ?? this.app.workspace.getActiveFile();
		return file ? file.path : null;
	}

	private copySelectionReference(editor: Editor, ctx: EditorCtx) {
		const vaultPath = this.resolvePath(ctx);
		if (!vaultPath) {
			new Notice("Obsidian2Claude: no active file");
			return;
		}
		const from = editor.getCursor("from");
		const to = editor.getCursor("to");
		const hasSelection = editor.somethingSelected();
		const ref = buildReference(vaultPath, from, to, this.settings, { hasSelection });
		void this.copy(ref);
	}

	private copyFileReference(ctx: EditorCtx) {
		const vaultPath = this.resolvePath(ctx);
		if (!vaultPath) {
			new Notice("Obsidian2Claude: no active file");
			return;
		}
		const origin = { line: 0, ch: 0 };
		const ref = buildReference(vaultPath, origin, origin, this.settings, { wholeFile: true });
		void this.copy(ref);
	}

	private async copy(ref: string) {
		try {
			await navigator.clipboard.writeText(ref);
		} catch (e) {
			new Notice("Obsidian2Claude: clipboard write failed");
			console.error("Obsidian2Claude clipboard error", e);
			return;
		}
		if (this.settings.showNotice) new Notice("Copied: " + ref);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class Obsidian2ClaudeSettingTab extends PluginSettingTab {
	plugin: Obsidian2ClaudePlugin;

	constructor(app: App, plugin: Obsidian2ClaudePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Path prefix")
			.setDesc(
				'Prepended to the vault-relative path. Leave empty when Claude Code runs from the vault root (claudian, or a terminal opened in the vault). Use "Obsidian/" if it runs from the git repo root one level up.'
			)
			.addText((t) =>
				t
					.setPlaceholder("(empty)")
					.setValue(this.plugin.settings.pathPrefix)
					.onChange(async (v) => {
						this.plugin.settings.pathPrefix = v;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Range template")
			.setDesc("Multi-line selection. Placeholders: {path} {start} {end} {basename}")
			.addText((t) =>
				t
					.setValue(this.plugin.settings.templateRange)
					.onChange(async (v) => {
						this.plugin.settings.templateRange = v;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Single-line template")
			.setDesc("Cursor or one-line selection. Placeholders: {path} {line} {basename}")
			.addText((t) =>
				t
					.setValue(this.plugin.settings.templateLine)
					.onChange(async (v) => {
						this.plugin.settings.templateLine = v;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Whole-file template")
			.setDesc("Whole-file command / no line info. Placeholders: {path} {basename}")
			.addText((t) =>
				t
					.setValue(this.plugin.settings.templateFile)
					.onChange(async (v) => {
						this.plugin.settings.templateFile = v;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Space handling")
			.setDesc(
				"How to keep spaces in paths from truncating Claude Code's @ picker. Try 'backslash' or 'quote' if a reference to a file with spaces doesn't resolve."
			)
			.addDropdown((d) =>
				d
					.addOption("none", "Leave as-is")
					.addOption("backslash", "Backslash-escape spaces")
					.addOption("quote", "Wrap path in quotes")
					.setValue(this.plugin.settings.spaceHandling)
					.onChange(async (v) => {
						this.plugin.settings.spaceHandling = v as SpaceHandling;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Show notice on copy")
			.setDesc("Pop a confirmation showing exactly what was copied.")
			.addToggle((t) =>
				t.setValue(this.plugin.settings.showNotice).onChange(async (v) => {
					this.plugin.settings.showNotice = v;
					await this.plugin.saveSettings();
				})
			);

		const tip = containerEl.createEl("p", { cls: "setting-item-description" });
		tip.setText(
			"Tip: if Claude Code can't resolve @path#10-20, switch the range template to “@{path} (L{start}-{end})” — the @ picker then matches the file cleanly and the line numbers stay as a hint."
		);
	}
}
