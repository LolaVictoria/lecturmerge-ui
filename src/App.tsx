import { useState } from "react"
import UploadScreen from "./screens/UploadScreen"
import ReviewScreen from "./screens/ReviewScreen"
import type { SessionData } from "./types"

export default function App() {
  const [screen, setScreen] = useState<"upload" | "review">("upload")
  const [sessionData, setSessionData] = useState<SessionData | null>(null)

  const handleSessionReady = (data: SessionData) => {
    setSessionData(data)
    setScreen("review")
  }

  return (
    <>
      {screen === "upload" && (
        <UploadScreen onSessionReady={handleSessionReady} />
      )}
      {screen === "review" && sessionData && (
        <ReviewScreen sessionData={sessionData} />
      )}
    </>
  )
}