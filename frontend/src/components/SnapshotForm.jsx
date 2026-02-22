// src/components/SnapshotForm.jsx
// Reusable form for creating (and optionally editing) a snapshot.
// Props:
//   initial    — pre-populated values (for edit mode)
//   onSave(fields) — called with validated form data
//   loading    — disables submit button while saving

import { useState } from 'react';

const EMPTY = { name: '', notes: '', urlInput: '', urls: [], tags: '' };

export default function SnapshotForm({ initial = {}, onSave, loading = false }) {
  const [name,     setName]     = useState(initial.name  ?? '');
  const [notes,    setNotes]    = useState(initial.notes ?? '');
  const [urls,     setUrls]     = useState(initial.urls  ?? []);
  const [urlInput, setUrlInput] = useState('');
  const [tags,     setTags]     = useState((initial.tags ?? []).join(', '));
  const [error,    setError]    = useState('');

  // ── URL helpers ──────────────────────────────────────────────────────────
  const addUrl = () => {
    const u = urlInput.trim();
    if (!u) return;
    try { new URL(u); } catch { setError('Enter a valid URL (include https://)'); return; }
    setUrls(prev => [...prev, u]);
    setUrlInput('');
    setError('');
  };

  const removeUrl = (i) => setUrls(prev => prev.filter((_, idx) => idx !== i));

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Task name is required.'); return; }
    setError('');
    onSave({
      name:  name.trim(),
      notes: notes.trim(),
      urls,
      tags:  tags.split(',').map(t => t.trim()).filter(Boolean),
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
          onChange={e => setName(e.target.value)}
          placeholder="What are you working on?"
          className="input text-base"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes / next steps</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={4}
          placeholder="Where did you leave off? What's the next step?"
          className="input resize-none"
        />
      </div>

      {/* URLs */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">URLs</label>
        <div className="flex gap-2">
          <input
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addUrl(); } }}
            placeholder="https://github.com/org/repo/pull/42"
            className="input"
          />
          <button type="button" onClick={addUrl} className="btn-secondary shrink-0">
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
          onChange={e => setTags(e.target.value)}
          placeholder="auth, backend, urgent"
          className="input"
        />
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 text-base">
        {loading ? 'Saving…' : '💾  Save Snapshot'}
      </button>
    </form>
  );
}