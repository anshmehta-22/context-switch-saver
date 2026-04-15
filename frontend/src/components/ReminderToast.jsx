// src/components/ReminderToast.jsx
// Persistent toast that polls localStorage for reminder notifications.

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function ReminderToast() {
  const [currentReminder, setCurrentReminder] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkReminders = () => {
      const reminders = JSON.parse(
        localStorage.getItem("css_reminders") || "[]",
      );
      const now = Date.now();

      // Find the first reminder that has passed
      const dueReminder = reminders.find(
        (r) => new Date(r.resumeAt).getTime() <= now,
      );

      if (dueReminder && !currentReminder) {
        setCurrentReminder(dueReminder);

        // Auto-dismiss after 60 seconds
        setTimeout(() => {
          dismissReminder(dueReminder.snapshotId);
        }, 60000);
      }
    };

    // Check immediately, then every 30 seconds
    checkReminders();
    const interval = setInterval(checkReminders, 30000);

    return () => clearInterval(interval);
  }, [currentReminder]);

  const dismissReminder = (snapshotId) => {
    // Remove from localStorage
    const reminders = JSON.parse(localStorage.getItem("css_reminders") || "[]");
    const filtered = reminders.filter((r) => r.snapshotId !== snapshotId);
    localStorage.setItem("css_reminders", JSON.stringify(filtered));

    // Clear current reminder
    setCurrentReminder(null);
  };

  const handleResume = () => {
    if (!currentReminder) return;

    dismissReminder(currentReminder.snapshotId);
    navigate(`/snapshots/${currentReminder.snapshotId}`);
  };

  return (
    <AnimatePresence>
      {currentReminder && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: 50 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: 50, x: 50 }}
          className="fixed bottom-6 right-6 z-50 p-4 rounded-xl shadow-2xl max-w-sm"
          style={{
            background: "rgba(17, 24, 39, 0.95)",
            border: "2px solid rgba(139, 92, 246, 0.6)",
            backdropFilter: "blur(16px)",
          }}
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">⏰</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-white mb-1">
                Time to resume
              </p>
              <p className="text-xs text-purple-300">
                {currentReminder.snapshotName}
              </p>
            </div>
            <button
              onClick={() => dismissReminder(currentReminder.snapshotId)}
              className="text-purple-300/60 hover:text-purple-200 transition text-sm"
            >
              ✕
            </button>
          </div>

          <div className="flex gap-2 mt-3">
            <button
              onClick={handleResume}
              className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
            >
              Resume →
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
