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
  perLearnerMonthlyPriceMinor: number;
  isRecommended: boolean;
  trialDays: number;
  features: Array<{ slug: FeatureSlug; name: string; value: EntitlementValue }>;
}

/**
 * Fetch active, public plans with feature entitlements, priced in `currency`.
 *
 * Prices come from plan_prices for the requested currency; when a plan has no
 * row for that currency we fall back to the plan's base columns (which are
 * treated as the plan's default currency). Everything is admin-configured in
 * the database — no prices or plan names are hardcoded. Returns [] if Supabase
 * is not configured so the page degrades gracefully.
 */
export async function getPublicPlans(currency = 'USD'): Promise<PublicPlan[]> {
  try {
    const supabase = await createClient();
    const { data: plans, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .eq('is_public', true)
      .order('sort_order', { ascending: true });

    if (error || !plans) return [];

    const [{ data: planFeatures }, { data: prices }] = await Promise.all([
      supabase.from('plan_features').select('plan_id, value, feature:features(slug, name, type)'),
      supabase.from('plan_prices').select('*').eq('currency', currency),
    ]);

    const priceByPlan = new Map((prices ?? []).map((p) => [p.plan_id, p]));

    return plans.map((p) => {
      const price = priceByPlan.get(p.id);
      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        description: p.description,
        currency: price ? currency : p.currency,
        monthlyPriceMinor: price ? price.monthly_price_minor : p.monthly_price_minor,
        yearlyPriceMinor: price ? price.yearly_price_minor : p.yearly_price_minor,
        includedLearners: p.included_learners,
        additionalLearnerPriceMinor: price
          ? price.additional_learner_price_minor
          : p.additional_learner_price_minor,
        perLearnerMonthlyPriceMinor: price ? price.per_learner_monthly_price_minor : 0,
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
      };
    });
  } catch {
    return [];
  }
}
