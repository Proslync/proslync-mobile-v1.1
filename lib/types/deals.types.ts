export enum DealBadgeType {
  HAPPY_HOUR = 'Happy Hour',
  SPECIAL = 'Special',
  LIMITED = 'Limited',
  ALL_NIGHT = 'All Night',
}

export interface EventDeal {
  id: string;
  title: string;
  description: string;
  badge: DealBadgeType;
  timeRange?: string;
}
