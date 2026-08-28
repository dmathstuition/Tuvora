import { createClient } from '@/lib/supabase/server';
import { parseEntitlement, type EntitlementValue } from '@/lib/entitlements/engine';
import type { FeatureSlug } from '@/constants/features';

export interface PublicPlan {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  monthlyPriceMinor: number;
  yearlyPriceMinor: number;
  currency: string;
  includedLearners: number;
  additionalLearnerPriceMinor: number;
  isRecommended: boolean;
  trialDays: number;
  features: Array<{ slug: FeatureSlug; name: string; value: EntitlementValue }>;
}

/**
 * Fetch active, public plans with their feature entitlements for the marketing
 * pricing page. Reads entirely from the database (admin-configured) — no prices
 * or plan names are hardcoded. Returns [] if Supabase is not yet configured so
 * the page degrades gracefully instead of crashing.
 */
export async function getPublicPlans(): Promise<PublicPlan[]> {
  try {
    const supabase = await createClient();
    const { data: plans, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .eq('is_public', true)
      .order('sort_order', { ascending: true });

    if (error || !plans) return [];

    const { data: planFeatures } = await supabase
      .from('plan_features')
      .select('plan_id, value, feature:features(slug, name, type)');

    return plans.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      description: p.description,
      monthlyPriceMinor: p.monthly_price_minor,
      yearlyPriceMinor: p.yearly_price_minor,
      currency: p.currency,
      includedLearners: p.included_learners,
      additionalLearnerPriceMinor: p.additional_learner_price_minor,
      isRecommended: p.is_recommended,
      trialDays: p.trial_days,
      features: (planFeatures ?? [])
        .filter((pf) => pf.plan_id === p.id)
        .map((pf) => {
          const feature = pf.feature as unknown as {
            slug: FeatureSlug;
            name: string;
            type: 'boolean' | 'numeric' | 'unlimited';
          } | null;
          return feature
            ? {
                slug: feature.slug,
                name: feature.name,
                value: parseEntitlement(feature.type, pf.value),
              }
            : null;
        })
        .filter((x): x is NonNullable<typeof x> => x !== null),
    }));
  } catch {
    return [];
  }
}
