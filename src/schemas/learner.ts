import { z } from 'zod';
import { LEARNER_STATUSES } from '@/constants/organizations';

export const createLearnerSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(60),
  lastName: z.string().max(60).optional().or(z.literal('')),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  phone: z.string().max(30).optional().or(z.literal('')),
  dateOfBirth: z.string().optional().or(z.literal('')),
  country: z.string().length(2).optional().or(z.literal('')),
  timezone: z.string().optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
  status: z.enum(LEARNER_STATUSES).default('active'),
});
export type CreateLearnerInput = z.infer<typeof createLearnerSchema>;

export const updateLearnerSchema = createLearnerSchema.partial();
export type UpdateLearnerInput = z.infer<typeof updateLearnerSchema>;
