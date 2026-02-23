import { useState } from 'react'
import { LAYOUT_PRESETS } from '../office/layout/layoutPresets.js'
import type { OfficeLayout } from '../office/types.js'

interface LayoutPresetsPanelProps {
    onLoadPreset: (layout: OfficeLayout) => void
}

const panelStyle: React.CSSProperties = {
    position: 'absolute',
    top: 60,
    right: 10,
    zIndex: 'var(--pixel-controls-z)',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    background: '#1e1e2e',
    border: '2px solid #4a4a6a',
    borderRadius: 0,
    padding: '6px',
    boxShadow: 'var(--pixel-shadow)',
    width: 150
}

const btnBase: React.CSSProperties = {
    padding: '4px 8px',
    fontSize: '20px',
    color: 'var(--pixel-text)',
    background: 'var(--pixel-btn-bg)',
    border: '2px solid transparent',
    borderRadius: 0,
    cursor: 'pointer',
    textAlign: 'left'
}

export function LayoutPresetsPanel({ onLoadPreset }: LayoutPresetsPanelProps) {
    const [hovered, setHovered] = useState<string | null>(null)
    const [confirmKey, setConfirmKey] = useState<string | null>(null)

    return (
        <div style={panelStyle}>
            <div style={{ fontSize: '20px', color: '#999', marginBottom: 4, paddingBottom: 4, borderBottom: '1px solid #4a4a6a' }}>
                Layout Presets
            </div>
            {LAYOUT_PRESETS.map((preset) => {
                const isHovered = hovered === preset.id
                const isConfirming = confirmKey === preset.id

                return (
                    <button
                        key={preset.id}
                        onClick={() => {
                            if (isConfirming) {
                                onLoadPreset(preset.create())
                                setConfirmKey(null)
                            } else {
                                setConfirmKey(preset.id)
                                setTimeout(() => setConfirmKey(null), 3000)
                            }
                        }}
                        onMouseEnter={() => setHovered(preset.id)}
                        onMouseLeave={() => setHovered(null)}
                        style={{
                            ...btnBase,
                            background: isConfirming
                                ? 'var(--pixel-danger-bg)'
                                : (isHovered ? 'var(--pixel-btn-hover-bg)' : btnBase.background),
                            color: isConfirming ? '#fff' : btnBase.color,
                        }}
                    >
                        {isConfirming ? 'Confirm?' : preset.name}
                    </button>
                )
            })}
        </div>
    )
}
