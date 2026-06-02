# FloatTube AI – Smart Floating Video Experience

FloatTube AI is a premium Google Chrome Extension designed to revolutionize your video learning, studying, and working workflows. It allows you to continue watching YouTube, Udemy, Coursera, Netflix, or any HTML5 video in a native floating Picture-in-Picture window while you write code, browse other tabs, or take notes inside a dedicated workspace.

Unlike standard Picture-in-Picture players, FloatTube AI integrates a feature-rich study suite featuring synced transcripts, a markdown note-taking editor, timestamped bookmarks, distraction-free focus modes, and a dedicated Chrome Side Panel workspace.

---

## 📖 Table of Contents
1. [Key Features](#-key-features)
2. [Upcoming Features – AI Pack (Coming Soon)](#-upcoming-features--ai-pack-coming-soon)
3. [Prerequisites](#-prerequisites)
4. [Step-by-Step Installation Guide](#-step-by-step-installation-guide)
5. [How to Use FloatTube AI](#-how-to-use-floattube-ai)
6. [Keyboard Shortcuts Cheatsheet](#-keyboard-shortcuts-cheatsheet)
7. [Project Folder Layout](#-project-folder-layout)
8. [Technical Architecture & Development Guide](#-technical-architecture--development-guide)
9. [Troubleshooting & FAQs](#-troubleshooting--faqs)
10. [Author](#-author)

---

## 🚀 Key Features

### 📺 Direct Native Picture-in-Picture
* **Instant Native Float**: Clicking **"Start Floating"** in the popup or pressing `Alt + P` directly launches Chrome's native Picture-in-Picture (PiP) window. This ensures zero delay, high performance, and zero black-screen or CORS issues.
* **Always-On-Top Viewing**: The native PiP window floats on top of all application windows, including non-browser windows (like your IDE or text editor).
* **Auto-Float on Tab Change**: Automatically enters Picture-in-Picture when you switch tabs, and docks back to the original page when you return (when Chrome's native auto-PiP flag is enabled).

### 📝 Chrome Side Panel Study Workspace (`Ctrl + Shift + Y`)
* **Real-Time Synced Transcript**: Captures video captions (supporting YouTube TimedText API + WebVTT fallback reader) and auto-scrolls to highlight the active line. Click any line to skip the video directly to that sentence.
* **Timestamp-Linked Notes**: Type study notes on the fly. The editor automatically captures the video's active timestamp, generating a clickable link (e.g. `[02:14]`) so you can return to that moment with a single click.
* **Notes Exports**: Save your notes as structured Markdown (`.md`) or print-ready PDF files for offline review.
* **Interactive Bookmarks**: Create custom-labeled bookmarks at key video highlights.
* **Inline Web Search**: Look up definitions, docs, or code snippets inside the mini search panel without opening another tab.

### 🧹 Productivity Boosters
* **Distraction-Free Focus Mode**: One-click toggling to hide recommendations columns, comments lists, autoplay sections, end-screen cards, headers, and Shorts on YouTube and Udemy.

---

## ✨ Upcoming Features – AI Pack (Coming Soon)

We are working on integrating advanced AI capabilities to create the ultimate study companion:

* **Gemini AI Video Summarization** *(Coming Soon)*: Generate structured summaries of long lectures, tutorials, and meetings in seconds using Gemini 2.5 Flash.
* **AI Chat with Transcript Context** *(Coming Soon)*: Ask questions about the video and get answers directly referenced from the video's transcript.
* **Smart Study Flashcards** *(Coming Soon)*: Automatically extract key takeaways and generate flashcards for study review.
* **Comprehension Quizzes** *(Coming Soon)*: Test your understanding with auto-generated multiple-choice quizzes based on the video content.
* **Pomodoro Focus Timer** *(Coming Soon)*: Track study intervals with an integrated Pomodoro clock directly inside your side panel.
* **Visual Screenshot Bookmarks** *(Coming Soon)*: Capture and attach video frame screenshots to your bookmarks using the Canvas API.

---

## 📋 Prerequisites

Before installing the extension, make sure you have:
1. The **Google Chrome** browser installed on your computer.
2. **Node.js** installed (version 18 or higher is recommended).
   * Verify your installation by running these commands:
     ```bash
     node -v
     npm -v
     ```
   * Download Node.js from the official site: [https://nodejs.org/](https://nodejs.org/)

---

## 📥 Step-by-Step Installation Guide

Follow these steps to build and load the extension into Google Chrome:

### Step 1: Download the Project
Save the project folder (`extension2.0`) to a folder on your computer.

### Step 2: Open Terminal / Command Prompt
Open **Command Prompt** (on Windows) or **Terminal** (on macOS/Linux), and navigate to the project directory:
```bash
# Example (Windows):
cd c:\Users\babul\OneDrive\Desktop\extension2.0
```

### Step 3: Install Project Dependencies
Run the install command to download all required packages:
```bash
npm install
```

### Step 4: Compile and Build the Extension
Build the extension. This bundles and compiles the TSX/TS files into a new folder named `dist/`:
```bash
npm run build
```

### Step 5: Load the Extension in Google Chrome
1. Open Google Chrome.
2. Type `chrome://extensions` in the URL bar and press `Enter`.
3. In the top-right corner, toggle the **Developer mode** switch to **ON**.
4. In the top-left corner, click the **"Load unpacked"** button.
5. Browse and select the compiled **`dist`** folder inside your project directory:
   `c:\Users\babul\OneDrive\Desktop\extension2.0\dist`
6. Click **Select Folder**.
7. Click the Chrome Extensions puzzle icon and **pin** **FloatTube AI** for quick access.

---

## 💡 How to Use FloatTube AI

### 1. Activating the Float Player
* Open a video on **YouTube**, **Udemy**, or any supported HTML5 video site.
* Click the **FloatTube AI icon** in your toolbar to open the settings popup, then click **▶ Start Floating** (or press **Alt+P**).
* The video will immediately enter native Picture-in-Picture mode!

### 2. Opening the Study Workspace
* Press **`Ctrl + Shift + Y`** (or open the Chrome Side Panel menu and select **FloatTube AI**).
* The side panel will open next to your active tab and automatically sync with the video's timeline.
* Switch between the **Notes**, **Transcript**, and **Workspace** tabs inside the side panel to study.

### 3. Taking Notes & Bookmarks
* In the **Notes** tab, type your thoughts and press **Enter** or click **Add**. The note will save with a timestamp.
* Click the timestamp badges next to any note to seek the video to that moment.
* Click **MD** or **PDF** to export your study guide.
* Use the **Workspace** tab to bookmark chapters or search Google inline.

### 4. Toggling Focus Mode
* In the extension popup or the options dashboard, toggle **Focus Mode** to ON.
* All clutter (sidebar, comments, lists) on YouTube and Udemy will be hidden immediately, allowing you to study in peace.

---

## ⌨️ Keyboard Shortcuts Cheatsheet

FloatTube AI includes native browser hotkeys. You can customize these shortcuts at any time by visiting `chrome://extensions/shortcuts` in Google Chrome.

| Action | Suggested Shortcut | Details |
|---|---|---|
| **Toggle Float Mode** | `Alt + P` | Opens or closes the native Picture-in-Picture window |
| **Play / Pause** | `Alt + Space` | Play or pause video playback |
| **Skip Forward 10s** | `Alt + →` | Seek video forward by 10 seconds |
| **Skip Backward 10s** | `Alt + ←` | Seek video backward by 10 seconds |

---

## 📁 Project Folder Layout

```
extension2.0/
├── manifest.json              ← Manifest V3 setup (Permissions, Shortcuts, SidePanel)
├── vite.config.ts             ← Vite build configurations with web-extension plugin
├── package.json               ← Packages, dependencies & build scripts
├── tsconfig.json              ← TypeScript compiler options
├── tsconfig.node.json         ← Node-specific TypeScript config
├── index.html                 ← Standalone local entry point
├── popup.html                 ← Extension popup panel page markup
├── options.html               ← Settings options dashboard page markup
├── sidepanel.html             ← Side panel workspace page markup
├── public/
│   └── icons/                 ← Extension branding assets (16/32/48/128px)
└── src/
    ├── vite-env.d.ts          ← Vite TypeScript references
    ├── main.ts                ← Main script entry
    ├── style.css              ← Styling variables and utilities
    ├── popup/                 ← React UI for the Extension Popup
    │   ├── index.tsx
    │   └── Popup.tsx
    ├── options/               ← React UI for the Settings Dashboard
    │   ├── index.tsx
    │   └── OptionsPage.tsx
    ├── sidepanel/             ← React UI for the Chrome Side Panel
    │   ├── index.tsx
    │   └── SidePanel.tsx
    ├── content/               ← Script injected into YouTube/Udemy to render player
    │   ├── index.ts           ← Content script entry (handles messaging & state updates)
    │   ├── pipManager.ts      ← Handles browser Picture-in-Picture API
    │   ├── autoFloat.ts       ← Detects tab switching/blurs to auto-trigger PiP
    │   ├── shortcuts.ts       ← Keypress shortcuts listeners
    │   └── focusMode.ts       ← Distraction-free CSS injection styles
    ├── components/            
    │   ├── FloatingPlayer/    ← Hoverable controls bar and drag utility guides
    │   │   ├── FloatingPlayer.tsx
    │   │   ├── ControlsBar.tsx
    │   │   └── SnapZones.tsx
    │   ├── Transcript/        ← Synced transcript scrolling panel
    │   │   └── TranscriptPanel.tsx
    │   ├── NotesPanel/        ← Note-taking editor, MD/PDF exporter
    │   │   └── NotesPanel.tsx
    │   ├── Bookmarks/         ← Timestamped video bookmark lists
    │   │   └── BookmarkList.tsx
    │   └── MiniWorkspace/     ← Tabbed mini panel workspace (Notes, Search, Bookmarks)
    │       └── MiniWorkspace.tsx
    ├── services/              ← Synced transcript fetching layer
    │   └── transcript.ts
    ├── providers/             ← Multi-site DOM selector wrappers (YouTube, Udemy, Coursera)
    │   ├── VideoProvider.ts
    │   ├── registry.ts
    │   ├── YouTubeProvider.ts
    │   ├── UdemyProvider.ts
    │   ├── CourseraProvider.ts
    │   ├── NetflixProvider.ts
    │   ├── PrimeVideoProvider.ts
    │   ├── SkillshareProvider.ts
    │   └── GenericHTML5Provider.ts
    ├── store/                 ← Zustand shared state management
    └── storage/               
        ├── settings.ts        ← Device synced storage (chrome.storage.sync)
        ├── positionStore.ts   ← Local position tracker (chrome.storage.local)
        └── db.ts              ← IndexedDB notes & bookmarks database
```

---

## 💻 Technical Architecture & Development Guide

### 🧱 Core Architecture
1. **Direct Native Picture-in-Picture**: By triggering `video.requestPictureInPicture()` synchronously on the original video element, the browser handles the float natively. This bypasses DRM restrictions (allowing Netflix and Prime Video to float natively rather than showing a black screen) and CORS issues.
2. **Background Message Bus**: The background service worker (`src/background/index.ts`) acts as a central router. It redirects state updates between the Content Script (which controls the video) and the active extension panels (Popup, Side Panel, Options).
3. **Database Layer (IndexedDB)**: Notes and Bookmarks are stored in client-side IndexedDB using the `idb` wrapper, ensuring high performance and offline persistence.
4. **Settings Sync**: User configurations are saved using Chrome's Synced Storage (`chrome.storage.sync`) so settings propagate across multiple logged-in browsers.

### 🧪 Local Standalone Preview Mode
Developing Chrome Extensions can be tedious due to constant compilation and reloading. To streamline this, FloatTube AI is designed with an **Extension API Availability Guard**.
If you run the app outside of Chrome's extension manager (e.g., in a standard local HTTP web server):
* It automatically falls back from `chrome.storage.sync` and `chrome.storage.local` to standard browser `localStorage`.
* It falls back from Chrome's Extension message channels to standard DOM event dispatching.
* This allows you to preview the popup, options dashboard, and sidepanel dynamically inside standard browser tabs without needing to package them.

### 🛠️ Developer Build Commands
For developers editing or modifying the code, use the following package commands:
* **Install Packages**: `npm install`
* **Development Build (Fast)**: `npm run build:fast`
  * Compiles code using Vite without running strict TypeScript type checking.
* **Production Build (Strict)**: `npm run build`
  * Runs strict TypeScript type-checking (`tsc --noEmit`) and compiles final minimized assets into `/dist`.
* **Watch Mode**: `npm run dev`
  * Keeps the compiler active, rebuilding the `/dist` directory automatically upon edits.

---

## ❓ Troubleshooting & FAQs

* **Why does the extension popup show "No video detected"?**
  If you just loaded/reloaded the extension, your active browser tab needs to be refreshed once so Chrome can inject the script. Alternatively, clicking **"Start Floating"** in the popup will auto-inject the script and trigger the native PiP without a refresh!
* **How do I make the video float automatically when I switch tabs?**
  To enable seamless auto-floating:
  1. Open Chrome and go to `chrome://flags/#auto-picture-in-picture-for-video-playback`.
  2. Change the dropdown setting from **Default** to **Enabled**.
  3. Relaunch Google Chrome.
  4. Tabbing away from any active video will now automatically open a native PiP window!
* **The transcript is loading infinitely / showing "No transcript available".**
  FloatTube AI extracts captions using YouTube's timedtext metadata. If the video does not have native captions or auto-generated English captions enabled, the transcript panel will display a "No transcript available" message.
* **Why does Netflix or Amazon Prime show a black screen in the float?**
  Netflix and Amazon Prime use Digital Rights Management (DRM) which restricts stream capture via `captureStream` for copyright protection. To bypass this, the extension automatically detects the DRM block and falls back to **Controller Mode**. In Controller Mode, the video plays on the host tab while the floating player operates as a synced remote control board, allowing you to play, pause, take notes, and read transcripts without hitting DRM blocks.
* **How do I update the extension after making code changes?**
  Run `npm run build` to compile your latest edits. Then open `chrome://extensions` and click the **Reload** (circular arrow) icon on the **FloatTube AI** card.

---

## 👤 Author

**Babul Kumar**
