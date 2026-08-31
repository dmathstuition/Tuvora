import type { Metadata } from 'next';
import { LegalShell } from '@/components/marketing/legal-shell';
import { legalConfig } from '@/config/legal';

export const metadata: Metadata = {
  title: 'Acceptable Use Policy',
  description: 'The rules for using Tuvoria responsibly and safely.',
};

const { product, supportEmail } = legalConfig;

export default function AcceptableUsePage() {
  return (
    <LegalShell
      title="Acceptable Use Policy"
      intro={`This Acceptable Use Policy sets out what you may and may not do with ${product}. It forms part of our Terms of Service.`}
    >
      <h2>1. Be lawful and respectful</h2>
      <p>You agree not to use {product} to:</p>
      <ul>
        <li>break any law or regulation, or infringe anyone&apos;s rights (including privacy and intellectual property);</li>
        <li>upload or share content that is unlawful, harmful, harassing, hateful, or sexually exploitative — especially any content that endangers a child;</li>
        <li>bully, threaten, impersonate or harass any learner, parent, tutor or other person;</li>
        <li>share another person&apos;s personal data without a lawful basis or the necessary consent.</li>
      </ul>

      <h2>2. Protect the platform</h2>
      <p>You must not:</p>
      <ul>
        <li>attempt to gain unauthorised access to the service, other accounts, or the data of other Academies;</li>
        <li>probe, scan or test the vulnerability of the service without our written permission;</li>
        <li>interfere with or disrupt the service, for example through malware, denial-of-service, or excessive automated requests;</li>
        <li>reverse engineer, resell or copy the service except as allowed by law.</li>
      </ul>

      <h2>3. Content &amp; file uploads</h2>
      <p>
        You are responsible for the files and content you upload (question sheets, submissions, images
        and messages). Only upload content you have the right to use, that is appropriate for an
        educational setting, and that does not contain malware.
      </p>

      <h2>4. AI features</h2>
      <p>
        Do not use AI features to generate unlawful, deceptive or harmful content, to attempt to
        extract underlying models or prompts, or in ways that could mislead learners. Always review AI
        output before sharing it with learners.
      </p>

      <h2>5. Fair use</h2>
      <p>
        Use the service reasonably. We may apply limits to protect performance and availability for all
        customers, and may investigate suspected abuse.
      </p>

      <h2>6. Enforcement</h2>
      <p>
        We may remove content or suspend or terminate access that breaches this policy, and will
        cooperate with law enforcement where required. If you become aware of a violation — especially
        any risk to a child&apos;s safety — report it immediately to{' '}
        <a href={`mailto:${supportEmail}`}>{supportEmail}</a>.
      </p>
    </LegalShell>
  );
}
