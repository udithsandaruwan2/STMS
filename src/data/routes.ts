import type { AlternateRoute } from '../types'

export const seedRoutes: AlternateRoute[] = [
  {
    id: 'rt-marine',
    name: 'Marine Drive bypass',
    via: ['Galle Face', 'Marine Drive', 'Kollupitiya'],
    distanceKm: 4.2,
    etaMin: 12,
    crowd: 'Light',
    status: 'recommended',
  },
  {
    id: 'rt-duplication',
    name: 'Duplication Road',
    via: ['Bambalapitiya', 'Duplication Rd', 'Borella'],
    distanceKm: 3.8,
    etaMin: 16,
    crowd: 'Medium',
    status: 'open',
  },
  {
    id: 'rt-baseline',
    name: 'Baseline Road loop',
    via: ['Havelock', 'Baseline Rd', 'Kirulapone'],
    distanceKm: 5.1,
    etaMin: 22,
    crowd: 'Heavy',
    status: 'congested',
  },
  {
    id: 'rt-galle',
    name: 'Stay on Galle Road',
    via: ['Bambalapitiya junction', 'Wellawatte'],
    distanceKm: 2.4,
    etaMin: 28,
    crowd: 'Heavy',
    status: 'congested',
  },
]
