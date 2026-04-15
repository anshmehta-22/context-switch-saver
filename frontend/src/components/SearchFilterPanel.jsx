// src/components/SearchFilterPanel.jsx
// Standalone search and filter panel for snapshots with amber/gold glassmorphism styling.

export default function SearchFilterPanel({ search, setSearch }) {
  return (
    <div
      style={{
        background:
          "linear-gradient(145deg, #1a1200 0%, #110d00 60%, #1a1400 100%)",
        border: "1px solid rgba(251,191,36,0.28)",
        borderRadius: "1rem",
        boxShadow:
          "0 0 28px rgba(251,191,36,0.05), inset 0 1px 0 rgba(253,230,138,0.07)",
        padding: "0.75rem 1rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Radial glow overlays */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          borderRadius: "1rem",
          backgroundImage:
            "radial-gradient(ellipse at 25% 20%, rgba(251,191,36,0.07) 0%, transparent 55%), radial-gradient(ellipse at 80% 85%, rgba(234,179,8,0.05) 0%, transparent 50%)",
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Single merged input with inline clear action */}
        <div id="search-filter-panel" style={{ position: "relative" }}>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              const value = e.target.value;
              setSearch(value);
            }}
            placeholder="Search by name or tag..."
            style={{
              background: "rgba(251,191,36,0.06)",
              border: "1px solid rgba(251,191,36,0.22)",
              borderRadius: "0.625rem",
              color: "rgba(254,243,199,0.85)",
              padding: "0.625rem 2.25rem 0.625rem 0.875rem",
              fontSize: "0.8rem",
              width: "100%",
              outline: "none",
              boxSizing: "border-box",
            }}
            onFocus={(e) =>
              (e.target.style.borderColor = "rgba(251,191,36,0.45)")
            }
            onBlur={(e) =>
              (e.target.style.borderColor = "rgba(251,191,36,0.22)")
            }
          />

          {search.trim() && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setSearch("");
              }}
              style={{
                position: "absolute",
                top: "50%",
                right: "0.625rem",
                transform: "translateY(-50%)",
                border: "none",
                background: "transparent",
                color: "rgba(253,230,138,0.75)",
                fontSize: "0.95rem",
                lineHeight: 1,
                padding: 0,
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.target.style.color = "rgba(253,230,138,0.95)";
              }}
              onMouseLeave={(e) => {
                e.target.style.color = "rgba(253,230,138,0.75)";
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Placeholder color styles */}
        <style>{`
          #search-filter-panel input[type="text"]::placeholder {
            color: rgba(251,191,36,0.30);
          }
        `}</style>
      </div>
    </div>
  );
}
