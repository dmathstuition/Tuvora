import { z } from 'zod';
import { ORGANIZATION_TYPES } from '@/constants/organizations';

const orgTypeValues = ORGANIZATION_TYPES.map((t) => t.value) as [string, ...string[]];

export const createOrganizationSchema = z.object({
  name: z.string().min(2, 'Enter your business or tutoring name').max(80),
  ownerName: z.string().min(2, 'Enter the owner name').max(80),
  type: z.enum(orgTypeValues),
  country: z.string().length(2, 'Select a country').optional(),
  currency: z.string().min(3).max(3).default('USD'),
  timezone: z.string().default('UTC'),
  subjects: z.array(z.string().min(1)).default([]),
});
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;

export const inviteMemberSchema = z.object({
  email: z.string().email('Enter a valid email'),
  role: z.enum(['admin', 'tutor', 'assistant', 'accountant', 'staff']),
});
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
