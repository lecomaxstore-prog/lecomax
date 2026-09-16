insert into public.settings (key, value)
values
  ('app_minimum_version', '1.0.0'),
  ('app_latest_version', '1.0.0'),
  ('app_force_update', 'false'),
  ('app_store_url', ''),
  ('app_support_contact', ''),
  ('app_notifications_enabled', 'true'),
  ('app_club_title', 'ECOCLUB'),
  ('app_club_description', 'Des avantages pensés pour vous.'),
  ('app_club_cta_label', 'Découvrir'),
  ('app_club_cta_destination', '/ecoclub'),
  ('app_wishlist_section_title', 'MES FAVORIS'),
  ('app_wishlist_recommendations_enabled', 'true'),
  ('app_wishlist_recommendations_title', 'VOUS AIMEREZ AUSSI'),
  ('app_wishlist_recommendation_slugs', ''),
  ('app_wishlist_promotional_label', 'NOUVEAU'),
  ('app_wishlist_default_sort', 'recommended'),
  ('app_cache_version', '1'),
  ('app_popular_searches', ''),
  ('app_home_promotions', 'true'),
  ('app_home_new_arrivals', 'true'),
  ('app_home_products', 'true'),
  ('app_home_welcome_offer', 'true'),
  ('app_onboarding_enabled', 'true'),
  ('app_onboarding_version', '1'),
  ('app_onboarding_title', 'Bienvenue chez L’ECOMAX'),
  ('app_onboarding_message', 'Découvrez une sélection actuelle, des paiements protégés et un suivi clair de vos commandes.')
on conflict (key) do nothing;

notify pgrst, 'reload schema';
