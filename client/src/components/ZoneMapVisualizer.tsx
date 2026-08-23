/**
 * Interactive Leaflet Map & GeoJSON Zone Visualizer
 * --------------------------------------------------
 * Renders GeoJSON polygon delivery zones, pickup/drop location markers,
 * delivery driver position pins, route polylines, and map click position selection.
 */

import React from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Custom Leaflet SVG Markers for Dark Slate UI
const createCustomIcon = (colorHex: string, label: string) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${colorHex}" width="32" height="32" stroke="#ffffff" stroke-width="1.5">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `;
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `<div style="display: flex; flex-direction: column; items: center; text-align: center;">
            ${svg}
            <span style="background: #121215; color: #ffffff; padding: 2px 6px; border-radius: 4px; font-size: 10px; border: 1px solid ${colorHex}; font-weight: 600; font-family: monospace;">${label}</span>
          </div>`,
    iconSize: [32, 48],
    iconAnchor: [16, 32],
  });
};

const pickupIcon = createCustomIcon('#10b981', 'PICKUP');
const dropIcon = createCustomIcon('#ef4444', 'DROP');
const agentIcon = createCustomIcon('#3b82f6', 'AGENT');

export interface IMapZone {
  _id: string;
  name: string;
  code: string;
  colorHex?: string;
  boundary: {
    type: 'Polygon';
    coordinates: number[][][];
  };
}

interface IZoneMapVisualizerProps {
  zones?: IMapZone[];
  pickupCoords?: [number, number] | null; // [longitude, latitude]
  dropCoords?: [number, number] | null; // [longitude, latitude]
  agentCoords?: [number, number] | null; // [longitude, latitude]
  activeSelectionMode?: 'pickup' | 'drop' | null;
  onSelectLocation?: (type: 'pickup' | 'drop', coords: [number, number]) => void;
  height?: string;
}

// Inner component listening to map click events
const MapClickHandler: React.FC<{
  activeSelectionMode?: 'pickup' | 'drop' | null;
  onSelectLocation?: (type: 'pickup' | 'drop', coords: [number, number]) => void;
}> = ({ activeSelectionMode, onSelectLocation }) => {
  useMapEvents({
    click(e) {
      if (activeSelectionMode && onSelectLocation) {
        // e.latlng contains { lat, lng } -> convert to [lng, lat]
        onSelectLocation(activeSelectionMode, [e.latlng.lng, e.latlng.lat]);
      }
    },
  });
  return null;
};

export const ZoneMapVisualizer: React.FC<IZoneMapVisualizerProps> = ({
  zones = [],
  pickupCoords,
  dropCoords,
  agentCoords,
  activeSelectionMode,
  onSelectLocation,
  height = '400px',
}) => {
  // Center map on Gurgaon / Delhi NCR default
  const defaultCenter: [number, number] = [28.4595, 77.0266]; // [lat, lng] for Leaflet center

  // Convert GeoJSON [lng, lat] coordinates to Leaflet [lat, lng]
  const convertPolygonCoords = (coordinates: number[][][]): [number, number][][] => {
    return coordinates.map((ring) => ring.map((pt) => [pt[1], pt[0]]));
  };

  return (
    <div style={{ height }} className="w-full rounded-xl overflow-hidden border border-zinc-800 relative shadow-2xl">
      
      {/* Active Selection Mode Indicator Banner */}
      {activeSelectionMode && (
        <div className="absolute top-3 left-3 z-[1000] bg-indigo-600/90 text-white px-3 py-1.5 rounded-lg text-xs font-mono font-medium shadow-lg backdrop-blur-md border border-indigo-400/40 animate-pulse">
          📍 Click on map to set {activeSelectionMode.toUpperCase()} location
        </div>
      )}

      <MapContainer
        center={pickupCoords ? [pickupCoords[1], pickupCoords[0]] : defaultCenter}
        zoom={11}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        {/* Dark Mode CartoDB Tile Layer */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        <MapClickHandler
          activeSelectionMode={activeSelectionMode}
          onSelectLocation={onSelectLocation}
        />

        {/* Render GeoJSON Polygon Zones */}
        {zones.map((zone) => {
          if (!zone.boundary?.coordinates) return null;
          const leafletPositions = convertPolygonCoords(zone.boundary.coordinates);
          const strokeColor = zone.colorHex || '#6366f1';

          return (
            <Polygon
              key={zone._id}
              positions={leafletPositions}
              pathOptions={{
                color: strokeColor,
                fillColor: strokeColor,
                fillOpacity: 0.15,
                weight: 2,
                dashArray: '4, 4',
              }}
            >
              <Popup>
                <div className="text-xs font-sans p-1">
                  <div className="font-bold text-indigo-400">{zone.name}</div>
                  <div className="font-mono text-zinc-400">{zone.code}</div>
                </div>
              </Popup>
            </Polygon>
          );
        })}

        {/* Pickup Location Marker */}
        {pickupCoords && (
          <Marker position={[pickupCoords[1], pickupCoords[0]]} icon={pickupIcon}>
            <Popup>
              <div className="text-xs font-sans">
                <strong>Pickup Location</strong>
                <div>Coordinates: {pickupCoords[0].toFixed(4)}, {pickupCoords[1].toFixed(4)}</div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Drop Location Marker */}
        {dropCoords && (
          <Marker position={[dropCoords[1], dropCoords[0]]} icon={dropIcon}>
            <Popup>
              <div className="text-xs font-sans">
                <strong>Drop Location</strong>
                <div>Coordinates: {dropCoords[0].toFixed(4)}, {dropCoords[1].toFixed(4)}</div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Agent Position Marker */}
        {agentCoords && (
          <Marker position={[agentCoords[1], agentCoords[0]]} icon={agentIcon}>
            <Popup>
              <div className="text-xs font-sans">
                <strong>Assigned Delivery Agent</strong>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Route Polyline connecting Pickup and Drop */}
        {pickupCoords && dropCoords && (
          <Polyline
            positions={[
              [pickupCoords[1], pickupCoords[0]],
              [dropCoords[1], dropCoords[0]],
            ]}
            pathOptions={{
              color: '#6366f1',
              weight: 3,
              opacity: 0.8,
              dashArray: '8, 8',
            }}
          />
        )}
      </MapContainer>
    </div>
  );
};
