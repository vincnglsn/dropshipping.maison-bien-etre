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
   3490, 'https://cf.cjdropshipping.com/102bafe6-82ba-404f-b0fd-7e65c1b9d797.jpg', 'bien-etre',
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

-- Troisième vague de produits (2026-09-28, suite) : mêmes critères que la
-- vague précédente (API CJdropshipping, productFlag=0 "trending products",
-- niche bien-être/décoration).
insert into products (
  slug, name, description, price_cents, image_url, category, supplier_url,
  cj_product_id, cj_variant_id, cj_sku
)
values
  ('masseur-facial-led', 'Masseur Facial LED 7-en-1',
   'Appareil de soin du visage 7 fonctions : micro-courant EMS, luminothérapie LED et vibrations, pour raffermir et purifier la peau à domicile.',
   2990, 'https://cf.cjdropshipping.com/a83f7246-f723-4224-bd1e-30b25a74de31.jpg', 'bien-etre',
   'https://cjdropshipping.com/product/1406822350284001280.html',
   '1406822350284001280', '1406822351689093120', 'CJCC118382301AZ'),

  ('appareil-traction-cervicale', 'Appareil de Traction Cervicale',
   'Dispositif de soutien lombaire et cervical pour étirer la nuque en douceur et soulager les tensions liées à une journée assise.',
   1990, 'https://cf.cjdropshipping.com/20200925/657681664249.jpg', 'bien-etre',
   'https://cjdropshipping.com/product/36A945E0-1C6D-44DD-A029-446411EB8200.html',
   '36A945E0-1C6D-44DD-A029-446411EB8200', '3BFEF9D7-3977-4336-B48F-7DE6E27E4F8C', 'CJBJMRAM01043-Blue-English'),

  ('tenture-murale-foret-etoilee', 'Tenture Murale Forêt Étoilée',
   'Grande tenture murale en tissu façon forêt sous un ciel étoilé, pour une décoration bohème et apaisante au-dessus du lit ou du canapé.',
   2990, 'https://cf.cjdropshipping.com/20190328/3732392518590.jpg', 'decoration',
   'https://cjdropshipping.com/product/A9C75904-0592-412C-9EC2-15B1F9378C0A.html',
   'A9C75904-0592-412C-9EC2-15B1F9378C0A', 'B68281A4-EEC5-4148-BEEE-3D8D80BE291D', 'CJJJJFCS00180-150x230cm thick'),

  ('chaussettes-compression', 'Chaussettes de Compression (taille S/M)',
   'Chaussettes de compression graduée pour améliorer la circulation, réduire les jambes lourdes et accélérer la récupération après le sport ou un long trajet.',
   1490, 'https://cf.cjdropshipping.com/2a96241b-bf97-4619-8766-12e4bb1a7593.jpg', 'bien-etre',
   'https://cjdropshipping.com/product/4A4F16B0-D283-4B64-8A51-A87A6919B30F.html',
   '4A4F16B0-D283-4B64-8A51-A87A6919B30F', '1453552568792911872', 'CJYDQXZQ00002-Black 2PC-S M')

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

