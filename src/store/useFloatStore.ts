import { create } from 'zustand'
import type { FloatSettings } from '../storage/settings'
import { DEFAULT_SETTINGS } from '../storage/settings'

interface FloatState {
  isFloating: boolean
  currentSite: string | null
  currentVideoId: string | null
  currentTitle: string
  settings: FloatSettings
  isPlaying: boolean
  volume: number
  playbackRate: number
  currentTime: number
  duration: number
  // Actions
  setFloating: (v: boolean) => void
  setCurrentSite: (site: string | null) => void
  setCurrentVideo: (id: string | null, title: string) => void
  updateSettings: (patch: Partial<FloatSettings>) => void
  setIsPlaying: (v: boolean) => void
  setVolume: (v: number) => void
  setPlaybackRate: (r: number) => void
  setCurrentTime: (t: number) => void
  setDuration: (d: number) => void
}

export const useFloatStore = create<FloatState>((set) => ({
  isFloating: false,
  currentSite: null,
  currentVideoId: null,
  currentTitle: '',
  settings: DEFAULT_SETTINGS,
  isPlaying: false,
  volume: 1,
  playbackRate: 1,
  currentTime: 0,
  duration: 0,

  setFloating: (v) => set({ isFloating: v }),
  setCurrentSite: (site) => set({ currentSite: site }),
  setCurrentVideo: (id, title) => set({ currentVideoId: id, currentTitle: title }),
  updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
  setIsPlaying: (v) => set({ isPlaying: v }),
  setVolume: (v) => set({ volume: v }),
  setPlaybackRate: (r) => set({ playbackRate: r }),
  setCurrentTime: (t) => set({ currentTime: t }),
  setDuration: (d) => set({ duration: d }),
}))
