import { z } from 'zod';
import { CURRENCY_CODES } from '@/constants/currencies';

const currencyValues = CURRENCY_CODES as [string, ...string[]];

/**
 * Richer onboarding schema. Captures who the educator is (solo vs a business
 * that employs tutors), where they operate (country + billing currency), and
 * how their learner/parent portal should look.
 */
export const createOrganizationSchema = z.object({
  name: z.string().min(2, 'Enter your business or tutoring name').max(80),
  ownerName: z.string().min(2, 'Enter your name').max(80),
  // Solo tutor vs a business that employs/manages other tutors.
  businessModel: z.enum(['solo', 'business']),
  country: z.string().min(2, 'Select your country').max(10),
  currency: z.enum(currencyValues),
  timezone: z.string().default('UTC'),
  subjects: z.array(z.string().min(1)).default([]),
  // Portal look & feel.
  portalName: z.string().max(60).optional().or(z.literal('')),
  portalWelcome: z.string().max(300).optional().or(z.literal('')),
  themeColor: z
    .string()
    .regex(/^#([0-9a-fA-F]{6})$/, 'Use a hex colour like #4F46E5')
    .optional()
    .or(z.literal('')),
});
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;

export const inviteMemberSchema = z.object({
  email: z.string().email('Enter a valid email'),
  role: z.enum(['admin', 'tutor', 'assistant', 'accountant', 'staff']),
});
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
