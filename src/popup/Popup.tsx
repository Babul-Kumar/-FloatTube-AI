import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getSettings, saveSettings, type FloatSettings } from '../storage/settings'

const SITE_COLORS: Record<string, string> = {
  youtube: '#FF0000',
  udemy: '#A435F0',
  coursera: '#0056D2',
  skillshare: '#00FF84',
  netflix: '#E50914',
  primevideo: '#00A8E1',
  generic: '#6366F1',
}

const SITE_LABELS: Record<string, string> = {
  youtube: 'YouTube',
  udemy: 'Udemy',
  coursera: 'Coursera',
  skillshare: 'Skillshare',
  netflix: 'Netflix ⚠️',
  primevideo: 'Prime Video',
  generic: 'HTML5 Video',
}

const KBD: React.CSSProperties = {
  background: 'rgba(255,255,255,0.1)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 4, padding: '1px 5px',
  fontFamily: 'monospace', fontSize: 10, color: '#aaa',
}

export default function Popup() {
  const [settings, setSettings] = useState<FloatSettings | null>(null)
  const [detectedSite, setDetectedSite] = useState<string | null>(null)
  const [isFloating, setIsFloating] = useState(false)
  const [activeTab, setActiveTab] = useState<'main' | 'settings'>('main')

  useEffect(() => {
    getSettings().then(setSettings)
    // Ask content script for current site if running as extension
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        if (tab?.id) {
          // Pre-detect based on URL
          if (tab.url) {
            const url = tab.url
            let site: string | null = null
            if (url.includes('youtube.com') || url.includes('youtu.be')) site = 'youtube'
            else if (url.includes('udemy.com')) site = 'udemy'
            else if (url.includes('coursera.org')) site = 'coursera'
            else if (url.includes('skillshare.com')) site = 'skillshare'
            else if (url.includes('netflix.com')) site = 'netflix'
            else if (url.includes('primevideo.com') || url.includes('amazon.com')) site = 'primevideo'

            if (site) setDetectedSite(site)
          }

          chrome.tabs.sendMessage(tab.id, { type: 'GET_VIDEO_STATE' }, (response) => {
            if (chrome.runtime.lastError) {
              console.warn('[FloatTube] Content script not responding on initial load.')
              return
            }
            if (response?.state?.siteId) setDetectedSite(response.state.siteId)
          })
        }
      })
    } else {
      // Fallback detected site for standalone browser testing
      setDetectedSite('youtube')
    }
  }, [])

  const toggleFloat = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        const tabId = tab?.id
        if (tabId) {
          chrome.tabs.sendMessage(tabId, { type: 'TOGGLE_FLOAT' }, (response) => {
            if (chrome.runtime.lastError || !response) {
              // Content script not loaded yet (e.g. extension loaded after page load).
              // Inject it dynamically!
              console.log('[FloatTube] Dynamic injection initiated...')
              chrome.scripting.executeScript({
                target: { tabId: tabId },
                files: ['src/content/index.js']
              }, () => {
                if (chrome.runtime.lastError) {
                  console.error('[FloatTube] Failed to inject index.js:', chrome.runtime.lastError)
                  return
                }
                // Inject CSS
                chrome.scripting.insertCSS({
                  target: { tabId: tabId },
                  files: ['src/content/content.css']
                }, () => {
                  if (chrome.runtime.lastError) {
                    console.error('[FloatTube] Failed to inject content.css:', chrome.runtime.lastError)
                  }
                  // Message the newly injected script after a small delay
                  setTimeout(() => {
                    chrome.tabs.sendMessage(tabId, { type: 'TOGGLE_FLOAT' })
                    setIsFloating(true)
                  }, 400)
                })
              })
            } else {
              setIsFloating(f => !f)
            }
          })
        }
      })
    } else {
      setIsFloating(f => !f)
    }
  }

  const toggleSetting = async (key: keyof FloatSettings) => {
    if (!settings) return
    const newVal = !settings[key as keyof FloatSettings]
    const updated = { ...settings, [key]: newVal } as FloatSettings
    setSettings(updated)
    await saveSettings({ [key]: newVal })
  }

  const siteColor = detectedSite ? SITE_COLORS[detectedSite] ?? '#6366F1' : '#6366F1'
  const siteLabel = detectedSite ? SITE_LABELS[detectedSite] ?? 'Unknown' : 'No video detected'

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0f0f13 0%, #1a1a2e 100%)',
      minHeight: '100vh',
      fontFamily: "'Inter', sans-serif",
      color: '#fff',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', top: -60, right: -60,
        width: 180, height: 180,
        background: `radial-gradient(circle, ${siteColor}33 0%, transparent 70%)`,
        borderRadius: '50%',
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{
        padding: '20px 20px 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32,
            background: `linear-gradient(135deg, ${siteColor}, #6366F1)`,
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16,
          }}>▶</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.3px' }}>FloatTube AI</div>
            <div style={{ fontSize: 10, color: '#888', marginTop: 1 }}>Smart Floating Player</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <TabButton active={activeTab === 'main'} onClick={() => setActiveTab('main')}>Player</TabButton>
          <TabButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')}>⚙️</TabButton>
        </div>
      </div>

      {/* Site badge */}
      <div style={{ padding: '12px 20px 0' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: `${siteColor}22`,
          border: `1px solid ${siteColor}44`,
          borderRadius: 20, padding: '4px 10px',
          fontSize: 11, color: siteColor, fontWeight: 500,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: siteColor }} />
          {siteLabel}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'main' ? (
          <motion.div key="main"
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.15 }}
          >
            <MainPanel
              settings={settings}
              isFloating={isFloating}
              siteColor={siteColor}
              detectedSite={detectedSite}
              onToggleFloat={toggleFloat}
              onToggleSetting={toggleSetting}
            />
          </motion.div>
        ) : (
          <motion.div key="settings"
            initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}
          >
            <SettingsPanel settings={settings} onToggle={toggleSetting} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function TabButton({ active, onClick, children }: { active: boolean, onClick: () => void, children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      background: active ? 'rgba(99,102,241,0.2)' : 'transparent',
      border: `1px solid ${active ? '#6366F1' : 'rgba(255,255,255,0.1)'}`,
      color: active ? '#6366F1' : '#888',
      borderRadius: 8, padding: '4px 10px', cursor: 'pointer',
      fontSize: 12, fontWeight: 500, transition: 'all 0.15s',
    }}>{children}</button>
  )
}

