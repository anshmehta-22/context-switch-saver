import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Silk from "../components/Silk";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err?.message || "Invalid email or password");
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
        <h1 className="text-white text-2xl font-semibold">Welcome back</h1>
        <p className="text-white/50 text-sm mt-2">Sign in to your snapshots</p>

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
              autoComplete="current-password"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full py-2.5"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="text-white/70 text-sm mt-6 text-center">
          Don&apos;t have an account?{" "}
          <Link
            to="/register"
            className="text-white hover:text-white/80 transition underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
