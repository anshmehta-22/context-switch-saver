// src/pages/SnapshotListPage.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import SnapshotCard from "../components/SnapshotCard";
import ChatPanel from "../components/ChatPanel";
import SearchFilterPanel from "../components/SearchFilterPanel";
import Silk from "../components/Silk";
import * as api from "../api";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const FILTERS = ["all", "active", "paused", "complete"];

export default function SnapshotListPage() {
  const [snapshots, setSnapshots] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const hasLoadedRef = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleFilterChange = (nextFilter) => {
    setFilter(nextFilter);
    setPage(1);
  };

  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(1);
  };

  const fetchSnapshots = useCallback(async () => {
    try {
      if (!hasLoadedRef.current) setLoading(true);
      const result = await api.getSnapshots({
        status: filter === "all" ? undefined : filter,
        search: debouncedSearch.trim() || undefined,
        page,
      });
      setSnapshots(result.data ?? []);
      setPagination(result.pagination ?? null);
      setError("");
      hasLoadedRef.current = true;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filter, debouncedSearch, page]);

  useEffect(() => {
    fetchSnapshots();
  }, [fetchSnapshots]);

  const handleReload = (snap) => {
    snap.urls?.forEach((u) => window.open(u, "_blank", "noopener"));
    navigate(`/snapshots/${snap.id}`);
  };

  const handleStatusChange = async (id, status) => {
    try {
      const updated = await api.updateSnapshot(id, { status });
      setSnapshots((prev) => prev.map((s) => (s.id === id ? updated : s)));
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div
      style={{
        height: "calc(100vh - 93px)",
        overflow: "hidden",
        position: "relative",
      }}
    >
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

      {/* Three-column layout — full height, no overflow */}
      <div
        style={{
          display: "flex",
          height: "100%",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* LEFT COLUMN */}
        <div className="hidden lg:block w-96 shrink-0" />

        {/* CENTER COLUMN */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            padding: "0 1rem",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Filter tabs */}
          <div className="flex gap-1 border-b border-white/20 mb-6">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => handleFilterChange(f)}
                className={`pb-2 px-3 text-sm font-medium capitalize border-b-2 -mb-px transition
                  ${
                    filter === f
                      ? "border-white text-white"
                      : "border-transparent text-white/40 hover:text-white/70"
                  }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Snapshot list — fills remaining height, no overflow */}
          <div
            style={{
              flex: 1,
              overflow: "hidden",
              maxWidth: "42rem",
              margin: "0 auto",
              width: "100%",
            }}
          >
            {loading && (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
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
                <button
                  className="btn-primary"
                  onClick={() => navigate("/new")}
                >
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
        </div>

        {/* RIGHT COLUMN — full height, pagination pinned to bottom */}
        <div
          className="hidden lg:flex"
          style={{
            width: "368px",
            flexShrink: 0,
            flexDirection: "column",
            justifyContent: "space-between",
            paddingRight: "1.25rem",
            paddingTop: "3.5rem",
            paddingBottom: "1.5rem",
            position: "sticky",
            top: 0,
            height: "100%",
          }}
        >
          {/* Top — search + chat panels */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <SearchFilterPanel search={search} setSearch={handleSearchChange} />
            <ChatPanel onSnapshotCreated={fetchSnapshots} />
          </div>

          {/* Bottom — pagination pinned */}
          {pagination && pagination.totalPages > 1 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                gap: "0.75rem",
              }}
            >
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={!pagination.hasPrev}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: pagination.hasPrev
                    ? "rgba(255,255,255,0.8)"
                    : "rgba(255,255,255,0.2)",
                  borderRadius: "0.5rem",
                  padding: "0.4rem 0.9rem",
                  cursor: pagination.hasPrev ? "pointer" : "not-allowed",
                  fontSize: "0.85rem",
                }}
              >
                ← Prev
              </button>

              <span
                style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.8rem" }}
              >
                {pagination.page} / {pagination.totalPages}
              </span>

              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!pagination.hasNext}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: pagination.hasNext
                    ? "rgba(255,255,255,0.8)"
                    : "rgba(255,255,255,0.2)",
                  borderRadius: "0.5rem",
                  padding: "0.4rem 0.9rem",
                  cursor: pagination.hasNext ? "pointer" : "not-allowed",
                  fontSize: "0.85rem",
                }}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
