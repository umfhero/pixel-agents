import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import type { AgentState } from './types.js';
import {
	createAgent,
	removeAgent,
	restoreAgents,
	persistAgents,
	sendExistingAgents,
	sendLayout,
} from './agentManager.js';
import { loadFurnitureAssets, sendAssetsToWebview, loadFloorTiles, sendFloorTilesToWebview, loadWallTiles, sendWallTilesToWebview, loadCharacterSprites, sendCharacterSpritesToWebview, loadDefaultLayout } from './assetLoader.js';
import { WORKSPACE_KEY_AGENT_SEATS, GLOBAL_KEY_SOUND_ENABLED } from './constants.js';
import { writeLayoutToFile, readLayoutFromFile, watchLayoutFile } from './layoutPersistence.js';
import type { LayoutWatcher } from './layoutPersistence.js';
import { startActivityMonitoring } from './activityMonitor.js';

export class PixelAgentsViewProvider implements vscode.WebviewViewProvider {
	nextAgentId = { current: 1 };
	agents = new Map<number, AgentState>();
	webviewView: vscode.WebviewView | undefined;

	activeAgentId = { current: null as number | null };

	// Bundled default layout (loaded from assets/default-layout.json)
	defaultLayout: Record<string, unknown> | null = null;

	// Cross-window layout sync
	layoutWatcher: LayoutWatcher | null = null;

	constructor(private readonly context: vscode.ExtensionContext) { }

	private get extensionUri(): vscode.Uri {
		return this.context.extensionUri;
	}

	private get webview(): vscode.Webview | undefined {
		return this.webviewView?.webview;
	}

	private persistAgents = (): void => {
		persistAgents(this.agents, this.context);
	};

	resolveWebviewView(webviewView: vscode.WebviewView) {
		this.webviewView = webviewView;
		webviewView.webview.options = { enableScripts: true };
		webviewView.webview.html = getWebviewContent(webviewView.webview, this.extensionUri);

		// Start native VS Code activity tracking
		startActivityMonitoring(this.agents, this.activeAgentId, () => this.webview);

		webviewView.webview.onDidReceiveMessage(async (message) => {
			if (message.type === 'addAgent') { // renamed from openClaude
				createAgent(
					this.nextAgentId,
					this.agents,
					this.activeAgentId,
					this.webview,
					this.persistAgents
				);
			} else if (message.type === 'focusAgent') {
				// We no longer have terminal refs attached to agents. Focus could mean focusing VS Code editor in phase 2.
			} else if (message.type === 'closeAgent') {
				removeAgent(
					message.id, this.agents,
					this.persistAgents,
				);
				this.webview?.postMessage({ type: 'agentClosed', id: message.id });
			} else if (message.type === 'saveAgentSeats') {
				console.log(`[Pixel Agents] saveAgentSeats:`, JSON.stringify(message.seats));
				this.context.workspaceState.update(WORKSPACE_KEY_AGENT_SEATS, message.seats);
			} else if (message.type === 'saveLayout') {
				this.layoutWatcher?.markOwnWrite();
				writeLayoutToFile(message.layout as Record<string, unknown>);
			} else if (message.type === 'setSoundEnabled') {
				this.context.globalState.update(GLOBAL_KEY_SOUND_ENABLED, message.enabled);
			} else if (message.type === 'webviewReady') {
				restoreAgents(
					this.context,
					this.nextAgentId,
					this.agents,
					this.activeAgentId,
					this.webview, this.persistAgents,
				);

				const soundEnabled = this.context.globalState.get<boolean>(GLOBAL_KEY_SOUND_ENABLED, true);
				this.webview?.postMessage({ type: 'settingsLoaded', soundEnabled });

				const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
				console.log('[Extension] workspaceRoot:', workspaceRoot);

				(async () => {
					try {
						console.log('[Extension] Loading furniture assets...');
						const extensionPath = this.extensionUri.fsPath;
						console.log('[Extension] extensionPath:', extensionPath);

						const bundledAssetsDir = path.join(extensionPath, 'dist', 'assets');
						let assetsRoot: string | null = null;
						if (fs.existsSync(bundledAssetsDir)) {
							assetsRoot = path.join(extensionPath, 'dist');
						} else if (workspaceRoot) {
							assetsRoot = workspaceRoot;
						}

						if (assetsRoot) {
							this.defaultLayout = loadDefaultLayout(assetsRoot);
							const charSprites = await loadCharacterSprites(assetsRoot);
							if (charSprites && this.webview) sendCharacterSpritesToWebview(this.webview, charSprites);

							const floorTiles = await loadFloorTiles(assetsRoot);
							if (floorTiles && this.webview) sendFloorTilesToWebview(this.webview, floorTiles);

							const wallTiles = await loadWallTiles(assetsRoot);
							if (wallTiles && this.webview) sendWallTilesToWebview(this.webview, wallTiles);

							const assets = await loadFurnitureAssets(assetsRoot);
							if (assets && this.webview) sendAssetsToWebview(this.webview, assets);
						}
					} catch (err) {
						console.error('[Extension] ❌ Error loading assets:', err);
					}

					if (this.webview) {
						sendLayout(this.context, this.webview, this.defaultLayout);
						this.startLayoutWatcher();
					}
				})();

				sendExistingAgents(this.agents, this.context, this.webview);
			} else if (message.type === 'openSessionsFolder') {
				// Phase out or replace with something else later.
			} else if (message.type === 'exportLayout') {
				const layout = readLayoutFromFile();
				if (!layout) {
					vscode.window.showWarningMessage('Pixel Agents: No saved layout to export.');
					return;
				}
				const uri = await vscode.window.showSaveDialog({
					filters: { 'JSON Files': ['json'] },
					defaultUri: vscode.Uri.file(path.join(os.homedir(), 'pixel-agents-layout.json')),
				});
				if (uri) {
					fs.writeFileSync(uri.fsPath, JSON.stringify(layout, null, 2), 'utf-8');
					vscode.window.showInformationMessage('Pixel Agents: Layout exported successfully.');
				}
			} else if (message.type === 'importLayout') {
				const uris = await vscode.window.showOpenDialog({
					filters: { 'JSON Files': ['json'] },
					canSelectMany: false,
				});
				if (!uris || uris.length === 0) return;
				try {
					const raw = fs.readFileSync(uris[0].fsPath, 'utf-8');
					const imported = JSON.parse(raw) as Record<string, unknown>;
					if (imported.version !== 1 || !Array.isArray(imported.tiles)) {
						vscode.window.showErrorMessage('Pixel Agents: Invalid layout file.');
						return;
					}
					this.layoutWatcher?.markOwnWrite();
					writeLayoutToFile(imported);
					this.webview?.postMessage({ type: 'layoutLoaded', layout: imported });
					vscode.window.showInformationMessage('Pixel Agents: Layout imported successfully.');
				} catch {
					vscode.window.showErrorMessage('Pixel Agents: Failed to read or parse layout file.');
				}
			} else if (message.type === 'resetToDefaultLayout') {
				if (this.defaultLayout) {
					this.layoutWatcher?.markOwnWrite();
					writeLayoutToFile(this.defaultLayout);
					this.webview?.postMessage({ type: 'layoutLoaded', layout: this.defaultLayout });
					vscode.window.showInformationMessage('Pixel Agents: Layout reset to default.');
				} else {
					vscode.window.showErrorMessage('Pixel Agents: Default layout not available.');
				}
			}
		});
	}

