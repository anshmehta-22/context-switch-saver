// src/pages/SnapshotDetailPage.jsx
// Full detail view — view + inline-edit notes, change status, delete.

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import StatusBadge from "../components/StatusBadge";
import * as api from "../api";
import toast from "react-hot-toast";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const STATUS_OPTIONS = ["active", "paused", "complete"];

export default function SnapshotDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [snap, setSnap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState("");

  // ── Fetch ────────────────────────────────────────────────────────────────
  useEffect(() => {
    api
      .getSnapshot(id)
      .then((data) => {
        setSnap(data);
        setNotes(data.notes);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const update = async (fields) => {
    try {
      const updated = await api.updateSnapshot(id, fields);
      setSnap(updated);
      if (fields.notes !== undefined) setNotes(updated.notes);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async () => {
    try {
      await api.deleteSnapshot(id);

      toast.success("Snapshot deleted");

      setTimeout(() => {
        navigate("/");
      }, 200);
    } catch (err) {
      toast.error(err.message || "Failed to delete snapshot");
    }
  };

  const saveNotes = () => {
    update({ notes });
    setEditingNotes(false);
  };

  const openAll = () =>
    snap.urls?.forEach((u) => window.open(u, "_blank", "noopener"));

  // ── Render ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-xl mx-auto space-y-4">
        <Skeleton height={30} width="60%" />
        <Skeleton height={20} width="40%" />
        <Skeleton height={100} />
        <Skeleton height={20} width="80%" />
      </div>
    );
  }
  if (error)
    return <p className="text-red-500 text-sm py-12 text-center">{error}</p>;
  if (!snap) return null;

  return (
    <div className="max-w-xl mx-auto">
      <button
        onClick={() => navigate("/")}
        className="text-sm text-indigo-600 hover:underline mb-4 inline-block"
      >
        ← Back
      </button>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-xl font-bold text-gray-900 leading-snug">
            {snap.name}
          </h1>
          <select
            value={snap.status}
            onChange={(e) => update({ status: e.target.value })}
            className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 shrink-0"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* ── Notes ── */}
        <section>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Notes
            </h2>
            {editingNotes ? (
              <button
                onClick={saveNotes}
                className="text-xs text-indigo-600 hover:underline font-semibold"
              >
                Save
              </button>
            ) : (
              <button
                onClick={() => setEditingNotes(true)}
                className="text-xs text-gray-400 hover:text-indigo-600"
              >
                Edit
              </button>
            )}
          </div>
          {editingNotes ? (
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              className="input resize-none text-sm"
              autoFocus
            />
          ) : (
            <p className="text-sm text-gray-700 whitespace-pre-wrap min-h-[2rem]">
              {snap.notes || (
                <span className="text-gray-400 italic">
                  No notes — click Edit to add some.
                </span>
              )}
            </p>
          )}
        </section>

        {/* ── URLs ── */}
        {snap.urls?.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                URLs ({snap.urls.length})
              </h2>
              <button
                onClick={openAll}
                className="text-xs text-indigo-600 hover:underline"
              >
                Open all ↗
              </button>
            </div>
            <ul className="space-y-1">
              {snap.urls.map((u, i) => (
                <li key={i}>
                  <a
                    href={u}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-indigo-600 hover:underline truncate block"
                  >
                    {u}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ── Files ── */}
        {snap.files?.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Files
            </h2>
            <ul className="space-y-1">
              {snap.files.map((f, i) => (
                <li
                  key={i}
                  className="text-xs font-mono text-gray-700 bg-gray-50 rounded px-2 py-1"
                >
                  {f.path}
                  <span className="text-gray-400">
                    :{f.line}:{f.col}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ── Tags ── */}
        {snap.tags?.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Tags
            </h2>
            <div className="flex gap-1 flex-wrap">
              {snap.tags.map((t) => (
                <span
                  key={t}
                  className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full"
                >
                  {t}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* ── Meta ── */}
        <div className="text-xs text-gray-400 space-y-0.5 border-t border-gray-100 pt-4">
          <p>Created: {new Date(snap.createdAt).toLocaleString()}</p>
          <p>Updated: {new Date(snap.updatedAt).toLocaleString()}</p>
        </div>

        {/* ── Danger zone ── */}
        <button
          onClick={handleDelete}
          className="text-sm text-red-400 hover:text-red-600 hover:underline transition"
        >
          Delete snapshot
        </button>
      </div>
    </div>
  );
}
