// Per-site position + size memory using chrome.storage.local with localStorage fallback

export interface WindowPosition {
  x: number
  y: number
  width: number
  height: number
  opacity: number
}

const DEFAULT_POSITIONS: Record<string, WindowPosition> = {
  default: { x: window.innerWidth - 400, y: window.innerHeight - 270, width: 360, height: 203, opacity: 1 },
}

export async function getPosition(siteId: string): Promise<WindowPosition> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(`pos_${siteId}`, (result: Record<string, any>) => {
        resolve(result[`pos_${siteId}`] ?? DEFAULT_POSITIONS.default)
      })
    } else {
      try {
        const local = localStorage.getItem(`pos_${siteId}`)
        resolve(local ? JSON.parse(local) : DEFAULT_POSITIONS.default)
      } catch (e) {
        resolve(DEFAULT_POSITIONS.default)
      }
    }
  })
}

export async function savePosition(siteId: string, pos: WindowPosition): Promise<void> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ [`pos_${siteId}`]: pos }, resolve)
    } else {
      try {
        localStorage.setItem(`pos_${siteId}`, JSON.stringify(pos))
      } catch (e) {
        // ignore storage errors
      }
      resolve()
    }
  })
}
