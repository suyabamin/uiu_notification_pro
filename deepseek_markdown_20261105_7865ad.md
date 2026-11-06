# UniPortal Monitor — Browser Extension

A cross-browser extension (Chrome, Edge, Firefox, Brave, Opera) that monitors
UIU's **UCAM** (`https://ucam.uiu.ac.bd/`) and **ELMS** (`https://elms.uiu.ac.bd/`)
portals and notifies you about new study materials, notices, assignments, results,
and attendance updates.

## ✨ Features

- 🔔 Desktop notifications on new content (materials, notices, assignments, results, attendance)
- 🎓 ELMS monitoring via **official Moodle Web Services API** — no password stored
- 🌐 UCAM monitoring via **session-based page scraping** — no password stored
- ⏱️ Configurable check interval (default: **30 minutes**, minimum 15)
- 🎨 Modern popup + full options page UI (React + Tailwind)
- 🔒 Zero password storage — uses session cookies & API tokens only
- 🌍 Cross-browser: Chrome, Edge, Firefox, Brave, Opera
- 🌙 Dark mode, WCAG AA accessibility
- 🔕 Quiet hours, notification coalescing, sound toggle

## 🚀 Quick Start

```bash
pnpm install
pnpm dev:chrome       # hot-reload dev in Chrome
pnpm build:all        # production builds for all browsers