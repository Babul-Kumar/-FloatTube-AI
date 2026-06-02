# FloatTube AI

> Turn any video into a distraction-free learning workspace.

FloatTube AI is a Chromium extension that combines native Picture-in-Picture playback with a powerful study workspace. Take timestamped notes, save bookmarks, search transcripts, and stay productive while learning from videos.

![Version](https://img.shields.io/badge/version-1.0-blue)
![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![React](https://img.shields.io/badge/React-18-61dafb)
![License](https://img.shields.io/badge/license-MIT-yellow)

---

## Why FloatTube AI?

Watching tutorials often means constantly switching between videos, notes, documentation, and coding environments.

FloatTube AI solves this by providing:

* Native Picture-in-Picture playback
* Timestamped notes
* Video bookmarks
* Transcript search
* Focus mode
* Study workspace inside the browser

Learn without losing context.

---

## Features

### Floating Video

* Start or stop Picture-in-Picture instantly
* Continue watching while working in other tabs
* Auto-float on tab switch or window blur

### Study Workspace

* Timestamped notes
* Quick bookmarks
* Transcript navigation
* Search transcript content

### Productivity Tools

* Markdown export
* PDF export
* Focus mode
* Keyboard shortcuts

### AI Features (Coming Soon)

* Video summaries
* AI-powered notes
* Flashcard generation
* Quiz generation
* Chat with video transcript

---

## Screenshots

### Floating Video Player

(Add screenshot here)

### Study Workspace

(Add screenshot here)

### Notes and Bookmarks

(Add screenshot here)

---

## Supported Platforms

| Platform            | Support |
| ------------------- | ------- |
| YouTube             | Full    |
| Udemy               | Full    |
| Coursera            | Full    |
| Skillshare          | Full    |
| Netflix             | Limited |
| Prime Video         | Limited |
| Generic HTML5 Video | Partial |

---

## Installation

### Development

Clone the repository:

```bash
git clone https://github.com/yourusername/floattube-ai.git
cd floattube-ai
```

Install dependencies:

```bash
npm install
```

Run development mode:

```bash
npm run dev
```

Build production version:

```bash
npm run build
```

### Load Extension

1. Open chrome://extensions
2. Enable Developer Mode
3. Click Load Unpacked
4. Select the dist folder

---

## Tech Stack

Frontend:

* React
* TypeScript
* Tailwind CSS

State Management:

* Zustand

Build System:

* Vite

Browser APIs:

* Chrome Extension Manifest V3
* Side Panel API
* Picture-in-Picture API
* Storage API

---

## Project Structure

```text
src/
├── popup/
├── sidepanel/
├── content/
├── background/
├── providers/
├── components/
├── services/
├── storage/
└── utils/
```

---

## Roadmap

### Version 1.0

* Native PiP
* Notes
* Bookmarks
* Transcript Search
* Focus Mode

### Version 1.5

* Multi-site support improvements
* Keyboard shortcut customization
* Better transcript extraction

### Version 2.0

* AI Summaries
* AI Chat
* Flashcards
* Quiz Generator

---

## Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Open a Pull Request

---

## Author

Babul Kumar

B.Tech CSE Student | Full-Stack & AI Developer

---

## License

MIT License
