export interface MapEvent {
  id: string;
  title: string;
  venue: string;
  latitude: number;
  longitude: number;
  imageUrl: string;
  date: string;
  time: string;
  rawDate: string;
  attendees: number;
  isLive: boolean;
  popularity: number;
  type: 'event' | 'venue' | 'hotspot';
  isUserRegistered: boolean;
}
