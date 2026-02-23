export interface VenueTableSection {
  id: number;
  venueId: number;
  name: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  tables: VenueTableItem[];
}

export interface VenueTableItem {
  id: number;
  venueId: number;
  sectionId: number;
  label: string;
  seatCount: number;
  minimumSpend?: number;
  imageUrl?: string;
  displayOrder: number;
  isActive: boolean;
}

export interface EventTableItem {
  id: number;
  eventId: number;
  venueTableId: number;
  price: number;
  currency: string;
  status: 'available' | 'reserved' | 'sold';
  label: string;
  seatCount: number;
  sectionName: string;
  sectionId: number;
  imageUrl?: string | null;
}

export interface ConfigureEventTableRequest {
  venueTableId: number;
  price: number;
  currency?: string;
}
