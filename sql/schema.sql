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

-- 'fontaine-interieur-zen' et 'plaid-leste-cocooning' n'existent pas chez
-- CJdropshipping : remplacés par des équivalents réellement disponibles
-- (voir migration ci-dessous). Le plaid n'est pas réellement lesté chez CJ,
-- d'où le changement de nom pour ne pas induire en erreur.
delete from products where slug in ('fontaine-interieur-zen', 'plaid-leste-cocooning');

insert into products (
  slug, name, description, price_cents, image_url, category, supplier_url,
  cj_product_id, cj_variant_id, cj_sku
)
values
  ('diffuseur-huiles-essentielles', 'Diffuseur d''Huiles Essentielles en Bois',
   'Diffuseur ultrasonique en bois avec éclairage LED doux, idéal pour créer une atmosphère zen. Diffusion silencieuse jusqu''à 6h.',
   2990, 'https://cf.cjdropshipping.com/5f06a8b4-85b3-440f-89a0-baa0d1fb4754.jpg', 'bien-etre',
   'https://cjdropshipping.com/product/1580441280076206080.html',
   '1580441280076206080', '1580441280097177607', 'CJKD1586240-AU-Black'),

  ('miroir-led-sans-fil', 'Miroir LED Sans Fil',
   'Miroir lumineux à LED tactile, rechargeable et sans fil, pour une lumière douce et flatteuse partout dans la maison.',
   4490, 'https://cf.cjdropshipping.com/1617346786721.jpg', 'bien-etre',
   'https://cjdropshipping.com/product/1377881281043501056.html',
   '1377881281043501056', '1377934291807375360', 'CJSN106354101AZ'),

  ('veilleuse-lune-3d', 'Veilleuse Lune 3D Flottante',
   'Veilleuse lunaire à lévitation magnétique avec télécommande tactile, 3 teintes de lumière évoquant le clair de lune pour un sommeil apaisé.',
   3490, 'https://cf.cjdropshipping.com/12ae7895-c887-4cf2-9ef1-4849feece65b.jpg', 'bien-etre',
   'https://cjdropshipping.com/product/1564850062642130944.html',
   '1564850062642130944', '1564850062751182848', 'CJJT155338401AZ'),

  ('plaid-moelleux-cocooning', 'Plaid Moelleux Cocooning',
   'Plaid en laine composite épaisse et douce, idéal pour se blottir au chaud et se détendre après une longue journée.',
   3490, 'https://cf.cjdropshipping.com/c51fad5c-1dd1-4096-8e65-d427c5d21e8d.jpg', 'bien-etre',
   'https://cjdropshipping.com/product/1419952937068793856.html',
   '1419952937068793856', '1419952939707011072', 'CJCZ122942801AZ'),

  ('coussin-masseur-nuque', 'Coussin Masseur Nuque & Épaules',
   'Masseur électrique chauffant multifonction pour soulager les tensions de la nuque, des épaules et du dos, à la maison ou en voiture.',
   2990, 'https://cj-product-center.oss-accelerate.aliyuncs.com/supplier/1688/0e502a27-dfa9-4e48-b02c-9d1725cd6d3e.jpg', 'bien-etre',
   'https://cjdropshipping.com/product/2087437804783431682.html',
   '2087437804783431682', '2087437804863123458', 'CJAM305523501AZ'),

  ('bruleur-encens-zen-ceramique', 'Brûle-Encens Zen en Céramique',
   'Brûle-encens en céramique façon fleur de lotus, pour une ambiance zen et apaisante dans le salon ou la chambre.',
   2490, 'https://oss-cf.cjdropshipping.com/product/2025/01/17/11/3c6a8b03-fb9d-4620-b9a1-8cd81440122b.jpg', 'decoration',
   'https://cjdropshipping.com/product/2501171109581600200.html',
   '2501171109581600200', '2501171109581600400', 'CJYD227361302BY'),

  ('guirlande-macrame-murale', 'Guirlande Macramé Murale',
   'Suspension murale en macramé tissée à la main, pour une touche bohème et chaleureuse dans n''importe quelle pièce.',
   2690, 'https://cf.cjdropshipping.com/20200302/1029578070338.jpg', 'decoration',
   'https://cjdropshipping.com/product/B7B0B318-64DA-4C52-93A9-9EEF006CA56C.html',
   'B7B0B318-64DA-4C52-93A9-9EEF006CA56C', 'A3330646-0E19-4717-A165-37E059D9A4FB', 'CJJJYSSZ00116-Khaki')

on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  price_cents = excluded.price_cents,
  image_url = excluded.image_url,
  category = excluded.category,
  supplier_url = excluded.supplier_url,
  cj_product_id = excluded.cj_product_id,
  cj_variant_id = excluded.cj_variant_id,
  cj_sku = excluded.cj_sku;
