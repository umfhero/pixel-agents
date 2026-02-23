# Pixel Agents: VS Code Native Migration Plan

## ⚠️ MASSIVE DISCLAIMER: 100% TOS-SAFE ARCHITECTURE ⚠️
This document outlines the migration of the Pixel Agents extension from being a Claude Code JSONL log watcher to a **native VS Code activity visualizer**. 

### The Golden Rule of Safety
**To remain 100% safe and compliant with the Terms of Service for GitHub Copilot, Anthropic, and other AI services, this extension MUST NEVER interact directly with their APIs, network requests, or proprietary local logs.**

Instead, this extension functions purely as a **VS Code Editor Visualizer**. It listens *only* to public, standard VS Code editor events (like text being typed quickly, terminal commands being run, or panel changes) and animates the characters based on those generic workspace activities. 

Because we only monitor standard VS Code public events, we are completely decoupled from any specific AI provider's systems. This means:
- No API keys or authentication are required.
- No network monitoring or interception.
- No risk of violating rate limits, botting rules, or Terms of Service.
- Complete safety for your GitHub/Microsoft accounts.

As long as the extension adheres to consuming standard `vscode.*` API events, it remains a purely local UI enhancement.

---

## 🎯 The Goal
Convert Pixel Agents to show character animations based on general VS Code activity (simulating "AI" activity when large chunks of code or terminal commands are executed), entirely removing the dependency on Claude Code's local JSONL logs.

## 📝 Step-by-Step Implementation Plan

### Phase 1: Strip the Old Architecture
1. **Remove Claude Code integrations:** Look for logic in `src/agentManager.ts` that relies heavily on Claude Code's specific behaviors or terminal spawning.
2. **Remove File Watchers:** 
   - Delete `src/fileWatcher.ts` 
   - Delete `src/transcriptParser.ts`
   - Remove `fs.watch` and polling dependencies from `PixelAgentsViewProvider.ts`.
3. **Clean up state types:** Update `src/types.ts` to remove JSONL-specific state tracking (like `fileOffset`, `jsonlFile`, `permissionSent`) and replace it with VS Code activity states.

### Phase 2: Implement VS Code Native Event Listeners
Instead of parsing text logs, we will wire up official VS Code event listeners in `src/extension.ts` or a new `activityMonitor.ts` file to drive our agent states.

1. **The "Typing" Heuristic (`vscode.workspace.onDidChangeTextDocument`)**
   - Detect when text is inserted into the active editor.
   - *AI Detection Heuristic:* If a large chunk of text is inserted rapidly (faster than human typing speed), we can assume an AI or snippet is generating it.
   - *Action:* Trigger the agent's **typing/coding** animation.
   - *Action:* Start an "idle timer" that resets to the **idle** animation after a few seconds of no text changes.

2. **The "Thinking/Chatting" Heuristic (`vscode.window.tabGroups.onDidChangeTabs` or `activeTextEditor`)**
   - Detect when the user opens or focuses on the GitHub Copilot Chat panel (or an AI chat tab).
   - *Action:* Trigger a **thinking/reading** animation to represent the agent processing the question.

3. **The "Terminal" Heuristic (`vscode.window.onDidWriteTerminalData`)**
   - Listen to data being written or executed in the terminal.
   - *Action:* When rapid output or command executions occur, trigger the **typing/terminal** animation.

### Phase 3: Update the Agent State Management
1. **Rethink "Spawned Agents":** Currently, the extension spawns an agent per Claude terminal. We should adjust this conceptually:
   - Provide standard "Workers" (e.g., one agent handles code changes, another handles terminal).
   - OR, just spawn visual agents based on the number of active editors/chat sessions open.
2. **Map Events to Webview Messages:** Create a robust event bus that takes the VS Code events (from Phase 2) and sends `{ type: 'setAgentState', state: 'typing' }` messages to the Webview.

### Phase 4: Seamless Theme & IDE Integration
1. **Webview CSS Theme Variables:**
   - Modify the React/Webview code (`webview-ui/`) to inherit VS Code's native theme colors.
   - Use CSS variables like `var(--vscode-editor-background)`, `var(--vscode-sideBarTitle-foreground)`, and `var(--vscode-button-background)`.
2. **Dynamic Theming:**
   - Update the Pixel Art canvas logic to optionally tint or theme the "Office Room" walls and floors based on the current VS Code Light/Dark theme setting. 

### Phase 5: Polish & Testing
1. **Heuristic Tuning:** Since we are relying on timeouts (e.g., "when does an agent stop typing?"), we will need to test and tune these timers so the animations feel snappy and responsive.
2. **Performance Check:** Ensure `onDidChangeTextDocument` is debounced properly so we don't spam the Webview with messages on every single keystroke.

---

### 🛡️ Final Safety Checklist for Development
- [ ] No `fetch` or `http` requests made to any AI endpoints.
- [ ] No reading of hidden VS Code internal telemetry or log directories (`AppData/.../Code/logs`).
- [ ] Uses only documented `vscode.*` namespace APIs.
- [ ] Does not require GitHub authentication scopes beyond what is standard for the IDE.
