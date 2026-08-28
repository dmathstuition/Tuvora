import { z } from 'zod';

export const createAssignmentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(120),
  classId: z.string().uuid('Select a class'),
  instructions: z.string().max(5000).optional().or(z.literal('')),
  maxPoints: z.coerce.number().positive().max(1000).optional(),
  dueAt: z.string().optional().or(z.literal('')),
});
export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;

export const gradeSubmissionSchema = z.object({
  submissionId: z.string().uuid(),
  score: z.coerce.number().min(0).max(100000),
  feedback: z.string().max(5000).optional().or(z.literal('')),
  /** 'graded' keeps it internal; 'returned' releases it to the learner. */
  action: z.enum(['graded', 'returned']).default('returned'),
});
export type GradeSubmissionInput = z.infer<typeof gradeSubmissionSchema>;
