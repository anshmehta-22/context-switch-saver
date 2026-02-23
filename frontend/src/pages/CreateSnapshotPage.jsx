// src/pages/CreateSnapshotPage.jsx
// Wraps SnapshotForm and handles the POST to the API.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SnapshotForm from "../components/SnapshotForm";
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
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate("/")}
          className="text-sm text-indigo-600 hover:underline mb-2 inline-block"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">New Snapshot</h1>
        <p className="text-sm text-gray-500 mt-1">
          Capture where you are so you can pick up exactly where you left off.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <SnapshotForm onSave={handleSave} loading={loading} />
      </div>
    </div>
  );
}
