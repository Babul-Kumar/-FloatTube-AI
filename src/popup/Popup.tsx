import React, { useState, useEffect } from 'react'
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

function isScriptableUrl(url?: string) {
  return !!url && (url.startsWith('http://') || url.startsWith('https://'))
}

export default function Popup() {
  const [settings, setSettings] = useState<FloatSettings | null>(null)
  const [detectedSite, setDetectedSite] = useState<string | null>(null)
  const [isFloating, setIsFloating] = useState(false)
  const [canAttemptFloat, setCanAttemptFloat] = useState(false)
  const [activeTab, setActiveTab] = useState<'main' | 'settings'>('main')

  useEffect(() => {
    getSettings().then(setSettings)

    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        if (tab?.id) {
          setCanAttemptFloat(isScriptableUrl(tab.url))

          // Pre-detect site based on URL
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
              return
            }
            if (response?.state?.siteId) setDetectedSite(response.state.siteId)
            if (typeof response?.state?.isFloating === 'boolean') setIsFloating(response.state.isFloating)
            setCanAttemptFloat(true)
          })
        }
      })
    } else {
      setDetectedSite('youtube')
      setCanAttemptFloat(true)
    }
  }, [])

  const updateSettings = async (patch: Partial<FloatSettings>) => {
    if (!settings) return
    const updated = { ...settings, ...patch }
    setSettings(updated)
    await saveSettings(patch)
  }

  const toggleFloat = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        const tabId = tab?.id
        if (!tabId) return

        chrome.tabs.sendMessage(tabId, { type: 'TOGGLE_FLOAT' }, async (response) => {
          if (chrome.runtime.lastError || !response) {
            // Dynamically inject using manifest entry
            try {
              const contentScript = chrome.runtime.getManifest().content_scripts?.[0]
              if (contentScript?.js?.length) {
                await chrome.scripting.executeScript({
                  target: { tabId },
                  files: contentScript.js,
                })
              }
              if (contentScript?.css?.length) {
                await chrome.scripting.insertCSS({
                  target: { tabId },
                  files: contentScript.css,
                })
              }

              setTimeout(() => {
                chrome.tabs.sendMessage(tabId, { type: 'TOGGLE_FLOAT' }, (injectedResponse) => {
                  if (chrome.runtime.lastError) {
                    setIsFloating(false)
                    return
                  }
                  setIsFloating(!!injectedResponse?.isFloating)
                  if (injectedResponse?.success) {
                    setDetectedSite((current) => current ?? 'generic')
                    setCanAttemptFloat(true)
                  }
                })
              }, 400)
            } catch (err) {
              console.warn('[FloatTube AI] Dynamic injection error:', err)
            }
          } else {
            setIsFloating(!!response.isFloating)
            if (response.success) {
              setCanAttemptFloat(true)
            }
          }
        })
      })
    } else {
      setIsFloating((f) => !f)
    }
  }

  const toggleSetting = async (key: keyof FloatSettings) => {
    if (!settings || typeof settings[key] !== 'boolean') return
    await updateSettings({ [key]: !settings[key] } as Partial<FloatSettings>)
  }

  const siteColor = detectedSite ? SITE_COLORS[detectedSite] ?? '#6366F1' : '#6366F1'
  const siteLabel = detectedSite
    ? SITE_LABELS[detectedSite] ?? 'Unknown Site'
    : canAttemptFloat
      ? 'Active Video Tab'
      : 'No video detected'

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #0f0f13 0%, #1a1a2e 100%)',
        minHeight: '100vh',
        fontFamily: "'Inter', sans-serif",
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
        width: 330,
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: 'absolute',
          top: -60,
          right: -60,
          width: 180,
          height: 180,
          background: `radial-gradient(circle, ${siteColor}33 0%, transparent 70%)`,
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />

      {/* Header */}
      <div
        style={{
          padding: '16px 16px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              background: `linear-gradient(135deg, ${siteColor}, #6366F1)`,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
            }}
          >
            ▶
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.3px' }}>FloatTube AI</div>
            <div style={{ fontSize: 10, color: '#888', marginTop: 1 }}>Smart Study Workspace</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <TabButton active={activeTab === 'main'} onClick={() => setActiveTab('main')}>
            Player
          </TabButton>
          <TabButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')}>
            ⚙️
          </TabButton>
        </div>
      </div>

      {/* Site badge */}
      <div style={{ padding: '10px 16px 0' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: `${siteColor}22`,
            border: `1px solid ${siteColor}44`,
            borderRadius: 20,
            padding: '4px 10px',
            fontSize: 11,
            color: siteColor,
            fontWeight: 600,
          }}
        >
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: siteColor }} />
          {siteLabel}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'main' ? (
          <motion.div
            key="main"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.15 }}
          >
            <MainPanel
              settings={settings}
              isFloating={isFloating}
              siteColor={siteColor}
              canAttemptFloat={canAttemptFloat}
              onToggleFloat={toggleFloat}
              onToggleSetting={toggleSetting}
            />
          </motion.div>
        ) : (
          <motion.div
            key="settings"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
          >
            <SettingsPanel
              settings={settings}
              onToggle={toggleSetting}
              onSaveApiKey={(key) => updateSettings({ geminiApiKey: key, aiEnabled: !!key })}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? 'rgba(99,102,241,0.2)' : 'transparent',
        border: `1px solid ${active ? '#6366F1' : 'rgba(255,255,255,0.1)'}`,
        color: active ? '#818CF8' : '#888',
        borderRadius: 8,
        padding: '4px 10px',
        cursor: 'pointer',
        fontSize: 12,
        fontWeight: 600,
        transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  )
}

