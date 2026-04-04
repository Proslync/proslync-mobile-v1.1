import type {
  LineupArtist,
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

export const MOCK_DEALS: EventDeal[] = [
  { id: 'd1', title: '2-for-1 Wells', description: 'All well drinks buy one get one', badge: DealBadgeType.HAPPY_HOUR, timeRange: '10PM - 11PM' },
  { id: 'd2', title: '$5 Shots', description: 'Select tequila and vodka shots', badge: DealBadgeType.SPECIAL },
  { id: 'd3', title: 'Free Entry Before 11', description: 'Skip the cover charge with early arrival', badge: DealBadgeType.LIMITED, timeRange: 'Before 11PM' },
];
