# Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| UI | React 19 + TypeScript | Typed components for a dashboard SPA |
| Build | Vite | Fast local demo |
| CSS | Tailwind CSS v4 | Rapid dark control-room styling |
| Routing | React Router | Multi-screen prototype |
| State | Zustand | Lightweight live simulation state |
| Charts | Recharts | Analytics page |
| Icons | Lucide React | Sidebar + status icons |

## Conventions

- `src/pages` — route screens
- `src/components` — reusable UI
- `src/store` — Zustand + simulator start
- `src/data` — seed data
- `src/lib` — rules and formatters
- `docs/` — planning and assignment alignment

## Non-goals

No backend, no Mapbox key requirement, no real ML training. Junction map is a custom SVG/canvas-style scene so the demo runs offline.
