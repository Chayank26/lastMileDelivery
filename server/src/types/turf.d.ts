/**
 * Type declaration for @turf/turf
 */

declare module '@turf/turf' {
  export function point(coordinates: [number, number], properties?: any, options?: any): any;
  export function polygon(coordinates: number[][][], properties?: any, options?: any): any;
  export function booleanPointInPolygon(point: any, polygon: any, options?: any): boolean;
  export function distance(from: any, to: any, options?: { units?: string }): number;
}
