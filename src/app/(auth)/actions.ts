'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { publicEnv } from '@/lib/public-env';
import { resolveHomePath } from '@/lib/auth/routing';
import { loginSchema, signUpSchema, forgotPasswordSchema, resetPasswordSchema } from '@/schemas/auth';

export type AuthActionState = { error?: string; message?: string };

/**
 * All auth actions validate input server-side with Zod, then call Supabase Auth.
 * Never trust the client — every field is re-validated here.
 */
export async function signUpAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signUpSchema.safeParse({
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid details' };
  }

  // A learner may be signing up via a portal invite link.
  const inviteToken = (formData.get('invite') as string) || '';

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${publicEnv.appUrl}/auth/callback?next=/${inviteToken ? 'portal' : 'onboarding'}`,
    },
  });
  if (error) return { error: error.message };

  // Link the learner record to this new user (safe to do before confirmation).
  if (inviteToken && data.user) {
    const { consumePortalInvite } = await import('@/services/portal/invites');
    await consumePortalInvite(inviteToken, data.user.id);
  }

  // When email confirmation is enabled, signUp returns no session — the user
  // must confirm via email before they have a session. Redirecting to a
  // protected route here would just bounce them back to /login and look broken.
  // Show a clear "check your email" message instead. When confirmation is off,
  // a session exists and we can route straight into the app.
  if (!data.session) {
    return {
      message:
        'Account created. Check your email to confirm your address, then log in to continue.',
    };
  }

  if (inviteToken) redirect('/portal');
  redirect('/onboarding');
}

export async function loginAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid credentials' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: 'Invalid email or password' };

  // Honour an explicit redirect (e.g. a protected page the user was sent from);
  // otherwise route by role — learners to their portal, tutors to the dashboard.
  const explicit = (formData.get('redirect') as string) || '';
  const target = explicit && explicit !== '/dashboard' ? explicit : await resolveHomePath();
  revalidatePath('/', 'layout');
  redirect(target);
}

export async function forgotPasswordAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get('email') });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid email' };
  }

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${publicEnv.appUrl}/auth/callback?next=/reset-password`,
  });
  // Always report success to avoid leaking which emails are registered.
  return { message: 'If an account exists, a reset link is on its way.' };
}

/**
 * Set a new password after following the emailed recovery link. The link signs
 * the user into a short-lived recovery session, so updateUser succeeds here.
 */
export async function resetPasswordAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid password' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Your reset link has expired or is invalid. Request a new one.' };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: error.message };

  revalidatePath('/', 'layout');
  redirect(await resolveHomePath());
}

/**
 * Change the password for the signed-in user (from Settings). Verifies the
 * current password first so a hijacked open session can't silently reset it.
 */
export async function changePasswordAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid password' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { error: 'You must be signed in.' };

  const currentPassword = String(formData.get('currentPassword') ?? '');
  if (!currentPassword) return { error: 'Enter your current password.' };

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (verifyError) return { error: 'Your current password is incorrect.' };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: error.message };

  return { message: 'Password changed successfully.' };
}

export async function logoutAction() {
  const supabase = await createClient();

  // If a learner is signing out, send them back to their academy's branded
  // login page rather than the generic Tuvora login.
  let target = '/login';
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const admin = createAdminClient();
    const { data: learner } = await admin
      .from('learners')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (learner) {
      const { data: org } = await admin
        .from('organizations')
        .select('slug')
        .eq('id', learner.organization_id)
        .maybeSingle();
      if (org?.slug) target = `/school/${org.slug}`;
    }
  }

  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect(target);
}
