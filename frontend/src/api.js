// src/api.js
// Centralised fetch helpers — all backend calls go through here.

const BASE = '/api'; // proxied to http://localhost:3001 by Vite in dev

async function request(path, options = {}) {
  const res  = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (res.status === 204) return null;

  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
  return json.data;
}

export const getSnapshots    = (status)     => request(status ? `/snapshots?status=${status}` : '/snapshots');
export const getSnapshot     = (id)         => request(`/snapshots/${id}`);
export const createSnapshot  = (body)       => request('/snapshots',     { method: 'POST',   body: JSON.stringify(body) });
export const updateSnapshot  = (id, body)   => request(`/snapshots/${id}`, { method: 'PATCH',  body: JSON.stringify(body) });
export const deleteSnapshot  = (id)         => request(`/snapshots/${id}`, { method: 'DELETE' });