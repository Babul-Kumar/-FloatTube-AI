import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getSettings, saveSettings, type FloatSettings } from '../storage/settings'
import { clearNotes, clearBookmarks, clearAICache } from '../storage/db'
import { testGeminiApiKey } from '../services/ai/gemini'

const SECTION_LABEL: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: '#818CF8',
  letterSpacing: 1,
  marginBottom: 10,
  marginTop: 24,
  textTransform: 'uppercase',
}

export default function OptionsPage() {
  const [settings, setSettings] = useState<FloatSettings | null>(null)
  const [saved, setSaved] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [storageStatus, setStorageStatus] = useState<string | null>(null)

  useEffect(() => {
    getSettings().then((s) => {
      setSettings(s)
      setApiKey(s.geminiApiKey || '')
    })
  }, [])

  const update = async (patch: Partial<FloatSettings>) => {
    if (!settings) return
    const updated = { ...settings, ...patch }
    setSettings(updated)
    await saveSettings(patch)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const handleSaveApiKey = async () => {
    await update({ geminiApiKey: apiKey.trim(), aiEnabled: !!apiKey.trim() })
    setTestResult(null)
  }

  const handleTestKey = async () => {
    if (!apiKey.trim()) {
      setTestResult({ success: false, message: 'Please enter an API key first.' })
      return
    }
    setTestingConnection(true)
    setTestResult(null)
    try {
      const res = await testGeminiApiKey(apiKey.trim())
      setTestResult(res)
    } catch (err: any) {
      setTestResult({ success: false, message: err?.message || 'Connection test failed.' })
    } finally {
      setTestingConnection(false)
    }
  }

  const handleRemoveKey = async () => {
    if (confirm('Are you sure you want to remove your Gemini API key?')) {
      setApiKey('')
      await update({ geminiApiKey: '', aiEnabled: false })
      setTestResult(null)
    }
  }

  const handleClearData = async (type: 'notes' | 'bookmarks' | 'ai') => {
    const labels = { notes: 'notes', bookmarks: 'bookmarks', ai: 'AI generated summaries & cache' }
    if (confirm(`Are you sure you want to clear all ${labels[type]}? This action cannot be undone.`)) {
      if (type === 'notes') await clearNotes()
      if (type === 'bookmarks') await clearBookmarks()
      if (type === 'ai') await clearAICache()

      setStorageStatus(`✓ Successfully cleared ${labels[type]}`)
      setTimeout(() => setStorageStatus(null), 3000)
    }
  }

  if (!settings) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#888' }}>
        Loading settings...
      </div>
    )
  }

  return (
    <div
      style={{
        maxWidth: 680,
        margin: '0 auto',
        padding: '40px 24px 80px',
        fontFamily: "'Inter', sans-serif",
        color: '#fff',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <div
          style={{
            width: 44,
            height: 44,
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
          }}
        >
          ▶
        </div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.4px' }}>FloatTube AI</div>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>Extension Settings & AI Configuration</div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          {saved && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                background: 'rgba(34,197,94,0.15)',
                border: '1px solid rgba(34,197,94,0.4)',
                color: '#22c55e',
                borderRadius: 8,
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              ✓ Saved
            </motion.div>
          )}
        </div>
      </div>

      {/* AI Studio Configuration */}
      <div style={SECTION_LABEL}>🤖 Google Gemini AI Engine</div>
      <Card>
        <OptionRow
          label="Enable AI Features"
          description="Enable video summaries, transcript chat, flashcards, and quizzes"
          value={settings.aiEnabled}
          onChange={() => update({ aiEnabled: !settings.aiEnabled })}
        />
        <Divider />
        <div style={{ padding: '14px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#ddd' }}>Gemini API Key</span>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#818CF8', fontSize: 12, textDecoration: 'none', fontWeight: 500 }}
            >
              Get Free Key at ai.google.dev →
            </a>
          </div>

          <div style={{ display: 'flex', gap: 8, position: 'relative' }}>
            <input
              type={showKey ? 'text' : 'password'}
              placeholder="Paste your Gemini API key (AIza...)"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 8,
                padding: '10px 40px 10px 12px',
                color: '#fff',
                fontSize: 13,
                outline: 'none',
                fontFamily: 'monospace',
              }}
            />
            <button
              onClick={() => setShowKey(!showKey)}
              type="button"
              style={{
                position: 'absolute',
                right: 175,
                top: 8,
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: 14,
              }}
              title={showKey ? 'Hide key' : 'Show key'}
            >
              {showKey ? '🙈' : '👁️'}
            </button>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSaveApiKey}
              style={{
                padding: '8px 16px',
                background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                border: 'none',
                borderRadius: 8,
                color: '#fff',
                fontSize: 12,
                cursor: 'pointer',
                fontWeight: 700,
              }}
            >
              Save Key
            </motion.button>

            <button
              onClick={handleTestKey}
              disabled={testingConnection || !apiKey.trim()}
              style={{
                padding: '8px 12px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 8,
                color: '#cbd5e1',
                fontSize: 12,
                cursor: testingConnection || !apiKey.trim() ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              {testingConnection ? 'Testing...' : '🔌 Test'}
            </button>
          </div>

          {/* Test connection result status */}
          {testResult && (
            <div
              style={{
                marginTop: 10,
                padding: '8px 12px',
                borderRadius: 8,
                fontSize: 12,
                background: testResult.success ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                border: `1px solid ${testResult.success ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                color: testResult.success ? '#22c55e' : '#f87171',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>{testResult.message}</span>
              <button
                onClick={() => setTestResult(null)}
                style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
            <div style={{ fontSize: 11, color: '#64748b' }}>
              🔒 Your API key is stored strictly on your local browser. It is never logged or sent to any third party.
            </div>
            {apiKey && (
              <button
                onClick={handleRemoveKey}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ef4444',
                  fontSize: 11,
                  cursor: 'pointer',
                  padding: '2px 4px',
                  textDecoration: 'underline',
                }}
              >
                Remove Key
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Auto Float Triggers */}
      <div style={SECTION_LABEL}>⚡ Auto Float Triggers</div>
      <Card>
        <OptionRow
          label="Auto Float on Tab Change"
          description="Enter Picture-in-Picture automatically when you switch to another browser tab"
          value={settings.autoFloatOnTabChange}
          onChange={() => update({ autoFloatOnTabChange: !settings.autoFloatOnTabChange })}
        />
        <Divider />
        <OptionRow
          label="Auto Float on Window Blur"
          description="Float the video when switching to your IDE, editor, or desktop window"
          value={settings.autoFloatOnWindowBlur}
          onChange={() => update({ autoFloatOnWindowBlur: !settings.autoFloatOnWindowBlur })}
        />
        <Divider />
        <OptionRow
          label="Auto Float on Page Navigation"
          description="Keep floating when navigating away from video pages"
          value={settings.autoFloatOnPageHide}
          onChange={() => update({ autoFloatOnPageHide: !settings.autoFloatOnPageHide })}
        />
      </Card>

      {/* Productivity & Focus Mode */}
      <div style={SECTION_LABEL}>🎯 Focus Mode & Appearance</div>
      <Card>
        <OptionRow
          label="Focus Mode (Distraction Blocker)"
          description="Hide recommended video sidebars, comments, and shorts on YouTube and Udemy"
          value={settings.focusModeEnabled}
          onChange={() => update({ focusModeEnabled: !settings.focusModeEnabled })}
        />
        <Divider />
        <OptionRow
          label="Remember Position per Site"
          description="Remember your preferred floating window size and position"
          value={settings.rememberPosition}
          onChange={() => update({ rememberPosition: !settings.rememberPosition })}
        />
      </Card>

      {/* Keyboard Shortcuts */}
      <div style={SECTION_LABEL}>⌨️ Keyboard Shortcuts</div>
      <Card>
        <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12, paddingTop: 6 }}>
          You can customize these shortcuts anytime at{' '}
          <button
            onClick={() => {
              if (typeof chrome !== 'undefined' && chrome.tabs) {
                chrome.tabs.create({ url: 'chrome://extensions/shortcuts' })
              }
            }}
            style={{
              background: 'rgba(99,102,241,0.15)',
              border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: 4,
              color: '#818CF8',
              fontSize: 11,
              fontFamily: 'monospace',
              padding: '2px 6px',
              cursor: 'pointer',
              textDecoration: 'underline',
              display: 'inline-block',
            }}
          >
            chrome://extensions/shortcuts
          </button>
        </div>
        {[
          ['Ctrl + Shift + U', 'Toggle Picture-in-Picture Float'],
          ['Ctrl + Shift + K', 'Play / Pause Video'],
          ['Ctrl + Shift + Y', 'Open Study Workspace Side Panel'],
        ].map(([key, desc]) => (
          <div
            key={key}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 0',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            <span style={{ fontSize: 13, color: '#cbd5e1' }}>{desc}</span>
            <kbd
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 6,
                padding: '4px 10px',
                fontSize: 11,
                color: '#e2e8f0',
                fontFamily: 'monospace',
              }}
            >
              {key}
            </kbd>
          </div>
        ))}
      </Card>

      {/* Storage Management */}
      <div style={SECTION_LABEL}>💾 Data & Storage Management</div>
      <Card>
        <div style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {storageStatus && (
            <div style={{ padding: '6px 10px', background: 'rgba(34,197,94,0.15)', color: '#22c55e', borderRadius: 6, fontSize: 12 }}>
              {storageStatus}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#ddd' }}>Clear Saved Notes</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>Erase all timestamped video study notes from IndexedDB</div>
            </div>
            <button
              onClick={() => handleClearData('notes')}
              style={{
                background: 'rgba(239,68,68,0.15)',
                border: '1px solid rgba(239,68,68,0.3)',
                color: '#f87171',
                borderRadius: 6,
                padding: '6px 12px',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Clear Notes
            </button>
          </div>
          <Divider />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#ddd' }}>Clear Video Bookmarks</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>Erase all saved video timestamps & bookmarks</div>
            </div>
            <button
              onClick={() => handleClearData('bookmarks')}
              style={{
                background: 'rgba(239,68,68,0.15)',
                border: '1px solid rgba(239,68,68,0.3)',
                color: '#f87171',
                borderRadius: 6,
                padding: '6px 12px',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Clear Bookmarks
            </button>
          </div>
          <Divider />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#ddd' }}>Clear AI Cache</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>Erase cached AI summaries, flashcards, and quizzes</div>
            </div>
            <button
              onClick={() => handleClearData('ai')}
              style={{
                background: 'rgba(239,68,68,0.15)',
                border: '1px solid rgba(239,68,68,0.3)',
                color: '#f87171',
                borderRadius: 6,
                padding: '6px 12px',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Clear AI Cache
            </button>
          </div>
        </div>
      </Card>

      {/* About */}
      <div style={SECTION_LABEL}>ℹ️ About FloatTube AI</div>
      <Card>
        <div style={{ padding: '12px 0', fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>
          <strong style={{ color: '#fff' }}>FloatTube AI v1.0.0</strong> — Turn any video into a distraction-free learning workspace. Built with Chromium Manifest V3, React 19, and Google Gemini.
        </div>
      </Card>
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 14,
        padding: '6px 18px',
      }}
    >
      {children}
    </div>
  )
}

function Divider() {
  return <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />
}

function OptionRow({
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
        padding: '12px 0',
        cursor: 'pointer',
      }}
    >
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#ddd' }}>{label}</div>
        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{description}</div>
      </div>
      <div
        style={{
          width: 42,
          height: 22,
          borderRadius: 11,
          background: value ? '#6366F1' : 'rgba(255,255,255,0.1)',
          position: 'relative',
          flexShrink: 0,
          marginLeft: 16,
          transition: 'background 0.2s',
        }}
      >
        <motion.div
          animate={{ x: value ? 22 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          style={{
            position: 'absolute',
            top: 3,
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
