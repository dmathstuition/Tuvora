'use client';

import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Sparkles,
  UploadCloud,
  UserPlus,
  PartyPopper,
} from 'lucide-react';
import { LogoMark } from '@/components/brand/logo';
import { COUNTRIES } from '@/constants/countries';
import { CURRENCIES, defaultCurrencyForCountry } from '@/constants/currencies';
import {
  BUSINESS_TYPES,
  AGE_GROUPS,
  CURRICULA,
  LEVELS,
  TEACHING_FORMATS,
  DELIVERY_MODES,
  LEARNER_RANGES,
  MANAGEMENT_METHODS,
  GRADING_SYSTEMS,
  ACADEMIC_STRUCTURES,
  WORKING_DAYS,
  LESSON_DURATIONS,
  ONBOARDING_MODULES,
  INVITE_ROLES,
} from '@/constants/onboarding';
import { ONBOARDING_STEPS } from '@/config/onboarding-steps';
import { stepSchemas } from '@/schemas/onboarding';
import {
  saveOnboardingStepAction,
  uploadOnboardingLogoAction,
  inviteFromOnboardingAction,
  completeOnboardingAction,
  type OnboardingData,
} from '@/services/organizations/onboarding';
import { cn } from '@/lib/utils';
import { Field, TextField, TextArea, SelectField, OptionCards, ChipMultiSelect, TagInput, YesNoToggle } from './fields';

