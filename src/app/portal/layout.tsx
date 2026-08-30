import { getLearnerAccess } from '@/lib/portal/access';
import { PortalLocked } from '@/components/portal/portal-locked';

/**
 * Gates the whole learner portal. While the academy's 14-day free trial runs,
 * everyone is in. After that, a learner can only continue once their month has
 * been paid — otherwise every portal page is replaced by the "access paused"
 * screen. (An unlinked user falls through so the home page can guide them.)
 */
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const access = await getLearnerAccess();
  if (access.linked && !access.allowed) {
    return <PortalLocked academyName={access.academyName} />;
  }
  return <>{children}</>;
}
