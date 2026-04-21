import { z } from "zod";

// ─── Section A — Athletic Identity ─────────────────────────────────
export const athleticIdentitySchema = z.object({
  legalName: z.string().trim().min(2, "Enter your full legal name"),
  displayName: z.string().trim().min(1, "Enter a display name"),
  profilePhotoUri: z.string().min(1, "Add a profile photo"),
  sports: z.array(z.string()).min(1, "Pick at least one sport"),
  schoolId: z.string().min(1, "Select your school"),
  conference: z.string().min(1),
  division: z.string().min(1, "Select your division"),
  position: z.string().optional(),
  hometown: z
    .string()
    .trim()
    .min(2, "Enter your hometown")
    .regex(/,/, "Use City, ST format"),
  jerseyNumber: z.string().trim().max(3).optional(),
});
export type AthleticIdentityValues = z.infer<typeof athleticIdentitySchema>;

// ─── Section B — Professional Profile ──────────────────────────────
export const professionalProfileSchema = z.object({
  agentName: z.string().trim().optional(),
  agentEmail: z
    .string()
    .trim()
    .email("Invalid email")
    .optional()
    .or(z.literal("")),
  currentBrands: z.array(z.string()),
  charities: z.array(z.string()),
  extracurriculars: z.array(z.string()),
  interests: z.array(z.string()),
  bio: z
    .string()
    .trim()
    .min(1, "Write a short bio")
    .refine((v) => v.split(/\s+/).filter(Boolean).length <= 250, "Max 250 words"),
});
export type ProfessionalProfileValues = z.infer<
  typeof professionalProfileSchema
>;

// ─── Section C — Deal Preferences ──────────────────────────────────
export const dealPreferencesSchema = z.object({
  minDealAmountCents: z
    .number({ message: "Enter a minimum deal amount" })
    .int()
    .min(0, "Must be zero or positive"),
  dealTypes: z.array(z.string()).min(1, "Pick at least one deal type"),
  contentCategories: z.array(z.string()),
  availability: z
    .object({
      weekdays: z.array(z.string()),
      blackouts: z.array(z.string()),
    })
    .optional(),
});
export type DealPreferencesValues = z.infer<typeof dealPreferencesSchema>;

// ─── Legal consent ─────────────────────────────────────────────────
const mustBeTrue = (v: boolean) => v === true;
export const legalConsentSchema = z.object({
  biometricDisclosure: z.boolean().refine(mustBeTrue, "Required to continue"),
  ncaaCompliance: z.boolean().refine(mustBeTrue, "Required to continue"),
  termsAccepted: z.boolean().refine(mustBeTrue, "Required to continue"),
});
export type LegalConsentValues = z.infer<typeof legalConsentSchema>;

// ─── Composed ──────────────────────────────────────────────────────
export const athleteRegistrationSchema = athleticIdentitySchema
  .merge(professionalProfileSchema)
  .merge(dealPreferencesSchema);
export type AthleteRegistrationValues = z.infer<
  typeof athleteRegistrationSchema
>;
