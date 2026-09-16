-- Align website and app standard delivery while preserving free-shipping rules.
INSERT INTO public.settings (key, value, updated_at)
VALUES ('shipping_cost', '40', now())
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

UPDATE public.shipping_zones
SET standard_rate = 40
WHERE active = true;
