import { z } from 'zod';

// Phone number validation schema (for full phone with country code)
export const phoneSchema = z
  .string()
  .min(1, 'Phone number is required')
  .refine((val) => {
    // Basic E.164 format validation
    const e164Regex = /^\+[1-9]\d{6,14}$/;
    return e164Regex.test(val);
  }, 'Please enter a valid phone number');

// Local phone number validation schema (for phone input without country code)
export const localPhoneSchema = z
  .string()
  .min(1, 'Phone number is required')
  .refine((val) => {
    const digits = val.replace(/\D/g, '');
    return digits.length >= 6 && digits.length <= 15;
  }, 'Please enter a valid phone number');

// OTP validation schema
export const otpSchema = z
  .string()
  .length(6, 'OTP must be exactly 6 digits')
  .regex(/^\d{6}$/, 'OTP must contain only digits');

// Request OTP form schema with custom validation that includes country code
export const createRequestOtpSchema = (countryCode: string) =>
  z.object({
    phoneNumber: z
      .string()
      .min(1, 'Phone number is required')
      .superRefine((val, ctx) => {
        const digits = val.replace(/\D/g, '');

        if (digits.length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Phone number is required',
          });
          return;
        }

        // Basic length validation (most phone numbers are 6-15 digits)
        if (digits.length < 6 || digits.length > 15) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Please enter a valid phone number',
          });
        }
      }),
  });

// Default schema for backward compatibility (uses +1 as default)
export const requestOtpSchema = createRequestOtpSchema('+1');

// Verify OTP form schema
export const verifyOtpSchema = z.object({
  phoneNumber: phoneSchema,
  code: otpSchema,
});

// Profile setup form schema
export const profileSetupSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must not exceed 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'First name can only contain letters and spaces'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must not exceed 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Last name can only contain letters and spaces'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(100, 'Email must not exceed 100 characters'),
});

// Type exports
export type RequestOtpFormData = z.infer<typeof requestOtpSchema>;
export type VerifyOtpFormData = z.infer<typeof verifyOtpSchema>;
export type ProfileSetupFormData = z.infer<typeof profileSetupSchema>;
