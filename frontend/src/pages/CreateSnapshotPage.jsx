// src/pages/CreateSnapshotPage.jsx
// Wraps SnapshotForm and handles the POST to the API.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SnapshotForm from "../components/SnapshotForm";
import Silk from "../components/Silk";
import * as api from "../api";
import toast from "react-hot-toast";

export default function CreateSnapshotPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSave = async (fields) => {
    try {
      setLoading(true);
      setError("");
      await api.createSnapshot(fields);
      toast.success("Snapshot saved !");
      navigate("/");
    } catch (err) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      {/* Silk background */}
      <div className="fixed inset-0 -z-10">
        <Silk speed={4} scale={1} color="#4B5563" noiseIntensity={1.5} rotation={0} />
      </div>
      <div className="fixed inset-0 -z-10 bg-black/30" />

      <div className="relative z-10 max-w-xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate("/")}
            className="text-sm text-purple-400 hover:text-purple-200 transition mb-2 inline-block"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-white">New Snapshot</h1>
          <p className="text-sm text-purple-300/70 mt-1">
            Capture where you are so you can pick up exactly where you left off.
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-400 bg-red-900/30 border border-red-500/30 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}

        <div
          className="rounded-2xl p-6 shadow-sm"
          style={{ background: 'rgba(15,10,30,0.65)', backdropFilter: 'blur(12px)', border: '1px solid rgba(139,92,246,0.25)' }}
        >
          <SnapshotForm onSave={handleSave} loading={loading} />
        </div>
      </div>
    </div>
  );
}
