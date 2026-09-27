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

-- Catalogue de démonstration initial retiré : remplacé par une sélection de
-- produits réellement sourçables en dropshipping (voir migration ci-dessous).
delete from products
where slug in (
  'bougie-lavande-apaisante',
  'coussin-mediation-lin',
  'guirlande-dentelle-montmirail'
);

insert into products (slug, name, description, price_cents, image_url, category)
values
  ('diffuseur-huiles-essentielles', 'Diffuseur d''Huiles Essentielles en Bois', 'Diffuseur ultrasonique en bois avec éclairage LED doux, idéal pour créer une atmosphère zen. Diffusion silencieuse jusqu''à 6h.', 2990, 'https://images.pexels.com/photos/6693958/pexels-photo-6693958.jpeg', 'bien-etre'),
  ('miroir-led-sans-fil', 'Miroir LED Sans Fil', 'Miroir lumineux à LED tactile, rechargeable et sans fil, pour une lumière douce et flatteuse partout dans la maison.', 4990, 'https://images.pexels.com/photos/6466223/pexels-photo-6466223.jpeg', 'bien-etre'),
  ('veilleuse-lune-3d', 'Veilleuse Lune 3D', 'Veilleuse lunaire imprimée en 3D avec télécommande, effets de lumière chaude évoquant le clair de lune pour un sommeil apaisé.', 2490, 'https://images.pexels.com/photos/10524859/pexels-photo-10524859.jpeg', 'bien-etre'),
  ('plaid-leste-cocooning', 'Plaid Lesté Cocooning', 'Couverture pondérée qui enveloppe le corps d''une pression douce et régulière, pour un relâchement du stress et un meilleur endormissement.', 5990, 'https://images.pexels.com/photos/17219736/pexels-photo-17219736.jpeg', 'bien-etre'),
  ('coussin-masseur-nuque', 'Coussin Masseur Nuque & Épaules', 'Masseur électrique chauffant à billes rotatives pour soulager les tensions de la nuque et des épaules après une longue journée.', 3990, 'https://images.pexels.com/photos/275768/pexels-photo-275768.jpeg', 'bien-etre'),
  ('fontaine-interieur-zen', 'Fontaine d''Intérieur Zen', 'Fontaine décorative avec circulation d''eau continue et bruit apaisant, pour une ambiance sereine dans le salon ou le bureau.', 4490, 'https://images.pexels.com/photos/32039197/pexels-photo-32039197.jpeg', 'decoration'),
  ('guirlande-macrame-murale', 'Guirlande Macramé Murale', 'Suspension murale en macramé tissée à la main, coton naturel, pour une touche bohème et chaleureuse dans n''importe quelle pièce.', 2690, 'https://images.pexels.com/photos/11719332/pexels-photo-11719332.jpeg', 'decoration')
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  price_cents = excluded.price_cents,
  image_url = excluded.image_url,
  category = excluded.category;
