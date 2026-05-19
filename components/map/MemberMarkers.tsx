'use client';

// Imperative Leaflet marker layer driven by ReceivedPositionsProvider.
// Reconciles by user_id: existing markers are moved in place, new
// users get a fresh circleMarker, and users who disappeared from
// `positions` (because their 5-minute window lapsed) are removed.

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useMapInstance } from './MapContext';
import { useReceivedPositions } from '@/components/sharing/ReceivedPositionsProvider';
import type { VisiblePosition } from '@/lib/sharing/types';

const MARKER_OPTIONS: L.CircleMarkerOptions = {
  radius: 9,
  fillColor: '#0E9F8E', // accent teal
  color: '#FFFFFF',
  weight: 2,
  fillOpacity: 0.95,
};

function relativeTime(then: string, now: number): string {
  const diffSeconds = Math.max(0, Math.round((now - new Date(then).getTime()) / 1000));
  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  const minutes = Math.round(diffSeconds / 60);
  return `${minutes}m ago`;
}

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[c] ?? c,
  );
}

function popupContent(pos: VisiblePosition, now: number): string {
  const name = escapeHtml(pos.display_name ?? 'Unknown');
  const ago = relativeTime(pos.recorded_at, now);
  return `<strong>${name}</strong><br/><span style="color:#666;font-size:12px">${ago}</span>`;
}

export function MemberMarkers() {
  const map = useMapInstance();
  const { positions } = useReceivedPositions();
  const markersRef = useRef<Map<string, L.CircleMarker>>(new Map());

  useEffect(() => {
    const now = Date.now();
    const seen = new Set<string>();

    for (const pos of positions) {
      seen.add(pos.user_id);
      const latlng: L.LatLngExpression = [pos.lat, pos.lng];
      const existing = markersRef.current.get(pos.user_id);

      if (existing) {
        existing.setLatLng(latlng);
        existing.setPopupContent(popupContent(pos, now));
      } else {
        const marker = L.circleMarker(latlng, MARKER_OPTIONS).addTo(map);
        marker.bindPopup(popupContent(pos, now));
        markersRef.current.set(pos.user_id, marker);
      }
    }

    // Remove markers for users no longer in the visible set.
    for (const [userId, marker] of markersRef.current) {
      if (!seen.has(userId)) {
        marker.remove();
        markersRef.current.delete(userId);
      }
    }
  }, [positions, map]);

  // Wipe everything if the layer unmounts (e.g. on map remount across
  // React Strict Mode dev double-invoke).
  useEffect(() => {
    const markers = markersRef.current;
    return () => {
      for (const marker of markers.values()) {
        marker.remove();
      }
      markers.clear();
    };
  }, []);

  return null;
}
