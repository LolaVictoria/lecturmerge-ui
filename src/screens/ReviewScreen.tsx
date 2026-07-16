import { useState, useRef, useEffect, useCallback }  from "react"
import type {
  SessionData,
  TranscriptChunk,
  ChunkMap,
  NoteMap,
  NoteInputMap,
  ConfirmedMap
} from "../types"
import styles from "./ReviewScreen.module.css"

//const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

interface ConfidenceBarProps {
  score: number
}

function ConfidenceBar({ score }: ConfidenceBarProps) {
  const pct = Math.round(score * 100)
  const color = score > 0.5
    ? "var(--accent)"
    : score > 0.3
    ? "#F5A623"
    : "var(--danger-text)"
  return (
    <div className={styles.confBar}>
      <div className={styles.confFill} style={{ width: `${pct}%`, background: color }} />
      <span className={styles.confLabel} style={{ color }}>{pct}%</span>
    </div>
  )
}

interface AudioPlayerProps {
  audioFile: File
  startTime: number
  endTime: number
}

function AudioPlayer({ audioFile, startTime, endTime }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [src, setSrc] = useState<string>("")

  useEffect(() => {
    const url = URL.createObjectURL(audioFile)
    setSrc(url)
    return () => URL.revokeObjectURL(url)
  }, [audioFile])

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      audio.currentTime = startTime
      audio.play()
      setPlaying(true)
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current && audioRef.current.currentTime >= endTime) {
      audioRef.current.pause()
      setPlaying(false)
    }
  }

  return (
    <div className={styles.audioPlayer}>
      {src && (
        <audio ref={audioRef} src={src} onTimeUpdate={handleTimeUpdate} hidden />
      )}
      <button
        className={`${styles.playBtn} ${playing ? styles.playing : ""}`}
        onClick={toggle}
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? "■" : "▶"}
      </button>
      <span className={styles.timestamp}>
        {formatTime(startTime)} – {formatTime(endTime)}
      </span>
    </div>
  )
}

interface Props {
  sessionData: SessionData
}

export default function ReviewScreen({ sessionData }: Props) {
  const {sections, chunks, audioFile } = sessionData

  const buildChunkMap = useCallback((): ChunkMap => {
    const map: ChunkMap = {}
    sections.forEach(s => { map[s.id] = [] })
    chunks.forEach(chunk => {
      if (chunk.matched_section_id !== null && map[chunk.matched_section_id]) {
        map[chunk.matched_section_id].push(chunk)
      }
    })
    return map
  }, [sections, chunks])

  const [chunkMap, setChunkMap] = useState<ChunkMap>(buildChunkMap)
  const [notes, setNotes] = useState<NoteMap>({})
  const [confirmed, setConfirmed] = useState<ConfirmedMap>({})
  const [activeSectionId, setActiveSectionId] = useState<number>(sections[0]?.id)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [noteInput, setNoteInput] = useState<NoteInputMap>({})
  const [dragChunk, setDragChunk] = useState<TranscriptChunk | null>(null)

  const confirmedCount = Object.values(confirmed).filter(Boolean).length
  const totalSections = sections.filter(s => s.body_text?.trim()).length

  const removeChunk = (sectionId: number, chunkId: number) => {
    setChunkMap(prev => ({
      ...prev,
      [sectionId]: prev[sectionId].filter(c => c.id !== chunkId)
    }))
  }

  const toggleConfirm = (sectionId: number) => {
    setConfirmed(prev => ({ ...prev, [sectionId]: !prev[sectionId] }))
  }

  const addNote = (sectionId: number) => {
    const text = noteInput[sectionId]?.trim()
    if (!text) return
    setNotes(prev => ({
      ...prev,
      [sectionId]: [...(prev[sectionId] || []), text]
    }))
    setNoteInput(prev => ({ ...prev, [sectionId]: "" }))
  }

  const removeNote = (sectionId: number, idx: number) => {
    setNotes(prev => ({
      ...prev,
      [sectionId]: prev[sectionId].filter((_, i) => i !== idx)
    }))
  }

  const moveChunk = (chunk: TranscriptChunk, targetSectionId: number) => {
    setChunkMap(prev => {
      const next = { ...prev }
      Object.keys(next).forEach(id => {
        next[Number(id)] = next[Number(id)].filter(c => c.id !== chunk.id)
      })
      if (next[targetSectionId]) {
        next[targetSectionId] = [...next[targetSectionId], chunk]
      }
      return next
    })
  }

  const handleDrop = (e: React.DragEvent, sectionId: number) => {
    e.preventDefault()
    if (dragChunk) {
      moveChunk(dragChunk, sectionId)
      setDragChunk(null)
    }
  }

  const generateOutput = async () => {
    setSaving(true)

    let html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Merged Lecture Notes</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Inter', system-ui, sans-serif;
    max-width: 760px;
    margin: 0 auto;
    padding: 48px 32px;
    color: #1a1a1a;
    line-height: 1.7;
    background: #FAFAFA;
  }
  .doc-header {
    border-bottom: 2px solid #E5E5E5;
    padding-bottom: 24px;
    margin-bottom: 40px;
  }
  .doc-label {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: #999;
    margin-bottom: 8px;
  }
  .doc-title {
    font-size: 26px;
    font-weight: 600;
    letter-spacing: -0.5px;
    color: #111;
  }
  .section {
    margin-bottom: 48px;
  }
  .section-meta {
    font-size: 11px;
    font-family: 'JetBrains Mono', monospace;
    color: #999;
    margin-bottom: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .section-heading {
    font-size: 18px;
    font-weight: 600;
    color: #111;
    letter-spacing: -0.3px;
    margin-bottom: 12px;
    line-height: 1.3;
  }
  .section-body {
    font-size: 14px;
    color: #444;
    line-height: 1.8;
    margin-bottom: 16px;
  }
  .speech-item {
    background: #EEF2FF;
    border-left: 3px solid #5B6EF5;
    padding: 12px 16px;
    border-radius: 0 6px 6px 0;
    margin: 10px 0;
  }
  .speech-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: #5B6EF5;
    margin-bottom: 6px;
  }
  .speech-text {
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    color: #2D3A8C;
    line-height: 1.6;
  }
  .speech-timestamp {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: #9CA3AF;
    margin-top: 6px;
  }
  .note-item {
    background: #F0FFF4;
    border-left: 3px solid #22C55E;
    padding: 12px 16px;
    border-radius: 0 6px 6px 0;
    margin: 10px 0;
  }
  .note-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: #22C55E;
    margin-bottom: 6px;
  }
  .note-text {
    font-size: 13px;
    color: #166534;
    line-height: 1.6;
  }
  .empty-section {
    font-size: 13px;
    color: #CCC;
    font-style: italic;
  }
