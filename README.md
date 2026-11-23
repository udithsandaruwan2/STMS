# STMS — Smart Traffic Management System

Prototype dashboard for **Innovation & Entrepreneurship Assignment 2** (COHNDIS261F-019): a conceptual smart traffic pilot for one Colombo junction, powered by **dummy/sample data**.

## Quick start

```bash
npm install
npm run dev
```

Open the local Vite URL (usually `http://localhost:5173`).

## What you can demo

- **Monitor** — map zoom, click approaches/buses, cameras, scenarios, inject/ack incidents
- **Search / Pause / Bell** — command search, pause sim, notification drawer
- **Control** — approve/reject AI suggestions + manual phase/green overrides
- **Faults** — filter devices, cycle status, restore all, camera feeds
- **Analytics** — range filters, live approach bars, export JSON report
- **Automation** — digital twin apply fixed/adaptive to approaches
- **Driver** — open alternate routes and select one (Marine Drive, etc.)
- **System** — demo controls + activity log

## Docs

Planning and assignment alignment live in [`docs/`](docs/README.md).

## Stack

React 19 · Vite · TypeScript · Tailwind CSS v4 · React Router · Zustand · Recharts · Lucide

## Important

This is a **demonstration prototype only**. It does not connect to real cameras, controllers, or traffic lights.
