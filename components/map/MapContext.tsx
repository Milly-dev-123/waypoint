'use client';

// Exposes the live L.Map instance to descendants that need it (e.g.
// marker layers). Map.tsx provides it once Leaflet has initialised.

import { createContext, useContext } from 'react';
import type L from 'leaflet';

export const MapContext = createContext<L.Map | null>(null);

export function useMapInstance(): L.Map {
  const map = useContext(MapContext);
  if (!map) {
    throw new Error('useMapInstance must be used inside a <MapContext.Provider>');
  }
  return map;
}
