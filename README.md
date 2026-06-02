# FloatTube AI

FloatTube AI is a Chrome extension for watching videos in Picture-in-Picture while keeping a study workspace beside your browser. It combines native floating playback with a side panel for notes, transcripts, bookmarks, and quick search.

This README is written for first-time users. It explains what the extension does today, how to install it, how to use each screen, and where the current limitations are.

## What FloatTube AI does

- Starts native Chrome Picture-in-Picture from a supported video page.
- Opens a Chrome side panel workspace with Notes, Transcript, Workspace, and AI tabs.
- Saves timestamped notes per video and exports them as Markdown or PDF.
- Saves timestamped bookmarks per video.
- Lets you click transcript lines, note timestamps, and bookmark timestamps to jump the video.
- Offers auto-float triggers such as tab switch, window blur, and page leave.
- Includes a Focus Mode toggle for reducing distractions on supported learning sites.

## What is fully usable right now

- Popup detection for major supported sites.
- Native Picture-in-Picture start and stop.
- Side panel notes.
- Side panel transcript search and timestamp seeking.
- Side panel bookmarks.
- Side panel close button.
- Options page for core setup and shortcut access.

## What is visible but not fully implemented yet

The current UI includes a few settings that are still groundwork for future improvements. A new user should know this up front:

- AI tab: shown in the side panel, but still a placeholder.
- AI enable toggle and Gemini API key: settings can be saved, but no live AI summaries or chat run yet.
- Theme setting: saved in options, but the current UI is still effectively dark-styled.
- Default window size, default position, show transcript, and remember position: present in settings, but not all of them are fully applied to the current native PiP workflow.
- The options page mentions extra shortcut ideas like skip forward and skip back, but Chrome currently registers only the shortcuts defined in `manifest.json`.

## Supported sites

FloatTube AI is built primarily for these sites:

- YouTube
- Udemy
- Coursera
- Skillshare
- Netflix
- Prime Video / Amazon Video

There is also a generic HTML5 video fallback. In practice, that means:

- If a page has a normal HTML5 `<video>` element, the extension may still work when you launch it from the popup on the active tab.
- Generic pages are less reliable than the named integrations above.

## Feature support by site

| Site or page | Floating video | Focus Mode | Transcript support |
| --- | --- | --- | --- |
| YouTube | Yes | Yes | Best support, including YouTube caption fetch when available |
| Udemy | Yes | Yes | Works when captions or subtitle tracks are available |
| Coursera | Yes | No | Works when caption tracks are available |
| Skillshare | Yes | No | Works when caption tracks are available |
| Netflix | Browser and DRM may restrict behavior | No | Usually limited |
| Prime Video / Amazon Video | Browser and DRM may restrict behavior | No | Usually limited |
| Other HTML5 video pages | Sometimes | No | Only if the page exposes subtitle or caption tracks |

## Before you install

You need:

- Google Chrome or another Chromium-based browser with side panel support.
- Node.js 18 or newer.
- npm.

Check your versions:

```bash
node -v
npm -v
```

## Installation

### 1. Get the project

Place the project folder on your machine.

Example path on Windows:

```bash
cd c:\Users\babul\OneDrive\Desktop\extension2.0
```

### 2. Install dependencies

```bash
npm install
```

### 3. Build the extension

For a full production-style build:

```bash
npm run build
```

For a faster build during local testing:

```bash
npm run build:fast
```

This creates the compiled extension in the `dist/` folder.

### 4. Load the extension in Chrome

1. Open `chrome://extensions`.
2. Turn on `Developer mode`.
3. Click `Load unpacked`.
4. Select the `dist` folder inside this project.
5. Pin `FloatTube AI` from the extensions menu if you want quick access.

### 5. Refresh video tabs that were already open

If YouTube, Udemy, or another supported site was already open before you loaded or reloaded the extension, refresh that tab once so the content script is active.

## Quick start

If you want the shortest path from install to using it:

