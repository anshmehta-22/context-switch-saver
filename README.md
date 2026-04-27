# Context Switch Saver

> Save and restore your developer context instantly.

## 🚀 Overview

Context Switch Saver helps developers save their working state (tabs, notes, tasks) and restore it later without losing mental context.

## ✨ Features (MVP)

- Save snapshots (task name, notes, URLs)
- View all snapshots
- Reload snapshot (restore tabs)
- Update notes & status

## 🏗 Tech Stack

- Frontend: React + Vite + Tailwind
- Backend: Node.js + Express
- Database: SQLite

## 📦 Setup

### Environment variables

The backend parser uses Google Gemini. Set this in local and production environments:

- `GEMINI_API_KEY`: required for high-quality title/notes/tags extraction from one freeform input

If `GEMINI_API_KEY` is missing, the app falls back to heuristic parsing (works, but tag quality is lower).

### 1. Clone repo

```bash
git clone https://github.com/anshmehta-22/context-switch-saver.git
cd context-switch-saver
```
