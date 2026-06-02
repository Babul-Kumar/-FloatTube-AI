import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { VideoProvider } from '../../providers/VideoProvider'
import { ControlsBar } from './ControlsBar'
import { SnapZones } from './SnapZones'
import { TranscriptPanel } from '../Transcript/TranscriptPanel'
import { NotesPanel } from '../NotesPanel/NotesPanel'
import { MiniWorkspace } from '../MiniWorkspace/MiniWorkspace'
import { savePosition, getPosition } from '../../storage/positionStore'

const SIZE_PRESETS = {
  small:  { width: 320, height: 180 },
  medium: { width: 480, height: 270 },
  large:  { width: 640, height: 360 },
}

type SnapCorner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | null

interface Props {
  provider: VideoProvider
  onClose: () => void
  initialSize?: 'small' | 'medium' | 'large'
}

export function FloatingPlayer({ provider, onClose, initialSize = 'medium' }: Props) {
  const { width: defaultWidth, height: defaultHeight } = SIZE_PRESETS[initialSize]
  const [pos, setPos] = useState({ x: window.innerWidth - defaultWidth - 24, y: window.innerHeight - defaultHeight - 24 })
  const [snapCorner, setSnapCorner] = useState<SnapCorner>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [opacity, setOpacity] = useState(1)
  const [currentSize, setCurrentSize] = useState(initialSize)
  const [activeTab, setActiveTab] = useState<'none' | 'notes' | 'transcript' | 'workspace'>('notes')
  
  // State for synced video state
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [playbackRate, setPlaybackRate] = useState(1)

  const constraintsRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<HTMLDivElement>(null)
  const siteId = provider.siteId

  const { width, height } = SIZE_PRESETS[currentSize]

  // Restore saved position
  useEffect(() => {
    getPosition(siteId).then(saved => {
      if (saved) {
        setPos({ x: saved.x, y: saved.y })
        setOpacity(saved.opacity || 1)
      }
    })
  }, [siteId])

  // Sync state with original video
  useEffect(() => {
    const originalVideo = provider.getVideo()
    if (!originalVideo) return

    const syncStates = () => {
      setIsPlaying(provider.isPlaying())
      setCurrentTime(originalVideo.currentTime)
      setDuration(originalVideo.duration || 0)
      setVolume(originalVideo.volume)
      setPlaybackRate(originalVideo.playbackRate)
    }

    syncStates()

    // Event listeners
    originalVideo.addEventListener('play', syncStates)
    originalVideo.addEventListener('pause', syncStates)
    originalVideo.addEventListener('timeupdate', syncStates)
    originalVideo.addEventListener('volumechange', syncStates)
    originalVideo.addEventListener('ratechange', syncStates)
    originalVideo.addEventListener('durationchange', syncStates)

    return () => {
      originalVideo.removeEventListener('play', syncStates)
      originalVideo.removeEventListener('pause', syncStates)
      originalVideo.removeEventListener('timeupdate', syncStates)
      originalVideo.removeEventListener('volumechange', syncStates)
      originalVideo.removeEventListener('ratechange', syncStates)
      originalVideo.removeEventListener('durationchange', syncStates)
    }
  }, [provider])

  const handleTogglePlay = () => {
    if (isPlaying) {
      provider.pause()
    } else {
      provider.play()
    }
  }

  const handleVolumeChange = (level: number) => {
    provider.setVolume(level)
  }

  const handlePlaybackRateChange = (rate: number) => {
    provider.setPlaybackRate(rate)
  }

  const handleSeek = (seconds: number) => {
    provider.seekTo(seconds)
  }

  const handleSkipBack = () => {
    provider.skipPrev()
  }

  const handleSkipForward = () => {
    provider.skipNext()
  }

  const handleToggleNativePiP = async () => {
    const video = provider.getVideo()
    if (!video) return
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
      } else {
        await video.requestPictureInPicture()
      }
    } catch (e) {
      console.error('[FloatTube] Failed to toggle native PiP:', e)
    }
  }

  const handleDragStart = () => {
    setIsDragging(true)
  }

  const handleDrag = (_event: any, info: any) => {
    const x = info.point.x
    const y = info.point.y

    // Determine closest corner
    const threshold = 150
    const w = window.innerWidth
    const h = window.innerHeight

    if (x < threshold && y < threshold) {
      setSnapCorner('top-left')
    } else if (x > w - threshold && y < threshold) {
      setSnapCorner('top-right')
    } else if (x < threshold && y > h - threshold) {
      setSnapCorner('bottom-left')
    } else if (x > w - threshold && y > h - threshold) {
      setSnapCorner('bottom-right')
    } else {
      setSnapCorner(null)
    }
  }

  const handleDragEnd = (_event: any, info: any) => {
    setIsDragging(false)
    let newX = pos.x + info.offset.x
    let newY = pos.y + info.offset.y

    const w = window.innerWidth
    const h = window.innerHeight
    const pad = 12

    const totalHeight = 48 + (activeTab !== 'none' ? panelHeight : 0)

    if (snapCorner === 'top-left') {
      newX = pad
      newY = pad
    } else if (snapCorner === 'top-right') {
      newX = w - width - pad
      newY = pad
    } else if (snapCorner === 'bottom-left') {
      newX = pad
      newY = h - totalHeight - pad
    } else if (snapCorner === 'bottom-right') {
      newX = w - width - pad
      newY = h - totalHeight - pad
    } else {
      newX = Math.max(pad, Math.min(w - width - pad, newX))
      newY = Math.max(pad, Math.min(h - totalHeight - pad, newY))
    }

    setPos({ x: newX, y: newY })
    setSnapCorner(null)

    // Save position
    savePosition(siteId, {
      x: newX,
      y: newY,
      width,
      height,
      opacity,
    })
  }

  const handleOpacityChange = (val: number) => {
    setOpacity(val)
    savePosition(siteId, {
      x: pos.x,
      y: pos.y,
      width,
      height,
      opacity: val,
    })
  }

  const panelHeight = 300

  return (
    <>
      {/* Constraints for dragging */}
      <div
        ref={constraintsRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 2147483646,
        }}
      />

      {/* Snap Guides */}
      <SnapZones activeCorner={isDragging ? snapCorner : null} />

      <motion.div
        ref={playerRef}
        drag
        dragMomentum={false}
        dragConstraints={constraintsRef}
        dragElastic={0.05}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        animate={{ x: pos.x, y: pos.y }}
        transition={isDragging ? { type: 'tween', duration: 0 } : { type: 'spring', stiffness: 300, damping: 25 }}
        style={{
          position: 'fixed',
          width: width,
          height: 48 + (activeTab !== 'none' ? panelHeight : 0),
          backgroundColor: '#0f0f13',
          borderRadius: 12,
          boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 2147483647,
          opacity: isDragging ? 0.7 : opacity,
          border: '1px solid rgba(255,255,255,0.08)',
          cursor: isDragging ? 'grabbing' : 'grab',
          pointerEvents: 'auto',
        }}
      >

        {/* Controls Bar */}
        <div style={{ cursor: 'default' }} onMouseDown={e => e.stopPropagation()}>
          <ControlsBar
            isPlaying={isPlaying}
            onTogglePlay={handleTogglePlay}
            currentTime={currentTime}
            duration={duration}
            volume={volume}
            onVolumeChange={handleVolumeChange}
            playbackRate={playbackRate}
            onPlaybackRateChange={handlePlaybackRateChange}
            onSeek={handleSeek}
            onSkipBack={handleSkipBack}
            onSkipForward={handleSkipForward}
            activeTab={activeTab}
            onToggleTab={setActiveTab}
            onClose={onClose}
            opacity={opacity}
            onOpacityChange={handleOpacityChange}
            onToggleNativePiP={handleToggleNativePiP}
          />
        </div>

        {/* Sliding Widget Panels */}
        <AnimatePresence>
          {activeTab !== 'none' && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: panelHeight }}
              exit={{ height: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              style={{
                width: '100%',
                overflow: 'hidden',
                backgroundColor: '#13131a',
                cursor: 'default',
              }}
              onMouseDown={e => e.stopPropagation()}
            >
              {activeTab === 'notes' && (
                <NotesPanel provider={provider} currentTime={currentTime} onSeek={handleSeek} />
              )}
              {activeTab === 'transcript' && (
                <TranscriptPanel provider={provider} currentTime={currentTime} onSeek={handleSeek} />
              )}
              {activeTab === 'workspace' && (
                <MiniWorkspace provider={provider} currentTime={currentTime} onSeek={handleSeek} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  )
}
