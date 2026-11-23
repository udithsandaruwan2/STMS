# UI Screens

## Visual language (from references)

Inspired by Yunex Traffic–style control rooms and fleet ops dashboards:

- Dark charcoal / deep blue shell
- Left icon sidebar with mint active state
- Map (or junction diagram) as the main stage
- Floating glass panels for stats and notifications
- Severity colors: critical red, high amber, ok mint/teal
- Dense but readable metrics; mono for numbers

## Layout

```
┌────────┬──────────────────────────────────────────────┐
│ Brand  │ Search / junction context     Operator chip  │
│ Nav    ├──────────────────────────────────────────────┤
│ Monitor│                                              │
│ Faults │         Junction / city map stage            │
│ Control│   ┌─────────────┐          ┌──────────────┐  │
│ Analytics│ │ Equipment   │          │ Notifications│  │
│ Twin   │ │ KPI grid    │          │ severity feed │  │
│ Driver │ └─────────────┘          └──────────────┘  │
│ System │                                              │
└────────┴──────────────────────────────────────────────┘
```

## Screen notes

- **Monitor** — map + equipment KPIs + live notifications (primary demo)
- **Control** — recommendation review queue with approve/reject
- **Faults** — device cards with online/degraded/offline
- **Analytics** — Recharts volume and wait trends
- **Twin** — side-by-side fixed vs adaptive timing
- **Driver** — phone frame, public-safe messaging only
