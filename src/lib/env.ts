/**
 * Validated environment access. Import server env ONLY from server code.
 * Referencing `serverEnv` from a client component will throw at runtime and is
 * caught by ESLint's server-only boundary in practice.
 */
import 'server-only';
import { z } from 'zod';

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  PAYSTACK_SECRET_KEY: z.string().optional(),
  PAYSTACK_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
});

let cached: z.infer<typeof serverSchema> | null = null;

export function serverEnv() {
  if (cached) return cached;
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      `Invalid server environment: ${parsed.error.issues.map((i) => i.path.join('.')).join(', ')}`,
    );
  }
  cached = parsed.data;
  return cached;
}
