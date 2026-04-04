import type { Event } from './events.types';

export type TabType = 'overview' | 'lineup' | 'map';

export interface LineupArtist {
  id: string;
  name: string;
  bio?: string;
  avatarUrl?: string;
  startTime: string;
  endTime: string;
  audioPreviewUrl?: string;
}

/** Extended event with fields not yet on backend */
export type EventDetailExtended = Event & {
  doorTime?: string;
  coverCharge?: string;
  ageRequirement?: string;
};
