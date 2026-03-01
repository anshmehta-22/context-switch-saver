// src/components/Layout.jsx
// Persistent top navbar + page wrapper.

import { Link, useLocation } from "react-router-dom";
import Shuffle from "./Shuffle";

export default function Layout({ children }) {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-10 bg-white/10 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-4 py-4">
          <Link to="/" className="hover:opacity-70 transition">
            <Shuffle
              text="Context Switch Saver"
              tag="span"
              className="navbar-heading"
              shuffleDirection="right"
              duration={0.35}
              ease="power3.out"
              stagger={0.03}
              textAlign="left"
              triggerOnHover
              triggerOnce={false}
              loop={false}
            />
          </Link>

          {pathname !== "/new" && (
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
