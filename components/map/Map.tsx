'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LocateButton } from './LocateButton';
import { MapContext } from './MapContext';
import { MemberMarkers } from './MemberMarkers';

// Plain Leaflet via useEffect — chosen over react-leaflet because v4
// double-initialises the map under React 18 Strict Mode and v5 needs
// React 19. This implementation calls map.remove() in the effect
// cleanup, which clears Leaflet's _leaflet_id on the container DOM
// node and makes re-init safe across Strict Mode's mount → unmount →
// re-mount cycle.

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

// Cold-start view: neutral world frame centred over the Atlantic so
// Europe and the Americas are both visible. The user explicitly
// invokes geolocation via the Locate button.
const INITIAL_CENTER: [number, number] = [30, -10];
const INITIAL_ZOOM = 3;

export default function Map() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = L.map(containerRef.current, {
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      minZoom: 2,
      worldCopyJump: true,
      zoomControl: false,
      attributionControl: true,
    });

    L.tileLayer(TILE_URL, {
      attribution: TILE_ATTRIBUTION,
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;
    setReady(true);

    return () => {
      map.remove();
      mapRef.current = null;
      setReady(false);
    };
  }, []);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} aria-label="Map" className="h-full w-full bg-bg" />
      {ready && mapRef.current && (
        <MapContext.Provider value={mapRef.current}>
          <LocateButton mapRef={mapRef} />
          <MemberMarkers />
        </MapContext.Provider>
      )}
    </div>
  );
}
