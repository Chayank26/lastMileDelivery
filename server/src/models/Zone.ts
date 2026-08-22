/**
 * Zone Data Model (Geospatial GeoJSON Polygon Boundary)
 * ----------------------------------------------------
 * Stores admin-defined geographic delivery zones as official GeoJSON Polygons.
 * Uses MongoDB 2dsphere indexing to support point-in-polygon queries ($geoIntersects).
 */

import { Schema, model, Document } from 'mongoose';

// GeoJSON Polygon Coordinate Structure: [ [ [lng, lat], [lng, lat], ... ] ]
export interface IZoneGeometry {
  type: 'Polygon';
  coordinates: number[][][];
}

export interface IZone extends Document {
  name: string; // e.g. "South Gurgaon Enterprise Hub"
  code: string; // e.g. "ZONE-GGN-SOUTH"
  description?: string;
  boundary: IZoneGeometry;
  colorHex: string; // Used for UI map polygon rendering
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const zoneSchema = new Schema<IZone>(
  {
    name: {
      type: String,
      required: [true, 'Zone name is required'],
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Zone code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    boundary: {
      type: {
        type: String,
        enum: ['Polygon'],
        required: true,
        default: 'Polygon',
      },
      coordinates: {
        type: [[[Number]]], // Array of linear rings containing [longitude, latitude] arrays
        required: [true, 'Polygon boundary coordinates are required'],
      },
    },
    colorHex: {
      type: String,
      default: '#6366f1', // Default Indigo theme color for rendering on Leaflet map
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// 2dsphere Spatial Index for high-performance point-in-polygon geographic searches
zoneSchema.index({ boundary: '2dsphere' });

export const Zone = model<IZone>('Zone', zoneSchema);
