# FloatTube AI

FloatTube AI is a Chromium extension that combines native Picture-in-Picture video playback with an integrated study workspace. It provides timestamped notes, bookmarks, transcript search, and a lightweight side panel so you can learn from video while staying productive.

Author: Babul Kumar

Key goals:
- Keep video floating while you work in other tabs or apps
- Capture timestamped notes and bookmarks per video
- Search and jump transcripts
- Provide a compact study workspace alongside the browser

## Features

- Native Picture-in-Picture (PiP) integration for supported video pages
- Side panel study workspace with Notes, Transcript, Bookmarks, and AI tab (placeholder)
- Timestamped notes and bookmarks; export notes to Markdown or PDF
- Transcript search and click-to-seek functionality
- Auto-float triggers: on tab switch, window blur, and page leave
- Focus Mode to reduce visual distractions on supported sites

## Current status

- Fully functional: PiP start/stop, popup site detection, notes, bookmarks, transcript search, and core side panel UI.
- Work in progress: AI features (placeholder tab and settings), some options that are saved but not fully applied to the native PiP overlay flow.

## Supported sites

Primary integrations:
- YouTube
- Udemy
- Coursera
- Skillshare
- Netflix (limited by DRM)
- Prime Video / Amazon Video (limited by DRM)

Fallback: generic HTML5 `<video>` pages may work but are less reliable than targeted integrations.

## Feature support by site

Support varies by site and browser; YouTube and Udemy provide the best experience. DRM-heavy platforms (Netflix, Prime Video) may restrict PiP and transcript access.

## Prerequisites

- Chromium-based browser (Chrome or Edge) with side panel support
- Node.js 18+ and npm

Verify versions:

```bash
node -v
npm -v
```

## Installation

-# FloatTube AI

FloatTube AI is a lightweight Chromium extension that helps learners watch videos in Picture-in-Picture while maintaining a compact study workspace in the browser. It focuses on timestamped notes, bookmarks, and transcript-based navigation to make revisiting lecture content fast and structured.

**Author:** Babul Kumar

## Features

- Native Picture-in-Picture (PiP) controls (start / stop)
- Side panel study workspace: Notes, Transcript, Bookmarks
- Timestamped notes and bookmarks with Markdown/PDF export
- Transcript search and click-to-seek (when captions are available)
- Auto-float triggers (tab switch, window blur, page leave)
- Focus Mode to reduce visual distractions on supported sites

## Quick start

1. Open a supported video page (YouTube or Udemy recommended).
2. Click the FloatTube AI extension icon and choose `Start Floating`.
3. Open the study workspace to access Notes, Transcript, and Bookmarks.
4. Add timestamped notes/bookmarks and click timestamps to seek the video.

## Installation

Prerequisites:

- Node.js 18+ and npm
- Chromium-based browser

Install and build:

```bash
npm install
npm run dev       # development (watch) mode
npm run build     # production build
npm run build:fast
```

Load locally:

1. Build into `dist/`.
2. Open `chrome://extensions`, enable Developer mode.
3. Click `Load unpacked` and select the `dist/` folder.

## Development

- Source: `src/` — popup, sidepanel, content scripts, providers, and storage
- Build: Vite + TypeScript (see `tsconfig.json`, `vite.config.ts`)
- Useful commands: `npm run dev`, `npm run build`, `npm run build:fast`

## Contributing

- Fork or branch from `main`, implement changes, run the build, and open a pull request with a clear description.
- Open issues for bugs or feature requests with steps to reproduce.

## Project structure

- `src/` — TypeScript source and React components
- `public/` — static assets and icons
- `dist/` — build output
- `manifest.json` — extension manifest

## License

This project is available under the MIT License. See `LICENSE` for details.

---

FloatTube AI — tools for focused learning with videos.

Author: Babul Kumar


Contributions are welcome. Please open issues for bugs or feature requests and submit pull requests with clear descriptions and tests where appropriate.

## Author

Babul Kumar

## License

No license specified. Add a `LICENSE` file if you want to make usage terms explicit.
