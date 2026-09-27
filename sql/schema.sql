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

create table if not exists orders (
  id serial primary key,
  stripe_checkout_session_id text not null unique,
  stripe_payment_intent_id text,
  status text not null default 'paid',
  mode text not null default 'test',
  amount_total_cents integer not null,
  currency text not null default 'EUR',
  customer_email text,
  shipping_address jsonb,
  created_at timestamptz not null default now()
);

-- Ajoute la colonne mode ('test' ou 'live') si la table existait déjà avant cette
-- migration, et déduit sa valeur des commandes passées à partir de l'id de session Stripe.
alter table orders add column if not exists mode text not null default 'test';
update orders set mode = 'live' where stripe_checkout_session_id like 'cs\_live\_%' and mode = 'test';

create index if not exists orders_mode_idx on orders (mode);

create table if not exists order_items (
  id serial primary key,
  order_id integer not null references orders (id) on delete cascade,
  product_slug text,
  name text not null,
  unit_amount_cents integer not null,
  quantity integer not null,
  currency text not null default 'EUR'
);

create index if not exists order_items_order_id_idx on order_items (order_id);

insert into products (slug, name, description, price_cents, image_url, category)
values
  ('bougie-lavande-apaisante', 'Bougie Lavande Apaisante', 'Bougie parfumée à la cire de soja, notes de lavande et bois de santal pour une ambiance relaxante.', 1990, null, 'bien-etre'),
  ('diffuseur-huiles-essentielles', 'Diffuseur d''Huiles Essentielles', 'Diffuseur ultrasonique en bois avec éclairage LED doux, idéal pour créer une atmosphère zen.', 3490, null, 'bien-etre'),
  ('coussin-mediation-lin', 'Coussin de Méditation en Lin', 'Coussin de méditation rembourré en fibres naturelles, housse en lin lavé.', 4290, null, 'decoration'),
  ('guirlande-dentelle-montmirail', 'Guirlande Dentelle Montmirail', 'Guirlande décorative en dentelle inspirée du savoir-faire des Dentelles de Montmirail.', 2490, null, 'decoration')
on conflict (slug) do nothing;