function MainPanel({ settings, isFloating, siteColor, detectedSite, onToggleFloat, onToggleSetting }: {
  settings: FloatSettings | null
  isFloating: boolean
  siteColor: string
  detectedSite: string | null
  onToggleFloat: () => void
  onToggleSetting: (key: keyof FloatSettings) => void
}) {
  return (
    <div style={{ padding: '16px 20px 20px' }}>
      {/* Big float button */}
      <motion.button
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
        onClick={onToggleFloat}
        disabled={!detectedSite}
        style={{
          width: '100%', padding: '14px',
          background: isFloating
            ? 'linear-gradient(135deg, #ef4444, #dc2626)'
            : `linear-gradient(135deg, ${siteColor}, #6366F1)`,
          border: 'none', borderRadius: 14, cursor: detectedSite ? 'pointer' : 'not-allowed',
          color: '#fff', fontSize: 15, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          boxShadow: `0 8px 24px ${isFloating ? '#ef444444' : siteColor + '44'}`,
          opacity: detectedSite ? 1 : 0.5,
          transition: 'all 0.2s',
          marginBottom: 20,
        }}
      >
        {isFloating ? '⏹ Stop Floating' : '▶ Start Floating'}
      </motion.button>

      {/* Quick Controls */}
      <div style={{ fontSize: 11, color: '#666', fontWeight: 600, marginBottom: 10, letterSpacing: 0.5 }}>AUTO FLOAT TRIGGERS</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Toggle
          label="On Tab Switch"
          description="Float when you switch tabs"
          value={settings?.autoFloatOnTabChange ?? true}
          onChange={() => onToggleSetting('autoFloatOnTabChange')}
        />
        <Toggle
          label="On Window Blur"
          description="Float when Chrome loses focus"
          value={settings?.autoFloatOnWindowBlur ?? false}
          onChange={() => onToggleSetting('autoFloatOnWindowBlur')}
        />
        <Toggle
          label="On Page Leave"
          description="Float when navigating away"
          value={settings?.autoFloatOnPageHide ?? true}
          onChange={() => onToggleSetting('autoFloatOnPageHide')}
        />
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '16px 0' }} />

      <div style={{ fontSize: 11, color: '#666', fontWeight: 600, marginBottom: 10, letterSpacing: 0.5 }}>PRODUCTIVITY</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Toggle
          label="Focus Mode"
          description="Hide sidebar, comments & recommendations"
          value={settings?.focusModeEnabled ?? false}
          onChange={() => onToggleSetting('focusModeEnabled')}
        />
        <Toggle
          label="AI Features"
          description="Requires Gemini API key in settings"
          value={settings?.aiEnabled ?? false}
          onChange={() => onToggleSetting('aiEnabled')}
        />
      </div>

      {/* Keyboard shortcuts hint */}
      <div style={{
        marginTop: 16,
        background: 'rgba(255,255,255,0.04)',
        borderRadius: 10, padding: '10px 12px',
        fontSize: 11, color: '#555',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ color: '#777', fontWeight: 600 }}>KEYBOARD SHORTCUTS</div>
          <button
            onClick={() => {
              if (typeof chrome !== 'undefined' && chrome.tabs) {
                chrome.tabs.create({ url: 'chrome://extensions/shortcuts' })
              }
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#6366F1',
              fontSize: 10,
              cursor: 'pointer',
              padding: 0,
              fontWeight: 500,
              textDecoration: 'underline',
            }}
          >
            Configure
          </button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}><span>Toggle Float</span><kbd style={KBD}>Alt+P</kbd></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}><span>Play/Pause</span><kbd style={KBD}>Alt+Space</kbd></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Skip ±10s</span><kbd style={KBD}>Alt+←/→</kbd></div>
      </div>
    </div>
  )
}

