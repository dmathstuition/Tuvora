import type { Metadata } from 'next';
import { Mail, LifeBuoy, ShieldCheck, MapPin } from 'lucide-react';
import { legalConfig } from '@/config/legal';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with the Tuvora team.',
};

const { companyName, address, contactEmail, supportEmail, privacyEmail } = legalConfig;

const channels = [
  { icon: Mail, title: 'General enquiries', value: contactEmail, tint: 'from-brand-500 to-violet-600' },
  { icon: LifeBuoy, title: 'Support', value: supportEmail, tint: 'from-emerald-500 to-teal-600' },
  { icon: ShieldCheck, title: 'Privacy', value: privacyEmail, tint: 'from-sky-500 to-blue-600' },
];

export default function ContactPage() {
  return (
    <div className="relative overflow-hidden">
      <div className="blob left-[-6rem] top-[-4rem] h-96 w-96 animate-blob bg-brand-400/40" />

      <section className="container relative max-w-3xl py-20 text-center md:py-28">
        <h1 className="bg-gradient-to-br from-brand-900 via-brand-700 to-violet-600 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent dark:from-white dark:via-brand-100 dark:to-violet-300 md:text-5xl">
          Get in touch
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          We&apos;d love to hear from you. Reach the right team below and we&apos;ll get back to you as
          soon as we can.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {channels.map(({ icon: Icon, title, value, tint }) => (
            <a
              key={title}
              href={`mailto:${value}`}
              className="glass-card rounded-3xl text-left transition-transform duration-300 hover:-translate-y-1"
            >
              <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${tint} text-white shadow-md`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold">{title}</p>
              <p className="mt-0.5 break-all text-sm text-muted-foreground">{value}</p>
            </a>
          ))}
        </div>

        <div className="glass-card mx-auto mt-6 flex max-w-md items-center gap-3 rounded-3xl text-left">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-500 to-slate-700 text-white shadow-md">
            <MapPin className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold">{companyName}</p>
            <p className="text-sm text-muted-foreground">{address}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