function MainPanel({
  settings,
  isFloating,
  siteColor,
  canAttemptFloat,
  onToggleFloat,
  onToggleSetting,
}: {
  settings: FloatSettings | null
  isFloating: boolean
  siteColor: string
  canAttemptFloat: boolean
  onToggleFloat: () => void
  onToggleSetting: (key: keyof FloatSettings) => void
}) {
  return (
    <div style={{ padding: '14px 16px 16px' }}>
      {/* Big float button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onToggleFloat}
        disabled={!canAttemptFloat}
        style={{
          width: '100%',
          padding: '12px',
          background: isFloating
            ? 'linear-gradient(135deg, #ef4444, #dc2626)'
            : `linear-gradient(135deg, ${siteColor}, #6366F1)`,
          border: 'none',
          borderRadius: 12,
          cursor: canAttemptFloat ? 'pointer' : 'not-allowed',
          color: '#fff',
          fontSize: 14,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          boxShadow: `0 8px 24px ${isFloating ? '#ef444444' : siteColor + '44'}`,
          opacity: canAttemptFloat ? 1 : 0.5,
          transition: 'all 0.2s',
          marginBottom: 16,
        }}
      >
        {isFloating ? '⏹ Stop Floating' : '▶ Start Floating (PiP)'}
      </motion.button>

      {/* Quick Controls */}
      <div style={{ fontSize: 10, color: '#888', fontWeight: 700, marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' }}>
        Auto Float Triggers
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Toggle
          label="On Tab Switch"
          description="Float when you switch to other tabs"
          value={settings?.autoFloatOnTabChange ?? true}
          onChange={() => onToggleSetting('autoFloatOnTabChange')}
        />
        <Toggle
          label="On Window Blur"
          description="Float when switching to IDE or desktop"
          value={settings?.autoFloatOnWindowBlur ?? false}
          onChange={() => onToggleSetting('autoFloatOnWindowBlur')}
        />
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '14px 0' }} />

      <div style={{ fontSize: 10, color: '#888', fontWeight: 700, marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' }}>
        Study Workspace & AI
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Toggle
          label="Focus Mode"
          description="Hide comments, recommendations & sidebars"
          value={settings?.focusModeEnabled ?? false}
          onChange={() => onToggleSetting('focusModeEnabled')}
        />

        <div
          onClick={async () => {
            if (typeof chrome !== 'undefined' && chrome.sidePanel) {
              try {
                const window = await chrome.windows.getCurrent()
                if (window.id !== undefined) {
                  chrome.sidePanel.open({ windowId: window.id })
                }
              } catch (e) {
                console.error('[FloatTube] Failed to open side panel:', e)
              }
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            padding: '10px 12px',
            background: 'rgba(99, 102, 241, 0.12)',
            borderRadius: 10,
            border: '1px solid rgba(99, 102, 241, 0.3)',
            transition: 'background 0.15s',
            marginTop: 2,
          }}
        >
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#818CF8' }}>💼 Open Study Workspace</div>
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>Notes, Transcript, Flashcards & AI Quiz</div>
          </div>
          <div style={{ color: '#818CF8', fontSize: 14, fontWeight: 'bold' }}>➔</div>
        </div>
      </div>
    </div>
  )
}

function SettingsPanel({
  settings,
  onToggle,
  onSaveApiKey,
}: {
  settings: FloatSettings | null
  onToggle: (key: keyof FloatSettings) => void
  onSaveApiKey: (key: string) => void
}) {
  const [apiKey, setApiKey] = useState(settings?.geminiApiKey ?? '')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setApiKey(settings?.geminiApiKey ?? '')
  }, [settings?.geminiApiKey])

  const handleSave = () => {
    onSaveApiKey(apiKey)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const openFullSettings = () => {
    if (typeof chrome !== 'undefined' && chrome.runtime?.openOptionsPage) {
      chrome.runtime.openOptionsPage()
    } else {
      window.open('options.html', '_blank')
    }
  }

  return (
    <div style={{ padding: '14px 16px 16px' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#818CF8', marginBottom: 8, textTransform: 'uppercase' }}>
        Gemini AI Engine
      </div>
      <div
        style={{
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 10,
          padding: 12,
          marginBottom: 14,
        }}
      >
        <input
          type="password"
          placeholder="Paste Gemini API Key..."
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          style={{
            width: '100%',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 8,
            padding: '8px 10px',
            color: '#fff',
            fontSize: 12,
            outline: 'none',
            fontFamily: 'monospace',
          }}
        />
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          style={{
            marginTop: 8,
            width: '100%',
            background: saved ? '#22c55e' : 'rgba(99,102,241,0.3)',
            border: '1px solid rgba(99,102,241,0.5)',
            borderRadius: 8,
            padding: '7px',
            color: '#fff',
            fontSize: 12,
            cursor: 'pointer',
            fontWeight: 700,
          }}
        >
          {saved ? '✓ Saved Key!' : 'Save Key'}
        </motion.button>
        <div style={{ fontSize: 10, color: '#64748b', marginTop: 8 }}>
          Keys are stored locally. Get a free key at ai.google.dev
        </div>
      </div>

      <div style={{ fontSize: 10, color: '#888', fontWeight: 700, marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' }}>
        Preferences
      </div>
      <Toggle
        label="Remember Position"
        description="Restore floating window position per site"
        value={settings?.rememberPosition ?? true}
        onChange={() => onToggle('rememberPosition')}
      />

      <div style={{ marginTop: 12, textAlign: 'center' }}>
        <button
          onClick={openFullSettings}
          style={{
            background: 'none',
            border: 'none',
            color: '#818CF8',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          Open Advanced Settings →
        </button>
      </div>
    </div>
  )
}

function Toggle({
  label,
  description,
  value,
  onChange,
}: {
  label: string
  description: string
  value: boolean
  onChange: () => void
}) {
  return (
    <div
      onClick={onChange}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer',
        padding: '8px 10px',
        background: 'rgba(255,255,255,0.04)',
        borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.06)',
        transition: 'background 0.15s',
      }}
    >
      <div>
        <div style={{ fontSize: 12, fontWeight: 500, color: '#ddd' }}>{label}</div>
        <div style={{ fontSize: 10, color: '#64748b', marginTop: 1 }}>{description}</div>
      </div>
      <div
        style={{
          width: 36,
          height: 20,
          borderRadius: 10,
          background: value ? '#6366F1' : 'rgba(255,255,255,0.1)',
          position: 'relative',
          transition: 'background 0.2s',
          flexShrink: 0,
          marginLeft: 10,
        }}
      >
        <motion.div
          animate={{ x: value ? 18 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          style={{
            position: 'absolute',
            top: 2,
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
          }}
        />
      </div>
    </div>
  )
}
