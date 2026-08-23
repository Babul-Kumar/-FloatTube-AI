import type { VideoProvider } from '../providers/VideoProvider'

export class PiPManager {
  private provider: VideoProvider | null = null
  private currentVideo: HTMLVideoElement | null = null
  private onEnterCallbacks: Array<() => void> = []
  private onLeaveCallbacks: Array<() => void> = []

  setProvider(provider: VideoProvider) {
    this.provider = provider
  }

  async requestPiP(): Promise<boolean> {
    const video = this.provider?.getVideo()
    if (!video) return false

    // Check if PiP is supported
    if (!document.pictureInPictureEnabled) {
      console.warn('[FloatTube] PiP not supported in this browser')
      return false
    }

    // Attach listeners only once per video element
    if (this.currentVideo !== video) {
      if (this.currentVideo) {
        this.currentVideo.removeEventListener('enterpictureinpicture', this.handleEnter)
        this.currentVideo.removeEventListener('leavepictureinpicture', this.handleLeave)
      }
      this.currentVideo = video
      video.addEventListener('enterpictureinpicture', this.handleEnter)
      video.addEventListener('leavepictureinpicture', this.handleLeave)
    }

    try {
      await video.requestPictureInPicture()
      return true
    } catch (err) {
      console.error('[FloatTube] PiP request failed:', err)
      return false
    }
  }

  async exitPiP(): Promise<void> {
    if (!document.pictureInPictureElement) return
    try {
      await document.exitPictureInPicture()
    } catch (err) {
      console.error('[FloatTube] PiP exit failed:', err)
    }
  }

  isPiPActive(): boolean {
    return !!document.pictureInPictureElement
  }

  async togglePiP(): Promise<boolean> {
    if (this.isPiPActive()) {
      await this.exitPiP()
      return false
    } else {
      return await this.requestPiP()
    }
  }

  onEnter(cb: () => void) {
    this.onEnterCallbacks.push(cb)
  }
  onLeave(cb: () => void) {
    this.onLeaveCallbacks.push(cb)
  }

  private handleEnter = () => this.onEnterCallbacks.forEach((cb) => cb())
  private handleLeave = () => this.onLeaveCallbacks.forEach((cb) => cb())
}

export const pipManager = new PiPManager()
