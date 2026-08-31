import type { Metadata } from 'next';
import { LegalShell } from '@/components/marketing/legal-shell';
import { legalConfig } from '@/config/legal';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Tuvoria collects, uses and protects personal data.',
};

const { product, companyName, privacyEmail } = legalConfig;

export default function PrivacyPage() {
  return (
    <LegalShell
      title="Privacy Policy"
      intro={`This Privacy Policy explains how ${companyName} ("we") handles personal data in ${product}. We designed ${product} to keep each Academy's data private and isolated.`}
    >
      <h2>1. Our role: controller and processor</h2>
      <p>
        For account holders (tutors, admins and staff), we act as a <strong>data controller</strong>{' '}
        for the account and billing data we collect. For learner and parent data that an Academy adds
        to run its teaching, the Academy is the <strong>controller</strong> and we act as a{' '}
        <strong>data processor</strong> — we only process that data on the Academy&apos;s instructions
        to provide the service.
      </p>

      <h2>2. Data we collect</h2>
      <h3>Account &amp; profile</h3>
      <ul>
        <li>Name, email, phone, country, timezone and password (stored only as a secure hash).</li>
        <li>Organization details you provide during onboarding (name, address, subjects, preferences, logo).</li>
      </ul>
      <h3>Learner &amp; teaching data (entered by the Academy)</h3>
      <ul>
        <li>Learner profiles, classes, attendance, assignments, submissions and uploaded files, grades, progress and rewards.</li>
        <li>Parent/guardian contact details where provided by the Academy.</li>
      </ul>
      <h3>Billing</h3>
      <ul>
        <li>Subscription and payment records. Card details are handled by our payment providers — we do not store full card numbers.</li>
      </ul>
      <h3>Technical</h3>
      <ul>
        <li>Log data, device/browser information and essential cookies needed to run the service (see our <a href="/cookies">Cookie Policy</a>).</li>
      </ul>

      <h2>3. How we use data</h2>
      <ul>
        <li>To provide, secure and improve the service.</li>
        <li>To authenticate users and protect against fraud and abuse.</li>
        <li>To process payments and manage subscriptions.</li>
        <li>To send essential service communications (and, with consent where required, product updates).</li>
        <li>To comply with legal obligations.</li>
      </ul>
      <p>We do not sell personal data, and we do not use learner data for advertising.</p>

      <h2>4. Children&apos;s data</h2>
      <p>
        {product} is used by Academies to teach learners who may be children. Academies are
        responsible for obtaining any parental/guardian consent required by law before adding a
        child&apos;s data. As processor, we handle children&apos;s data only to deliver the service to
        the Academy, apply appropriate safeguards, and delete or return it on the Academy&apos;s
        instruction or on account closure. If you believe a child&apos;s data has been provided
        without proper consent, contact the relevant Academy or us at{' '}
        <a href={`mailto:${privacyEmail}`}>{privacyEmail}</a>.
      </p>

      <h2>5. Legal bases</h2>
      <p>
        Where applicable (e.g. under the GDPR), we rely on: performance of a contract (to provide the
        service), legitimate interests (to secure and improve it), consent (for optional
        communications and non-essential cookies), and legal obligation. Academies are responsible for
        the legal basis of the learner data they process.
      </p>

      <h2>6. Sharing &amp; sub-processors</h2>
      <p>
        We share data only with service providers who help us run {product} — such as cloud hosting
        and database, file storage, email delivery, payment processing and AI providers — under
        contracts that require them to protect the data and use it only for those services. We may
        also disclose data where required by law.
      </p>

      <h2>7. International transfers</h2>
      <p>
        Data may be processed in countries other than your own. Where required, we use appropriate
        safeguards (such as standard contractual clauses) for international transfers.
      </p>

      <h2>8. Security</h2>
      <p>
        We use technical and organisational measures to protect data, including encryption in transit,
        hashed passwords, strict per-Academy data isolation enforced at the database level (row-level
        security), and access controls. No system is perfectly secure, but we work to protect your
        data and to notify affected parties of material breaches as required by law.
      </p>

      <h2>9. Retention</h2>
      <p>
        We keep account and Academy data for as long as the account is active. After closure we retain
        data for a limited period to allow export and to meet legal obligations, then delete or
        anonymise it. Academies can delete learner records within the app.
      </p>

      <h2>10. Your rights</h2>
      <p>
        Depending on your location, you may have rights to access, correct, delete, port or restrict
        the processing of your personal data, and to object or withdraw consent. Account holders can
        exercise many of these in the app. For learner data, please contact the relevant Academy (the
        controller). To exercise rights regarding data we control, email{' '}
        <a href={`mailto:${privacyEmail}`}>{privacyEmail}</a>.
      </p>

      <h2>11. Changes</h2>
      <p>
        We may update this policy and will post the new version here, with notice of material changes.
      </p>

      <h2>12. Contact</h2>
      <p>
        For privacy questions or requests, contact{' '}
        <a href={`mailto:${privacyEmail}`}>{privacyEmail}</a>.
      </p>
    </LegalShell>
  );
}
