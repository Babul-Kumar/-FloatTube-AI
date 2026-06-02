// Settings schema and chrome.storage.sync API wrappers with localStorage fallback

export interface FloatSettings {
  // Auto float triggers
  autoFloatOnTabChange: boolean
  autoFloatOnWindowBlur: boolean
  autoFloatOnPageHide: boolean
  // Player defaults
  defaultSize: 'small' | 'medium' | 'large' | 'custom'
  defaultPosition: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  defaultOpacity: number  // 0.4–1.0
  rememberPosition: boolean
  // Appearance
  theme: 'dark' | 'light'
  // Productivity
  focusModeEnabled: boolean
  showTranscript: boolean
  // AI Pack
  aiEnabled: boolean
  geminiApiKey: string
}

export const DEFAULT_SETTINGS: FloatSettings = {
  autoFloatOnTabChange: true,
  autoFloatOnWindowBlur: false,
  autoFloatOnPageHide: true,
  defaultSize: 'medium',
  defaultPosition: 'bottom-right',
  defaultOpacity: 1.0,
  rememberPosition: true,
  theme: 'dark',
  focusModeEnabled: false,
  showTranscript: false,
  aiEnabled: false,
  geminiApiKey: '',
}

export async function getSettings(): Promise<FloatSettings> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.get('floatSettings', (result: Record<string, any>) => {
        resolve({ ...DEFAULT_SETTINGS, ...(result.floatSettings ?? {}) })
      })
    } else {
      try {
        const local = localStorage.getItem('floatSettings')
        resolve({ ...DEFAULT_SETTINGS, ...(local ? JSON.parse(local) : {}) })
      } catch (e) {
        resolve(DEFAULT_SETTINGS)
      }
    }
  })
}

export async function saveSettings(settings: Partial<FloatSettings>): Promise<void> {
  const current = await getSettings()
  const updated = { ...current, ...settings }
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.set({ floatSettings: updated }, resolve)
    } else {
      try {
        localStorage.setItem('floatSettings', JSON.stringify(updated))
      } catch (e) {
        // ignore storage errors
      }
      resolve()
    }
  })
}

export async function getSetting<K extends keyof FloatSettings>(key: K): Promise<FloatSettings[K]> {
  const all = await getSettings()
  return all[key]
}
