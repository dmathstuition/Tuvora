-- ============================================================================
-- seed_prices.sql — Multi-currency plan prices (run after seed.sql).
-- All amounts are in MINOR units (USD cents / NGN kobo) and are admin-editable
-- placeholders. Per-learner monthly price supports the per-learner billing model.
-- ============================================================================

do $$
declare
  starter uuid; professional uuid; business uuid;
begin
  select id into starter from public.subscription_plans where slug = 'starter';
  select id into professional from public.subscription_plans where slug = 'professional';
  select id into business from public.subscription_plans where slug = 'business';

  -- (plan, currency, monthly, yearly, additional_learner, per_learner_monthly)
  insert into public.plan_prices
    (plan_id, currency, monthly_price_minor, yearly_price_minor, additional_learner_price_minor, per_learner_monthly_price_minor)
  values
    -- USD (cents)
    (starter,      'USD',  1900,  19000, 150, 500),
    (professional, 'USD',  4900,  49000, 120, 400),
    (business,     'USD',  9900,  99000,  90, 300),
    -- NGN (kobo) — placeholders for the Nigerian market
    (starter,      'NGN',  750000,  7500000, 200000, 200000),
    (professional, 'NGN', 1900000, 19000000, 150000, 150000),
    (business,     'NGN', 3500000, 35000000, 120000, 120000)
  on conflict (plan_id, currency) do update set
    monthly_price_minor = excluded.monthly_price_minor,
    yearly_price_minor = excluded.yearly_price_minor,
    additional_learner_price_minor = excluded.additional_learner_price_minor,
    per_learner_monthly_price_minor = excluded.per_learner_monthly_price_minor;
end $$;
