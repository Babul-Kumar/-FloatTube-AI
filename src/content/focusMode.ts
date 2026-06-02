const FOCUS_MODE_ID = 'floattube-focus-mode-css'

const YOUTUBE_FOCUS_CSS = `
  /* Hide YouTube distractions */
  ytd-watch-next-secondary-results-renderer,
  #secondary,
  ytd-comments,
  #comments,
  ytd-shorts,
  [is-shorts],
  ytd-reel-shelf-renderer,
  ytd-shelf-renderer.ytd-watch-next-secondary-results-renderer,
  .ytp-endscreen-content,
  .ytp-cards-button,
  .ytp-ce-element {
    display: none !important;
  }
  #primary {
    max-width: 100% !important;
  }
`

const UDEMY_FOCUS_CSS = `
  [class*="sidebar"],
  [class*="Sidebar"],
  [class*="curriculum"] {
    display: none !important;
  }
`

const CSS_MAP: Record<string, string> = {
  youtube: YOUTUBE_FOCUS_CSS,
  udemy: UDEMY_FOCUS_CSS,
}

export function enableFocusMode(siteId: string) {
  if (document.getElementById(FOCUS_MODE_ID)) return
  const style = document.createElement('style')
  style.id = FOCUS_MODE_ID
  style.textContent = CSS_MAP[siteId] ?? ''
  document.head.appendChild(style)
}

export function disableFocusMode() {
  document.getElementById(FOCUS_MODE_ID)?.remove()
}

export function toggleFocusMode(siteId: string) {
  if (document.getElementById(FOCUS_MODE_ID)) {
    disableFocusMode()
  } else {
    enableFocusMode(siteId)
  }
}
