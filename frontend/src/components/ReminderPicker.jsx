// src/components/ReminderPicker.jsx
// Inline reminder picker: toggle minutes/days + scroll drum selector.

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

export default function ReminderPicker({
  snapshotId,
  snapshotName,
  onConfirm,
  onDismiss,
}) {
  const [unit, setUnit] = useState("minutes"); // "minutes" | "days"
  const [value, setValue] = useState(5);
  const scrollRef = useRef(null);

  const maxValues = { minutes: 60, days: 30 };
  const options = Array.from({ length: maxValues[unit] }, (_, i) => i + 1);

  // Scroll to selected value when unit changes
  useEffect(() => {
    if (scrollRef.current) {
      const itemHeight = 40; // px per item
      const container = scrollRef.current;
      const targetIndex = value - 1;
      const scrollTop = targetIndex * itemHeight; // center the selected item
      container.scrollTop = scrollTop;
    }
  }, [unit, value]);

  // Handle scroll end to snap and update value
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const itemHeight = 40;
    const scrollTop = scrollRef.current.scrollTop;
    const index = Math.round(scrollTop / itemHeight);
    const newValue = Math.max(1, Math.min(options.length, index + 1));
    if (newValue !== value) {
      setValue(newValue);
    }
  };

  const handleConfirm = () => {
    const now = Date.now();
    const resumeAt =
      unit === "minutes"
        ? new Date(now + value * 60 * 1000)
        : new Date(now + value * 24 * 60 * 60 * 1000);

    // Save to localStorage
    const existing = JSON.parse(localStorage.getItem("css_reminders") || "[]");
    existing.push({
      snapshotId,
      snapshotName,
      resumeAt: resumeAt.toISOString(),
    });
    localStorage.setItem("css_reminders", JSON.stringify(existing));

    onConfirm({ snapshotId, snapshotName, resumeAt });
  };

  const handleUnitChange = (newUnit) => {
    setUnit(newUnit);
    // Reset value to 5 when switching units
    setValue(5);
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="mt-4 p-4 rounded-lg"
      style={{
        background: "rgba(17, 24, 39, 0.6)",
        border: "1px solid rgba(139, 92, 246, 0.3)",
        backdropFilter: "blur(10px)",
      }}
    >
      <p className="text-sm text-purple-200 mb-3">Set a reminder to resume</p>

      {/* Toggle pills */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => handleUnitChange("minutes")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            unit === "minutes"
              ? "bg-purple-500 text-white"
              : "bg-purple-500/20 text-purple-300 hover:bg-purple-500/30"
          }`}
        >
          Minutes
        </button>
        <button
          onClick={() => handleUnitChange("days")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            unit === "days"
              ? "bg-purple-500 text-white"
              : "bg-purple-500/20 text-purple-300 hover:bg-purple-500/30"
          }`}
        >
          Days
        </button>
      </div>

      {/* Scroll drum */}
      <div className="relative mb-4">
        {/* Centered highlight overlay */}
        <div
          className="absolute left-0 right-0 pointer-events-none z-10"
          style={{
            top: "40px",
            height: "40px",
            background: "rgba(139, 92, 246, 0.2)",
            border: "1px solid rgba(139, 92, 246, 0.5)",
            borderRadius: "8px",
          }}
        />

        {/* Scrollable container */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="overflow-y-scroll no-scrollbar"
          style={{
            height: "120px", // 3 items visible
            scrollSnapType: "y mandatory",
            scrollPaddingTop: "40px",
          }}
        >
          {/* Top padding */}
          <div style={{ height: "40px" }} />

          {options.map((num) => (
            <div
              key={num}
              onClick={() => {
                setValue(num);
                const itemHeight = 40;
                scrollRef.current.scrollTop = (num - 1) * itemHeight;
              }}
              className="flex items-center justify-center cursor-pointer transition"
              style={{
                height: "40px",
                scrollSnapAlign: "start",
                fontSize: num === value ? "1.5rem" : "1rem",
                color: num === value ? "#ffffff" : "#a78bfa",
                fontWeight: num === value ? "600" : "400",
              }}
            >
              {num}
            </div>
          ))}

          {/* Bottom padding */}
          <div style={{ height: "40px" }} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleConfirm}
          className="btn-primary text-sm px-4 py-2"
        >
          Remind me in {value} {unit}
        </button>
        <button
          onClick={onDismiss}
          className="text-xs text-purple-300/60 hover:text-purple-200 transition"
        >
          Skip
        </button>
      </div>
    </motion.div>
  );
}
