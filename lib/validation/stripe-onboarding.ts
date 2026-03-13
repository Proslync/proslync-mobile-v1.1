import { z } from 'zod';

const currentYear = new Date().getFullYear();

export const personalInfoSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dobDay: z.number().min(1, 'Invalid day').max(31, 'Invalid day'),
  dobMonth: z.number().min(1, 'Invalid month').max(12, 'Invalid month'),
  dobYear: z
    .number()
    .min(1900, 'Invalid year')
    .max(currentYear - 18, 'Must be at least 18 years old'),
  ssnLast4: z
    .string()
    .length(4, 'Must be exactly 4 digits')
    .regex(/^\d{4}$/, 'Must be exactly 4 digits'),
});

export const addressSchema = z.object({
  line1: z.string().min(1, 'Street address is required'),
  line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().length(2, 'Must be 2-letter state code'),
  postalCode: z
    .string()
    .length(5, 'Must be 5-digit ZIP code')
    .regex(/^\d{5}$/, 'Must be 5-digit ZIP code'),
});

export const bankAccountSchema = z.object({
  routingNumber: z
    .string()
    .length(9, 'Must be 9-digit routing number')
    .regex(/^\d{9}$/, 'Must be 9-digit routing number'),
  accountNumber: z
    .string()
    .min(4, 'Must be at least 4 digits')
    .max(17, 'Must be at most 17 digits')
    .regex(/^\d+$/, 'Must contain only digits'),
  accountHolderName: z.string().min(1, 'Account holder name is required'),
  tosAccepted: z.literal(true, {
    message: 'You must accept the Terms of Service',
  }),
});

export const stripeOnboardingSchema = z.object({
  ...personalInfoSchema.shape,
  ...addressSchema.shape,
  ...bankAccountSchema.shape,
});

export type StripeOnboardingFormData = z.infer<typeof stripeOnboardingSchema>;

export const personalInfoFields: (keyof StripeOnboardingFormData)[] = [
  'firstName',
  'lastName',
  'dobDay',
  'dobMonth',
  'dobYear',
  'ssnLast4',
];

export const addressFields: (keyof StripeOnboardingFormData)[] = [
  'line1',
  'line2',
  'city',
  'state',
  'postalCode',
];

export const bankAccountFields: (keyof StripeOnboardingFormData)[] = [
  'routingNumber',
  'accountNumber',
  'accountHolderName',
  'tosAccepted',
];
