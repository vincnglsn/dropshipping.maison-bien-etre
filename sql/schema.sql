-- Schéma initial de la boutique Maison Bien-Être
-- À exécuter sur la base Neon (branche "production" par défaut, cf. .neon)

create table if not exists products (
  id serial primary key,
  slug text not null unique,
  name text not null,
  description text not null default '',
  price_cents integer not null,
  currency text not null default 'EUR',
  image_url text,
  category text not null default 'bien-etre',
  in_stock boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists products_category_idx on products (category);

insert into products (slug, name, description, price_cents, image_url, category)
values
  ('bougie-lavande-apaisante', 'Bougie Lavande Apaisante', 'Bougie parfumée à la cire de soja, notes de lavande et bois de santal pour une ambiance relaxante.', 1990, null, 'bien-etre'),
  ('diffuseur-huiles-essentielles', 'Diffuseur d''Huiles Essentielles', 'Diffuseur ultrasonique en bois avec éclairage LED doux, idéal pour créer une atmosphère zen.', 3490, null, 'bien-etre'),
  ('coussin-mediation-lin', 'Coussin de Méditation en Lin', 'Coussin de méditation rembourré en fibres naturelles, housse en lin lavé.', 4290, null, 'decoration'),
  ('guirlande-dentelle-montmirail', 'Guirlande Dentelle Montmirail', 'Guirlande décorative en dentelle inspirée du savoir-faire des Dentelles de Montmirail.', 2490, null, 'decoration')
on conflict (slug) do nothing;
