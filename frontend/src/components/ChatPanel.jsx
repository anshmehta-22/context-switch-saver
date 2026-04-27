// src/components/ChatPanel.jsx
// AI-powered snapshot creation panel with parse → preview → save flow.

import { useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { parseSnapshotInput, createSnapshot } from "../api";

// ── Inline mic square (rounded square, matches attachment icon style) ──────────
const isSpeechSupported =
  typeof window !== "undefined" &&
  ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

function MicSquare({ onTranscript, onError, disabled }) {
  const [listening, setListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const recognitionRef = useRef(null);
  const transcriptRef = useRef("");

  const start = useCallback(() => {
    console.log(
      "🎤 START called - listening:",
      listening,
      "processing:",
      processing,
    );
    if (!isSpeechSupported) {
      console.log("❌ Speech not supported");
      onError?.("Speech recognition not supported in this browser.");
      return;
    }
    if (listening || processing) {
      console.log("❌ Already listening or processing");
      return;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const r = new SR();
    recognitionRef.current = r;
    transcriptRef.current = "";
    r.continuous = true;
    r.interimResults = true;
    r.lang = "en-US";

    r.onstart = () => {
      console.log("✅ Speech recognition started");
      setListening(true);
    };

    r.onresult = (e) => {
      let t = "";
      for (let i = 0; i < e.results.length; i++)
        t += e.results[i][0].transcript;
      transcriptRef.current = t;
      console.log("📝 Captured:", t);
    };

    r.onerror = (e) => {
      console.error("❌ Speech error:", e.error);
      const msg =
        e.error === "not-allowed"
          ? "Mic access denied. Please allow microphone permissions."
          : e.error === "no-speech"
            ? "No speech detected. Please try again."
            : `Error: ${e.error}`;
      onError?.(msg);
      setListening(false);
    };

    r.onend = () => {
      console.log(
        "🛑 Speech recognition ended, transcript:",
        transcriptRef.current,
      );
      setListening(false);
      setProcessing(true);
      const text = transcriptRef.current.trim();
      if (text) {
        console.log("✅ Processing transcript:", text);
        onTranscript?.(text);
      } else {
        console.log("⚠️ No transcript captured");
        onError?.(
          "Nothing captured. Try speaking and click the button to stop.",
        );
      }
      setTimeout(() => setProcessing(false), 500);
    };

    try {
      console.log("🚀 Starting speech recognition...");
      r.start();
    } catch (err) {
      console.error("💥 Failed to start:", err);
      onError?.("Failed to start recording. Please try again.");
    }
  }, [listening, processing, onTranscript, onError]);

  const stop = useCallback(() => {
    console.log("⏹️ STOP called, listening:", listening);
    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, [listening]);

  const isDisabled = disabled || !isSpeechSupported || processing;

  return (
    <>
      <style>{`
        @keyframes mic-ping { 0%{transform:scale(1);opacity:.7} 100%{transform:scale(1.45);opacity:0} }
        @keyframes mic-spin { to{transform:rotate(360deg)} }
      `}</style>
      <button
        type="button"
        aria-label={listening ? "Click to stop" : "Click to speak"}
        disabled={isDisabled}
        onClick={() => {
          console.log("🔘 Button clicked! listening:", listening);
          if (listening) {
            stop();
          } else {
            start();
          }
        }}
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "0.625rem",
          border: listening
            ? "1px solid rgba(239,68,68,0.55)"
            : "1px solid rgba(56,189,248,0.22)",
          background: listening
            ? "rgba(239,68,68,0.18)"
            : "rgba(56,189,248,0.07)",
          color: listening ? "#fca5a5" : "rgba(125,211,252,0.75)",
          cursor: isDisabled ? "not-allowed" : "pointer",
          opacity: isDisabled && !listening ? 0.4 : 1,
          display: "grid",
          placeItems: "center",
          position: "relative",
          transition: "border-color 0.15s, background 0.15s, box-shadow 0.15s",
          boxShadow: listening ? "0 0 10px rgba(239,68,68,0.3)" : "none",
          flexShrink: 0,
        }}
      >
        {listening && (
          <span
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "0.625rem",
              background: "rgba(239,68,68,0.12)",
              animation: "mic-ping 1s cubic-bezier(0,0,0.2,1) infinite",
            }}
          />
        )}

        {processing ? (
          <svg
            style={{
              width: 18,
              height: 18,
              animation: "mic-spin 0.8s linear infinite",
            }}
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
              strokeOpacity="0.2"
            />
            <path
              d="M4 12a8 8 0 018-8"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="9" y="3" width="6" height="11" rx="3" />
            <path d="M5 10a7 7 0 0014 0" />
            <line x1="12" y1="19" x2="12" y2="22" />
            <line x1="9" y1="22" x2="15" y2="22" />
          </svg>
        )}
      </button>
    </>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────
export default function ChatPanel({ onSnapshotCreated }) {
  const navigate = useNavigate();

  const [state, setState] = useState("idle");
  const [input, setInput] = useState("");
  const [parsedData, setParsedData] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const handleParse = async (text) => {
    const value = (text ?? input).trim();
    if (!value) return;
    setError("");
    setIsParsing(true);
    try {
      const result = await parseSnapshotInput(value);
      setParsedData(result);
      setState("preview");
    } catch (err) {
      setError(err.message || "Failed to parse input");
    } finally {
      setIsParsing(false);
    }
  };

  const handleVoiceTranscript = (text) => {
    setInput(text);
    handleParse(text);
  };
  const handleVoiceError = (msg) => setError(msg);

  const handleSave = async () => {
    setError("");
    setIsSaving(true);
    try {
      const created = await createSnapshot(parsedData);
      setState("success");
      if (onSnapshotCreated) onSnapshotCreated(created);
    } catch (err) {
      setError(err.message || "Failed to save snapshot");
      setIsSaving(false);
    }
  };

  const handleEdit = () => navigate("/new", { state: parsedData });

  const handleReset = () => {
    setState("idle");
    setInput("");
    setParsedData(null);
    setError("");
    setIsSaving(false);
  };

  return (
    <div
      style={{
        background:
          "linear-gradient(145deg, #080e1a 0%, #060c16 60%, #091020 100%)",
        border: "1px solid rgba(56,189,248,0.28)",
        borderRadius: "1rem",
        boxShadow:
          "0 0 28px rgba(56,189,248,0.05), inset 0 1px 0 rgba(125,211,252,0.07)",
        padding: "1.25rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          borderRadius: "1rem",
          backgroundImage:
            "radial-gradient(ellipse at 25% 20%, rgba(56,189,248,0.07) 0%, transparent 55%), radial-gradient(ellipse at 80% 85%, rgba(14,165,233,0.05) 0%, transparent 50%)",
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        <p className="text-xs text-sky-300 mb-1">AI Assistant</p>
        <p className="text-[11px] text-sky-200/50 mb-3">
          Turn messy thoughts into structured snapshots
        </p>

        {/* ── STATE 1: idle ── */}
        {state === "idle" && (
          <>

            <textarea
              id="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe what you're working on… e.g. fixing JWT auth bug, blocked on refresh token, need to check the /api/login route"
              rows={6}
              disabled={isParsing}
              style={{
                background: "rgba(56,189,248,0.05)",
                border: "1px solid rgba(56,189,248,0.18)",
                borderRadius: "0.625rem",
                color: "rgba(186,230,253,0.85)",
                padding: "0.875rem",
                fontSize: "0.875rem",
                resize: "none",
                width: "100%",
                outline: "none",
                lineHeight: "1.6",
                boxSizing: "border-box",
              }}
              onFocus={(e) =>
                (e.target.style.borderColor = "rgba(56,189,248,0.35)")
              }
              onBlur={(e) =>
                (e.target.style.borderColor = "rgba(56,189,248,0.18)")
              }
            />
            <style>{`#chat-input::placeholder { color: rgba(56,189,248,0.30); }`}</style>

            {error && (
              <p
                style={{
                  color: "#f87171",
                  fontSize: "0.75rem",
                  marginTop: "0.5rem",
                }}
              >
                {error}
              </p>
            )}

            {/* ── Action row: Generate (left) · Mic square (right) ── */}
            <div
              style={{
                display: "flex",
                gap: "0.625rem",
                marginTop: "0.50rem",
                alignItems: "center",
              }}
            >
              <button
                onClick={() => handleParse()}
                disabled={isParsing || !input.trim()}
                style={{
                  flex: 1,
                  height: "48px",
                  background:
                    "linear-gradient(135deg, #0369a1 0%, #0ea5e9 50%, #0369a1 100%)",
                  color: "#fff",
                  fontWeight: "600",
                  border: "none",
                  borderRadius: "0.625rem",
                  padding: "0 1rem",
                  cursor:
                    isParsing || !input.trim() ? "not-allowed" : "pointer",
                  fontSize: "0.875rem",
                  opacity: isParsing || !input.trim() ? 0.6 : 1,
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (!isParsing && input.trim())
                    e.target.style.opacity = "0.9";
                }}
                onMouseLeave={(e) => {
                  if (!isParsing && input.trim()) e.target.style.opacity = "1";
                }}
              >
                {isParsing ? "Generating…" : "Generate Snapshot"}
              </button>

              {/* Mic square — right side */}
              <MicSquare
                onTranscript={handleVoiceTranscript}
                onError={handleVoiceError}
                disabled={isParsing}
              />
            </div>
          </>
        )}

        {/* ── STATE 2: preview ── */}
        {state === "preview" && parsedData && (
          <>
            <div
              style={{
                background: "rgba(56,189,248,0.06)",
                border: "1px solid rgba(56,189,248,0.18)",
                borderRadius: "0.625rem",
                padding: "1rem",
                marginBottom: "0.75rem",
              }}
            >
              <h3
                style={{
                  color: "#7dd3fc",
                  fontWeight: "600",
                  fontSize: "0.9rem",
                  margin: "0 0 6px",
                }}
              >
                {parsedData.name}
              </h3>
              {parsedData.notes && (
                <p
                  style={{
                    color: "rgba(186,230,253,0.60)",
                    fontSize: "0.8rem",
                    margin: "0 0 8px",
                  }}
                >
                  {parsedData.notes}
                </p>
              )}
              {parsedData.tags?.length > 0 && (
                <div style={{ marginBottom: "8px" }}>
                  {parsedData.tags.map((tag, i) => (
                    <span
                      key={i}
                      style={{
                        display: "inline-block",
                        background: "rgba(56,189,248,0.10)",
                        border: "1px solid rgba(56,189,248,0.22)",
                        color: "#38bdf8",
                        borderRadius: "9999px",
                        fontSize: "0.72rem",
                        padding: "2px 10px",
                        marginRight: "4px",
                        marginBottom: "4px",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              {parsedData.urls?.length > 0 &&
                parsedData.urls.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "#38bdf8",
                      fontSize: "0.8rem",
                      display: "block",
                      marginBottom: "2px",
                      textDecoration: "none",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {url}
                  </a>
                ))}
            </div>

            {error && (
              <p
                style={{
                  color: "#f87171",
                  fontSize: "0.75rem",
                  marginBottom: "0.75rem",
                }}
              >
                {error}
              </p>
            )}

            <button
              onClick={handleSave}
              disabled={isSaving}
              style={{
                background:
                  "linear-gradient(135deg, #0369a1 0%, #0ea5e9 50%, #0369a1 100%)",
                color: "#fff",
                fontWeight: "600",
                border: "none",
                borderRadius: "0.625rem",
                padding: "0.625rem",
                width: "100%",
                cursor: isSaving ? "not-allowed" : "pointer",
                opacity: isSaving ? 0.6 : 1,
                marginBottom: "0.5rem",
                fontSize: "0.875rem",
              }}
              onMouseEnter={(e) => {
                if (!isSaving) e.target.style.opacity = "0.9";
              }}
              onMouseLeave={(e) => {
                if (!isSaving) e.target.style.opacity = "1";
              }}
            >
              {isSaving ? "Saving…" : "Save Snapshot"}
            </button>

            <button
              onClick={handleEdit}
              disabled={isSaving}
              style={{
                background: "transparent",
                border: "1px solid rgba(56,189,248,0.22)",
                color: "rgba(125,211,252,0.65)",
                borderRadius: "0.625rem",
                padding: "0.625rem",
                width: "100%",
                cursor: isSaving ? "not-allowed" : "pointer",
                opacity: isSaving ? 0.5 : 1,
                fontSize: "0.8rem",
              }}
              onMouseEnter={(e) => {
                if (!isSaving)
                  e.target.style.background = "rgba(56,189,248,0.08)";
              }}
              onMouseLeave={(e) => {
                if (!isSaving) e.target.style.background = "transparent";
              }}
            >
              Edit manually
            </button>
          </>
        )}

        {/* ── STATE 3: success ── */}
        {state === "success" && (
          <div style={{ textAlign: "center" }}>
            <p
              style={{
                color: "#38bdf8",
                fontWeight: "600",
                fontSize: "0.95rem",
                marginBottom: "1rem",
              }}
            >
              <span style={{ marginRight: "0.5rem" }}>✓</span>Snapshot saved
            </p>
            <button
              onClick={handleReset}
              style={{
                background: "transparent",
                border: "1px solid rgba(56,189,248,0.22)",
                color: "rgba(125,211,252,0.65)",
                borderRadius: "0.625rem",
                padding: "0.625rem 1.5rem",
                cursor: "pointer",
                fontSize: "0.8rem",
              }}
              onMouseEnter={(e) =>
                (e.target.style.background = "rgba(56,189,248,0.08)")
              }
              onMouseLeave={(e) => (e.target.style.background = "transparent")}
            >
              Save another
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
