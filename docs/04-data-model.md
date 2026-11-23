# Data Model

## Core types

- `Junction` — id, name, lat/lng, approaches, signal plan
- `Approach` — direction, queueLength, vehicleCount, currentPhase, greenSeconds
- `Device` — id, type (camera|sensor|gps|controller), status, lastHeartbeat
- `Incident` — severity, title, message, timestamp
- `Recommendation` — approach, fromSec, toSec, reason, status (pending|approved|rejected)
- `HourlyStat` — hour, volume, avgWaitSec

## Sample junction

**Bambalapitiya / Galle Road Junction (Pilot)**  
Approaches: North, South, East, West  
Signal plan: `normalGreenSec: 30`, `heavyGreenSec: 50`, `pedestrianProtectSec: 12`

## Seed files

Located under `src/data/`:

- `junction.ts` — junction + live approaches
- `devices.ts` — IoT inventory
- `incidents.ts` — notification feed
- `history.ts` — 24h analytics series
