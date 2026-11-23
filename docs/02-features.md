# Features

## Workflow (assignment)

1. Collect traffic data (cameras, sensors, GPS)
2. Analyse queues and busy approaches (AI rules)
3. Predict congestion from sample history (ML-style forecast)
4. Suggest safe signal timing adjustments
5. Provide alerts to operators and drivers

## Screens

| Route | Feature |
|-------|---------|
| `/` Monitor | Map-centric operator view, KPIs, floating stats, notifications |
| `/control` | AI recommendations with approve / reject + reason |
| `/faults` | Device health, degraded/offline sensors |
| `/analytics` | Hourly volume, wait-time trends, pilot before/after |
| `/twin` | Digital twin what-if: fixed vs adaptive green |
| `/driver` | Mobile-style public traffic alert |
| `/system` | Architecture / about the prototype |

## Demo-critical interactions

- Live-updating queue lengths (simulator ticks)
- Recommendation card: extend North green 30→50s
- Approve / Reject with operator note
- Fallback banner when a critical device fails
- Driver alert when congestion is high
