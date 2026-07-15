# LectureMerge — UI

React TypeScript frontend for LectureMerge, a tool that merges a lecturer's spoken explanations into the right sections of a course PDF.

## What it does

Provides a two-screen interface:

1. **Upload screen** — student uploads a lecture audio recording and course PDF, the app handles transcription and semantic matching automatically
2. **Review screen** — split-screen interface showing PDF sections on the left, matched speech chunks in the center, and all transcript chunks on the right. Students can play audio for each chunk, remove irrelevant matches, drag chunks to reassign them to different sections, and add their own typed notes

When satisfied, the student downloads a merged HTML document with the original PDF content and the lecturer's spoken elaborations inserted under the right sections, visually distinguished by color.

## Tech Stack

- **React 18** + **TypeScript** — UI framework
- **Vite** — build tool
- **CSS Modules** — scoped component styling
- **Axios** — API communication
- **HTML5 Drag and Drop API** — chunk reassignment
- **Web Audio API** — inline audio playback per chunk

## Design

Minimal dark UI inspired by tools like Linear and Armin — tight spacing, monospace accents for machine-generated content (transcript text), high contrast, no visual noise.

## Setup

```bash
git clone https://github.com/LolaVictoria/lecturmerge-ui.git
cd lecturmerge-ui
npm install
npm run dev
```

Requires the LectureMerge backend running at `http://127.0.0.1:8000`.
See [lecturmerge-api](https://github.com/LolaVictoria/lecturemerger-api) for backend setup.

## Screens

### Upload Screen
- Audio file input (mp3, wav, m4a, webm, ogg)
- PDF file input
- Optional lecture title
- Real-time status updates through the pipeline (uploading → transcribing → parsing → matching)

### Review Screen
- Left sidebar: all PDF sections with speech/note counts
- Center panel: active section with PDF text, matched speech chunks (playable, removable, draggable), student notes
- Right panel: all transcript chunks, draggable to any section
- Confidence score bar on each chunk (colour-coded: indigo = high, amber = medium, red = low)
- Confirm button per section to track review progress
- Download button generates merged HTML document
