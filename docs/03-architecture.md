# Architecture

## Three layers (assignment)

```
Roadside     →  cameras, sensors, GPS, signal controller (mocked)
Application  →  React SPA, Zustand store, rule-based AI, charts
User         →  operator dashboard + driver alert view
```

## Runtime data flow

1. Seed JSON loads junction, devices, history, incidents
2. Simulator ticks every ~2.5s and updates approach queues
3. Rule engine may open a recommendation when a queue exceeds threshold
4. Operator approves/rejects; store records the decision
5. Driver view reads congestion + alerts from the same store

## Security story (prototype-level)

- Operator UI is separate from the public `/driver` route
- Recommendations require explicit human action
- Device failure triggers a “fallback fixed plan” banner
- No real credentials or cloud secrets in this demo

## What is simulated

| Real-world concept | Prototype stand-in |
|--------------------|--------------------|
| IoT telemetry | Interval random walk on queues |
| AI vision counts | Derived vehicleCount from queue length |
| ML forecast | Peak-hour curve from historical JSON |
| V2X ambulance | Sample incident event |
| Digital twin | What-if toggle comparing wait estimates |
