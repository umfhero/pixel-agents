import * as vscode from 'vscode';
import type { AgentState, AgentActivityState } from './types.js';
import { TEXT_IDLE_DELAY_MS } from './constants.js';

let idleTimer: ReturnType<typeof setTimeout> | null = null;

export function startActivityMonitoring(
    agents: Map<number, AgentState>,
    activeAgentIdRef: { current: number | null },
    getWebview: () => vscode.Webview | undefined
) {
    // 1. Listen for text document changes (Typing)
    vscode.workspace.onDidChangeTextDocument((e) => {
        if (e.contentChanges.length === 0) return;

        // We treat any text insertion as "typing"
        const isInsert = e.contentChanges.some((c) => c.text.length > 0);
        if (isInsert) {
            setAgentState('typing', agents, activeAgentIdRef, getWebview);
            resetIdleTimer(agents, activeAgentIdRef, getWebview);
        }
    });

    // 2. Listen for Editor/Tab changes (Thinking/Reading)
    vscode.window.tabGroups.onDidChangeTabs(() => {
        setAgentState('thinking', agents, activeAgentIdRef, getWebview);
        resetIdleTimer(agents, activeAgentIdRef, getWebview);
    });

    // 3. Listen for Terminal Focus (Terminal)
    vscode.window.onDidChangeActiveTerminal((t) => {
        if (t) {
            setAgentState('terminal', agents, activeAgentIdRef, getWebview);
            resetIdleTimer(agents, activeAgentIdRef, getWebview);
        }
    });

    // 4. Listen to selection changes (Thinking/Reading code)
    vscode.window.onDidChangeTextEditorSelection((e) => {
        if (e.selections.length > 0) {
            const textLen = e.selections.reduce((acc, s) => acc + (s.end.line - s.start.line), 0);
            if (textLen > 10) {
                setAgentState('thinking', agents, activeAgentIdRef, getWebview);
                resetIdleTimer(agents, activeAgentIdRef, getWebview);
            }
        }
    });

    // 5. Active editor change
    vscode.window.onDidChangeActiveTextEditor(() => {
        setAgentState('thinking', agents, activeAgentIdRef, getWebview);
        resetIdleTimer(agents, activeAgentIdRef, getWebview);
    });
}

function setAgentState(
    state: AgentActivityState,
    agents: Map<number, AgentState>,
    activeAgentIdRef: { current: number | null },
    getWebview: () => vscode.Webview | undefined
) {
    // Broadcast to all agents so they all look busy together!
    for (const [id, agent] of agents.entries()) {
        updateSingleAgent(id, agent, state, getWebview());
    }
}

function updateSingleAgent(id: number, agent: AgentState, state: AgentActivityState, webview: vscode.Webview | undefined) {
    if (agent.activityState !== state) {
        agent.activityState = state;
        agent.lastActivityMs = Date.now();
        webview?.postMessage({
            type: 'agentStatus',
            id: id,
            status: state
        });
    }
}

function resetIdleTimer(
    agents: Map<number, AgentState>,
    activeAgentIdRef: { current: number | null },
    getWebview: () => vscode.Webview | undefined
) {
    if (idleTimer) clearTimeout(idleTimer);

    idleTimer = setTimeout(() => {
        setAgentState('idle', agents, activeAgentIdRef, getWebview);
    }, TEXT_IDLE_DELAY_MS);
}