</style>
</head>
<body>
<div class="doc-header">
  <div class="doc-label">Merged Lecture Notes</div>
  <div class="doc-title">Introduction to Psychology</div>
</div>`
    sections.forEach(section => {
      if (!section.body_text?.trim() && !section.heading?.trim()) return
      html += `<div class="section">`
      if (section.heading) html += `<div class="section-heading">${section.heading}</div>`
      if (section.body_text) html += `<div class="section-body">${section.body_text}</div>`

      const sectionChunks = chunkMap[section.id] || []
      sectionChunks.forEach(chunk => {
        html += `<div class="speech-item">
          <div class="speech-label">Lecturer</div>
          ${chunk.text}
          <div class="timestamp">${formatTime(chunk.start_time)} – ${formatTime(chunk.end_time)}</div>
        </div>`
      })

      const sectionNotes = notes[section.id] || []
      sectionNotes.forEach(note => {
        html += `<div class="note-item">
          <div class="note-label">Your note</div>
          ${note}
        </div>`
      })

      html += `</div>`
    })

    html += `</body></html>`

    const blob = new Blob([html], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "merged-lecture-notes.html"
    a.click()
    URL.revokeObjectURL(url)

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const activeSection = sections.find(s => s.id === activeSectionId)
  const activeChunks = chunkMap[activeSectionId] || []
  const activeNotes = notes[activeSectionId] || []

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.topbarLeft}>
          <span className={styles.wordmark}>LectureMerge</span>
          <span className={styles.divider} />
          <span className={styles.topbarLabel}>Review matches</span>
        </div>
        <div className={styles.topbarRight}>
          <span className={styles.progress}>
            {confirmedCount} / {totalSections} confirmed
          </span>
          <button
            className={`${styles.saveBtn} ${saved ? styles.savedBtn : ""}`}
            onClick={generateOutput}
            disabled={saving}
          >
            {saved ? "Downloaded ✓" : saving ? "Generating..." : "Download merged notes →"}
          </button>
        </div>
      </header>

      <div className={styles.body}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarLabel}>PDF Sections</div>
          {sections.map(section => {
            const hasChunks = (chunkMap[section.id] || []).length > 0
            const hasNotes = (notes[section.id] || []).length > 0
            const isConfirmed = confirmed[section.id]
            const isActive = section.id === activeSectionId
            return (
              <button
                key={section.id}
                className={`${styles.sectionBtn} ${isActive ? styles.sectionActive : ""} ${isConfirmed ? styles.sectionConfirmed : ""}`}
                onClick={() => setActiveSectionId(section.id)}
                onDragOver={e => e.preventDefault()}
                onDrop={e => handleDrop(e, section.id)}
              >
                <div className={styles.sectionBtnHeading}>
                  {section.heading || `Section ${section.order_index + 1}`}
                </div>
                <div className={styles.sectionBtnMeta}>
                  {hasChunks && (
                    <span className={styles.badge}>
                      {chunkMap[section.id].length} speech
                    </span>
                  )}
                  {hasNotes && (
                    <span className={styles.badge}>
                      {notes[section.id].length} note
                    </span>
                  )}
                  {isConfirmed && <span className={styles.confirmedBadge}>✓</span>}
                </div>
              </button>
            )
          })}
        </aside>

        <main className={styles.main}>
          {activeSection && (
            <>
              <div className={styles.sectionHeader}>
                <div>
                  <div className={styles.sectionPage}>Page {activeSection.page_number}</div>
                  <h2 className={styles.sectionTitle}>
                    {activeSection.heading || `Section ${activeSection.order_index + 1}`}
                  </h2>
                </div>
                <button
                  className={`${styles.confirmBtn} ${confirmed[activeSectionId] ? styles.confirmedBtn : ""}`}
                  onClick={() => toggleConfirm(activeSectionId)}
                >
                  {confirmed[activeSectionId] ? "✓ Confirmed" : "Confirm"}
                </button>
              </div>

              <div className={styles.pdfText}>
                {activeSection.body_text || (
                  <span className={styles.empty}>No body text in this section</span>
                )}
              </div>

              {activeChunks.length > 0 && (
                <div className={styles.itemsBlock}>
                  <div className={styles.blockLabel}>Matched speech</div>
                  {activeChunks.map(chunk => (
                    <div
                      key={chunk.id}
                      className={styles.speechItem}
                      draggable
                      onDragStart={() => setDragChunk(chunk)}
                    >
                      <div className={styles.speechText}>{chunk.text}</div>
                      <div className={styles.speechMeta}>
                        <AudioPlayer
                          audioFile={audioFile}
                          startTime={chunk.start_time}
                          endTime={chunk.end_time}
                        />
                        <ConfidenceBar score={chunk.match_confidence ?? 0} />
                        <button
                          className={styles.removeChunkBtn}
                          onClick={() => removeChunk(activeSectionId, chunk.id)}
                        >
                          ×
                        </button>
                      </div>
                      <div className={styles.dragHint}>drag to reassign</div>
                    </div>
                  ))}
                </div>
              )}

              {activeNotes.length > 0 && (
                <div className={styles.itemsBlock}>
                  <div className={styles.blockLabel}>Your notes</div>
                  {activeNotes.map((note, idx) => (
                    <div key={idx} className={styles.noteItem}>
                      <div className={styles.noteText}>{note}</div>
                      <button
                        className={styles.removeBtn}
                        onClick={() => removeNote(activeSectionId, idx)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className={styles.addNote}>
                <div className={styles.blockLabel}>Add a note</div>
                <div className={styles.noteInputRow}>
                  <textarea
                    className={styles.noteInput}
                    placeholder="Type your own explanation or clarification..."
                    value={noteInput[activeSectionId] || ""}
                    onChange={e => setNoteInput(prev => ({
                      ...prev,
                      [activeSectionId]: e.target.value
                    }))}
                    rows={3}
                  />
                  <button
                    className={styles.addNoteBtn}
                    onClick={() => addNote(activeSectionId)}
                    disabled={!noteInput[activeSectionId]?.trim()}
                  >
                    Add note
                  </button>
                </div>
              </div>
            </>
          )}
        </main>

        <aside className={styles.rightPanel}>
          <div className={styles.sidebarLabel}>All transcript chunks</div>
          <div className={styles.unmatchedHint}>
            Drag a chunk to a section on the left to reassign it
          </div>
          {chunks.map(chunk => {
            const isPlaced = Object.values(chunkMap).some(arr =>
              arr.some((c: { id: number }) => c.id === chunk.id)
            )
            return (
              <div
                key={chunk.id}
                className={`${styles.chunkCard} ${isPlaced ? styles.chunkPlaced : ""}`}
                draggable
                onDragStart={() => setDragChunk(chunk)}
              >
                <div className={styles.chunkText}>{chunk.text}</div>
                <div className={styles.chunkTime}>{formatTime(chunk.start_time)}</div>
                {isPlaced && <div className={styles.chunkPlacedLabel}>placed</div>}
              </div>
            )
          })}
        </aside>
      </div>
    </div>
  )
}