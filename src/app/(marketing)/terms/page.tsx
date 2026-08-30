import type { Metadata } from 'next';
import { LegalShell } from '@/components/marketing/legal-shell';
import { legalConfig } from '@/config/legal';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'The terms that govern your use of Tuvora.',
};

const { product, companyName, jurisdiction, contactEmail } = legalConfig;

export default function TermsPage() {
  return (
    <LegalShell
      title="Terms of Service"
      intro={`These Terms of Service ("Terms") govern your access to and use of ${product}, operated by ${companyName} ("we", "us", "our"). By creating an account or using the service you agree to these Terms.`}
    >
      <h2>1. Who can use {product}</h2>
      <p>
        You must be at least 18 years old, or the age of majority in your jurisdiction, to create an
        account. By registering an organization you confirm you are authorised to enter into these
        Terms on behalf of that organization (your &ldquo;Academy&rdquo;). Learners and parents/guardians
        use the service under the account of, and by invitation from, an Academy.
      </p>

      <h2>2. Your account</h2>
      <ul>
        <li>You are responsible for the accuracy of the information you provide and for all activity under your account.</li>
        <li>You must keep your password confidential and notify us promptly of any unauthorised use.</li>
        <li>You are responsible for your team members, tutors, staff, learners and parents you invite, and their use of the service.</li>
      </ul>

      <h2>3. Free trial &amp; subscriptions</h2>
      <ul>
        <li>New Academies may receive a free trial for the period stated at sign-up. During the trial all included features are available.</li>
        <li>After the trial, continued use of paid features requires an active subscription. Fees, billing intervals and per-learner pricing are shown before you subscribe.</li>
        <li>Subscriptions renew automatically for the chosen interval unless cancelled before the renewal date. You can cancel at any time; access continues until the end of the paid period.</li>
        <li>Except where required by law, fees already paid are non-refundable. We may change pricing on reasonable notice.</li>
        <li>Payments may be processed by third-party payment providers; their terms also apply to those transactions.</li>
      </ul>

      <h2>4. Your content and data</h2>
      <p>
        You and your Academy retain ownership of the data and content you submit — including learner
        records, lessons, assignments, submissions, uploaded files and messages (&ldquo;Your
        Content&rdquo;). You grant us a limited licence to host, process and display Your Content
        solely to provide and improve the service. You are responsible for having the necessary rights
        and consents (including from parents/guardians of minors) for the data you upload.
      </p>

      <h2>5. Acceptable use</h2>
      <p>
        Your use of {product} must comply with our{' '}
        <a href="/acceptable-use">Acceptable Use Policy</a> and all applicable laws. You must not
        misuse the service, attempt to disrupt it, access it without authorisation, or use it to store
        or share unlawful, harmful or infringing material.
      </p>

      <h2>6. AI features</h2>
      <p>
        Some features use artificial intelligence to generate content such as explanations, questions
        or feedback. AI output may be inaccurate or incomplete and must be reviewed by a qualified
        educator before being relied upon. You are responsible for how AI output is used with learners.
      </p>

      <h2>7. Intellectual property</h2>
      <p>
        The {product} software, brand, and all related materials are owned by {companyName} and
        protected by law. These Terms grant you a limited, non-exclusive, non-transferable right to
        use the service; no other rights are granted.
      </p>

      <h2>8. Third-party services</h2>
      <p>
        The service may link to or integrate with third-party services (for example video meeting
        links, payment providers and email delivery). We are not responsible for third-party services,
        and your use of them is governed by their own terms.
      </p>

      <h2>9. Availability &amp; changes</h2>
      <p>
        We work hard to keep {product} available but do not guarantee uninterrupted service. We may
        modify, suspend or discontinue features, and will give reasonable notice of material adverse
        changes where practical.
      </p>

      <h2>10. Termination</h2>
      <p>
        You may stop using the service and close your account at any time. We may suspend or terminate
        access if you breach these Terms or the Acceptable Use Policy, or where required by law.
        Following termination we will make your data available for export for a reasonable period,
        after which it may be deleted.
      </p>

      <h2>11. Disclaimers</h2>
      <p>
        The service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties
        of any kind, whether express or implied, to the fullest extent permitted by law. We do not
        warrant that the service will be error-free or that results obtained from it will be accurate.
      </p>

      <h2>12. Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, {companyName} will not be liable for any indirect,
        incidental, special or consequential damages, or for loss of profits, data or goodwill. Our
        total liability arising out of or relating to the service is limited to the amounts you paid
        us in the twelve months before the event giving rise to the claim.
      </p>

      <h2>13. Indemnity</h2>
      <p>
        You agree to indemnify and hold {companyName} harmless from claims arising out of Your Content
        or your breach of these Terms or applicable law.
      </p>

      <h2>14. Governing law</h2>
      <p>
        These Terms are governed by the laws of {jurisdiction}, and the courts of {jurisdiction} have
        exclusive jurisdiction, unless mandatory local law provides otherwise.
      </p>

      <h2>15. Changes to these Terms</h2>
      <p>
        We may update these Terms from time to time. We will post the updated version here and, for
        material changes, provide reasonable notice. Continued use after changes take effect means you
        accept the revised Terms.
      </p>

      <h2>16. Contact</h2>
      <p>
        Questions about these Terms? Email us at <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
      </p>
    </LegalShell>
  );
}
