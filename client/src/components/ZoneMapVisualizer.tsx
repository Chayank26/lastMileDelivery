/**
 * Interactive Leaflet Map & GeoJSON Zone Visualizer (Technical Blueprint Theme)
 * ----------------------------------------------------------------------------
 * Renders GeoJSON polygon delivery zones on Light Voyager tiles with crisp black borders
 * and high-contrast SVG markers.
 */

import React from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Custom Leaflet SVG Markers with High-Contrast Monospace Labels
const createCustomIcon = (colorHex: string, label: string) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${colorHex}" width="32" height="32" stroke="#000000" stroke-width="2">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `;
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `<div style="display: flex; flex-direction: column; align-items: center; text-align: center;">
            ${svg}
            <span style="background: #000000; color: #ffffff; padding: 2px 6px; border: 1.5px solid #000000; font-size: 9px; font-weight: 800; font-family: 'JetBrains Mono', monospace; text-transform: uppercase;">${label}</span>
          </div>`,
    iconSize: [32, 48],
    iconAnchor: [16, 32],
  });
};

const pickupIcon = createCustomIcon('#10b981', 'PICKUP');
const dropIcon = createCustomIcon('#ef4444', 'DROP');
const agentIcon = createCustomIcon('#0052FF', 'AGENT');

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
  pickupCoords?: [number, number] | null;
  dropCoords?: [number, number] | null;
  agentCoords?: [number, number] | null;
  activeSelectionMode?: 'pickup' | 'drop' | null;
  onSelectLocation?: (type: 'pickup' | 'drop', coords: [number, number]) => void;
  height?: string;
}

const MapClickHandler: React.FC<{
  activeSelectionMode?: 'pickup' | 'drop' | null;
  onSelectLocation?: (type: 'pickup' | 'drop', coords: [number, number]) => void;
}> = ({ activeSelectionMode, onSelectLocation }) => {
  useMapEvents({
    click(e) {
      if (activeSelectionMode && onSelectLocation) {
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
  const defaultCenter: [number, number] = [28.4595, 77.0266];

  const convertPolygonCoords = (coordinates: number[][][]): [number, number][][] => {
    return coordinates.map((ring) => ring.map((pt) => [pt[1], pt[0]]));
  };

  return (
    <div style={{ height }} className="w-full border-2 border-black neo-shadow relative overflow-hidden bg-[#f4f4f6]">
      
      {activeSelectionMode && (
        <div className="absolute top-3 left-3 z-[1000] bg-[#0052FF] text-white px-3 py-1.5 border-2 border-black text-xs font-mono font-bold uppercase neo-shadow-sm animate-pulse">
          📍 CLICK MAP TO SET {activeSelectionMode.toUpperCase()} LOCATION
        </div>
      )}

      <MapContainer
        center={pickupCoords ? [pickupCoords[1], pickupCoords[0]] : defaultCenter}
        zoom={11}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        {/* Light CartoDB Voyager Tile Layer */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        <MapClickHandler
          activeSelectionMode={activeSelectionMode}
          onSelectLocation={onSelectLocation}
        />

        {zones.map((zone) => {
          if (!zone.boundary?.coordinates) return null;
          const leafletPositions = convertPolygonCoords(zone.boundary.coordinates);
          const strokeColor = zone.colorHex || '#0052FF';

          return (
            <Polygon
              key={zone._id}
              positions={leafletPositions}
              pathOptions={{
                color: '#000000',
                fillColor: strokeColor,
                fillOpacity: 0.25,
                weight: 2.5,
              }}
            >
              <Popup>
                <div className="text-xs font-mono font-bold">
                  <div className="text-[#0052FF] uppercase">{zone.name}</div>
                  <div className="text-black">{zone.code}</div>
                </div>
              </Popup>
            </Polygon>
          );
        })}

        {pickupCoords && (
          <Marker position={[pickupCoords[1], pickupCoords[0]]} icon={pickupIcon}>
            <Popup>
              <div className="text-xs font-mono">
                <strong>PICKUP POINT (ORIGIN)</strong>
                <div>{pickupCoords[0].toFixed(4)}, {pickupCoords[1].toFixed(4)}</div>
              </div>
            </Popup>
          </Marker>
        )}

        {dropCoords && (
          <Marker position={[dropCoords[1], dropCoords[0]]} icon={dropIcon}>
            <Popup>
              <div className="text-xs font-mono">
                <strong>DROP POINT (DESTINATION)</strong>
                <div>{dropCoords[0].toFixed(4)}, {dropCoords[1].toFixed(4)}</div>
              </div>
            </Popup>
          </Marker>
        )}

        {agentCoords && (
          <Marker position={[agentCoords[1], agentCoords[0]]} icon={agentIcon}>
            <Popup>
              <div className="text-xs font-mono">
                <strong>ASSIGNED AGENT POSITION</strong>
              </div>
            </Popup>
          </Marker>
        )}

        {pickupCoords && dropCoords && (
          <Polyline
            positions={[
              [pickupCoords[1], pickupCoords[0]],
              [dropCoords[1], dropCoords[0]],
            ]}
            pathOptions={{
              color: '#0052FF',
              weight: 3,
              opacity: 0.9,
              dashArray: '6, 6',
            }}
          />
        )}
      </MapContainer>
    </div>
  );
};
