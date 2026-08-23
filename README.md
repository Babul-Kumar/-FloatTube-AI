# FloatTube AI

> **Turn any video into a distraction-free, AI-powered learning workspace.**

FloatTube AI is a production-grade Chromium Extension (Manifest V3) that combines native Picture-in-Picture playback with an intelligent study workspace. Take timestamped notes, save bookmarks, search transcripts, and supercharge your learning with Google Gemini AI summaries, transcript-grounded Q&A, active-recall flashcards, and automated quizzes.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Chrome Extension](https://img.shields.io/badge/Chrome-Extension%20MV3-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![React](https://img.shields.io/badge/React-19-61dafb)
![Google Gemini](https://img.shields.io/badge/Gemini-2.0%20Flash-8e75ff)
![License](https://img.shields.io/badge/license-MIT-yellow)

---

## 🚀 Key Features

### 📺 1. Floating Video Player (Picture-in-Picture)
* **Native Chrome PiP**: Instant one-click floating video playback on YouTube, Udemy, Coursera, Skillshare, and any HTML5 video site.
* **Auto-Float Triggers**: Automatically floats video when switching browser tabs (`visibilitychange`) or switching windows to your IDE/code editor (`window.blur`).
* **Playback Shortcuts**: Global keyboard shortcuts to toggle float and play/pause from anywhere.

### ✨ 2. Google Gemini AI Study Studio
* **Executive Summary**: Generates a concise overview, difficulty level rating, and core conceptual breakdown from the video transcript.
* **Key Takeaways**: 5–10 actionable bullet points summarizing key principles.
* **Grounded Transcript Chat**: Multi-turn conversational assistant grounded directly in the video transcript. Ask questions like *"Explain this concept simply"*, *"Give a practical code example"*, or *"What did the instructor say about X?"*.
* **Active-Recall Flashcards**: Interactive 3D flip card viewer with question/answer recall, shuffle, progress tracker, and difficulty tags.
* **Multiple-Choice Quiz**: Test comprehension with automated 5–10 question quizzes featuring instant answer validation, scoring, and in-depth explanations.
* **Smart Caching**: AI summaries, flashcards, and quizzes are automatically cached in IndexedDB so you never make duplicate API calls.

### 📝 3. Timestamped Study Notes
* **Precision Timestamps**: Add notes tied to the exact video timestamp.
* **Instant Seek**: Click any timestamp in your notes to jump the video directly to that second.
* **Inline Editing & Search**: Search and edit notes seamlessly.
* **Multi-Format Export**: Export your complete study session (including Video Info, AI Summary, Key Takeaways, Notes, and Bookmarks) directly to **Markdown (.md)** or **PDF (.pdf)**.

### 📄 4. Live Transcript Navigation
* **Multi-Source Extraction**: Robust transcript parsing across YouTube (caption tracks, timedtext json3/XML, and DOM tracks) and HTML5 `<track>` subtitles.
* **Full-Text Search**: Live keyword search with match counter and highlighted segment navigation.
* **Time Sync**: Auto-scrolls and highlights the active transcript line in real time as the video plays.
* **One-Click Copy**: Copy the entire transcript to your clipboard with clean timestamp formatting.

### 🎯 5. Focus Mode (Distraction Blocker)
* **Distraction-Free Learning**: Eliminates recommendations, sidebars, comments, and shorts on YouTube and Udemy so you can focus 100% on learning.

---

## 🛠️ Supported Platforms

| Platform | Picture-in-Picture | Timestamped Notes | Transcript Extraction | Gemini AI Studio | Focus Mode |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **YouTube** | ✅ Full | ✅ Full | ✅ Multi-Track & Auto | ✅ Full | ✅ Full |
| **Udemy** | ✅ Full | ✅ Full | ✅ Subtitle / Track | ✅ Full | ✅ Full |
| **Coursera** | ✅ Full | ✅ Full | ✅ Subtitle / Track | ✅ Full | ✅ Supported |
| **Skillshare** | ✅ Full | ✅ Full | ✅ Subtitle / Track | ✅ Full | ✅ Supported |
| **HTML5 Video** | ✅ Full | ✅ Full | ✅ `<track>` VTT | ✅ Full | ✅ Supported |

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action | Description |
| :--- | :--- | :--- |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>U</kbd> | **Toggle Float** | Toggle Picture-in-Picture floating mode |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>K</kbd> | **Play / Pause** | Toggle video playback |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Y</kbd> | **Open Workspace** | Open the FloatTube AI Side Panel study workspace |

*Shortcuts can be customized at `chrome://extensions/shortcuts`.*

---

## 📦 Installation & Setup

### 1. Development & Build

```bash
# Clone the repository
git clone https://github.com/yourusername/floattube-ai.git
cd floattube-ai

# Install dependencies
npm install

# Build production extension bundle
npm run build
```

### 2. Load into Chrome

1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked**.
4. Select the `dist` folder generated inside the project directory.

### 3. Configure Gemini AI Key

1. Click the FloatTube AI extension icon in your Chrome toolbar -> click the **⚙️ Settings** tab (or right-click the extension icon -> **Options**).
2. Enter your **Google Gemini API Key**. (Get a free key at [Google AI Studio](https://aistudio.google.com/app/apikey)).
3. Click **Save Key** and optionally test the connection using the **🔌 Test** button.

---

## 🔒 Security & Privacy

* **Local Storage Only**: Your Gemini API key is stored locally in Chrome's encrypted extension storage (`chrome.storage.sync` / `chrome.storage.local`).
* **Zero Telemetry**: Keys and study notes are never transmitted to any third-party server.
* **Direct Official Endpoints**: All AI requests are made directly from your browser to Google's official Gemini REST API (`generativelanguage.googleapis.com`).

---

## 🏗️ Architecture & Project Structure

```text
src/
├── background/
│   └── index.ts                 # Service worker: Command routing & auto-injection
├── content/
│   ├── index.ts                 # Content script & message dispatcher
│   ├── autoFloat.ts             # Tab switch / window blur auto-float manager
│   ├── focusMode.ts             # CSS distraction blocker for YouTube/Udemy
│   ├── pipManager.ts            # Native Picture-in-Picture controller
│   └── shortcuts.ts             # Video playback keyboard handlers
├── providers/
│   ├── VideoProvider.ts         # Base provider interface & TranscriptSegment types
│   ├── YouTubeProvider.ts       # YouTube player response & timedtext extractor
│   ├── UdemyProvider.ts         # Udemy player integration
│   ├── CourseraProvider.ts      # Coursera player integration
│   ├── SkillshareProvider.ts    # Skillshare player integration
│   ├── GenericHTML5Provider.ts  # HTML5 fallback player
│   └── registry.ts              # Automatic video provider detection
├── services/
│   ├── ai/
│   │   ├── types.ts             # AI data contracts (Summary, Flashcard, Quiz, Chat)
│   │   ├── prompts.ts           # Structured prompt builders
│   │   ├── gemini.ts            # Google Gemini REST client & JSON parser
│   │   └── aiService.ts         # High-level AI orchestrator & cache manager
│   └── transcript.ts            # Subtitle parser & WebVTT extractor
├── storage/
│   ├── db.ts                    # IndexedDB v3 (Notes, Bookmarks, AI Cache, Sessions)
│   ├── settings.ts              # Sync storage preferences & API key manager
│   └── positionStore.ts         # Per-site floating window geometry storage
├── components/
│   ├── AI/
│   │   ├── AIStudio.tsx         # AI master workspace tab
│   │   ├── AISummaryView.tsx    # Executive summary & core concepts
│   │   ├── AIChatView.tsx       # Grounded transcript conversational chat
│   │   ├── AIFlashcardsView.tsx # Interactive 3D active-recall flip cards
│   │   └── AIQuizView.tsx       # Multiple-choice quiz runner & explanations
│   └── FloatingPlayer/          # Floating controller components
├── sidepanel/
│   └── SidePanel.tsx            # Main side-panel study workspace UI
├── popup/
│   └── Popup.tsx                # Extension toolbar popup
└── options/
    └── OptionsPage.tsx          # Full-page settings & storage manager
```

---

## 📄 License

MIT License © 2026 Babul Kumar
