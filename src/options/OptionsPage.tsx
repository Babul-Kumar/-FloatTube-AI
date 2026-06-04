import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getSettings, saveSettings, type FloatSettings } from '../storage/settings'

const SECTION_LABEL: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: '#555',
  letterSpacing: 1, marginBottom: 12, marginTop: 24,
  textTransform: 'uppercase',
}

export default function OptionsPage() {
  const [settings, setSettings] = useState<FloatSettings | null>(null)
  const [saved, setSaved] = useState(false)
  const [apiKey, setApiKey] = useState('')

  useEffect(() => {
    getSettings().then(s => {
      setSettings(s)
      setApiKey(s.geminiApiKey)
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

  if (!settings) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#555' }}>
      Loading...
    </div>
  )

  return (
    <div style={{
      maxWidth: 640, margin: '0 auto', padding: '40px 24px',
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
        <div style={{
          width: 44, height: 44,
          background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
          borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22,
        }}>▶</div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>FloatTube AI</div>
          <div style={{ fontSize: 13, color: '#555' }}>Extension Settings</div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          {saved && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              style={{ background: '#22c55e22', border: '1px solid #22c55e55', color: '#22c55e', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600 }}
            >✓ Saved</motion.div>
          )}
        </div>
      </div>

      {/* Auto Float */}
      <div style={SECTION_LABEL}>Auto Float Triggers</div>
      <Card>
        <OptionRow label="Auto Float on Tab Change" description="Float when you switch to another tab" value={settings.autoFloatOnTabChange} onChange={() => update({ autoFloatOnTabChange: !settings.autoFloatOnTabChange })} />
        <Divider />
        <OptionRow label="Auto Float on Window Blur" description="Float when Chrome loses focus" value={settings.autoFloatOnWindowBlur} onChange={() => update({ autoFloatOnWindowBlur: !settings.autoFloatOnWindowBlur })} />
        <Divider />
        <OptionRow label="Auto Float on Page Leave" description="Float when navigating away from the page" value={settings.autoFloatOnPageHide} onChange={() => update({ autoFloatOnPageHide: !settings.autoFloatOnPageHide })} />
      </Card>

      {/* Player defaults */}
      <div style={SECTION_LABEL}>Player Defaults</div>
      <Card>
        <OptionRow label="Remember Position" description="Restore window position & size per site" value={settings.rememberPosition} onChange={() => update({ rememberPosition: !settings.rememberPosition })} />
        <Divider />
        <OptionRow label="Show Transcript" description="Display live captions below the floating video" value={settings.showTranscript} onChange={() => update({ showTranscript: !settings.showTranscript })} />
        <Divider />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#ddd' }}>Default Window Size</div>
            <div style={{ fontSize: 11, color: '#555' }}>Initial floating window size</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['small', 'medium', 'large'] as const).map(s => (
              <button key={s} onClick={() => update({ defaultSize: s })} style={{
                padding: '5px 12px',
                background: settings.defaultSize === s ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${settings.defaultSize === s ? '#6366F1' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 8, color: settings.defaultSize === s ? '#6366F1' : '#888',
                fontSize: 11, cursor: 'pointer', fontWeight: 600, textTransform: 'capitalize',
              }}>{s}</button>
            ))}
          </div>
        </div>
      </Card>

      {/* Productivity */}
      <div style={SECTION_LABEL}>Productivity</div>
      <Card>
        <OptionRow label="Focus Mode" description="Hide sidebar, comments, recommendations & autoplay" value={settings.focusModeEnabled} onChange={() => update({ focusModeEnabled: !settings.focusModeEnabled })} />
        <Divider />
        <OptionRow label="Theme" description="Extension popup and side panel appearance" value={settings.theme === 'dark'} onChange={() => update({ theme: settings.theme === 'dark' ? 'light' : 'dark' })} valueLabel={settings.theme === 'dark' ? 'Dark' : 'Light'} />
      </Card>

      {/* AI Pack */}
      <div style={SECTION_LABEL}>AI Pack – Optional</div>
      <Card>
        <OptionRow label="Enable AI Features" description="Requires a Gemini API key" value={settings.aiEnabled} onChange={() => update({ aiEnabled: !settings.aiEnabled })} />
        <Divider />
        <div style={{ padding: '12px 0' }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#ddd', marginBottom: 8 }}>Gemini API Key</div>
          <input
            type="password"
            placeholder="AIza..."
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            style={{
              width: '100%', background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 8, padding: '10px 12px',
              color: '#fff', fontSize: 13, outline: 'none',
              fontFamily: "'Inter', sans-serif",
            }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => update({ geminiApiKey: apiKey })} style={{
              padding: '8px 16px',
              background: 'rgba(99,102,241,0.3)',
              border: '1px solid rgba(99,102,241,0.5)',
              borderRadius: 8, color: '#fff', fontSize: 12,
              cursor: 'pointer', fontWeight: 600, fontFamily: "'Inter', sans-serif",
            }}>Save Key</motion.button>
            <div style={{ display: 'flex', alignItems: 'center', fontSize: 11, color: '#555' }}>
              Get free API key at{' '}
              <a href="https://ai.google.dev" target="_blank" rel="noopener noreferrer"
                style={{ color: '#6366F1', marginLeft: 4 }}>ai.google.dev →</a>
            </div>
          </div>
        </div>
      </Card>

      {/* Keyboard shortcuts */}
      <div style={SECTION_LABEL}>Keyboard Shortcuts</div>
      <Card>
        <div style={{ fontSize: 12, color: '#555', marginBottom: 12 }}>
          Customize shortcuts at{' '}
          <button
            onClick={() => {
              if (typeof chrome !== 'undefined' && chrome.tabs) {
                chrome.tabs.create({ url: 'chrome://extensions/shortcuts' })
              }
            }}
            style={{
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 4,
              color: '#6366F1',
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
          ['Ctrl + Shift + 5', 'Toggle Float Mode'],
          ['Ctrl + Shift + 6', 'Play / Pause'],
          ['Ctrl + Shift + Y', 'Open Side Panel'],
        ].map(([key, desc]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <span style={{ fontSize: 12, color: '#aaa' }}>{desc}</span>
            <kbd style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, padding: '3px 8px', fontSize: 11, color: '#ddd', fontFamily: 'monospace' }}>{key}</kbd>
          </div>
        ))}
      </Card>

      <div style={{ height: 40 }} />
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 14, padding: '4px 16px',
    }}>{children}</div>
  )
}

function Divider() {
  return <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />
}

function OptionRow({ label, description, value, onChange, valueLabel }: {
  label: string, description: string, value: boolean, onChange: () => void, valueLabel?: string
}) {
  return (
    <div onClick={onChange} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', cursor: 'pointer' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#ddd' }}>{label}</div>
        <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{description}</div>
      </div>
      {valueLabel ? (
        <div style={{ fontSize: 12, color: '#6366F1', fontWeight: 600 }}>{valueLabel}</div>
      ) : (
        <div style={{
          width: 42, height: 22, borderRadius: 11,
          background: value ? '#6366F1' : 'rgba(255,255,255,0.1)',
          position: 'relative', flexShrink: 0, marginLeft: 16,
          transition: 'background 0.2s',
        }}>
          <motion.div
            animate={{ x: value ? 22 : 2 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            style={{ position: 'absolute', top: 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }}
          />
        </div>
      )}
    </div>
  )
}
