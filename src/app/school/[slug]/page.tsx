import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { GraduationCap } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { LoginForm } from '../../(auth)/login/login-form';

interface SchoolOrg {
  name: string;
  logoUrl: string | null;
  brandColor: string | null;
}

/** Public lookup of an academy by its slug (service role — no session yet). */
async function getSchoolBySlug(slug: string): Promise<SchoolOrg | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('organizations')
    .select('name, logo_url, brand_color')
    .eq('slug', slug.toLowerCase())
    .maybeSingle();
  if (!data) return null;
  return { name: data.name, logoUrl: data.logo_url, brandColor: data.brand_color };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const org = await getSchoolBySlug(slug);
  return { title: org ? `${org.name} · Student login` : 'Student login' };
}

export default async function SchoolLoginPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const org = await getSchoolBySlug(slug);
  if (!org) notFound();

  const accent = org.brandColor ?? '#4f46e5';

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-indigo-50 via-fuchsia-50/40 to-amber-50/40 px-6 py-10">
      {/* Playful blobs, matching the learner app */}
      <div className="pointer-events-none fixed -left-20 top-20 h-56 w-56 rounded-full bg-sky-300/30 blur-3xl" />
      <div className="pointer-events-none fixed -right-16 top-40 h-52 w-52 rounded-full bg-fuchsia-300/30 blur-3xl" />
      <div className="pointer-events-none fixed bottom-16 left-1/3 h-48 w-48 rounded-full bg-amber-300/30 blur-3xl" />

      <div className="relative w-full max-w-sm">
        {/* Academy identity on top */}
        <div className="mb-6 flex flex-col items-center text-center">
          {org.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={org.logoUrl}
              alt={org.name}
              className="h-16 w-16 rounded-2xl object-cover shadow-md ring-4 ring-white"
            />
          ) : (
            <span
              className="flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-md ring-4 ring-white"
              style={{ backgroundColor: accent }}
            >
              <GraduationCap className="h-8 w-8" />
            </span>
          )}
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-brand-900">{org.name}</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Student login</p>
        </div>

        <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-xl backdrop-blur-xl">
          <Suspense fallback={<div className="h-48" />}>
            <LoginForm defaultRedirect="/portal" />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Powered by{' '}
          <Link href="/" className="font-semibold text-brand-600 hover:underline">
            Tuvoria
          </Link>
        </p>
      </div>
    </div>
  );
}
