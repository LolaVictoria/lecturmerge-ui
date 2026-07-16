# LectureMerge UI

Frontend for **LectureMerge**, an application that automatically combines lecture recordings with course slides to produce richer lecture notes.

The interface guides students through uploading lecture material, reviewing AI-generated matches, and producing merged notes.

---

# Features

- Upload lecture recordings
- Upload lecture PDFs
- Automatic processing pipeline
- Interactive review interface
- Drag-and-drop transcript reassignment
- Confidence score visualization
- Inline audio playback
- Student notes
- Download merged lecture notes

---

# Motivation

Lecture recordings contain valuable explanations that rarely appear on lecture slides.

LectureMerge helps students by automatically attaching spoken explanations to the relevant sections of the course material while still allowing complete manual review.

---

# Tech Stack

| Technology | Purpose |
|------------|---------|
| React 18 | UI |
| TypeScript | Type safety |
| Vite | Build tool |
| Axios | API requests |
| CSS Modules | Component styling |
| HTML Drag & Drop API | Chunk reassignment |
| Web Audio API | Audio playback |

---

# Screens

## Upload Screen

Students upload:

- lecture recording
- lecture PDF
- optional lecture title

The application displays progress through:

```
Uploading
      ↓
Transcribing
      ↓
Parsing PDF
      ↓
Matching
      ↓
Ready for Review
```

---

## Review Screen

Three-panel interface.

### Left Panel

- PDF sections
- speech count
- note count

### Centre Panel

- section content
- attached transcript chunks
- student notes
- confirm section

### Right Panel

- all transcript chunks
- drag into any section
- remove incorrect matches
- replay audio

---

# User Workflow

```
Upload Audio
        │
        ▼
Upload PDF
        │
        ▼
Backend Processing
        │
        ▼
Review Matches
        │
        ▼
Move Chunks
        │
        ▼
Add Notes
        │
        ▼
Download Notes
```

---

# Project Structure

```text
lecturemerger-ui/

src/

├── components/
├── screens/
├── services/
├── hooks/
├── App.tsx
└── main.tsx
```

---

# Design

The interface follows a minimal editor-style layout inspired by tools such as Linear.

Design principles include:

- minimal visual noise
- keyboard-friendly workflow
- dark theme
- readable typography
- clear confidence indicators
- focus on content over decoration

---

# Confidence Scores

Each transcript chunk displays its semantic matching confidence.

| Colour | Meaning |
|----------|---------|
| Indigo | High confidence |
| Amber | Medium confidence |
| Red | Low confidence |

Students can manually reassign any chunk regardless of confidence.

---

# Running Locally

Clone the repository.

```bash
git clone https://github.com/LolaVictoria/lecturemerger-ui.git

cd lecturemerger-ui
```

Install packages.

```bash
npm install
```

Run the development server.

```bash
npm run dev
```

The frontend expects the backend to be running locally at

```
http://127.0.0.1:8000
```

---

# Backend

Backend repository:

https://github.com/LolaVictoria/lecturemerger-api

---

# Future Improvements

- Authentication
- User accounts
- Collaborative editing
- Search within notes
- PDF preview
- Responsive mobile layout
- Dark/light theme toggle
- Export to PDF
- Keyboard shortcuts

---

# License

MIT License.