	/** Export current saved layout to webview-ui/public/assets/default-layout.json (dev utility) */
	exportDefaultLayout(): void {
		const layout = readLayoutFromFile();
		if (!layout) {
			vscode.window.showWarningMessage('Pixel Agents: No saved layout found.');
			return;
		}
		const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
		if (!workspaceRoot) {
			vscode.window.showErrorMessage('Pixel Agents: No workspace folder found.');
			return;
		}
		const targetPath = path.join(workspaceRoot, 'webview-ui', 'public', 'assets', 'default-layout.json');
		const json = JSON.stringify(layout, null, 2);
		fs.writeFileSync(targetPath, json, 'utf-8');
		vscode.window.showInformationMessage(`Pixel Agents: Default layout exported to ${targetPath}`);
	}

	private startLayoutWatcher(): void {
		if (this.layoutWatcher) return;
		this.layoutWatcher = watchLayoutFile((layout) => {
			console.log('[Pixel Agents] External layout change — pushing to webview');
			this.webview?.postMessage({ type: 'layoutLoaded', layout });
		});
	}

	dispose() {
		this.layoutWatcher?.dispose();
		this.layoutWatcher = null;
		for (const id of [...this.agents.keys()]) {
			removeAgent(
				id, this.agents,
				this.persistAgents,
			);
		}
	}
}

export function getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri): string {
	const distPath = vscode.Uri.joinPath(extensionUri, 'dist', 'webview');
	const indexPath = vscode.Uri.joinPath(distPath, 'index.html').fsPath;

	let html = fs.readFileSync(indexPath, 'utf-8');

	html = html.replace(/(href|src)="\.\/([^"]+)"/g, (_match, attr, filePath) => {
		const fileUri = vscode.Uri.joinPath(distPath, filePath);
		const webviewUri = webview.asWebviewUri(fileUri);
		return `${attr}="${webviewUri}"`;
	});

	return html;
}
