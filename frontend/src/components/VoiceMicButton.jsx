// src/components/VoiceMicButton.jsx
// Hold-to-record mic button using Web Speech API (browser-native, no backend needed).
// Props:
//   onTranscript(text) — called with final transcript when recording stops
//   onError(msg)       — called on recognition errors
//   disabled           — disables the button (e.g. while parsing)

import { useRef, useState, useCallback } from "react";

const isSpeechSupported =
  typeof window !== "undefined" &&
  ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

const STATES = {
  IDLE: "idle",
  LISTENING: "listening",
  PROCESSING: "processing",
};

export default function VoiceMicButton({ onTranscript, onError, disabled = false, theme = "purple" }) {
  // sky theme: matches ChatPanel's sky-blue palette
  const t = theme === "sky"
    ? { idle: "bg-sky-600/30 border-sky-400/50 hover:bg-sky-500/40", listening: "bg-red-500", ring: "bg-sky-400/30", icon: "text-sky-200", label: "text-sky-300/60", listeningLabel: "text-red-400", processingLabel: "text-sky-400" }
    : { idle: "bg-purple-600/30 border-purple-400/50 hover:bg-purple-500/40", listening: "bg-red-500", ring: "bg-red-400/30", icon: "text-purple-200", label: "text-purple-300/60", listeningLabel: "text-red-400", processingLabel: "text-purple-400" };
  const [recState, setRecState] = useState(STATES.IDLE);
  const recognitionRef = useRef(null);
  const transcriptRef = useRef("");

  const startListening = useCallback(() => {
    if (!isSpeechSupported) {
      onError?.("Speech recognition isn't supported in this browser. Try Chrome or Edge.");
      return;
    }
    if (recState !== STATES.IDLE) return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    transcriptRef.current = "";

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => setRecState(STATES.LISTENING);

    recognition.onresult = (e) => {
      let full = "";
      for (let i = 0; i < e.results.length; i++) {
        full += e.results[i][0].transcript;
      }
      transcriptRef.current = full;
    };

    recognition.onerror = (e) => {
      const msg =
        e.error === "not-allowed"
          ? "Microphone access was denied. Please allow it in your browser settings."
          : e.error === "no-speech"
          ? "No speech detected. Try again."
          : `Speech recognition error: ${e.error}`;
      onError?.(msg);
      setRecState(STATES.IDLE);
    };

    recognition.onend = () => {
      const text = transcriptRef.current.trim();
      setRecState(STATES.PROCESSING);
      if (text) {
        onTranscript?.(text);
      } else {
        onError?.("Nothing was captured. Try speaking after the mic activates.");
      }
      // Reset to idle after a short delay so the processing pulse is visible
      setTimeout(() => setRecState(STATES.IDLE), 600);
    };

    recognition.start();
  }, [recState, onTranscript, onError]);

  const stopListening = useCallback(() => {
    if (recState !== STATES.LISTENING) return;
    recognitionRef.current?.stop();
  }, [recState]);

  // ── Derived UI state ─────────────────────────────────────────────────────
  const isListening = recState === STATES.LISTENING;
  const isProcessing = recState === STATES.PROCESSING;
  const isDisabled = disabled || !isSpeechSupported || isProcessing;

  const label = isListening
    ? "Release to stop"
    : isProcessing
    ? "Processing…"
    : !isSpeechSupported
    ? "Not supported"
    : "Hold to speak";

  return (
    <div className="flex flex-col items-center gap-2 select-none">
      {/* Mic button */}
      <button
        type="button"
        aria-label={label}
        disabled={isDisabled}
        onMouseDown={startListening}
        onMouseUp={stopListening}
        onMouseLeave={stopListening}
        onTouchStart={(e) => { e.preventDefault(); startListening(); }}
        onTouchEnd={(e) => { e.preventDefault(); stopListening(); }}
        className={[
          "relative h-12 w-12 rounded-full transition-all duration-150 grid place-items-center",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400",
          isListening
            ? `${t.listening} scale-110 shadow-[0_0_20px_rgba(239,68,68,0.6)]`
            : isProcessing
            ? "bg-white/10 scale-100 cursor-wait"
            : isDisabled
            ? "bg-white/10 cursor-not-allowed opacity-40"
            : `${t.idle} border hover:scale-105 active:scale-95 cursor-pointer`,
        ].join(" ")}
      >
        {/* Pulse rings when listening */}
        {isListening && (
          <>
            <span className={`absolute inset-0 rounded-full ${t.ring} animate-ping`} />
            <span className="absolute inset-[-6px] rounded-full border border-red-400/40 animate-ping [animation-delay:150ms]" />
          </>
        )}

        {/* Icon */}
        {isProcessing ? (
          <svg
            className="h-5 w-5 text-purple-200 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`h-5 w-5 transition-colors ${isListening ? "text-white" : t.icon}`}
          >
            <rect x="9" y="3" width="6" height="11" rx="3" />
            <path d="M5 10a7 7 0 0014 0" />
            <line x1="12" y1="19" x2="12" y2="22" />
            <line x1="9" y1="22" x2="15" y2="22" />
          </svg>
        )}
      </button>

      {/* Label */}
      <span
        className={`text-[11px] font-medium tracking-wide transition-colors ${
          isListening ? t.listeningLabel : isProcessing ? t.processingLabel : t.label
        }`}
      >
        {label}
      </span>
    </div>
  );
}