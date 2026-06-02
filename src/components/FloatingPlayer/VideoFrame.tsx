import { useEffect, useRef, useState } from 'react'
import type { VideoProvider } from '../../providers/VideoProvider'

interface Props {
  provider: VideoProvider
  isPlaying: boolean
  currentTime: number
}

export function VideoFrame({ provider, isPlaying, currentTime }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [streamError, setStreamError] = useState(false)
  const [isSyncing, setIsSyncing] = useState(true)

  useEffect(() => {
    const originalVideo = provider.getVideo()
    const mirrorVideo = videoRef.current
    if (!originalVideo || !mirrorVideo) return

    let stream: MediaStream | null = null

    try {
      // Capture stream from original video
      const captureStreamFn = (originalVideo as any).captureStream || (originalVideo as any).mozCaptureStream
      if (captureStreamFn) {
        stream = captureStreamFn.call(originalVideo)
        mirrorVideo.srcObject = stream
        mirrorVideo.play().catch(e => {
          console.warn('[FloatTube] Mirror play failed:', e)
        })
        setStreamError(false)
      } else {
        throw new Error('captureStream not supported')
      }
    } catch (e) {
      console.warn('[FloatTube] Stream capture failed. Falling back to control mode.', e)
      setStreamError(true)
    }

    // Keep the mirror video time synced
    const syncTime = () => {
      if (mirrorVideo && !mirrorVideo.srcObject) {
        return
      }
      if (mirrorVideo && Math.abs(mirrorVideo.currentTime - originalVideo.currentTime) > 0.5) {
        mirrorVideo.currentTime = originalVideo.currentTime
      }
    }

    originalVideo.addEventListener('timeupdate', syncTime)
    setIsSyncing(false)

    return () => {
      originalVideo.removeEventListener('timeupdate', syncTime)
      if (mirrorVideo) {
        mirrorVideo.srcObject = null
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [provider])

  // Play/Pause sync
  useEffect(() => {
    const mirrorVideo = videoRef.current
    if (!mirrorVideo || !mirrorVideo.srcObject) return

    if (isPlaying) {
      mirrorVideo.play().catch(() => {})
    } else {
      mirrorVideo.pause()
    }
  }, [isPlaying])

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#000',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {streamError ? (
        <div
          style={{
            color: '#aaa',
            fontSize: 13,
            textAlign: 'center',
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ fontSize: 24 }}>📺</div>
          <div>Floating Controller Mode</div>
          <div style={{ fontSize: 10, color: '#666' }}>
            Video content is mirrored on the main tab.
          </div>
        </div>
      ) : (
        <video
          ref={videoRef}
          muted
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
      )}
    </div>
  )
}
