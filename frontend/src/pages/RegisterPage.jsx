import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Silk from "../components/Silk";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setSubmitting(true);

    try {
      await register(email, password);
      navigate("/");
    } catch (err) {
      setError(err?.message || "Failed to register");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-full flex items-center justify-center px-4">
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

      <div className="w-full max-w-sm rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl p-8">
        <h1 className="text-white text-2xl font-semibold">Create an account</h1>
        <p className="text-white/50 text-sm mt-2">
          Save your first snapshot in seconds
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <input
              type="email"
              className="input"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <input
              type="password"
              className="input"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
            <p className="text-white/30 text-xs mt-1">At least 8 characters</p>
          </div>

          <div>
            <input
              type="password"
              className="input"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full py-2.5"
          >
            {submitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="text-white/70 text-sm mt-6 text-center">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-white hover:text-white/80 transition underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
