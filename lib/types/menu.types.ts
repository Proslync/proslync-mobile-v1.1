export interface VenueMenuCategory {
  id: number;
  venueId: number;
  name: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  items: VenueMenuItem[];
  createdAt: string;
  updatedAt: string;
}

export interface VenueMenuItem {
  id: number;
  venueId: number;
  categoryId: number;
  name: string;
  description?: string;
  price: number; // in cents
  isActive: boolean;
  displayOrder: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}
