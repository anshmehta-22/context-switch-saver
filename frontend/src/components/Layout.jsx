// src/components/Layout.jsx
// Persistent top navbar + page wrapper.

import { Link, useLocation } from "react-router-dom";
import Shuffle from "./Shuffle";
import ReminderToast from "./ReminderToast";
import { useAuth } from "../context/AuthContext";

export default function Layout({ children }) {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();

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

          <div className="flex items-center gap-4">
            {user && (
              <span className="text-white/40 text-sm hidden sm:block">
                {user.email}
              </span>
            )}

            {user && (
              <button
                onClick={async () => {
                  await logout();
                }}
                className="text-white/40 hover:text-white/70 text-sm transition"
              >
                Sign out
              </button>
            )}

            {pathname !== "/new" && (
              <Link to="/new" className="btn-primary">
                + New Snapshot
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ── Page content ── */}
      <main className="flex-1 w-full px-0 py-8">{children}</main>

      {/* ── Reminder notifications ── */}
      <ReminderToast />
    </div>
  );
}
