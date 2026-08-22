/**
 * Geospatial Engine & Turf.js Spatial Analysis Module
 * ----------------------------------------------------
 * Handles point-in-polygon spatial detection, GeoJSON polygon boundary validation,
 * and Haversine distance calculations between coordinate points.
 */

import * as turf from '@turf/turf';
import { IZone } from '../models/Zone.js';

export interface ICoordinates {
  longitude: number;
  latitude: number;
}

/**
 * Validates whether a GeoJSON polygon coordinate array forms a closed linear ring.
 * A valid GeoJSON polygon ring must contain at least 4 coordinates, where the first
 * and last coordinates are identical.
 * 
 * @param coordinates 3D coordinate array [ [ [lng, lat], [lng, lat], ... ] ]
 */
export const validateGeoJsonPolygon = (coordinates: number[][][]): boolean => {
  if (!coordinates || !Array.isArray(coordinates) || coordinates.length === 0) {
    return false;
  }

  const outerRing = coordinates[0];
  if (!Array.isArray(outerRing) || outerRing.length < 4) {
    return false; // Polygon ring requires at least 4 positions
  }

  const firstPoint = outerRing[0];
  const lastPoint = outerRing[outerRing.length - 1];

  // First coordinate must match last coordinate to close the polygon loop
  return firstPoint[0] === lastPoint[0] && firstPoint[1] === lastPoint[1];
};

/**
 * Detects which stored Zone Polygon contains a given [longitude, latitude] coordinate point.
 * Uses Turf.js `booleanPointInPolygon` for spatial boundary evaluation.
 * 
 * @param lng Longitude coordinate
 * @param lat Latitude coordinate
 * @param activeZones Array of active IZone document objects
 * @returns Matched IZone object or null if point falls outside all zones
 */
export const detectZoneForCoordinates = (
  lng: number,
  lat: number,
  activeZones: IZone[]
): IZone | null => {
  try {
    // Create a Turf.js Point feature from coordinates
    const targetPoint = turf.point([lng, lat]);

    for (const zone of activeZones) {
      if (!zone.boundary || !zone.boundary.coordinates) continue;

      // Construct Turf.js Polygon feature from zone boundary
      const polygonFeature = turf.polygon(zone.boundary.coordinates);

      // Perform spatial point-in-polygon check
      const isInside = turf.booleanPointInPolygon(targetPoint, polygonFeature);

      if (isInside) {
        return zone;
      }
    }

    return null; // Point is unzoned / outside all registered polygons
  } catch (error) {
    console.error('❌ Error during Turf.js spatial zone detection:', error);
    return null;
  }
};

/**
 * Calculates Haversine distance in kilometers between two geographic coordinate points.
 * 
 * @param pointA [longitude, latitude]
 * @param pointB [longitude, latitude]
 * @returns Distance in kilometers
 */
export const calculateHaversineDistanceKm = (
  pointA: [number, number],
  pointB: [number, number]
): number => {
  const from = turf.point(pointA);
  const to = turf.point(pointB);
  return turf.distance(from, to, { units: 'kilometers' });
};
