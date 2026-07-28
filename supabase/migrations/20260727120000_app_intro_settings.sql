insert into public.settings (key, value)
values
  ('app_intro_enabled', 'true'),
  ('app_intro_message', 'DÉCOUVREZ. CHOISISSEZ. PROFITEZ.'),
  ('app_intro_background', '#080808'),
  ('app_intro_duration_ms', '1600'),
  ('app_intro_version', '1'),
  (
    'app_onboarding_slides',
    '[{"id":"discover","title":"TOUT L’ECOMAX, DANS VOTRE POCHE","description":"Découvrez nos nouveautés, collections et offres où que vous soyez.","image":""},{"id":"trust","title":"ACHETEZ EN TOUTE CONFIANCE","description":"Paiement sécurisé, livraison suivie et assistance à votre service.","image":""},{"id":"offers","title":"NE MANQUEZ AUCUNE OFFRE","description":"Enregistrez vos favoris et recevez nos nouveautés.","image":""}]'
  )
on conflict (key) do nothing;

notify pgrst, 'reload schema';
