// src/pages/SnapshotDetailPage.jsx
// Full detail view — view + inline-edit notes, change status, delete.

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import StatusBadge from "../components/StatusBadge";
import Silk from "../components/Silk";
import * as api from "../api";
import toast from "react-hot-toast";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import DeleteModal from "../components/DeleteModal";

const STATUS_OPTIONS = ["active", "paused", "complete"];

export default function SnapshotDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
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
    <div className="relative">
      {/* Silk background */}
      <div className="fixed inset-0 -z-10">
        <Silk
          speed={4}
          scale={1}
          color="#4B5563"
          noiseIntensity={1.5}
          rotation={0}
        />
      </div>
      <div className="fixed inset-0 -z-10 bg-black/30" />

      <div className="relative z-10 max-w-xl mx-auto">
        <div
          className="rounded-2xl p-6 shadow-sm space-y-6"
          style={{
            background: "rgba(15,10,30,0.65)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(139,92,246,0.25)",
          }}
        >
          {/* ── Header ── */}
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-xl font-bold text-white leading-snug">
              {snap.name}
            </h1>
            <select
              value={snap.status}
              onChange={(e) => update({ status: e.target.value })}
              className="text-sm rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500 shrink-0 text-purple-100"
              style={{
                background: "rgba(139,92,246,0.15)",
                border: "1px solid rgba(139,92,246,0.35)",
              }}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s} className="bg-[#1e1b4b]">
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* ── Notes ── */}
          <section>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-xs font-semibold text-purple-300/60 uppercase tracking-wider">
                Notes
              </h2>
              {editingNotes ? (
                <button
                  onClick={saveNotes}
                  className="text-xs text-purple-400 hover:text-purple-200 font-semibold transition"
                >
                  Save
                </button>
              ) : (
                <button
                  onClick={() => setEditingNotes(true)}
                  className="text-xs text-purple-300/50 hover:text-purple-300 transition"
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
                className="input resize-none text-sm w-full rounded-lg px-3 py-2 text-white placeholder-purple-300/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                style={{
                  background: "rgba(139,92,246,0.1)",
                  border: "1px solid rgba(139,92,246,0.35)",
                }}
                autoFocus
              />
            ) : (
              <p className="text-sm text-gray-200 whitespace-pre-wrap min-h-[2rem]">
                {snap.notes || (
                  <span className="text-purple-300/40 italic">
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
                <h2 className="text-xs font-semibold text-purple-300/60 uppercase tracking-wider">
                  URLs ({snap.urls.length})
                </h2>
                <button
                  onClick={openAll}
                  className="text-xs text-purple-400 hover:text-purple-200 transition"
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
                      className="text-sm text-purple-400 hover:text-purple-200 transition truncate block"
                    >
                      {u}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ── Screenshots ── */}
          {snap.attachments?.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-purple-300/60 uppercase tracking-wider mb-2">
                Screenshots ({snap.attachments.length})
              </h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {snap.attachments.map((a, i) => (
                  <li
                    key={a.id || `${a.name}-${i}`}
                    className="rounded-lg overflow-hidden border border-purple-500/30 bg-purple-500/5"
                  >
                    <a
                      href={a.dataUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <img
                        src={a.dataUrl}
                        alt={a.name || `Screenshot ${i + 1}`}
                        className="w-full h-36 object-cover"
                      />
                    </a>
                    <div className="px-2 py-1.5 text-xs text-purple-200 truncate">
                      {a.name || `Screenshot ${i + 1}`}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ── Files ── */}
          {snap.files?.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-purple-300/60 uppercase tracking-wider mb-2">
                Files
              </h2>
              <ul className="space-y-1">
                {snap.files.map((f, i) => (
                  <li
                    key={i}
                    className="text-xs font-mono text-purple-200 rounded px-2 py-1"
                    style={{ background: "rgba(139,92,246,0.1)" }}
                  >
                    {f.path}
                    <span className="text-purple-300/50">
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
              <h2 className="text-xs font-semibold text-purple-300/60 uppercase tracking-wider mb-2">
                Tags
              </h2>
              <div className="flex gap-1 flex-wrap">
                {snap.tags.map((t) => (
                  <span
                    key={t}
                    className="text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* ── Meta ── */}
          <div className="text-xs text-purple-300/40 space-y-0.5 border-t border-white/10 pt-4">
            <p>Created: {new Date(snap.createdAt).toLocaleString()}</p>
            <p>Updated: {new Date(snap.updatedAt).toLocaleString()}</p>
          </div>

          {/* ── Delete ── */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowDeleteModal(true)}
              className="text-red-400 hover:text-red-300 transition text-xl"
              title="Delete snapshot"
            >
              🗑️
            </button>
          </div>
        </div>

        <DeleteModal
          isOpen={showDeleteModal}
          name={snap.name}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={async () => {
            setShowDeleteModal(false);
            await handleDelete();
          }}
        />
      </div>
    </div>
  );
}
