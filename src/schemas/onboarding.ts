import { z } from 'zod';
import { CURRENCY_CODES } from '@/constants/currencies';

const currencyValues = CURRENCY_CODES as [string, ...string[]];
const optionalUrl = z
  .string()
  .trim()
  .url('Enter a valid URL (https://…)')
  .optional()
  .or(z.literal(''));
const optionalEmail = z.string().trim().email('Enter a valid email').optional().or(z.literal(''));

/** Per-step validation. Keys match ONBOARDING_STEPS[].key. */
export const stepSchemas = {
  about: z.object({
    fullName: z.string().trim().min(2, 'Enter your name').max(80),
    phone: z.string().trim().max(30).optional().or(z.literal('')),
    personalCountry: z.string().trim().max(10).optional().or(z.literal('')),
    personalTimezone: z.string().trim().max(60).optional().or(z.literal('')),
    businessType: z.enum(['solo', 'business', 'centre', 'online']),
  }),
  organization: z.object({
    orgName: z.string().trim().min(2, 'Enter your organization name').max(80),
    description: z.string().trim().max(400).optional().or(z.literal('')),
    website: optionalUrl,
    businessEmail: optionalEmail,
    businessPhone: z.string().trim().max(30).optional().or(z.literal('')),
    country: z.string().trim().min(2, 'Select your country').max(10),
    city: z.string().trim().max(80).optional().or(z.literal('')),
    currency: z.enum(currencyValues),
    timezone: z.string().trim().max(60).default('UTC'),
  }),
  teaching: z.object({
    subjects: z.array(z.string().min(1)).min(1, 'Add at least one subject'),
    ageGroups: z.array(z.string()).default([]),
    curricula: z.array(z.string()).default([]),
    levels: z.array(z.string()).default([]),
    teachingFormat: z.enum(['one_to_one', 'group', 'both']),
    delivery: z.enum(['online', 'physical', 'hybrid']),
  }),
  learners: z.object({
    learnerCount: z.string().optional().or(z.literal('')),
    currentManagement: z.string().optional().or(z.literal('')),
    worksWithParents: z.boolean().default(false),
    hasMultipleStaff: z.boolean().default(false),
  }),
  modules: z.object({
    modules: z.array(z.string()).min(1, 'Pick at least one module'),
  }),
  workspace: z.object({
    currency: z.enum(currencyValues),
    timezone: z.string().trim().max(60).default('UTC'),
    gradingSystem: z.enum(['percentage', 'letter', 'gpa', 'points', 'custom']),
    academicStructure: z.enum(['terms', 'semesters', 'quarters', 'rolling']),
    defaultLessonDuration: z.string().default('60'),
    workingDays: z.array(z.string()).default([]),
  }),
} as const;

export type StepKey = keyof typeof stepSchemas;

export type OnboardingDraft = {
  about?: z.infer<typeof stepSchemas.about>;
  organization?: z.infer<typeof stepSchemas.organization>;
  teaching?: z.infer<typeof stepSchemas.teaching>;
  learners?: z.infer<typeof stepSchemas.learners>;
  modules?: z.infer<typeof stepSchemas.modules>;
  workspace?: z.infer<typeof stepSchemas.workspace>;
  logoUrl?: string | null;
};
