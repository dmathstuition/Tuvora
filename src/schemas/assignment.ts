import { z } from 'zod';

export const createAssignmentSchema = z
  .object({
    title: z.string().min(1, 'Title is required').max(120),
    /** Whether the work goes to a whole class or a single learner (one-to-one). */
    target: z.enum(['class', 'learner']).default('class'),
    classId: z.string().uuid('Select a class').optional().or(z.literal('')),
    learnerId: z.string().uuid('Select a learner').optional().or(z.literal('')),
    instructions: z.string().max(5000).optional().or(z.literal('')),
    maxPoints: z.coerce.number().positive().max(1000).optional(),
    dueAt: z.string().optional().or(z.literal('')),
  })
  .refine((v) => (v.target === 'class' ? !!v.classId : !!v.learnerId), {
    message: 'Choose who this assignment is for',
    path: ['target'],
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
