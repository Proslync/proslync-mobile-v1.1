import type { Event } from './events.types';

export type TabType = 'overview' | 'lineup' | 'tables' | 'map';

export interface FloorData {
  id: string;
  name: string;
  level: number;
}

export interface TableMapItem {
  id: string;
  floorId: string;
  label: string;
  type: 'vip' | 'standard' | 'booth';
  seats: number;
  price: number;
  status: 'available' | 'reserved' | 'sold';
  /** Position as percentage (0-100) of container */
  x: number;
  y: number;
  imageUrl?: string;
  perks?: string[];
}

export interface PublicTableItem {
  id: string;
  label: string;
  hostName: string;
  hostAvatar?: string;
  totalSeats: number;
  filledSeats: number;
  pricePerSeat: number;
}

export interface LineupArtist {
  id: string;
  name: string;
  bio?: string;
  avatarUrl?: string;
  startTime: string;
  endTime: string;
  audioPreviewUrl?: string;
}

export interface BottleMenuCategory {
  id: string;
  name: string;
  items: BottleMenuItem[];
}

export interface BottleMenuItem {
  id: string;
  name: string;
  price: number;
  dealPrice?: number;
  imageUrl?: string;
  description?: string;
}

/** Extended event with fields not yet on backend */
export type EventDetailExtended = Event & {
  dressCode?: string;
  doorTime?: string;
  coverCharge?: string;
  ageRequirement?: string;
};
