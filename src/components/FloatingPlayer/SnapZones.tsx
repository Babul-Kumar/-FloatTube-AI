import React from 'react'

interface Props {
  activeCorner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | null
}

export function SnapZones({ activeCorner }: Props) {
  if (!activeCorner) return null

  const styleMap: Record<string, React.CSSProperties> = {
    'top-left':     { top: 12, left: 12 },
    'top-right':    { top: 12, right: 12 },
    'bottom-left':  { bottom: 12, left: 12 },
    'bottom-right': { bottom: 12, right: 12 },
  }

  return (
    <div
      style={{
        position: 'fixed',
        ...styleMap[activeCorner],
        width: 120,
        height: 80,
        border: '2px dashed rgba(99, 102, 241, 0.6)',
        borderRadius: 12,
        backgroundColor: 'rgba(99, 102, 241, 0.15)',
        pointerEvents: 'none',
        zIndex: 2147483646,
        transition: 'all 0.2s ease-in-out',
      }}
    />
  )
}
