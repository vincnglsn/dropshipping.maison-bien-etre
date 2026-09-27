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

-- URL du fournisseur (usage interne, jamais affichée aux clients) : permet de
-- retrouver rapidement où commander l'article une fois une vente reçue.
alter table products add column if not exists supplier_url text;

-- Identifiants CJdropshipping (usage interne) : nécessaires pour passer une
-- commande fournisseur automatiquement via leur API lors d'un paiement.
alter table products add column if not exists cj_product_id text;
alter table products add column if not exists cj_variant_id text;
alter table products add column if not exists cj_sku text;
alter table products add column if not exists cj_from_country_code text not null default 'CN';
alter table products add column if not exists cj_logistic_name text not null default 'CJPacket Ordinary';

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

-- Suivi des commandes passées automatiquement chez CJdropshipping suite à un
-- paiement Stripe : permet de savoir quelles commandes clients ont bien été
-- transmises au fournisseur, et de retrouver le numéro de suivi une fois expédié.
create table if not exists supplier_orders (
  id serial primary key,
  order_id integer not null references orders (id) on delete cascade,
  provider text not null default 'cjdropshipping',
  provider_order_id text,
  status text not null default 'pending',
  tracking_number text,
  error_message text,
  is_sandbox boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists supplier_orders_order_id_idx on supplier_orders (order_id);

-- Catalogue de démonstration initial retiré : remplacé par une sélection de
-- produits réellement sourçables en dropshipping (voir migration ci-dessous).
delete from products
where slug in (
  'bougie-lavande-apaisante',
  'coussin-mediation-lin',
  'guirlande-dentelle-montmirail'
);

insert into products (slug, name, description, price_cents, image_url, category, supplier_url)
values
  ('diffuseur-huiles-essentielles', 'Diffuseur d''Huiles Essentielles en Bois', 'Diffuseur ultrasonique en bois avec éclairage LED doux, idéal pour créer une atmosphère zen. Diffusion silencieuse jusqu''à 6h.', 2990, 'https://ae-pic-a1.aliexpress-media.com/kf/Sfbc47663af0e401b930cc640dbfe60d8K.jpg', 'bien-etre', 'https://www.aliexpress.com/item/1005008077463719.html'),
  ('miroir-led-sans-fil', 'Miroir LED Sans Fil', 'Miroir lumineux à LED tactile, rechargeable et sans fil, pour une lumière douce et flatteuse partout dans la maison.', 4990, 'https://ae-pic-a1.aliexpress-media.com/kf/Sa8bc7f7edfbd4c029505f2b2f7b4f7dcb.jpg', 'bien-etre', 'https://www.aliexpress.com/item/1005008595606756.html'),
  ('veilleuse-lune-3d', 'Veilleuse Lune 3D', 'Veilleuse lunaire imprimée en 3D avec télécommande, effets de lumière chaude évoquant le clair de lune pour un sommeil apaisé.', 2490, 'https://ae-pic-a1.aliexpress-media.com/kf/Sc81f0c55910c4a40983acc9e34657a40t.jpg', 'bien-etre', 'https://www.aliexpress.com/item/1005007096720102.html'),
  ('plaid-leste-cocooning', 'Plaid Lesté Cocooning', 'Couverture pondérée qui enveloppe le corps d''une pression douce et régulière, pour un relâchement du stress et un meilleur endormissement.', 5990, 'https://ae-pic-a1.aliexpress-media.com/kf/Sa4db6d2556054cb4a04837dfce05bfa6t.jpg', 'bien-etre', 'https://he.aliexpress.com/item/1005012671147818.html'),
  ('coussin-masseur-nuque', 'Coussin Masseur Nuque & Épaules', 'Masseur électrique chauffant à billes rotatives (Ekmoey Shiatsu) pour soulager les tensions de la nuque et des épaules après une longue journée. Expédié depuis l''Allemagne.', 3990, 'https://ae-pic-a1.aliexpress-media.com/kf/S81f0dc5d795c4631b9e329807ffedf15s.jpg', 'bien-etre', 'https://www.aliexpress.com/item/1005012036423291.html'),
  ('fontaine-interieur-zen', 'Fontaine d''Intérieur Zen', 'Fontaine décorative 3 niveaux avec circulation d''eau continue et bruit apaisant, pour une ambiance sereine dans le salon ou le bureau.', 4490, 'https://ae-pic-a1.aliexpress-media.com/kf/S57a91631c417400ba8dec2cadbbbf403z.jpg', 'decoration', 'https://www.aliexpress.com/item/1005008159886679.html'),
  ('guirlande-macrame-murale', 'Guirlande Macramé Murale', 'Suspension murale en macramé tissée à la main, coton naturel, motif feuille, pour une touche bohème et chaleureuse dans n''importe quelle pièce.', 2690, 'https://ae-pic-a1.aliexpress-media.com/kf/Sad6d11bdd2bc449e9ff3769c15870ad2R.png', 'decoration', 'https://www.aliexpress.com/item/1005012242321937.html')
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  price_cents = excluded.price_cents,
  image_url = excluded.image_url,
  category = excluded.category,
  supplier_url = excluded.supplier_url;
