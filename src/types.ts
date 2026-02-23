import type * as vscode from 'vscode';

export type AgentActivityState = 'idle' | 'typing' | 'thinking' | 'terminal';

export interface AgentState {
	id: number;
	activityState: AgentActivityState;
	lastActivityMs: number;
}

export interface PersistedAgent {
	id: number;
}
