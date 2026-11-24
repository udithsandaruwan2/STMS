# STMS — Smart Traffic Management System

Prototype dashboard for **Innovation & Entrepreneurship Assignment 2** (COHNDIS261F-019): a conceptual smart traffic pilot across six schematic Colombo junctions, powered by **simulated data**.

## Quick start

```bash
npm install
npm run dev
```

Open the local Vite URL (usually `http://localhost:5173`).

## What you can demo

- **Monitor** — network map, moving cars and buses, queue overlays, phase countdowns, cameras, and five traffic scenarios
- **Search / Pause / Bell** — command search, pause sim, notification drawer
- **Control** — approve/reject AI suggestions + manual phase/green overrides
- **Faults** — filter devices by junction, simulate faults and fixed fallback, restore devices, and view demo cameras
- **Analytics** — live network queues and approach metrics, sample hourly trends, JSON export
- **Automation** — digital twin compare and apply fixed/adaptive plans at the selected junction
- **Driver** — open alternate routes and select one (Marine Drive, etc.)
- **System** — demo controls + activity log

## Docs

Planning and assignment alignment live in [`docs/`](docs/README.md).

## Stack

React 19 · Vite · TypeScript · Tailwind CSS v4 · React Router · Zustand · Recharts · Lucide

## Important

This is a **demonstration prototype only**. It does not connect to real cameras, controllers, or traffic lights.