function SettingsPanel({ settings, onToggle }: {
  settings: FloatSettings | null
  onToggle: (key: keyof FloatSettings) => void
}) {
  const [apiKey, setApiKey] = useState(settings?.geminiApiKey ?? '')
  const [saved, setSaved] = useState(false)

  const saveApiKey = async () => {
    await saveSettings({ geminiApiKey: apiKey })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ padding: '16px 20px 20px' }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Default Position</div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map(pos => (
          <div key={pos} style={{
            flex: 1, padding: '6px 2px',
            background: settings?.defaultPosition === pos ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.06)',
            border: `1px solid ${settings?.defaultPosition === pos ? '#6366F1' : 'transparent'}`,
            borderRadius: 8, cursor: 'pointer',
            fontSize: 9, textAlign: 'center', color: '#aaa',
          }}>{pos.replace('-', '\n')}</div>
        ))}
      </div>

      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>AI Pack – Gemini API Key</div>
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        borderRadius: 10, padding: 12, marginBottom: 16,
      }}>
        <input
          type="password"
          placeholder="Paste your Gemini API key..."
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          style={{
            width: '100%', background: 'transparent',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 8, padding: '8px 10px',
            color: '#fff', fontSize: 12, outline: 'none',
          }}
        />
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={saveApiKey}
          style={{
            marginTop: 8, width: '100%',
            background: saved ? '#22c55e' : 'rgba(99,102,241,0.3)',
            border: '1px solid rgba(99,102,241,0.5)',
            borderRadius: 8, padding: '7px',
            color: '#fff', fontSize: 12, cursor: 'pointer', fontWeight: 600,
          }}
        >{saved ? '✓ Saved!' : 'Save API Key'}</motion.button>
        <div style={{ fontSize: 10, color: '#555', marginTop: 8 }}>
          Key stored locally. Get free key at ai.google.dev
        </div>
      </div>

      <div style={{ fontSize: 11, color: '#666', fontWeight: 600, marginBottom: 8, letterSpacing: 0.5 }}>ADVANCED</div>
      <Toggle
        label="Remember Position"
        description="Restore window position per site"
        value={settings?.rememberPosition ?? true}
        onChange={() => onToggle('rememberPosition')}
      />
      <div style={{ marginTop: 8 }}>
        <Toggle
          label="Show Transcript"
          description="Show live captions below video"
          value={settings?.showTranscript ?? false}
          onChange={() => onToggle('showTranscript')}
        />
      </div>
    </div>
  )
}

function Toggle({ label, description, value, onChange }: {
  label: string, description: string, value: boolean, onChange: () => void
}) {
  return (
    <div
      onClick={onChange}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        cursor: 'pointer', padding: '8px 10px',
        background: 'rgba(255,255,255,0.04)', borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.06)',
        transition: 'background 0.15s',
      }}
    >
      <div>
        <div style={{ fontSize: 12, fontWeight: 500, color: '#ddd' }}>{label}</div>
        <div style={{ fontSize: 10, color: '#555', marginTop: 1 }}>{description}</div>
      </div>
      <div style={{
        width: 36, height: 20, borderRadius: 10,
        background: value ? '#6366F1' : 'rgba(255,255,255,0.1)',
        position: 'relative', transition: 'background 0.2s', flexShrink: 0, marginLeft: 10,
      }}>
        <motion.div
          animate={{ x: value ? 18 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          style={{
            position: 'absolute', top: 2, width: 16, height: 16,
            borderRadius: '50%', background: '#fff',
            boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
          }}
        />
      </div>
    </div>
  )
}
