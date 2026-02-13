import { z } from 'zod';

const locationDetailsSchema = z.object({
  addressLine1: z.string(),
  city: z.string(),
  state: z.string(),
  postalCode: z.string(),
  country: z.string(),
  formattedAddress: z.string().optional(),
  coordinates: z.object({ lat: z.number(), lng: z.number() }).optional(),
}).optional();

// Base event form schema with all validations
// Keep values as strings for form inputs, convert in submit handler
export const eventFormSchema = z
  .object({
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
    flyerUri: z.string().nullable().optional(),

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
    isPublic: z.boolean(),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: 'End date must be after start date',
    path: ['endDate'],
  });

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
  flyerUri: z.string().nullable().optional(),
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
  isPublic: z.boolean(),
});

// Type export - form values (all as input types)
export type EventFormData = z.infer<typeof eventFormSchema>;
export type BasicInfoFormData = z.infer<typeof basicInfoSchema>;
export type DateTimeFormData = z.infer<typeof dateTimeSchema>;
export type LocationFormData = z.infer<typeof locationSchema>;
export type DetailsFormData = z.infer<typeof detailsSchema>;

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
    isPublic: data.isPublic,
  };
}
