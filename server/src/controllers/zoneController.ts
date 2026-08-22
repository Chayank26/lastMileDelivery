/**
 * Zone Management & Spatial Detection Controller
 * ----------------------------------------------
 * Manages GeoJSON polygon delivery zones and point-in-polygon matching endpoints.
 */

import { Request, Response } from 'express';
import { Zone } from '../models/Zone.js';
import { validateGeoJsonPolygon, detectZoneForCoordinates } from '../utils/geo.js';

/**
 * Controller: Create a new GeoJSON Polygon Zone (Admin only).
 */
export const createZone = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, code, description, coordinates, colorHex } = req.body;

    if (!name || !code || !coordinates) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Zone name, unique code, and GeoJSON polygon coordinates are required.',
      });
      return;
    }

    // Format coordinates as 3D array if given as 2D linear ring
    const formattedCoordinates = Array.isArray(coordinates[0][0])
      ? coordinates
      : [coordinates];

    // Validate polygon linear ring closure
    if (!validateGeoJsonPolygon(formattedCoordinates)) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid GeoJSON Polygon ring. A closed linear ring must contain at least 4 positions with identical start and end points.',
      });
      return;
    }

    const existingCode = await Zone.findOne({ code: code.toUpperCase() });
    if (existingCode) {
      res.status(409).json({
        error: 'Conflict',
        message: `Zone code '${code.toUpperCase()}' is already in use.`,
      });
      return;
    }

    const zone = await Zone.create({
      name,
      code: code.toUpperCase(),
      description,
      boundary: {
        type: 'Polygon',
        coordinates: formattedCoordinates,
      },
      colorHex: colorHex || '#6366f1',
      isActive: true,
    });

    res.status(201).json({
      message: 'Zone polygon created successfully',
      zone,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * Controller: Fetch all active delivery zones.
 */
export const getAllZones = async (req: Request, res: Response): Promise<void> => {
  try {
    const zones = await Zone.find({ isActive: true }).sort({ name: 1 });
    res.status(200).json({
      count: zones.length,
      zones,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * Controller: Fetch zone details by ID.
 */
export const getZoneById = async (req: Request, res: Response): Promise<void> => {
  try {
    const zone = await Zone.findById(req.params.id);
    if (!zone) {
      res.status(404).json({ error: 'Not Found', message: 'Zone not found.' });
      return;
    }
    res.status(200).json({ zone });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * Controller: Update an existing Zone polygon (Admin only).
 */
export const updateZone = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, coordinates, colorHex, isActive } = req.body;
    const zone = await Zone.findById(req.params.id);

    if (!zone) {
      res.status(404).json({ error: 'Not Found', message: 'Zone not found.' });
      return;
    }

    if (name) zone.name = name;
    if (description !== undefined) zone.description = description;
    if (colorHex) zone.colorHex = colorHex;
    if (isActive !== undefined) zone.isActive = isActive;

    if (coordinates) {
      const formattedCoordinates = Array.isArray(coordinates[0][0])
        ? coordinates
        : [coordinates];

      if (!validateGeoJsonPolygon(formattedCoordinates)) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid GeoJSON Polygon ring closure.',
        });
        return;
      }

      zone.boundary = {
        type: 'Polygon',
        coordinates: formattedCoordinates,
      };
    }

    await zone.save();

    res.status(200).json({
      message: 'Zone updated successfully',
      zone,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * Controller: Delete / Deactivate a Zone (Admin only).
 */
export const deleteZone = async (req: Request, res: Response): Promise<void> => {
  try {
    const zone = await Zone.findById(req.params.id);
    if (!zone) {
      res.status(404).json({ error: 'Not Found', message: 'Zone not found.' });
      return;
    }

    zone.isActive = false;
    await zone.save();

    res.status(200).json({ message: 'Zone deactivated successfully', zoneId: zone._id });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * Controller: Point-in-polygon spatial detection diagnostic.
 * Accepts { longitude, latitude } and detects matching zone.
 */
export const detectZoneByPoint = async (req: Request, res: Response): Promise<void> => {
  try {
    const { longitude, latitude } = req.body;

    if (longitude === undefined || latitude === undefined) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Numeric longitude and latitude coordinates are required.',
      });
      return;
    }

    const activeZones = await Zone.find({ isActive: true });
    const matchedZone = detectZoneForCoordinates(
      Number(longitude),
      Number(latitude),
      activeZones
    );

    res.status(200).json({
      coordinates: { longitude: Number(longitude), latitude: Number(latitude) },
      isUnzoned: !matchedZone,
      matchedZone: matchedZone
        ? {
            id: matchedZone._id,
            name: matchedZone.name,
            code: matchedZone.code,
            colorHex: matchedZone.colorHex,
          }
        : null,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * Controller: Seed Default Enterprise Sample Zones (Admin / Evaluator helper).
 */
export const seedSampleZones = async (req: Request, res: Response): Promise<void> => {
  try {
    const sampleZonesData = [
      {
        name: 'South Gurgaon Enterprise Hub',
        code: 'ZONE-GGN-SOUTH',
        description: 'Cyber City, Golf Course Road, and DLF Phase 1-5',
        colorHex: '#6366f1', // Indigo
        boundary: {
          type: 'Polygon',
          coordinates: [
            [
              [77.0000, 28.4200],
              [77.1200, 28.4200],
              [77.1200, 28.5100],
              [77.0000, 28.5100],
              [77.0000, 28.4200], // Linear ring closure
            ],
          ],
        },
      },
      {
        name: 'Central Delhi Commercial District',
        code: 'ZONE-DELHI-CENTRAL',
        description: 'Connaught Place, India Gate, and Barakhamba Commercial Hub',
        colorHex: '#10b981', // Emerald
        boundary: {
          type: 'Polygon',
          coordinates: [
            [
              [77.2000, 28.6100],
              [77.2500, 28.6100],
              [77.2500, 28.6600],
              [77.2000, 28.6600],
              [77.2000, 28.6100], // Linear ring closure
            ],
          ],
        },
      },
      {
        name: 'Noida IT & Logistics Corridor',
        code: 'ZONE-NOIDA-EAST',
        description: 'Sector 62, Sector 132, and Greater Noida Expressway',
        colorHex: '#f59e0b', // Amber
        boundary: {
          type: 'Polygon',
          coordinates: [
            [
              [77.3400, 28.5000],
              [77.4200, 28.5000],
              [77.4200, 28.6300],
              [77.3400, 28.6300],
              [77.3400, 28.5000], // Linear ring closure
            ],
          ],
        },
      },
    ];

    const seededZones = [];

    for (const sample of sampleZonesData) {
      let zone = await Zone.findOne({ code: sample.code });
      if (!zone) {
        zone = await Zone.create(sample);
      }
      seededZones.push(zone);
    }

    res.status(200).json({
      message: 'Sample GeoJSON enterprise delivery zones seeded successfully',
      count: seededZones.length,
      zones: seededZones,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};
