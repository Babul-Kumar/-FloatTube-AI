import type { VideoProvider } from '../providers/VideoProvider'

export class PiPManager {
  private provider: VideoProvider | null = null
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

    // Netflix has EME restrictions
    if (video.classList.contains('nfp-video') || window.location.hostname.includes('netflix')) {
      console.warn('[FloatTube] Netflix PiP may be restricted')
    }

    try {
      const pipWindow = await video.requestPictureInPicture()
      pipWindow.addEventListener('resize', this.handleResize)
      video.addEventListener('enterpictureinpicture', this.handleEnter)
      video.addEventListener('leavepictureinpicture', this.handleLeave)
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

  onEnter(cb: () => void) { this.onEnterCallbacks.push(cb) }
  onLeave(cb: () => void) { this.onLeaveCallbacks.push(cb) }

  private handleEnter = () => this.onEnterCallbacks.forEach(cb => cb())
  private handleLeave = () => this.onLeaveCallbacks.forEach(cb => cb())
  private handleResize = () => {}
}

export const pipManager = new PiPManager()
