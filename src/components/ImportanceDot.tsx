import React from 'react'
import { getImportanceColor, getImportanceLabel, ImportanceDotProps } from '@/lib/utils/importance-colors'

export function ImportanceDot({ importance, size = 12, showTooltip = false }: ImportanceDotProps) {
  const dotStyle: React.CSSProperties = {
    display: 'inline-block',
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '50%',
    backgroundColor: getImportanceColor(importance),
    marginRight: '6px',
    flexShrink: 0,
    border: '1px solid rgba(0, 0, 0, 0.1)',
    cursor: showTooltip ? 'help' : 'default'
  }

  const dot = <span style={dotStyle} />

  if (showTooltip) {
    return (
      <span
        style={{ position: 'relative', display: 'inline-block' }}
        title={`重要度: ${importance || 0} (${getImportanceLabel(importance)})`}
      >
        {dot}
      </span>
    )
  }

  return dot
}