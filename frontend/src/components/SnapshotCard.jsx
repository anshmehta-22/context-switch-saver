// src/components/SnapshotCard.jsx
// Card shown in the list view — name, status badge, tags, timestamps, actions.

import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import StatusBadge from "./StatusBadge";
import LightRays from "./LightRays";

export default function SnapshotCard({ snapshot, onReload, onStatusChange }) {
  const navigate = useNavigate();
  const { id, name, status, tags = [], urls = [], createdAt } = snapshot;

  return (
    <article
      className="rounded-xl p-4 transition hover:brightness-110 relative overflow-hidden"
      style={{
        background: "#0f0a1e",
        border: "1px solid rgba(139,92,246,0.25)",
      }}
    >
      {/* ── LightRays backdrop ── */}
      <div className="absolute inset-0 rounded-xl overflow-hidden">
        <LightRays
          raysOrigin="top-center"
          raysColor="#a855f7"
          raysSpeed={0.6}
          lightSpread={0.8}
          rayLength={1.5}
          fadeDistance={0.8}
          saturation={1.2}
          followMouse={false}
          mouseInfluence={0}
        />
      </div>

      {/* ── Card content (above canvas) ── */}
      <div className="relative z-10 flex items-start gap-4">
        {/* ── Info ── */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <StatusBadge status={status} />
            <span className="text-xs text-purple-300/70">
              {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
            </span>
          </div>

          <h2
            className="font-semibold text-white truncate cursor-pointer hover:text-purple-200 transition"
            onClick={() => navigate(`/snapshots/${id}`)}
          >
            {name}
          </h2>

          <p className="text-xs text-purple-300/60 mt-0.5">
            {urls.length} URL{urls.length !== 1 ? "s" : ""}
          </p>

          {tags.length > 0 && (
            <div className="flex gap-1 flex-wrap mt-2">
              {tags.map((t) => (
                <span
                  key={t}
                  className="text-xs bg-purple-500/20 text-purple-200 border border-purple-500/30 px-2 py-0.5 rounded-full"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── Actions ── */}
        <div className="flex flex-col gap-2 shrink-0">
          <button
            className="btn-primary text-xs px-3 py-1.5"
            onClick={() => onReload(snapshot)}
          >
            ↩ Reload
          </button>
          <button
            className="text-xs px-3 py-1.5 rounded-lg border border-purple-400/40 text-purple-100 hover:bg-purple-500/20 transition"
            onClick={() => navigate(`/snapshots/${id}`)}
          >
            View
          </button>
          {status !== "complete" && (
            <button
              className="text-xs text-purple-300/50 hover:text-purple-200 transition"
              onClick={() =>
                onStatusChange(id, status === "active" ? "paused" : "active")
              }
            >
              {status === "active" ? "⏸ Pause" : "▶ Resume"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