const detectedTz =
  typeof Intl !== 'undefined' ? (Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC') : 'UTC';

type Data = {
  about: { fullName: string; phone: string; personalCountry: string; personalTimezone: string; businessType: string };
  organization: { orgName: string; description: string; website: string; businessEmail: string; businessPhone: string; country: string; city: string; currency: string; timezone: string };
  teaching: { subjects: string[]; ageGroups: string[]; curricula: string[]; levels: string[]; teachingFormat: string; delivery: string };
  learners: { learnerCount: string; currentManagement: string; worksWithParents: boolean; hasMultipleStaff: boolean };
  modules: { modules: string[] };
  workspace: { currency: string; timezone: string; gradingSystem: string; academicStructure: string; defaultLessonDuration: string; workingDays: string[] };
};

export function OnboardingWizard({ initial }: { initial: OnboardingData }) {
  const d = initial.draft;
  const [step, setStep] = useState(Math.min(initial.step, ONBOARDING_STEPS.length - 1));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(d.logoUrl ?? null);
  const [logoBusy, setLogoBusy] = useState(false);
  const [invites, setInvites] = useState<{ email: string; role: string }[]>([]);

  const [data, setData] = useState<Data>({
    about: {
      fullName: d.about?.fullName ?? initial.ownerName ?? '',
      phone: d.about?.phone ?? '',
      personalCountry: d.about?.personalCountry ?? 'NG',
      personalTimezone: d.about?.personalTimezone ?? detectedTz,
      businessType: d.about?.businessType ?? 'solo',
    },
    organization: {
      orgName: d.organization?.orgName ?? '',
      description: d.organization?.description ?? '',
      website: d.organization?.website ?? '',
      businessEmail: d.organization?.businessEmail ?? initial.ownerEmail ?? '',
      businessPhone: d.organization?.businessPhone ?? '',
      country: d.organization?.country ?? 'NG',
      city: d.organization?.city ?? '',
      currency: d.organization?.currency ?? 'NGN',
      timezone: d.organization?.timezone ?? detectedTz,
    },
    teaching: {
      subjects: d.teaching?.subjects ?? [],
      ageGroups: d.teaching?.ageGroups ?? [],
      curricula: d.teaching?.curricula ?? [],
      levels: d.teaching?.levels ?? [],
      teachingFormat: d.teaching?.teachingFormat ?? 'one_to_one',
      delivery: d.teaching?.delivery ?? 'online',
    },
    learners: {
      learnerCount: d.learners?.learnerCount ?? '',
      currentManagement: d.learners?.currentManagement ?? '',
      worksWithParents: d.learners?.worksWithParents ?? false,
      hasMultipleStaff: d.learners?.hasMultipleStaff ?? false,
    },
    modules: { modules: d.modules?.modules ?? ['learners', 'classes', 'lessons', 'attendance'] },
    workspace: {
      currency: d.workspace?.currency ?? d.organization?.currency ?? 'NGN',
      timezone: d.workspace?.timezone ?? d.organization?.timezone ?? detectedTz,
      gradingSystem: d.workspace?.gradingSystem ?? 'percentage',
      academicStructure: d.workspace?.academicStructure ?? 'terms',
      defaultLessonDuration: d.workspace?.defaultLessonDuration ?? '60',
      workingDays: d.workspace?.workingDays ?? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    },
  });

  const meta = ONBOARDING_STEPS[step]!;
  const isComplete = meta.key === 'complete';
  const total = ONBOARDING_STEPS.length;

  function patch<K extends keyof Data>(key: K, value: Partial<Data[K]>) {
    setData((prev) => ({ ...prev, [key]: { ...prev[key], ...value } }));
  }

  async function goNext() {
    setError(null);
    const key = meta.key;
    // Steps without a data schema (team) just advance; invites are sent inline.
    if (key in stepSchemas) {
      const schema = stepSchemas[key as keyof typeof stepSchemas];
      const res = schema.safeParse((data as Record<string, unknown>)[key]);
      if (!res.success) {
        setError(res.error.issues[0]?.message ?? 'Please check the form.');
        return;
      }
      setSaving(true);
      const fd = new FormData();
      fd.set('stepKey', key);
      fd.set('payload', JSON.stringify((data as Record<string, unknown>)[key]));
      const out = await saveOnboardingStepAction({}, fd);
      setSaving(false);
      if (out.error) {
        setError(out.error);
        return;
      }
    }
    setStep((s) => Math.min(s + 1, total - 1));
  }

  function goBack() {
    setError(null);
    setStep((s) => Math.max(0, s - 1));
  }

  async function onLogo(file: File | null) {
    if (!file) return;
    setLogoBusy(true);
    const fd = new FormData();
    fd.set('image', file);
    const out = await uploadOnboardingLogoAction({}, fd);
    setLogoBusy(false);
    if (out.url) setLogoUrl(out.url);
    else if (out.error) setError(out.error);
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 py-6 sm:px-6">
      {/* Header + progress */}
      <div className="mb-8">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LogoMark className="h-8 w-8" />
            <span className="text-lg font-bold tracking-tight text-brand-900">Tuvora</span>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            Step {step + 1} of {total}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-violet-600 transition-all duration-500"
            style={{ width: `${((step + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Step body (animated on change) */}
      <div key={step} className="flex-1 animate-fade-up">
        <div className="mb-6">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-brand-500">
            <Sparkles className="h-3.5 w-3.5" /> {meta.title}
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-brand-900 sm:text-3xl">
            {meta.subtitle}
          </h1>
        </div>

        {meta.key === 'about' && (
          <div className="space-y-5">
            <Field label="Full name">
              <TextField value={data.about.fullName} onChange={(e) => patch('about', { fullName: e.target.value })} placeholder="Your name" />
            </Field>
            <Field label="Phone" optional>
              <TextField value={data.about.phone} onChange={(e) => patch('about', { phone: e.target.value })} placeholder="+234…" />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Country" optional>
                <SelectField value={data.about.personalCountry} onChange={(e) => patch('about', { personalCountry: e.target.value })} options={COUNTRIES.map((c) => ({ value: c.code, label: c.name }))} />
              </Field>
              <Field label="Timezone" optional>
                <TextField value={data.about.personalTimezone} onChange={(e) => patch('about', { personalTimezone: e.target.value })} placeholder="Africa/Lagos" />
              </Field>
            </div>
            <Field label="How do you run your tutoring?">
              <OptionCards value={data.about.businessType} onChange={(v) => patch('about', { businessType: v })} options={BUSINESS_TYPES.map((b) => ({ value: b.value, label: b.label, hint: b.hint }))} />
            </Field>
          </div>
        )}

        {meta.key === 'organization' && (
          <div className="space-y-5">
            <Field label="Organization name">
              <TextField value={data.organization.orgName} onChange={(e) => patch('organization', { orgName: e.target.value })} placeholder="e.g. Bright Minds Tutoring" />
            </Field>
            <Field label="Description" optional hint="A short line about your academy.">
              <TextArea value={data.organization.description} onChange={(e) => patch('organization', { description: e.target.value })} placeholder="We help students excel in maths and science." />
            </Field>
            <Field label="Logo" optional hint="PNG or JPG, up to 4MB.">
              <div className="flex items-center gap-4">
                <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" />
                  ) : (
                    <UploadCloud className="h-6 w-6 text-slate-400" />
                  )}
                </span>
                <label className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-brand-700 shadow-sm hover:bg-slate-50">
                  {logoBusy ? 'Uploading…' : logoUrl ? 'Change logo' : 'Upload logo'}
                  <input type="file" accept="image/*" className="hidden" disabled={logoBusy} onChange={(e) => onLogo(e.target.files?.[0] ?? null)} />
                </label>
              </div>
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Website" optional>
                <TextField value={data.organization.website} onChange={(e) => patch('organization', { website: e.target.value })} placeholder="https://…" />
              </Field>
              <Field label="Business email" optional>
                <TextField type="email" value={data.organization.businessEmail} onChange={(e) => patch('organization', { businessEmail: e.target.value })} placeholder="hello@academy.com" />
              </Field>
              <Field label="Business phone" optional>
                <TextField value={data.organization.businessPhone} onChange={(e) => patch('organization', { businessPhone: e.target.value })} />
              </Field>
              <Field label="City" optional>
                <TextField value={data.organization.city} onChange={(e) => patch('organization', { city: e.target.value })} />
              </Field>
              <Field label="Country">
                <SelectField
                  value={data.organization.country}
                  onChange={(e) => {
                    const country = e.target.value;
                    const currency = defaultCurrencyForCountry(country);
                    patch('organization', { country, currency });
                  }}
                  options={COUNTRIES.map((c) => ({ value: c.code, label: c.name }))}
                />
              </Field>
              <Field label="Currency">
                <SelectField value={data.organization.currency} onChange={(e) => patch('organization', { currency: e.target.value })} options={CURRENCIES.map((c) => ({ value: c.code, label: `${c.symbol} ${c.code}` }))} />
              </Field>
            </div>
            <Field label="Timezone">
              <TextField value={data.organization.timezone} onChange={(e) => patch('organization', { timezone: e.target.value })} placeholder="Africa/Lagos" />
            </Field>
          </div>
        )}

        {meta.key === 'teaching' && (
          <div className="space-y-6">
            <Field label="Subjects" hint="Type a subject and press Enter.">
              <TagInput values={data.teaching.subjects} onChange={(v) => patch('teaching', { subjects: v })} placeholder="Maths, English, Science…" />
            </Field>
            <Field label="Learner age groups" optional>
              <ChipMultiSelect values={data.teaching.ageGroups} onChange={(v) => patch('teaching', { ageGroups: v })} options={AGE_GROUPS} />
            </Field>
            <Field label="Curricula / education systems" optional>
              <ChipMultiSelect values={data.teaching.curricula} onChange={(v) => patch('teaching', { curricula: v })} options={CURRICULA} />
            </Field>
            <Field label="Levels" optional>
              <ChipMultiSelect values={data.teaching.levels} onChange={(v) => patch('teaching', { levels: v })} options={LEVELS} />
            </Field>
            <Field label="Teaching format">
              <OptionCards columns={3} value={data.teaching.teachingFormat} onChange={(v) => patch('teaching', { teachingFormat: v })} options={TEACHING_FORMATS.map((f) => ({ value: f.value, label: f.label }))} />
            </Field>
            <Field label="Delivery">
              <OptionCards columns={3} value={data.teaching.delivery} onChange={(v) => patch('teaching', { delivery: v })} options={DELIVERY_MODES.map((f) => ({ value: f.value, label: f.label }))} />
            </Field>
          </div>
        )}

        {meta.key === 'learners' && (
          <div className="space-y-6">
            <Field label="How many learners do you have?" optional>
              <ChipMultiSelect values={data.learners.learnerCount ? [data.learners.learnerCount] : []} onChange={(v) => patch('learners', { learnerCount: v[v.length - 1] ?? '' })} options={LEARNER_RANGES} />
            </Field>
            <Field label="How do you manage them today?" optional>
              <ChipMultiSelect values={data.learners.currentManagement ? [data.learners.currentManagement] : []} onChange={(v) => patch('learners', { currentManagement: v[v.length - 1] ?? '' })} options={MANAGEMENT_METHODS} />
            </Field>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
              <span className="text-sm font-semibold text-brand-900">Do you work with parents / guardians?</span>
              <YesNoToggle value={data.learners.worksWithParents} onChange={(v) => patch('learners', { worksWithParents: v })} />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
              <span className="text-sm font-semibold text-brand-900">Do you have multiple tutors / staff?</span>
              <YesNoToggle value={data.learners.hasMultipleStaff} onChange={(v) => patch('learners', { hasMultipleStaff: v })} />
            </div>
          </div>
        )}

        {meta.key === 'modules' && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">Pick the tools you want to use. You can change these anytime.</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {ONBOARDING_MODULES.map((m) => {
                const active = data.modules.modules.includes(m.key);
                return (
                  <button
                    type="button"
                    key={m.key}
                    onClick={() =>
                      patch('modules', {
                        modules: active
                          ? data.modules.modules.filter((x) => x !== m.key)
                          : [...data.modules.modules, m.key],
                      })
                    }
                    className={cn(
                      'flex items-center justify-between rounded-2xl border p-4 text-left text-sm font-bold transition-all',
                      active ? 'border-brand-500 bg-brand-50/60 text-brand-800 ring-2 ring-brand-200' : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300',
                    )}
                  >
                    {m.label}
                    {active && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {meta.key === 'workspace' && (
          <div className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Currency">
                <SelectField value={data.workspace.currency} onChange={(e) => patch('workspace', { currency: e.target.value })} options={CURRENCIES.map((c) => ({ value: c.code, label: `${c.symbol} ${c.code}` }))} />
              </Field>
              <Field label="Timezone">
                <TextField value={data.workspace.timezone} onChange={(e) => patch('workspace', { timezone: e.target.value })} />
              </Field>
              <Field label="Grading system">
                <SelectField value={data.workspace.gradingSystem} onChange={(e) => patch('workspace', { gradingSystem: e.target.value })} options={GRADING_SYSTEMS.map((g) => ({ value: g.value, label: g.label }))} />
              </Field>
              <Field label="Academic year">
                <SelectField value={data.workspace.academicStructure} onChange={(e) => patch('workspace', { academicStructure: e.target.value })} options={ACADEMIC_STRUCTURES.map((g) => ({ value: g.value, label: g.label }))} />
              </Field>
            </div>
            <Field label="Default lesson duration">
              <OptionCards columns={3} value={data.workspace.defaultLessonDuration} onChange={(v) => patch('workspace', { defaultLessonDuration: v })} options={LESSON_DURATIONS.map((l) => ({ value: l.value, label: l.label }))} />
            </Field>
            <Field label="Working days">
              <ChipMultiSelect values={data.workspace.workingDays} onChange={(v) => patch('workspace', { workingDays: v })} options={WORKING_DAYS} />
            </Field>
          </div>
        )}

        {meta.key === 'team' && (
          <TeamStep invites={invites} onInvited={(inv) => setInvites((prev) => [...prev, inv])} />
        )}

        {isComplete && (
          <CompletionStep data={data} logoUrl={logoUrl} invites={invites} />
        )}

        {error && (
          <p className="mt-5 rounded-xl bg-destructive/10 px-4 py-2.5 text-sm font-medium text-destructive">{error}</p>
        )}
      </div>

      {/* Footer nav */}
      <div className="mt-8 flex items-center justify-between gap-3 border-t border-slate-200 pt-5">
        {step > 0 && !isComplete ? (
          <button type="button" onClick={goBack} className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 hover:text-brand-700">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        ) : (
          <span />
        )}

        {isComplete ? (
          <form action={completeOnboardingAction}>
            <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-violet-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition hover:opacity-95">
              Enter dashboard <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        ) : (
          <div className="flex items-center gap-2">
            {meta.optional && (
              <button type="button" onClick={goNext} disabled={saving} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 hover:text-brand-700">
                Skip for now
              </button>
            )}
            <button
              type="button"
              onClick={goNext}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-violet-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition hover:opacity-95 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saving ? 'Saving…' : 'Continue'}
              {!saving && <ArrowRight className="h-4 w-4" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function TeamStep({
  invites,
  onInvited,
}: {
  invites: { email: string; role: string }[];
  onInvited: (inv: { email: string; role: string }) => void;
}) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('tutor');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function invite() {
    setErr(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErr('Enter a valid email.');
      return;
    }
    setBusy(true);
    const fd = new FormData();
    fd.set('email', email);
    fd.set('role', role);
    const out = await inviteFromOnboardingAction({}, fd);
    setBusy(false);
    if (out.error) {
      setErr(out.error);
      return;
    }
    onInvited({ email, role });
    setEmail('');
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-500">Invite tutors, admins and staff. They&apos;ll get a link to join — you can always do this later.</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <TextField value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="teammate@email.com" className="flex-1" />
        <SelectField value={role} onChange={(e) => setRole(e.target.value)} options={INVITE_ROLES.map((r) => ({ value: r.value, label: r.label }))} className="sm:w-44" />
        <button type="button" onClick={invite} disabled={busy} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm font-bold text-brand-700 hover:bg-brand-100 disabled:opacity-60">
          <UserPlus className="h-4 w-4" /> Invite
        </button>
      </div>
      {err && <p className="text-sm text-destructive">{err}</p>}
      {invites.length > 0 && (
        <ul className="space-y-2">
          {invites.map((i, idx) => (
            <li key={idx} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm shadow-sm">
              <span className="font-medium text-brand-900">{i.email}</span>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold capitalize text-emerald-600">Invited · {i.role}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CompletionStep({
  data,
  logoUrl,
  invites,
}: {
  data: Data;
  logoUrl: string | null;
  invites: { email: string; role: string }[];
}) {
  const summary = useMemo(
    () => [
      { label: 'Organization', value: data.organization.orgName || '—' },
      { label: 'Type', value: BUSINESS_TYPES.find((b) => b.value === data.about.businessType)?.label ?? '—' },
      { label: 'Subjects', value: data.teaching.subjects.join(', ') || '—' },
      { label: 'Format', value: TEACHING_FORMATS.find((f) => f.value === data.teaching.teachingFormat)?.label ?? '—' },
      { label: 'Delivery', value: DELIVERY_MODES.find((f) => f.value === data.teaching.delivery)?.label ?? '—' },
      { label: 'Modules', value: `${data.modules.modules.length} selected` },
      { label: 'Currency', value: data.workspace.currency },
      { label: 'Team invited', value: invites.length ? `${invites.length}` : 'None yet' },
    ],
    [data, invites],
  );

  return (
    <div className="text-center">
      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 to-violet-600 text-white shadow-lg shadow-violet-500/30">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <PartyPopper className="h-9 w-9" />
        )}
      </div>
      <h2 className="text-xl font-extrabold text-brand-900">
        {data.organization.orgName || 'Your academy'} is ready! 🎉
      </h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
        Here&apos;s a quick summary of your setup. You can change any of this later in Settings.
      </p>
      <dl className="mt-6 grid gap-2 text-left sm:grid-cols-2">
        {summary.map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{s.label}</dt>
            <dd className="mt-0.5 truncate text-sm font-bold text-brand-900">{s.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
