import type { Metadata } from 'next';
import { LegalShell } from '@/components/marketing/legal-shell';
import { legalConfig } from '@/config/legal';

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'How Tuvoria uses cookies and similar technologies.',
};

const { product, privacyEmail } = legalConfig;

export default function CookiePage() {
  return (
    <LegalShell
      title="Cookie Policy"
      intro={`This policy explains how ${product} uses cookies and similar technologies, and the choices you have.`}
    >
      <h2>1. What cookies are</h2>
      <p>
        Cookies are small files stored on your device. Similar technologies include local storage.
        Together they let a site remember information between requests and pages.
      </p>

      <h2>2. How we use them</h2>
      <h3>Strictly necessary</h3>
      <ul>
        <li>Authentication and session cookies that keep you securely signed in.</li>
        <li>Security cookies that help protect against fraud and abuse.</li>
      </ul>
      <h3>Functional</h3>
      <ul>
        <li>Local storage that remembers small preferences (for example a chosen tab or theme) to improve your experience.</li>
      </ul>
      <p>
        {product} is a private, logged-in application. We do not use advertising cookies, and we do not
        use cookies to track you across other websites.
      </p>

      <h2>3. Third-party cookies</h2>
      <p>
        Some providers we rely on (such as our authentication and payment providers) may set their own
        strictly-necessary cookies when you use those features. Their use of cookies is governed by
        their own policies.
      </p>

      <h2>4. Managing cookies</h2>
      <p>
        You can control or delete cookies through your browser settings. Because our authentication
        cookies are strictly necessary, blocking them will prevent you from signing in and using the
        service.
      </p>

      <h2>5. Contact</h2>
      <p>
        Questions about cookies? Email <a href={`mailto:${privacyEmail}`}>{privacyEmail}</a>.
      </p>
    </LegalShell>
  );
}
