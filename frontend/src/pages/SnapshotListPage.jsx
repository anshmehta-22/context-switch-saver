// src/pages/SnapshotListPage.jsx
// Home screen — filterable list of all snapshots.

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import SnapshotCard from "../components/SnapshotCard";
import * as api from "../api";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const FILTERS = ["all", "active", "paused", "complete"];

export default function SnapshotListPage() {
  const [snapshots, setSnapshots] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchSnapshots = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getSnapshots(
        filter === "all" ? undefined : filter,
      );
      setSnapshots(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchSnapshots();
  }, [fetchSnapshots]);

  // ── Actions ──────────────────────────────────────────────────────────────
  const handleReload = (snap) => {
    snap.urls?.forEach((u) => window.open(u, "_blank", "noopener"));
    navigate(`/snapshots/${snap.id}`);
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.updateSnapshot(id, { status });
      fetchSnapshots();
    } catch (err) {
      alert(err.message);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`pb-2 px-3 text-sm font-medium capitalize border-b-2 -mb-px transition
              ${
                filter === f
                  ? "border-indigo-600 text-indigo-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* States */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border rounded-xl p-4">
              <Skeleton height={20} width="30%" />
              <Skeleton height={16} width="50%" />
              <Skeleton height={16} width="20%" />
            </div>
          ))}
        </div>
      )}

      {error && !loading && (
        <div className="text-center py-16 text-red-500 text-sm">
          Failed to load snapshots: {error}
          <button
            className="block mx-auto mt-2 text-indigo-600 underline"
            onClick={fetchSnapshots}
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && snapshots.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-4">🗂️</p>
          <p className="text-lg font-semibold text-gray-600">
            No snapshots yet
          </p>
          <p className="text-sm mt-1 mb-6">
            Save your current context before stepping away.
          </p>
          <button className="btn-primary" onClick={() => navigate("/new")}>
            + New Snapshot
          </button>
        </div>
      )}

      {!loading && !error && snapshots.length > 0 && (
        <ul className="space-y-3">
          {snapshots.map((s) => (
            <li key={s.id}>
              <SnapshotCard
                snapshot={s}
                onReload={handleReload}
                onStatusChange={handleStatusChange}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