1. Open a supported video page.
2. Click the `FloatTube AI` extension icon.
3. Press `Start Floating`.
4. Press `Open Study Workspace` to open the side panel.
5. Add notes or bookmarks while you watch.
6. Click timestamps to jump back to important moments.

## How to use the popup

The extension popup has two tabs: `Player` and `Settings`.

### Player tab

This is the main action screen.

- `Start Floating`: requests native Chrome Picture-in-Picture for the current video.
- `Stop Floating`: exits native Picture-in-Picture if the video is already floating.
- Site badge: shows the detected site, such as YouTube or Udemy.
- `On Tab Switch`: attempts to float the video when you move to another tab.
- `On Window Blur`: attempts to float when Chrome loses focus.
- `On Page Leave`: attempts to float when you navigate away.
- `Focus Mode`: hides distractions on supported sites.
- `AI Features`: currently a saved toggle for future functionality.
- `Open Study Workspace`: opens the side panel.
- `Configure Keyboard Shortcuts`: jumps to Chrome's extension shortcut page.

### Settings tab in the popup

This is a lightweight settings view.

- Gemini API key field: stored in extension settings, but not yet used for active AI features.
- `Remember Position`: shown in UI, but not fully reflected in the current native PiP flow.
- `Show Transcript`: shown in UI, but not fully reflected in the current native PiP flow.
- Default position boxes are visible in the popup, but they are not currently wired as an active control.

## How to use the side panel

Open the side panel from:

- The popup's `Open Study Workspace` button.
- Chrome's side panel command for the extension.
- The keyboard shortcut registered for the side panel.

The side panel tries to sync with:

- The current active supported video tab first.
- If that is not a video tab, the last video tab the extension was tracking.

There is also an `X` button in the side panel header to close it.

### Notes tab

Use this while watching to capture study notes.

- Type in the note box at the bottom.
- Click `Add` to save the note.
- Each note is saved with the current video timestamp.
- Click a timestamp badge to seek back to that moment in the video.
- Click `MD` to export notes as Markdown.
- Click `PDF` to export notes as PDF.
- Notes are stored per video.

### Transcript tab

Use this to read and search available captions.

- The search box filters transcript lines.
- The current active line is highlighted as the video plays.
- Click any line to jump the video to that timestamp.

Transcript sources currently work like this:

- YouTube: the extension first tries YouTube's timed text endpoint.
- Other sites: the extension tries subtitle or caption tracks exposed on the page.

If a video has no accessible captions, the transcript tab may show no results.

### Workspace tab

This is split into two simple tools.

- Bookmarks: save labeled timestamps for the current video.
- Web Search: run a Google search from inside the side panel.

For bookmarks:

- Type a label.
- Click `Save`.
- Click the bookmark timestamp later to seek the video.
- Delete bookmarks individually if needed.

### AI tab

The AI tab is currently a placeholder. It is present in the interface, but the actual AI features are not active yet.

## How to use Focus Mode

Focus Mode is meant to clean up distracting page elements while you study.

Current behavior:

- YouTube: hides areas such as recommendations, comments, Shorts-related elements, and some end-screen clutter.
- Udemy: hides some sidebar or curriculum-style elements.
- Other sites: the toggle may save, but there is currently no site-specific CSS cleanup implemented.

## Keyboard shortcuts

Chrome currently registers these commands from `manifest.json`:

- `Ctrl+Shift+Y`: open the FloatTube AI side panel
- `Alt+P`: toggle floating mode
- `Alt+Space`: play or pause the current video

To change shortcuts:

1. Open `chrome://extensions/shortcuts`
2. Find `FloatTube AI`
3. Edit the shortcut bindings you want

Notes:

- Chrome may block or override some combinations depending on your OS.
- The UI mentions some extra shortcut ideas, but only the commands above are currently registered in the manifest.

## Options page

Open the extension options page from Chrome's extension details page or from the extension UI if you add a link later.

The current options page lets you save:

