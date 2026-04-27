// src/api.js
// Centralised fetch helpers — all backend calls go through here.

const BASE = import.meta.env.VITE_API_BASE ?? "/api";

async function request(path, options = {}) {
  let res;

  try {
    res = await fetch(`${BASE}${path}`, {
      credentials: "include",
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
      ...options,
    });
  } catch (_err) {
    throw new Error(
      "Unable to reach the server. Start the backend on http://localhost:3001 and try again.",
    );
  }

  if (res.status === 204) return null;

  let json = {};

  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    try {
      json = await res.json();
    } catch (err) {
      console.error("JSON parse failed", err);
    }
  }

  if (!res.ok) {
    if (res.status === 401) {
      const isAuthAttempt = path === "/auth/login" || path === "/auth/register";
      if (isAuthAttempt) {
        throw new Error(json?.error || "Invalid email or password");
      }

      const currentPath = window.location.pathname;
      if (currentPath !== "/login" && currentPath !== "/register") {
        window.location.href = "/login";
      }
      return;
    }
    throw new Error(json?.error || `HTTP ${res.status}`);
  }

  return json;
}

export const getSnapshots = ({ status, search, tag, page } = {}) => {
  const params = new URLSearchParams();
  if (status) params.append("status", status);
  if (search) params.append("search", search);
  if (tag) params.append("tag", tag);
  if (page) params.append("page", page);
  const qs = params.toString();
  return request(qs ? `/snapshots?${qs}` : "/snapshots");
};

export const getSnapshot = (id) =>
  request(`/snapshots/${id}`).then((json) => json?.data ?? null);

export const createSnapshot = (body) =>
  request("/snapshots", {
    method: "POST",
    body: JSON.stringify(body),
  }).then((json) => json?.data ?? null);

export const updateSnapshot = (id, body) =>
  request(`/snapshots/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  }).then((json) => json?.data ?? null);

export const deleteSnapshot = (id) =>
  request(`/snapshots/${id}`, { method: "DELETE" });

export const parseSnapshotInput = (input) =>
  request("/chat/parse", {
    method: "POST",
    body: JSON.stringify({ input }),
  }).then((json) => json?.data ?? null);

export const registerUser = (body) =>
  request("/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
  }).then((json) => json?.data ?? null);

export const loginUser = (body) =>
  request("/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  }).then((json) => json?.data ?? null);

export const logoutUser = () => request("/auth/logout", { method: "POST" });

export const getMe = () =>
  request("/auth/me").then((json) => json?.data ?? null);
