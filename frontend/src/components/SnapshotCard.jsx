// src/components/SnapshotCard.jsx
// Card shown in the list view — name, status badge, tags, timestamps, actions.

import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';

export default function SnapshotCard({ snapshot, onReload, onStatusChange }) {
  const navigate = useNavigate();
  const { id, name, status, tags = [], urls = [], createdAt } = snapshot;

  return (
    <article className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition">
      <div className="flex items-start gap-4">
        {/* ── Info ── */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <StatusBadge status={status} />
            <span className="text-xs text-gray-400">
              {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
            </span>
          </div>

          <h2
            className="font-semibold text-gray-900 truncate cursor-pointer hover:text-indigo-700 transition"
            onClick={() => navigate(`/snapshots/${id}`)}
          >
            {name}
          </h2>

          <p className="text-xs text-gray-500 mt-0.5">
            {urls.length} URL{urls.length !== 1 ? 's' : ''}
          </p>

          {tags.length > 0 && (
            <div className="flex gap-1 flex-wrap mt-2">
              {tags.map(t => (
                <span key={t} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── Actions ── */}
        <div className="flex flex-col gap-2 shrink-0">
          <button className="btn-primary text-xs px-3 py-1.5" onClick={() => onReload(snapshot)}>
            ↩ Reload
          </button>
          <button className="btn-secondary text-xs px-3 py-1.5" onClick={() => navigate(`/snapshots/${id}`)}>
            View
          </button>
          {status !== 'complete' && (
            <button
              className="text-xs text-gray-400 hover:text-gray-600 transition"
              onClick={() => onStatusChange(id, status === 'active' ? 'paused' : 'active')}
            >
              {status === 'active' ? '⏸ Pause' : '▶ Resume'}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}