import { useState } from "react"
import axios from "axios"
import type { SessionData, TranscriptChunk, PdfSection } from "../types"
import styles from "./UploadScreen.module.css"

const API = "http://127.0.0.1:8000"

type Step = "idle" | "uploading_audio" | "transcribing" | "uploading_pdf" | "matching" | "done" | "error"

interface Props {
  onSessionReady: (data: SessionData) => void
}

export default function UploadScreen({ onSessionReady }: Props) {
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [title, setTitle] = useState<string>("")
  const [step, setStep] = useState<Step>("idle")
  const [error, setError] = useState<string>("")

  const getStatusLabel = (): string => {
    switch (step) {
      case "uploading_audio": return "Uploading audio..."
      case "transcribing": return "Transcribing — this takes a few minutes"
      case "uploading_pdf": return "Parsing PDF..."
      case "matching": return "Matching transcript to sections..."
      case "done": return "Ready to review"
      case "error": return error
      default: return ""
    }
  }

  const handleSubmit = async () => {
    if (!audioFile || !pdfFile) {
      setError("Please select both an audio file and a PDF")
      setStep("error")
      return
    }

    setError("")

    try {
      // Step 1: Upload audio
      setStep("uploading_audio")
      const audioForm = new FormData()
      audioForm.append("file", audioFile)
      if (title) audioForm.append("title", title)
      const audioRes = await axios.post(`${API}/recordings/`, audioForm)
      const newRecordingId: number = audioRes.data.id

      // Step 2: Poll for transcription
      setStep("transcribing")
      await new Promise<void>((resolve, reject) => {
        const interval = setInterval(async () => {
          try {
            const res = await axios.get(`${API}/recordings/${newRecordingId}`)
            if (res.data.status === "transcribed") {
              clearInterval(interval)
              resolve()
            } else if (res.data.status === "error") {
              clearInterval(interval)
              reject(new Error("Transcription failed — check your audio file"))
            }
          } catch {
            clearInterval(interval)
            reject(new Error("Lost connection to server"))
          }
        }, 3000)
      })

      // Step 3: Upload PDF and create merge session
      setStep("uploading_pdf")
      const pdfForm = new FormData()
      pdfForm.append("file", pdfFile)
      const sessionRes = await axios.post(
        `${API}/merge-sessions/?recording_id=${newRecordingId}`,
        pdfForm
      )
      const sessionId: number = sessionRes.data.id

      // Step 4: Run matching
      setStep("matching")
      await axios.post(`${API}/merge-sessions/${sessionId}/match`)

      // Step 5: Fetch all data for review screen
      const [chunksRes, sectionsRes] = await Promise.all([
        axios.get<TranscriptChunk[]>(`${API}/recordings/${newRecordingId}/chunks`),
        axios.get<PdfSection[]>(`${API}/merge-sessions/${sessionId}/sections`)
      ])

      setStep("done")
      onSessionReady({
        sessionId,
        recordingId: newRecordingId,
        sections: sectionsRes.data,
        chunks: chunksRes.data,
        audioFile
      })

    } catch (err: unknown) {
      setStep("error")
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Something went wrong")
      }
    }
  }

  const isLoading = ["uploading_audio", "transcribing", "uploading_pdf", "matching"].includes(step)

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.wordmark}>LectureMerge</div>
        <p className={styles.sub}>
          Upload a lecture recording and its PDF — we'll match the spoken explanation to the right sections.
        </p>

        <div className={styles.fields}>
          <div className={styles.field}>
            <label className={styles.label}>
              Lecture title <span className={styles.optional}>(optional)</span>
            </label>
            <input
              className={styles.input}
              type="text"
              placeholder="e.g. Psychology — Week 4"
              value={title}
              onChange={e => setTitle(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Audio recording</label>
            <label className={`${styles.fileInput} ${audioFile ? styles.fileSelected : ""}`}>
              <input
                type="file"
                accept=".mp3,.wav,.m4a,.webm,.ogg"
                onChange={e => setAudioFile(e.target.files?.[0] ?? null)}
                disabled={isLoading}
                hidden
              />
              {audioFile ? audioFile.name : "Choose audio file — mp3, wav, m4a"}
            </label>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Course PDF</label>
            <label className={`${styles.fileInput} ${pdfFile ? styles.fileSelected : ""}`}>
              <input
                type="file"
                accept=".pdf"
                onChange={e => setPdfFile(e.target.files?.[0] ?? null)}
                disabled={isLoading}
                hidden
              />
              {pdfFile ? pdfFile.name : "Choose PDF file"}
            </label>
          </div>
        </div>

        {step !== "idle" && (
          <div className={`${styles.status} ${step === "error" ? styles.statusError : ""}`}>
            {isLoading && <span className={styles.spinner} />}
            <span>{getStatusLabel()}</span>
          </div>
        )}

        <button
          className={styles.btn}
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? "Processing..." : "Start merge →"}
        </button>
      </div>
    </div>
  )
}