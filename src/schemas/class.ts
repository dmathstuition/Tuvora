import { z } from 'zod';

export const createClassSchema = z.object({
  name: z.string().min(1, 'Class name is required').max(80),
  description: z.string().max(2000).optional().or(z.literal('')),
  mode: z.enum(['group', 'one_to_one']).default('group'),
  capacity: z.coerce.number().int().positive().max(1000).optional(),
  meetingUrl: z
    .string()
    .url('Enter a valid meeting link (https://…)')
    .optional()
    .or(z.literal('')),
  startDate: z.string().optional().or(z.literal('')),
  endDate: z.string().optional().or(z.literal('')),
  status: z.enum(['draft', 'active', 'completed', 'archived']).default('active'),
});
export type CreateClassInput = z.infer<typeof createClassSchema>;
