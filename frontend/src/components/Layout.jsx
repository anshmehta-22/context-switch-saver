// src/components/Layout.jsx
// Persistent top navbar + page wrapper.

import { Link, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import Shuffle from "./Shuffle";
import ReminderToast from "./ReminderToast";
import { useAuth } from "../context/AuthContext";

export default function Layout({ children }) {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setIsProfileOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-30 bg-white/10 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto grid grid-cols-[1fr_auto_auto] items-center gap-4 px-4 py-4">
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

          {user && (
            <div className="relative z-40" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setIsProfileOpen((prev) => !prev)}
                className="h-10 w-10 rounded-full bg-white/10 border border-white/20 text-white/80 hover:text-white hover:bg-white/20 transition inline-flex items-center justify-center"
                aria-haspopup="menu"
                aria-expanded={isProfileOpen}
                aria-label="Open profile menu"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6.75a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 19.5a7.5 7.5 0 1 1 15 0"
                  />
                </svg>
              </button>

              {isProfileOpen && (
                <div
                  className="absolute right-0 top-12 z-50 w-64 rounded-2xl border border-white/20 bg-slate-950/95 backdrop-blur-xl shadow-lg shadow-black/40 p-3"
                  role="menu"
                >
                  <p className="text-xs text-white/50 mb-1">Signed in as</p>
                  <p className="text-sm text-white break-all mb-3">
                    {user.email}
                  </p>

                  <button
                    onClick={async () => {
                      setIsProfileOpen(false);
                      await logout();
                    }}
                    className="w-full text-left rounded-lg px-3 py-2 text-sm text-red-300 hover:bg-white/10 hover:text-red-200 transition"
                    role="menuitem"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* ── Page content ── */}
      <main className="flex-1 w-full px-0 py-8">{children}</main>

      {/* ── Reminder notifications ── */}
      <ReminderToast />
    </div>
  );
}
