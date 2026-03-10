import type {
  LineupArtist,
  FloorData,
  TableMapItem,
  PublicTableItem,
  BottleMenuCategory,
} from '@/lib/types/event-detail.types';
import type { EventDeal } from '@/lib/types/deals.types';
import { DealBadgeType } from '@/lib/types/deals.types';

export const MOCK_EVENT_ARTISTS: LineupArtist[] = [
  {
    id: '1',
    name: 'DJ Nova',
    bio: 'Resident DJ known for deep house and melodic techno sets.',
    avatarUrl: 'https://i.pravatar.cc/150?u=djnova',
    startTime: '10:00 PM',
    endTime: '11:30 PM',
    audioPreviewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  },
  {
    id: '2',
    name: 'Aria Banks',
    bio: 'Chart-topping vocalist bringing live energy to the stage.',
    avatarUrl: 'https://i.pravatar.cc/150?u=ariabanks',
    startTime: '11:30 PM',
    endTime: '1:00 AM',
    audioPreviewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  },
  {
    id: '3',
    name: 'Marcus Wave',
    bio: 'Underground hip-hop producer and live performer.',
    avatarUrl: 'https://i.pravatar.cc/150?u=marcuswave',
    startTime: '1:00 AM',
    endTime: '2:30 AM',
  },
];

export const MOCK_FLOORS: FloorData[] = [
  { id: 'floor-1', name: 'Main Floor', level: 1 },
  { id: 'floor-2', name: 'VIP Mezzanine', level: 2 },
];

export const MOCK_TABLE_INVENTORY: TableMapItem[] = [
  // Main Floor
  { id: 't1', floorId: 'floor-1', label: 'VIP 1', type: 'vip', seats: 8, price: 2500, status: 'available', x: 15, y: 25, perks: ['Bottle service', 'Dedicated waitress', 'Priority entry'] },
  { id: 't2', floorId: 'floor-1', label: 'VIP 2', type: 'vip', seats: 10, price: 3500, status: 'reserved', x: 75, y: 25, perks: ['Bottle service', 'Dedicated waitress', 'Priority entry'] },
  { id: 't3', floorId: 'floor-1', label: 'Booth A', type: 'booth', seats: 6, price: 1200, status: 'available', x: 15, y: 65, perks: ['Bottle service'] },
  { id: 't4', floorId: 'floor-1', label: 'Booth B', type: 'booth', seats: 6, price: 1200, status: 'available', x: 45, y: 65, perks: ['Bottle service'] },
  { id: 't5', floorId: 'floor-1', label: 'Standard 1', type: 'standard', seats: 4, price: 500, status: 'sold', x: 75, y: 65 },
  // VIP Mezzanine
  { id: 't6', floorId: 'floor-2', label: 'Skybox 1', type: 'vip', seats: 12, price: 5000, status: 'available', x: 30, y: 35, perks: ['Premium bottle service', 'Private bartender', 'Stage view'] },
  { id: 't7', floorId: 'floor-2', label: 'Skybox 2', type: 'vip', seats: 12, price: 5000, status: 'available', x: 70, y: 35, perks: ['Premium bottle service', 'Private bartender', 'Stage view'] },
  { id: 't8', floorId: 'floor-2', label: 'Lounge A', type: 'booth', seats: 4, price: 800, status: 'available', x: 50, y: 70 },
];

export const MOCK_PUBLIC_TABLES: PublicTableItem[] = [
  { id: 'pt1', label: 'VIP 1', hostName: 'Jake M.', hostAvatar: 'https://i.pravatar.cc/100?u=jakem', totalSeats: 8, filledSeats: 5, pricePerSeat: 350 },
  { id: 'pt2', label: 'Booth A', hostName: 'Sarah K.', hostAvatar: 'https://i.pravatar.cc/100?u=sarahk', totalSeats: 6, filledSeats: 2, pricePerSeat: 200 },
];

export const MOCK_BOTTLE_CATEGORIES: BottleMenuCategory[] = [
  {
    id: 'cat-1',
    name: 'Vodka',
    items: [
      { id: 'b1', name: 'Grey Goose', price: 450, dealPrice: 375, description: '750ml' },
      { id: 'b2', name: 'Belvedere', price: 400, description: '750ml' },
      { id: 'b3', name: 'Ciroc', price: 425, dealPrice: 350, description: '750ml' },
    ],
  },
  {
    id: 'cat-2',
    name: 'Champagne',
    items: [
      { id: 'b4', name: 'Moet & Chandon', price: 350, description: '750ml' },
      { id: 'b5', name: 'Dom Perignon', price: 800, description: '750ml' },
      { id: 'b6', name: 'Ace of Spades', price: 650, dealPrice: 550, description: '750ml' },
    ],
  },
  {
    id: 'cat-3',
    name: 'Whiskey',
    items: [
      { id: 'b7', name: 'Hennessy VS', price: 375, description: '750ml' },
      { id: 'b8', name: 'Hennessy VSOP', price: 500, description: '750ml' },
    ],
  },
];

export const MOCK_DEALS: EventDeal[] = [
  { id: 'd1', title: '2-for-1 Wells', description: 'All well drinks buy one get one', badge: DealBadgeType.HAPPY_HOUR, timeRange: '10PM - 11PM' },
  { id: 'd2', title: '$5 Shots', description: 'Select tequila and vodka shots', badge: DealBadgeType.SPECIAL },
  { id: 'd3', title: 'Free Entry Before 11', description: 'Skip the cover charge with early arrival', badge: DealBadgeType.LIMITED, timeRange: 'Before 11PM' },
];
