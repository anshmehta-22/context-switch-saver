// src/components/SnapshotForm.jsx
// Reusable form for creating (and optionally editing) a snapshot.
// Props:
//   initial    — pre-populated values (for edit mode)
//   onSave(fields) — called with validated form data
//   loading    — disables submit button while saving

import { useRef, useState } from "react";

const EMPTY = { name: "", notes: "", urlInput: "", urls: [], tags: "" };
const MAX_ATTACHMENTS = 5;
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

export default function SnapshotForm({
  initial = {},
  onSave,
  loading = false,
}) {
  const [name, setName] = useState(initial.name ?? "");
  const [notes, setNotes] = useState(initial.notes ?? "");
  const [urls, setUrls] = useState(initial.urls ?? []);
  const [urlInput, setUrlInput] = useState("");
  const [tags, setTags] = useState((initial.tags ?? []).join(", "));
  const [attachments, setAttachments] = useState(initial.attachments ?? []);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  // ── URL helpers ──────────────────────────────────────────────────────────
  const addUrl = () => {
    const u = urlInput.trim();
    if (!u) return;
    try {
      new URL(u);
    } catch {
      setError("Enter a valid URL (include https://)");
      return;
    }
    setUrls((prev) => [...prev, u]);
    setUrlInput("");
    setError("");
  };

  const removeUrl = (i) =>
    setUrls((prev) => prev.filter((_, idx) => idx !== i));

  // ── Attachment helpers ───────────────────────────────────────────────────
  const addAttachment = (file) => {
    if (!file.type.startsWith("image/")) {
      setError("Only image files can be attached as screenshots.");
      return;
    }

    if (file.size > MAX_ATTACHMENT_BYTES) {
      setError("Each screenshot must be smaller than 5MB.");
      return;
    }

    if (attachments.length >= MAX_ATTACHMENTS) {
      setError(`You can attach up to ${MAX_ATTACHMENTS} screenshots.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachments((prev) => [
        ...prev,
        {
          id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${file.name}`,
          name: file.name,
          mimeType: file.type,
          size: file.size,
          dataUrl: String(reader.result || ""),
        },
      ]);
      setError("");
    };
    reader.onerror = () => setError("Failed to read screenshot file.");
    reader.readAsDataURL(file);
  };

  const handleAttachmentInput = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    addAttachment(file);
    e.target.value = "";
  };

  const removeAttachment = (attachmentId) => {
    setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Task name is required.");
      return;
    }
    setError("");
    onSave({
      name: name.trim(),
      notes: notes.trim(),
      urls,
      attachments,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Task name <span className="text-red-500">*</span>
        </label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="What are you working on?"
          className="input text-base"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes / next steps
        </label>
        <div className="relative">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Where did you leave off? What's the next step?"
            className="input resize-none pr-14 pb-14"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-3 right-3 h-10 w-10 rounded-lg border border-gray-300 bg-white/90 text-gray-700 hover:border-indigo-400 hover:text-indigo-600 transition grid place-items-center"
            aria-label="Attach screenshot"
            title="Attach screenshot"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.6 13.4 8 16a3.5 3.5 0 0 1-5-5l4.2-4.2a3.5 3.5 0 0 1 5 0"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.4 10.6 16 8a3.5 3.5 0 1 1 5 5l-4.2 4.2a3.5 3.5 0 0 1-5 0"
              />
            </svg>
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleAttachmentInput}
          className="hidden"
          aria-label="Attach screenshot"
        />

        {attachments.length > 0 && (
          <ul className="mt-3 grid grid-cols-2 gap-2">
            {attachments.map((a) => (
              <li
                key={a.id}
                className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50"
              >
                <img
                  src={a.dataUrl}
                  alt={a.name || "Attached screenshot"}
                  className="w-full h-24 object-cover"
                />
                <div className="p-2 flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-600 truncate">
                    {a.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(a.id)}
                    className="text-gray-400 hover:text-red-500 transition shrink-0"
                    aria-label="Remove screenshot"
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* URLs */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          URLs
        </label>
        <div className="flex gap-2">
          <input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addUrl();
              }
            }}
            placeholder="https://github.com/org/repo/pull/42"
            className="input"
          />
          <button
            type="button"
            onClick={addUrl}
            className="btn-secondary shrink-0"
          >
            Add
          </button>
        </div>

        {urls.length > 0 && (
          <ul className="mt-2 space-y-1.5">
            {urls.map((u, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <span className="flex-1 truncate text-indigo-600">{u}</span>
                <button
                  type="button"
                  onClick={() => removeUrl(i)}
                  className="text-gray-400 hover:text-red-500 transition shrink-0"
                  aria-label="Remove URL"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tags <span className="text-xs text-gray-400">(comma separated)</span>
        </label>
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="auth, backend, urgent"
          className="input"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full py-2.5 text-base"
      >
        {loading ? "Saving…" : "💾  Save Snapshot"}
      </button>
    </form>
  );
}