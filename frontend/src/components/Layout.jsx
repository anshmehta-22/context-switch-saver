// src/components/Layout.jsx
// Persistent top navbar + page wrapper.

import { Link, useLocation } from 'react-router-dom';

export default function Layout({ children }) {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 text-indigo-700 font-bold text-lg hover:opacity-80 transition">
            <span className="text-2xl">🗂</span>
            <span>Context Switch Saver</span>
          </Link>

          {pathname !== '/new' && (
            <Link to="/new" className="btn-primary">
              + New Snapshot
            </Link>
          )}
        </div>
      </header>

      {/* ── Page content ── */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        {children}
      </main>
    </div>
  );
}