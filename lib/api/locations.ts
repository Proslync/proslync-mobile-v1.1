// Locations API — anonymous heatmap data

import { apiClient } from './client';

export interface HeatmapPoint {
  latitude: number;
  longitude: number;
  weight: number;
}

export interface HeatmapResponse {
  points: HeatmapPoint[];
}

export const locationsApi = {
  getHeatmapPoints: async (
    lat: number,
    lng: number,
    radiusKm: number = 50,
  ): Promise<HeatmapPoint[]> => {
    const res = await apiClient.get<HeatmapResponse>(
      `/api/location/heatmap?lat=${lat}&lng=${lng}&radiusKm=${radiusKm}`,
    );
    return res.points;
  },
};
