export interface Recording {
  id: number
  title: string | null
  audio_filename: string
  status: string
  created_at: string
}

export interface TranscriptChunk {
  id: number
  recording_id: number
  start_time: number
  end_time: number
  text: string
  matched_section_id: number | null
  match_confidence: number | null
}

export interface PdfSection {
  id: number
  merge_session_id: number
  order_index: number
  heading: string | null
  body_text: string
  page_number: number | null
}

export interface MergeSession {
  id: number
  recording_id: number
  pdf_filename: string
  status: string
  created_at: string
}

export interface SessionData {
  sessionId: number
  recordingId: number
  sections: PdfSection[]
  chunks: TranscriptChunk[]
  audioFile: File
}

export interface ChunkMap {
  [sectionId: number]: TranscriptChunk[]
}

export interface NoteMap {
  [sectionId: number]: string[]
}

export interface NoteInputMap {
  [sectionId: number]: string
}

export interface ConfirmedMap {
  [sectionId: number]: boolean
}