-- Nouvelle vague de produits (2026-09-28) : sélectionnés parmi les articles
-- marqués "trending" par l'API CJdropshipping (productFlag=0) dans la
-- catégorie bien-être, pour des sujets à forte demande côté acheteurs.
insert into products (
  slug, name, description, price_cents, image_url, category, supplier_url,
  cj_product_id, cj_variant_id, cj_sku
)
values
  ('correcteur-posture-intelligent', 'Correcteur de Posture Intelligent',
   'Support dorsal ajustable pour corriger le dos vouté et soulager les tensions des épaules et de la clavicule, à porter au quotidien.',
   1990, 'https://cf.cjdropshipping.com/1612487036024.jpg', 'bien-etre',
   'https://cjdropshipping.com/product/1357500854936145920.html',
   '1357500854936145920', '1357500854957117440', 'CJJT100662701AZ'),

  ('hamac-yoga-anti-gravite', 'Hamac de Yoga Anti-Gravité',
   'Hamac de yoga aérien avec sangles de suspension incluses, pour des étirements en décharge, renforcer la souplesse et soulager le dos.',
   4490, 'https://cf.cjdropshipping.com/1621574645683.png', 'bien-etre',
   'https://cjdropshipping.com/product/8A13D4EE-2E18-44E9-8B48-2AD44C01255F.html',
   '8A13D4EE-2E18-44E9-8B48-2AD44C01255F', '1395612270276513792', 'CJYDQTJM00149-Black with Hangers straps'),

  ('masseur-corps-electrique', 'Masseur Corps Complet Électrique',
   'Masseur électrique à rouleaux vibrants, silencieux, pour pétrir et détendre le dos, les jambes et les épaules après l''effort.',
   2990, 'https://cf.cjdropshipping.com/15432480/876152385486.jpg', 'bien-etre',
   'https://cjdropshipping.com/product/E98BD910-C1BD-48C3-9D94-7A1766E1735B.html',
   'E98BD910-C1BD-48C3-9D94-7A1766E1735B', '2FFB3297-8E92-4684-8EB0-B3E09FDA009E', 'CJBJPFST00149-EU Plug-220V'),

  ('humidificateur-vase-decoratif', 'Humidificateur Vase Décoratif',
   'Humidificateur d''air en forme de vase façon bois, diffusion silencieuse pour assainir l''air tout en habillant une étagère ou un bureau.',
   2490, 'https://cf.cjdropshipping.com/15415200/941686723803.jpg', 'decoration',
   'https://cjdropshipping.com/product/8660979B-2AF0-4295-ACD4-61342DA354D9.html',
   '8660979B-2AF0-4295-ACD4-61342DA354D9', '09A3B203-9DB1-4EC6-A4F2-CB01EA39EA06', 'CJBJMRMB00020-Light wood grain')

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

-- Quatrième vague de produits (2026-09-28, suite) : mêmes critères
-- (CJdropshipping listV2, productFlag=0 "trending products", niche
-- bien-être/décoration).
insert into products (
  slug, name, description, price_cents, image_url, category, supplier_url,
  cj_product_id, cj_variant_id, cj_sku
)
values
  ('taie-oreiller-satin', 'Taie d''Oreiller en Satin',
   'Taie d''oreiller en satin doux façon soie, format standard 50x75cm, pour limiter les frottements sur la peau et les cheveux pendant le sommeil.',
   3490, 'https://cf.cjdropshipping.com/20200307/2030847358336.jpg', 'bien-etre',
   'https://cjdropshipping.com/product/F25DF9B2-5E6B-42C9-85FD-B34D55E39822.html',
   'F25DF9B2-5E6B-42C9-85FD-B34D55E39822', '5F0B29EB-74A1-4E05-B9C1-BF523D4DEF60', 'CJJJJFZT00222-Champagne-75X50cm-1pc'),

  ('pyramide-cristal-oeil-de-tigre', 'Pyramide Cristal Œil-de-Tigre',
   'Pyramide en pierre naturelle œil-de-tigre, objet de décoration et de méditation pour une touche zen sur un bureau ou une étagère.',
   2490, 'https://cf.cjdropshipping.com/1622250612875.jpg', 'decoration',
   'https://cjdropshipping.com/product/1363759538372743168.html',
   '1363759538372743168', '1398452539132874752', 'CJJT101832603CX'),

  ('pommeau-douche-econome', 'Pommeau de Douche Économe 360°',
   'Pommeau de douche à jet haute pression avec petite turbine, réduit la consommation d''eau tout en gardant un débit confortable.',
   1990, 'https://cf.cjdropshipping.com/7fed3426-081a-41ac-9c73-0e1880cfafd4.png', 'bien-etre',
   'https://cjdropshipping.com/product/1438099563213885440.html',
   '1438099563213885440', '1503280041168482304', 'CJYS128839899UF')

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