- Auto-float triggers
- Remember position
- Show transcript
- Default window size
- Focus Mode
- Theme
- AI enable toggle
- Gemini API key

Important honesty note:

- Not every saved setting is fully wired into the current runtime behavior yet.
- The options page is still useful as the main place to review and store preferences, but some values are future-facing.

## Typical workflow for studying

One practical way to use the extension:

1. Open a lesson on YouTube or Udemy.
2. Start floating the video.
3. Open the side panel.
4. Keep the video floating while you work in another tab or app.
5. Add notes whenever you hit an important idea.
6. Add bookmarks for sections you want to revisit.
7. Use the transcript tab to search for a keyword from the lecture.
8. Export notes at the end of the session.

## Data storage and privacy

Here is where the extension stores data today:

- Notes and bookmarks: browser IndexedDB.
- Some session-style data structures: IndexedDB.
- Settings: Chrome sync storage when available.
- Position-related values: Chrome local storage when used by the overlay path.

What this means for a user:

- Your notes and bookmarks stay in your browser profile.
- The current code does not send your notes to a remote server.
- If you enter a Gemini API key, it is saved in extension settings, but the current build does not yet use it for live AI requests.

## Troubleshooting

### The popup says no video was detected

Try these steps:

1. Make sure the tab really contains a playable video.
2. Refresh the tab if the extension was just installed or reloaded.
3. Open the popup while the video tab is active.
4. On generic video pages, try pressing `Start Floating` directly from the popup while the tab is active.

### The side panel says no active video detected

This usually means:

- The current tab is not a supported video page.
- The content script is not active yet.
- The extension has not tracked a video tab in the current session.

Try refreshing the video tab, then reopen the side panel.

### Picture-in-Picture does not start

Possible reasons:

- The page does not expose a normal video element.
- The browser blocked the PiP request.
- A DRM-protected site limited the action.
- The active page is not scriptable by the extension.

Try the feature first on YouTube to confirm the extension is working.

### Auto-float does not always trigger

That can happen because:

- Some PiP actions are sensitive to browser gesture rules.
- Browser support differs by site and by Chromium version.
- DRM-heavy sites can behave differently.

The toggles tell the extension to try the behavior, but the browser may still limit it.

### Transcript is empty

Common reasons:

- The video has no captions.
- The captions are not exposed in a way the extension can read.
- The caption language is different from what the current fetch path expects.

YouTube generally gives the best transcript results.

### Netflix or Prime Video behavior is inconsistent

This is usually due to browser and DRM restrictions, not your installation steps.

## Current limitations

These are the main limits a new user should know:

- The best overall experience is currently on YouTube and Udemy.
- AI features are not active yet, even though the UI includes AI-related settings.
- Several saved settings are groundwork and not fully reflected in the current runtime flow.
- Focus Mode currently has meaningful site-specific behavior mainly for YouTube and Udemy.
- Generic HTML5 support is useful, but less predictable than the named site integrations.

## Development commands

If you are editing the extension locally:

- `npm install`: install dependencies
- `npm run build`: strict TypeScript check plus Vite build
- `npm run build:fast`: fast Vite build without the strict type-check step
- `npm run dev`: watch mode that rebuilds into `dist/`

After each code change:

1. Rebuild the project
2. Open `chrome://extensions`
3. Click `Reload` on the FloatTube AI card
4. Refresh any already-open video tabs

## Project structure

High-level folders:

- `src/popup/`: popup UI
- `src/sidepanel/`: side panel UI
- `src/options/`: full settings page
- `src/content/`: content script and page-side runtime
- `src/providers/`: site-specific video integrations
- `src/storage/`: settings, positions, notes, bookmarks, and session storage
- `dist/`: built extension loaded into Chrome

## Summary

FloatTube AI already works well as a practical combo of:

- native floating video
- note-taking
- transcript jumping
- bookmark capture
- side-panel study workflow

Its strongest use case right now is learning-focused video watching on YouTube and similar sites, with a clear path for more advanced AI features later.
