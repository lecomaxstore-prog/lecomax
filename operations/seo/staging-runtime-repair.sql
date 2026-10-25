-- Operational repair for synthetic staging ONLY; never a production migration.
-- Runner must verify project tyltharlnbxrxibuxyye / organization mbhkspintqoxntjbykrm.
-- Transaction also verifies the reserved fixture population before changing anything.
BEGIN;
DO $$ BEGIN
 IF current_setting('lecomax.staging_target', true) IS DISTINCT FROM 'tyltharlnbxrxibuxyye' THEN
  RAISE EXCEPTION 'STAGING_TARGET_REQUIRED';
 END IF;
 IF (SELECT count(*) FROM public.products) <> 3
 OR EXISTS (SELECT 1 FROM public.products WHERE id NOT IN ('seo-fixture-fr','seo-fixture-ar','seo-fixture-inactive'))
 OR (SELECT count(*) FROM public.categories) <> 2
 OR EXISTS (SELECT 1 FROM public.categories WHERE id NOT IN (910001,910002)) THEN
  RAISE EXCEPTION 'SYNTHETIC_FIXTURE_BOUNDARY_REQUIRED';
 END IF;
END $$;
ALTER TABLE public.products
 ADD COLUMN price numeric NOT NULL DEFAULT 100 CHECK (price >= 0),
 ADD COLUMN original_price numeric,
 ADD COLUMN description_images jsonb NOT NULL DEFAULT '[]',
 ADD COLUMN video text,
 ADD COLUMN colors jsonb NOT NULL DEFAULT '[]',
 ADD COLUMN sizes jsonb NOT NULL DEFAULT '[]',
 ADD COLUMN featured boolean NOT NULL DEFAULT false,
 ADD COLUMN color_stock jsonb,
 ADD COLUMN preorder_enabled boolean NOT NULL DEFAULT false,
 ADD COLUMN preorder_estimated_at timestamptz,
 ADD COLUMN preorder_message text,
 ADD COLUMN tags jsonb NOT NULL DEFAULT '[]',
 ADD COLUMN created_at timestamptz NOT NULL DEFAULT now(),
 ADD COLUMN updated_at timestamptz;
ALTER TABLE public.categories
 ADD COLUMN sort_order integer NOT NULL DEFAULT 0,
 ADD COLUMN created_at timestamptz NOT NULL DEFAULT now(),
 ADD COLUMN updated_at timestamptz;
-- Category relations use URL slugs, not display labels. All values are synthetic.
UPDATE public.products SET category = CASE id WHEN 'seo-fixture-ar' THEN 'seo-fixture-category-ar' ELSE 'seo-fixture-category-fr' END;
CREATE TABLE public.pages (
 id text PRIMARY KEY, slug text NOT NULL UNIQUE, title text NOT NULL,
 content text, meta_title text, meta_description text, active boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz
);
CREATE TABLE public.ecomedia_posts (
 id text PRIMARY KEY, slug text NOT NULL UNIQUE, title text NOT NULL,
 content text, excerpt text, cover_image text, is_published boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz
);
CREATE TABLE public.settings (key text PRIMARY KEY, value text NOT NULL, updated_at timestamptz);
CREATE TABLE public.banners (
 id text PRIMARY KEY, title text, image text, active boolean NOT NULL DEFAULT false,
 sort_order integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.promotions (
 id text PRIMARY KEY, title text, active boolean NOT NULL DEFAULT false,
 product_ids jsonb NOT NULL DEFAULT '[]', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.reviews (
 id text PRIMARY KEY, product_slug text NOT NULL, author_name text, city text,
 rating integer CHECK (rating BETWEEN 1 AND 5), title text, body text, color text,
 image_url text, image_urls jsonb NOT NULL DEFAULT '[]', admin_reply text,
 verified_purchase boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now()
);
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['products','categories','pages','ecomedia_posts','settings','banners','promotions','reviews'] LOOP
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC, anon, authenticated, service_role', t);
  EXECUTE format('GRANT SELECT ON TABLE public.%I TO service_role', t);
 END LOOP;
END $$;
-- Empty supporting tables intentionally publish no CMS content, reviews or campaigns.
NOTIFY pgrst, 'reload schema';
COMMIT;
