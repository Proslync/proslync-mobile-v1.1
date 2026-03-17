import { z } from 'zod';

// Inline tier pricing schema for event creation
const tierPricingFormSchema = z.object({
  name: z.string().min(1, 'Pricing name is required'),
  price: z.number().min(0, 'Price must be 0 or more'),
  currency: z.string().optional(),
  capacity: z.number().min(1).optional(),
});

const tierFormSchema = z.object({
  name: z.string().min(1, 'Tier name is required'),
  description: z.string().optional().or(z.literal('')),
  pricing: z.array(tierPricingFormSchema),
});

const locationDetailsSchema = z.object({
  addressLine1: z.string(),
  city: z.string(),
  state: z.string(),
  postalCode: z.string(),
  country: z.string(),
  formattedAddress: z.string().optional(),
  coordinates: z.object({ lat: z.number(), lng: z.number() }).optional(),
}).optional();

// Base event form fields — shared between create and edit schemas
const eventFormFields = {
  // Basic Info (Step 1)
  name: z
    .string()
    .min(1, 'Event name is required')
    .max(100, 'Event name must not exceed 100 characters'),
  description: z
    .string()
    .max(2000, 'Description must not exceed 2000 characters')
    .optional()
    .or(z.literal('')),
  flyerUri: z.string().min(1, 'A flyer image or video is required').nullable(),
  flyerMediaType: z.enum(['image', 'video']).nullable(),

  // Date & Time (Step 2)
  startDate: z.date(),
  endDate: z.date(),

  // Location (Step 3)
  venueId: z.number().optional(),
  location: z
    .string()
    .min(1, 'Location is required')
    .max(500, 'Location must not exceed 500 characters'),
  locationDetails: locationDetailsSchema,

  // Details (Step 4) - keep as strings for form state
  maxCapacity: z.string().optional().or(z.literal('')),
  minimumAge: z.string().optional().or(z.literal('')),
  dressCode: z.string().optional(),
  isPublic: z.boolean(),
  isPaid: z.boolean(),

  // Pricing (Step 5 - only when isPaid is true)
  tiers: z.array(tierFormSchema).optional(),

  // Door cover price (dollars as string for form input)
  doorCoverPrice: z.string().optional().or(z.literal('')),
};

const dateRefinement = {
  refine: (data: { startDate: Date; endDate: Date }) => data.endDate > data.startDate,
  message: 'End date must be after start date',
  path: ['endDate'] as string[],
};

// Create event schema — flyerUri required
export const eventFormSchema = z.object(eventFormFields).refine(
  dateRefinement.refine, { message: dateRefinement.message, path: dateRefinement.path },
);

// Per-step validation schemas for multi-step form
export const basicInfoSchema = z.object({
  name: z
    .string()
    .min(1, 'Event name is required')
    .max(100, 'Event name must not exceed 100 characters'),
  description: z
    .string()
    .max(2000, 'Description must not exceed 2000 characters')
    .optional()
    .or(z.literal('')),
  flyerUri: z.string().min(1, 'A flyer image or video is required'),
  flyerMediaType: z.enum(['image', 'video']),
});

export const dateTimeSchema = z
  .object({
    startDate: z.date(),
    endDate: z.date(),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: 'End date must be after start date',
    path: ['endDate'],
  });

export const locationSchema = z.object({
  venueId: z.number().optional(),
  location: z
    .string()
    .min(1, 'Location is required')
    .max(500, 'Location must not exceed 500 characters'),
  locationDetails: locationDetailsSchema,
});

export const detailsSchema = z.object({
  maxCapacity: z.string().optional().or(z.literal('')),
  minimumAge: z.string().optional().or(z.literal('')),
  dressCode: z.string().optional(),
  isPublic: z.boolean(),
  isPaid: z.boolean(),
});

export const pricingSchema = z.object({
  tiers: z.array(tierFormSchema).optional(),
});


// Type export - form values (all as input types)
export type EventFormData = z.infer<typeof eventFormSchema>;
export type BasicInfoFormData = z.infer<typeof basicInfoSchema>;
export type DateTimeFormData = z.infer<typeof dateTimeSchema>;
export type LocationFormData = z.infer<typeof locationSchema>;
export type DetailsFormData = z.infer<typeof detailsSchema>;
export type PricingFormData = z.infer<typeof pricingSchema>;
export type TierFormData = z.infer<typeof tierFormSchema>;
export type TierPricingFormData = z.infer<typeof tierPricingFormSchema>;

// Helper to parse string values to numbers for API submission
export function parseEventFormData(data: EventFormData) {
  return {
    name: data.name.trim(),
    description: data.description?.trim() || undefined,
    startDate: data.startDate.toISOString(),
    endDate: data.endDate.toISOString(),
    location: data.location.trim(),
    venueId: data.venueId || undefined,
    locationDetails: data.locationDetails || undefined,
    maxCapacity: data.maxCapacity && data.maxCapacity.trim() !== ''
      ? parseInt(data.maxCapacity, 10)
      : undefined,
    minimumAge: data.minimumAge && data.minimumAge.trim() !== ''
      ? parseInt(data.minimumAge, 10)
      : 21,
    dressCode: data.dressCode || undefined,
    isPublic: data.isPublic,
    // Include inline tiers when event is paid
    ...(data.isPaid && data.tiers?.length
      ? {
          tiers: data.tiers.map((tier, index) => ({
            name: tier.name.trim(),
            description: tier.description?.trim() || undefined,
            displayOrder: index,
            pricing: tier.pricing.map((p) => ({
              name: p.name.trim(),
              price: p.price,
              currency: p.currency || 'USD',
              capacity: p.capacity || undefined,
            })),
          })),
        }
      : {}),
    // Door cover price in cents
    ...(data.doorCoverPrice && data.doorCoverPrice.trim() !== ''
      ? { doorCoverPriceCents: Math.round(parseFloat(data.doorCoverPrice) * 100) }
      : {}),
  };
}
