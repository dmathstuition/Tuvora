'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { submitIntakeAction, type IntakeState } from '@/services/enrollment';

const field =
  'w-full rounded-2xl bg-slate-50 px-4 py-2.5 text-sm text-slate-800 shadow-[inset_3px_3px_8px_rgba(99,102,241,0.14),inset_-3px_-3px_8px_rgba(255,255,255,0.9)] placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400';
const label = 'mb-1.5 block text-sm font-semibold text-slate-700';
const req = <span className="text-pink-500">*</span>;

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4">
      <legend className="text-sm font-extrabold uppercase tracking-wide text-indigo-500">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

export function IntakeForm({
  token,
  defaultEmail,
  clay,
}: {
  token: string;
  defaultEmail: string;
  clay: string;
}) {
  const [state, formAction, pending] = useActionState<IntakeState, FormData>(submitIntakeAction, {});

  if (state.success) {
    return (
      <div className={`${clay} mx-auto max-w-md p-8 text-center`}>
        <div className="text-5xl">🎉</div>
        <h2 className="mt-3 text-lg font-extrabold text-slate-800">Enrolment details received!</h2>
        <p className="mt-2 text-sm text-slate-500">
          Thank you. Your tutor now has everything they need. Create the learner&apos;s portal
          account to access classes, progress and rewards.
        </p>
        <Link
          href={`/signup?invite=${token}`}
          className="mt-5 inline-flex items-center justify-center rounded-full bg-indigo-500 px-6 py-2.5 text-sm font-bold text-white shadow-[6px_6px_16px_rgba(99,102,241,0.35),-4px_-4px_12px_rgba(255,255,255,0.8)] transition hover:bg-indigo-600"
        >
          Create portal account →
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className={`${clay} space-y-8 p-6`}>
      <input type="hidden" name="token" value={token} />

      <Section title="Parent / guardian">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="parentName" className={label}>
              Full name {req}
            </label>
            <input id="parentName" name="parentName" required className={field} />
          </div>
          <div>
            <label htmlFor="relationship" className={label}>
              Relationship to learner
            </label>
            <input
              id="relationship"
              name="relationship"
              placeholder="Mother, Father, Guardian…"
              className={field}
            />
          </div>
          <div>
            <label htmlFor="parentEmail" className={label}>
              Email
            </label>
            <input
              id="parentEmail"
              name="parentEmail"
              type="email"
              defaultValue={defaultEmail}
              className={field}
            />
          </div>
          <div>
            <label htmlFor="parentPhone" className={label}>
              Phone
            </label>
            <input id="parentPhone" name="parentPhone" type="tel" className={field} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="parentOccupation" className={label}>
              Occupation
            </label>
            <input id="parentOccupation" name="parentOccupation" className={field} />
          </div>
        </div>
      </Section>

      <Section title="About the learner">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="dateOfBirth" className={label}>
              Date of birth
            </label>
            <input id="dateOfBirth" name="dateOfBirth" type="date" className={field} />
          </div>
          <div>
            <label htmlFor="currentGrade" className={label}>
              Current class / grade
            </label>
            <input
              id="currentGrade"
              name="currentGrade"
              placeholder="e.g. Grade 6 / JSS 1"
              className={field}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="currentSchool" className={label}>
              Current school
            </label>
            <input id="currentSchool" name="currentSchool" className={field} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="subjectsOfInterest" className={label}>
              Subjects of interest
            </label>
            <input
              id="subjectsOfInterest"
              name="subjectsOfInterest"
              placeholder="Maths, English, Physics (comma separated)"
              className={field}
            />
          </div>
          <div>
            <label htmlFor="strengths" className={label}>
              Strengths
            </label>
            <textarea id="strengths" name="strengths" rows={3} className={field} />
          </div>
          <div>
            <label htmlFor="weaknesses" className={label}>
              Areas to improve
            </label>
            <textarea id="weaknesses" name="weaknesses" rows={3} className={field} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="learningGoals" className={label}>
              Learning goals
            </label>
            <textarea
              id="learningGoals"
              name="learningGoals"
              rows={3}
              placeholder="What would you like your child to achieve?"
              className={field}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="specialNeeds" className={label}>
              Special needs or medical notes
            </label>
            <textarea
              id="specialNeeds"
              name="specialNeeds"
              rows={2}
              placeholder="Anything the tutor should be aware of (optional)"
              className={field}
            />
          </div>
        </div>
      </Section>

      <Section title="Availability & capacity">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="preferredMode" className={label}>
              Preferred mode
            </label>
            <select id="preferredMode" name="preferredMode" className={field} defaultValue="">
              <option value="">No preference</option>
              <option value="online">Online</option>
              <option value="in_person">In person</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
          <div>
            <label htmlFor="sessionsPerWeek" className={label}>
              Sessions per week
            </label>
            <input
              id="sessionsPerWeek"
              name="sessionsPerWeek"
              type="number"
              min={0}
              max={14}
              className={field}
            />
          </div>
          <div className="sm:col-span-2">
            <span className={label}>Preferred days</span>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((d) => (
                <label
                  key={d}
                  className="flex cursor-pointer items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 shadow-[inset_2px_2px_6px_rgba(99,102,241,0.12),inset_-2px_-2px_6px_rgba(255,255,255,0.9)]"
                >
                  <input type="checkbox" name="preferredDays" value={d} className="accent-indigo-500" />
                  {d}
                </label>
              ))}
            </div>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="preferredTimes" className={label}>
              Preferred times
            </label>
            <input
              id="preferredTimes"
              name="preferredTimes"
              placeholder="e.g. Weekday evenings after 5pm"
              className={field}
            />
          </div>
        </div>
      </Section>

      <Section title="Emergency contact & other">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="emergencyContactName" className={label}>
              Emergency contact name
            </label>
            <input id="emergencyContactName" name="emergencyContactName" className={field} />
          </div>
          <div>
            <label htmlFor="emergencyContactPhone" className={label}>
              Emergency contact phone
            </label>
            <input
              id="emergencyContactPhone"
              name="emergencyContactPhone"
              type="tel"
              className={field}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="howHeard" className={label}>
              How did you hear about us?
            </label>
            <input id="howHeard" name="howHeard" className={field} />
          </div>
        </div>
      </Section>

      {state.error && (
        <p className="rounded-2xl bg-pink-50 px-4 py-2.5 text-sm font-medium text-pink-600">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-indigo-500 px-6 py-3 text-sm font-bold text-white shadow-[6px_6px_16px_rgba(99,102,241,0.35),-4px_-4px_12px_rgba(255,255,255,0.8)] transition hover:bg-indigo-600 disabled:opacity-60"
      >
        {pending ? 'Submitting…' : 'Submit enrolment form'}
      </button>
    </form>
  );
}
