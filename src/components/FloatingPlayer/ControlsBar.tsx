import React, { useState } from 'react'

interface Props {
  isPlaying: boolean
  onTogglePlay: () => void
  currentTime: number
  duration: number
  volume: number
  onVolumeChange: (val: number) => void
  playbackRate: number
  onPlaybackRateChange: (rate: number) => void
  onSeek: (seconds: number) => void
  onSkipBack: () => void
  onSkipForward: () => void
  activeTab: 'none' | 'notes' | 'transcript' | 'workspace'
  onToggleTab: (tab: 'none' | 'notes' | 'transcript' | 'workspace') => void
  onClose: () => void
  opacity: number
  onOpacityChange: (val: number) => void
  onToggleNativePiP: () => void
}

export function ControlsBar({
  isPlaying,
  onTogglePlay,
  currentTime,
  duration,
  volume,
  onVolumeChange,
  playbackRate,
  onPlaybackRateChange,
  onSeek,
  onSkipBack,
  onSkipForward,
  activeTab,
  onToggleTab,
  onClose,
  opacity,
  onOpacityChange,
  onToggleNativePiP,
}: Props) {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const [showOpacitySlider, setShowOpacitySlider] = useState(false)

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00'
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = Math.floor(secs % 60)
    const pad = (n: number) => (n < 10 ? '0' + n : n)
    if (h > 0) {
      return `${h}:${pad(m)}:${pad(s)}`
    }
    return `${m}:${pad(s)}`
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percent = Math.min(1, Math.max(0, clickX / rect.width))
    onSeek(percent * duration)
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'rgba(15, 15, 20, 0.95)',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '6px 12px 10px',
        color: '#fff',
        fontFamily: 'Inter, sans-serif',
        userSelect: 'none',
      }}
    >
      {/* Progress Bar */}
      <div
        onClick={handleProgressClick}
        style={{
          height: 4,
          width: '100%',
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          borderRadius: 2,
          position: 'relative',
          cursor: 'pointer',
          marginBottom: 8,
          transition: 'height 0.1s',
        }}
        onMouseEnter={e => (e.currentTarget.style.height = '6px')}
        onMouseLeave={e => (e.currentTarget.style.height = '4px')}
      >
        <div
          style={{
            height: '100%',
            width: `${progressPercent}%`,
            background: 'linear-gradient(90deg, #6366F1, #818CF8)',
            borderRadius: 2,
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        />
      </div>

      {/* Buttons and controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Left section: Playback controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Skip Back */}
          <button onClick={onSkipBack} style={btnStyle} title="Back 10s">
            ⏪
          </button>

          {/* Play/Pause */}
          <button onClick={onTogglePlay} style={{ ...btnStyle, fontSize: 16 }} title={isPlaying ? 'Pause' : 'Play'}>
            {isPlaying ? '⏸' : '▶'}
          </button>

          {/* Skip Forward */}
          <button onClick={onSkipForward} style={btnStyle} title="Forward 10s">
            ⏩
          </button>

          {/* Volume container */}
          <div
            onMouseEnter={() => setShowVolumeSlider(true)}
            onMouseLeave={() => setShowVolumeSlider(false)}
            style={{ display: 'flex', alignItems: 'center', position: 'relative' }}
          >
            <button
              onClick={() => onVolumeChange(volume === 0 ? 1 : 0)}
              style={btnStyle}
              title="Mute/Unmute"
            >
              {volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
            </button>
            {showVolumeSlider && (
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={e => onVolumeChange(parseFloat(e.target.value))}
                style={{
                  width: 60,
                  height: 4,
                  marginLeft: 6,
                  cursor: 'pointer',
                  accentColor: '#6366F1',
                }}
              />
            )}
          </div>

          {/* Time display */}
          <span style={{ fontSize: 11, color: '#aaa', marginLeft: 4 }}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        {/* Right section: Widgets / Opacity / Speed / Panels */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
          {/* Opacity selector */}
          <div
            onMouseEnter={() => setShowOpacitySlider(true)}
            onMouseLeave={() => setShowOpacitySlider(false)}
            style={{ display: 'flex', alignItems: 'center', position: 'relative' }}
          >
            <button style={btnStyle} title="Opacity">
              🌓
            </button>
            {showOpacitySlider && (
              <input
                type="range"
                min="0.3"
                max="1.0"
                step="0.05"
                value={opacity}
                onChange={e => onOpacityChange(parseFloat(e.target.value))}
                style={{
                  width: 50,
                  height: 4,
                  marginLeft: 4,
                  cursor: 'pointer',
                  accentColor: '#6366F1',
                }}
              />
            )}
          </div>

          {/* Speed selector */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              style={{ ...btnStyle, fontSize: 11, fontWeight: 600 }}
              title="Playback Speed"
            >
              {playbackRate}x
            </button>
            {showSpeedMenu && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '100%',
                  right: 0,
                  backgroundColor: '#1f1f2e',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 6,
                  padding: 4,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  zIndex: 2147483647,
                }}
              >
                {[0.5, 1, 1.25, 1.5, 2].map(rate => (
                  <button
                    key={rate}
                    onClick={() => {
                      onPlaybackRateChange(rate)
                      setShowSpeedMenu(false)
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: rate === playbackRate ? '#6366F1' : '#ccc',
                      fontSize: 10,
                      fontWeight: 500,
                      padding: '4px 8px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      borderRadius: 4,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ height: 12, width: 1, backgroundColor: 'rgba(255,255,255,0.15)' }} />

          {/* Notes Panel Toggle */}
          <button
            onClick={() => onToggleTab(activeTab === 'notes' ? 'none' : 'notes')}
            style={{ ...btnStyle, color: activeTab === 'notes' ? '#6366F1' : '#ccc' }}
            title="Notes"
          >
            📝
          </button>

          {/* Transcript Panel Toggle */}
          <button
            onClick={() => onToggleTab(activeTab === 'transcript' ? 'none' : 'transcript')}
            style={{ ...btnStyle, color: activeTab === 'transcript' ? '#6366F1' : '#ccc' }}
            title="Transcript"
          >
            📄
          </button>

          {/* Workspace Toggle */}
          <button
            onClick={() => onToggleTab(activeTab === 'workspace' ? 'none' : 'workspace')}
            style={{ ...btnStyle, color: activeTab === 'workspace' ? '#6366F1' : '#ccc' }}
            title="Workspace"
          >
            💼
          </button>

          {/* Native PiP Toggle */}
          <button onClick={onToggleNativePiP} style={btnStyle} title="Native PiP Mode">
            📺
          </button>

          {/* Close overlay */}
          <button onClick={onClose} style={{ ...btnStyle, color: '#ef4444' }} title="Close Player">
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#ccc',
  cursor: 'pointer',
  fontSize: 14,
  padding: '4px 6px',
  borderRadius: 4,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.15s',
}
