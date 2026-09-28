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

-- Sous-catégorie (usage affichage/navigation uniquement) : permet de
-- regrouper les produits par thème à l'intérieur d'une catégorie.
alter table products add column if not exists subcategory text;
create index if not exists products_subcategory_idx on products (subcategory);

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

-- Classement des produits en sous-catégories (2026-09-28) pour permettre une
-- navigation par thème sur le site.
update products set subcategory = 'massage-detente'
where slug in ('coussin-masseur-nuque', 'masseur-corps-electrique', 'masseur-facial-led', 'appareil-traction-cervicale');

update products set subcategory = 'sommeil-repos'
where slug in ('veilleuse-lune-3d', 'plaid-moelleux-cocooning', 'taie-oreiller-satin');

update products set subcategory = 'sport-posture'
where slug in ('correcteur-posture-intelligent', 'hamac-yoga-anti-gravite', 'chaussettes-compression');

update products set subcategory = 'soin-rituel'
where slug in ('diffuseur-huiles-essentielles', 'pommeau-douche-econome', 'miroir-led-sans-fil');

update products set subcategory = 'murs-textiles'
where slug in ('guirlande-macrame-murale', 'tenture-murale-foret-etoilee');

update products set subcategory = 'objets-zen'
where slug in ('humidificateur-vase-decoratif', 'pyramide-cristal-oeil-de-tigre', 'bruleur-encens-zen-ceramique');

-- Réécriture des descriptions produit (2026-09-28) : les descriptions
-- initiales étaient trop courtes pour donner envie d'acheter. Nouvelles
-- descriptions plus détaillées (fonctionnement, usage concret, bénéfice).
update products set description = 'Diffuseur ultrasonique à froid en bois véritable, sans chaleur ni combustion, pour préserver toutes les vertus de vos huiles essentielles. Réservoir grande capacité pour une diffusion silencieuse jusqu''à 6h en continu, avec un éclairage LED multicolore réglable pour une ambiance douce en soirée. S''arrête automatiquement une fois l''eau évaporée, sans surveillance nécessaire : à poser dans le salon, la chambre ou un bureau.'
where slug = 'diffuseur-huiles-essentielles';

update products set description = 'Miroir grossissant avec anneau LED intégré, pour une lumière homogène qui révèle chaque détail sans zone d''ombre, idéal pour le maquillage ou le soin du visage. Batterie rechargeable par USB : aucun câble ni prise à proximité, il se pose où l''on veut, salle de bain, chambre ou coiffeuse. Intensité lumineuse réglable au toucher pour s''adapter à la luminosité de la pièce.'
where slug = 'miroir-led-sans-fil';

update products set description = 'Veilleuse en forme de lune imprimée en relief 3D, en lévitation magnétique au-dessus de son socle en bois : elle tourne doucement dans les airs, sans fil ni support visible. Télécommande tactile pour choisir parmi plusieurs teintes de lumière et régler l''intensité, pour un clair de lune apaisant qui accompagne l''endormissement. Un objet aussi fonctionnel que décoratif, qui attire les regards dans une chambre ou un salon.'
where slug = 'veilleuse-lune-3d';

update products set description = 'Plaid en laine composite double face, ultra doux façon peluche d''un côté et texturé gaufré de l''autre, épais sans être lourd. Format généreux pour s''y blottir en entier sur le canapé ou dans le lit, et garder la chaleur sans surchauffer. Facile d''entretien, ne bouloche pas au lavage : un indispensable pour les soirées cocooning et les fins de journée qui s''éternisent.'
where slug = 'plaid-moelleux-cocooning';

update products set description = 'Masseur électrique à billes rotatives avec fonction chauffante intégrée, pour un pétrissage profond façon shiatsu qui dénoue les tensions de la nuque, des épaules et du bas du dos. Deux sangles réglables permettent de le fixer sur une chaise de bureau, un fauteuil, ou le siège de la voiture grâce à l''adaptateur allume-cigare fourni. Idéal après une journée assise ou une séance de sport, à la maison comme en déplacement.'
where slug = 'coussin-masseur-nuque';

update products set description = 'Brûle-encens en céramique émaillée, sculpté en forme de fleur de lotus, pour accueillir un cône ou un bâtonnet d''encens en toute sécurité. La fumée s''échappe doucement par les pétales ajourés, créant un effet visuel apaisant en plus du parfum diffusé. Un objet décoratif à part entière, à poser sur une table basse, une étagère ou un coin méditation.'
where slug = 'bruleur-encens-zen-ceramique';

update products set description = 'Suspension murale tissée à la main selon des techniques traditionnelles de macramé, en coton naturel texturé pour un rendu artisanal authentique. Elle vient habiller un mur nu au-dessus d''un lit ou d''un canapé, pour une touche bohème et chaleureuse sans multiplier les trous dans le mur. Livrée avec sa branche de bois pour un accrochage immédiat, prête à suspendre dès réception.'
where slug = 'guirlande-macrame-murale';

update products set description = 'Correcteur de posture avec capteur électronique intégré : il détecte quand le dos se voûte et vibre discrètement pour rappeler de se redresser, sans avoir à y penser. Écran digital affichant l''angle d''inclinaison et le nombre de rappels reçus dans la journée, pour suivre ses progrès au fil du temps. Harnais réglable en mousse respirante, à porter sous ou sur un vêtement au bureau, en télétravail ou pendant le sport.'
where slug = 'correcteur-posture-intelligent';

update products set description = 'Hamac de yoga aérien en tissu résistant, avec sangles de suspension et quincaillerie de fixation incluses pour un montage au plafond ou sur une structure adaptée. Il permet des étirements en décharge complète du poids du corps, pour soulager les vertèbres et progresser en souplesse sans forcer sur les articulations. Convient aussi bien à la pratique du yoga aérien qu''à un simple moment de détente suspendu.'
where slug = 'hamac-yoga-anti-gravite';

update products set description = 'Masseur électrique à double tête avec rouleaux vibrants et fonction chauffante, pour un massage en pétrissage profond qui détend le dos, les jambes, les épaules et les mollets. Moteur silencieux et prise en main ergonomique pour atteindre facilement toutes les zones, seul ou à deux. Plusieurs vitesses réglables pour adapter l''intensité, du massage léger de détente au pétrissage plus soutenu après le sport.'
where slug = 'masseur-corps-electrique';

update products set description = 'Humidificateur d''air ultrasonique en forme de vase texturé façon bois, qui diffuse une brume fine et silencieuse pour réhydrater l''air ambiant, particulièrement utile en hiver avec le chauffage. Réservoir dissimulé dans la base du vase, à remplir simplement, pour un objet qui reste décoratif même éteint sur une étagère ou une table de chevet. Fonctionne aussi bien avec de l''eau seule qu''avec quelques gouttes d''huile essentielle pour parfumer la pièce.'
where slug = 'humidificateur-vase-decoratif';

update products set description = 'Appareil de soin du visage 7-en-1 combinant micro-courants EMS, luminothérapie LED multicolore et vibrations, pour un rituel de soin façon institut à la maison. Chaque couleur de LED correspond à un objectif différent (fermeté, éclat, apaisement) selon les principes classiques de la luminothérapie. Rechargeable par USB, à utiliser quelques minutes par jour en complément de sa crème habituelle, pour intégrer un geste beauté simple à sa routine.'
where slug = 'masseur-facial-led';

update products set description = 'Dispositif de traction cervicale et lombaire à gonfler soi-même, qui étire en douceur les vertèbres du cou pour relâcher la pression accumulée après une journée passée assis ou penché sur un écran. S''utilise allongé, quelques minutes par jour, en toute autonomie et sans rendez-vous. Une routine simple à intégrer avant de dormir ou en pause pour soulager les tensions de la nuque.'
where slug = 'appareil-traction-cervicale';

update products set description = 'Grande tenture murale en tissu léger imprimé d''une forêt sous un ciel étoilé, pour transformer un mur nu en quelques minutes sans travaux. Format généreux pensé pour couvrir toute la largeur d''une tête de lit ou d''un canapé, avec des couleurs profondes qui restent nettes au lavage. Se fixe avec des punaises ou du ruban adhésif double-face (non fourni), pour une déco bohème facile à installer et à faire évoluer.'
where slug = 'tenture-murale-foret-etoilee';

update products set description = 'Chaussettes de compression graduée, plus serrées à la cheville et plus souples vers le mollet, qui stimulent le retour veineux et réduisent la sensation de jambes lourdes. Recommandées après le sport, lors de longs trajets en avion ou en voiture, ou simplement pour les journées passées debout. Tissu respirant renforcé aux zones de friction, taille S/M, pour un maintien confortable toute la journée.'
where slug = 'chaussettes-compression';

update products set description = 'Taie d''oreiller en satin doux façon soie, dont la texture lisse réduit les frottements responsables des frisottis et des marques d''oreiller sur le visage au réveil. Format standard français 50x75cm, compatible avec la plupart des oreillers du commerce. Un petit geste beauté nocturne qui préserve les cheveux lissés ou colorés et la peau, sans changer ses habitudes de sommeil.'
where slug = 'taie-oreiller-satin';

update products set description = 'Pyramide façon orgonite en résine incluant de la pierre naturelle œil-de-tigre, traditionnellement associée à la confiance en soi et à l''ancrage. Un objet à la fois décoratif et symbolique, à poser sur un bureau, une étagère ou un coin méditation. Sa forme géométrique et ses reflets dorés en font une pièce qui attire l''œil, que l''on soit adepte de lithothérapie ou simplement sensible à l''esthétique des cristaux.'
where slug = 'pyramide-cristal-oeil-de-tigre';

update products set description = 'Pommeau de douche équipé d''une petite turbine interne qui accélère et resserre le jet d''eau, pour une sensation de pression plus forte tout en réduisant la consommation d''eau. Rotation à 360° pour orienter facilement le jet, installation simple sans outil sur la plupart des flexibles de douche standards. Une amélioration immédiate du confort de douche, pensée aussi pour un usage plus responsable de l''eau.'
where slug = 'pommeau-douche-econome';

-- Descriptions encore approfondies (2026-09-28, suite) : format accroche +
-- liste de bénéfices concrets + usage, pour donner beaucoup plus de matière
-- à l'acheteur qu'un simple paragraphe. Remplace les descriptions ci-dessus.
update products set description = $$Un diffuseur à froid, sans chaleur ni combustion, pour profiter de toutes les vertus de vos huiles essentielles sans les dénaturer.

Ce que vous obtenez :
• Diffusion ultrasonique silencieuse jusqu'à 6h en continu
• Boîtier en bois véritable, plus élégant qu'un diffuseur en plastique classique
• Éclairage LED multicolore réglable, pour une veilleuse douce le soir
• Arrêt automatique dès que l'eau est évaporée, sans risque de le laisser tourner à vide

À poser dans le salon, la chambre ou sur un bureau, avec vos huiles essentielles préférées, pour transformer une pièce en quelques minutes.$$
where slug = 'diffuseur-huiles-essentielles';

update products set description = $$Un miroir grossissant à LED pensé pour un maquillage précis ou un soin du visage minutieux, sans zone d'ombre.

Ce que vous obtenez :
• Anneau LED intégré autour du miroir, pour une lumière homogène façon miroir de coiffeuse professionnelle
• Batterie rechargeable par USB : aucun câble à brancher, il se pose où la lumière naturelle manque
• Intensité lumineuse réglable au toucher, pour s'adapter au moment de la journée
• Format compact, facile à ranger dans un tiroir ou à emporter en week-end

Un accessoire qui change vraiment l'expérience du matin, en salle de bain, dans une chambre ou en déplacement.$$
where slug = 'miroir-led-sans-fil';

update products set description = $$Une veilleuse en forme de lune, sculptée en relief 3D, qui lévite littéralement au-dessus de son socle en bois grâce à un système magnétique.

Ce que vous obtenez :
• Lévitation magnétique silencieuse : la lune tourne doucement dans les airs, sans fil ni support visible
• Télécommande tactile pour choisir la teinte de lumière et régler l'intensité
• Un effet visuel bluffant, qui surprend à chaque fois qu'on la découvre
• Autant un objet déco qu'une vraie veilleuse d'appoint pour la chambre

Posée sur une commode ou une table de chevet, elle devient vite le point d'attention de la pièce : un très beau cadeau à offrir ou à s'offrir.$$
where slug = 'veilleuse-lune-3d';

update products set description = $$Un plaid épais en laine composite, pensé pour les soirées où l'on ne veut plus bouger du canapé.

Ce que vous obtenez :
• Double texture : un côté ultra doux façon peluche, l'autre gaufré, selon l'envie
• Épaisseur généreuse qui garde la chaleur sans peser ni faire transpirer
• Format large, pensé pour s'y enrouler en entier, pas juste se couvrir les jambes
• Facile d'entretien, résiste au lavage en machine sans boulocher

Le compagnon idéal des soirées télé, des lectures au coin du canapé, ou des fins de journée qui s'éternisent sous la couette.$$
where slug = 'plaid-moelleux-cocooning';

update products set description = $$Un masseur électrique à billes rotatives chauffantes, pour reproduire à la maison les sensations d'un massage shiatsu.

Ce que vous obtenez :
• Rotation des billes dans les deux sens, pour un pétrissage profond qui cible les points de tension
• Fonction chauffante intégrée, pour détendre les muscles avant même que le massage commence
• Deux sangles réglables pour le fixer sur une chaise de bureau, un fauteuil ou un canapé
• Adaptateur allume-cigare fourni, pour l'utiliser aussi en voiture sur les longs trajets

Quinze minutes suffisent pour relâcher les tensions accumulées après une journée d'écran ou une séance de sport.$$
where slug = 'coussin-masseur-nuque';

update products set description = $$Un brûle-encens sculpté en céramique émaillée, en forme de fleur de lotus, aussi décoratif que fonctionnel.

Ce que vous obtenez :
• Compatible avec les cônes et bâtonnets d'encens classiques
• Pétales ajourés qui laissent échapper la fumée en volutes, pour un effet visuel apaisant
• Céramique stable, résistante à la chaleur, pensée pour un usage régulier en sécurité
• Un objet suffisamment travaillé pour rester exposé même sans encens allumé

À poser sur une table basse, une étagère ou un coin méditation, pour un petit rituel zen avant de dormir ou pendant le yoga.$$
where slug = 'bruleur-encens-zen-ceramique';

update products set description = $$Une suspension murale en macramé, tissée à la main selon des techniques artisanales traditionnelles.

Ce que vous obtenez :
• Coton naturel texturé, pour un rendu authentique, très éloigné d'une déco imprimée
• Livrée avec sa branche de bois, prête à accrocher dès réception
• Un seul point de fixation nécessaire au mur, contrairement à un cadre ou une étagère
• S'associe facilement avec des plantes, d'autres textiles ou une guirlande lumineuse

Parfaite au-dessus d'un lit, d'un canapé ou d'un bureau, pour une touche bohème qui change immédiatement l'ambiance d'une pièce.$$
where slug = 'guirlande-macrame-murale';

update products set description = $$Un correcteur de posture électronique qui ne se contente pas de maintenir le dos : il apprend à le redresser à force de rappels.

Ce que vous obtenez :
• Capteur de mouvement intégré qui détecte automatiquement quand le dos se voûte
• Vibration discrète dès que la mauvaise posture est détectée
• Écran digital affichant l'angle d'inclinaison et le nombre de rappels de la journée
• Harnais réglable en mousse respirante, à porter sous ou sur un vêtement

Idéal en télétravail, au bureau ou pendant le sport, pour rééduquer sa posture au fil des semaines plutôt que forcer sur un maintien rigide.$$
where slug = 'correcteur-posture-intelligent';

update products set description = $$Un hamac de yoga aérien, pour pratiquer des étirements en décharge complète du poids du corps, sans pression sur les vertèbres.

Ce que vous obtenez :
• Tissu résistant, testé pour supporter le poids d'un adulte en toute sécurité
• Sangles de suspension et quincaillerie de fixation incluses, aucun achat supplémentaire nécessaire
• Convient au yoga aérien encadré comme aux étirements libres à la maison
• Peut aussi servir de simple cocon suspendu pour se détendre

Une fois fixé au plafond ou sur une structure adaptée, il transforme n'importe quelle pièce en petit studio de yoga aérien.$$
where slug = 'hamac-yoga-anti-gravite';

update products set description = $$Un masseur électrique à double tête, pour un massage en pétrissage profond qui couvre tout le corps, du dos aux mollets.

Ce que vous obtenez :
• Rouleaux vibrants qui reproduisent le mouvement d'un massage manuel
• Fonction chauffante intégrée pour détendre les muscles en profondeur
• Plusieurs vitesses réglables, du massage léger au pétrissage plus soutenu après le sport
• Poignée ergonomique pour atteindre facilement le dos et les épaules seul

À utiliser après une séance de sport, une longue journée debout, ou simplement pour un moment de détente en solo ou à deux.$$
where slug = 'masseur-corps-electrique';

update products set description = $$Un humidificateur d'air qui ne ressemble à aucun autre : sa forme de vase texturé façon bois en fait un objet déco à part entière, même éteint.

Ce que vous obtenez :
• Diffusion ultrasonique d'une brume fine et silencieuse
• Réservoir dissimulé dans la base, invisible une fois posé sur une étagère
• Compatible avec l'eau seule ou quelques gouttes d'huile essentielle pour parfumer la pièce
• Particulièrement utile en hiver, quand le chauffage assèche l'air intérieur

Un objet aussi utile pour la qualité de l'air que pour la déco, à poser sur un bureau, une table de chevet ou une étagère du salon.$$
where slug = 'humidificateur-vase-decoratif';

update products set description = $$Un appareil de soin du visage 7 fonctions, qui combine plusieurs technologies utilisées en institut pour un rituel beauté à la maison.

Ce que vous obtenez :
• Micro-courants EMS pour un effet tonifiant sur les traits du visage
• Luminothérapie LED multicolore, chaque teinte correspondant à un objectif différent (fermeté, éclat, apaisement)
• Vibrations pour stimuler la circulation et faciliter la pénétration des soins appliqués
• Rechargeable par USB, sans pile à changer

Quelques minutes par jour suffisent, en complément de votre crème habituelle, pour intégrer un vrai geste beauté à votre routine du soir.$$
where slug = 'masseur-facial-led';

update products set description = $$Un dispositif de traction cervicale et lombaire à gonfler soi-même, pour étirer en douceur les vertèbres du cou et relâcher la pression accumulée dans la journée.

Ce que vous obtenez :
• Gonflage manuel progressif, pour doser soi-même l'intensité de l'étirement
• Utilisation en position allongée, sans manipulation compliquée
• Design compact et léger, facile à ranger entre deux utilisations
• Aucune séance ni rendez-vous nécessaire : quelques minutes suffisent

Une routine simple à intégrer avant de dormir ou en pause, particulièrement utile après une journée passée assis ou penché sur un écran.$$
where slug = 'appareil-traction-cervicale';

update products set description = $$Une grande tenture murale en tissu léger, imprimée d'une forêt sous un ciel étoilé, pour transformer un mur nu sans un seul coup de peinture.

Ce que vous obtenez :
• Format généreux (150x230cm), pensé pour couvrir toute la largeur d'une tête de lit ou d'un canapé
• Impression aux couleurs profondes qui restent nettes après lavage
• Tissu léger et souple, facile à plier et à transporter en cas de déménagement
• Se fixe simplement avec des punaises ou du ruban adhésif double-face (non fourni)

Une solution déco rapide et réversible, idéale en location ou pour changer d'ambiance sans engagement.$$
where slug = 'tenture-murale-foret-etoilee';

update products set description = $$Des chaussettes de compression graduée, pensées pour stimuler la circulation plutôt que simplement serrer la jambe.

Ce que vous obtenez :
• Compression dégressive : plus marquée à la cheville, plus souple vers le mollet
• Tissu respirant, renforcé aux zones de friction pour une meilleure durabilité
• Format taille S/M, adapté à la majorité des morphologies
• Aussi discrètes qu'une chaussette classique, à porter au quotidien sans y penser

Recommandées après le sport, sur un long trajet en avion ou en voiture, ou simplement pour les journées passées debout ou assis sans bouger.$$
where slug = 'chaussettes-compression';

update products set description = $$Une taie d'oreiller en satin doux façon soie, pensée pour un vrai rituel beauté nocturne plutôt qu'un simple accessoire de literie.

Ce que vous obtenez :
• Texture lisse qui réduit les frottements responsables des frisottis et des marques d'oreiller au réveil
• Format standard français 50x75cm, compatible avec la plupart des oreillers du commerce
• Toucher frais et agréable, particulièrement appréciable en été
• Entretien facile, sans routine de lavage particulière

Un petit changement dans la literie qui protège les cheveux lissés ou colorés et la peau, sans modifier ses habitudes de sommeil.$$
where slug = 'taie-oreiller-satin';

update products set description = $$Une pyramide façon orgonite en résine, intégrant de la pierre naturelle œil-de-tigre, à mi-chemin entre l'objet déco et la pièce symbolique.

Ce que vous obtenez :
• Pierre naturelle œil-de-tigre, traditionnellement associée à la confiance en soi et à l'ancrage
• Forme géométrique aux reflets dorés, qui capte la lumière sous tous les angles
• Format compact, facile à intégrer sur un bureau, une étagère ou un coin méditation
• Une pièce unique qui suscite toujours la curiosité des visiteurs

Que l'on soit adepte de lithothérapie ou simplement sensible à l'esthétique des cristaux, un bel objet à poser ou à offrir.$$
where slug = 'pyramide-cristal-oeil-de-tigre';

update products set description = $$Un pommeau de douche équipé d'une petite turbine interne, pour repenser la pression de l'eau plutôt que simplement réduire le débit.

Ce que vous obtenez :
• Turbine qui accélère et resserre le jet, pour une sensation de pression plus forte à débit d'eau réduit
• Rotation à 360°, pour orienter facilement le jet sans bouger le bras de douche
• Installation simple, sans outil, compatible avec la plupart des flexibles de douche standards
• Un geste concret pour réduire sa consommation d'eau sans sacrifier le confort

Un remplacement de quelques minutes qui se ressent dès la première douche, sur le confort comme sur la facture d'eau.$$
where slug = 'pommeau-douche-econome';

-- La photo initiale des chaussettes de compression comportait un filigrane
-- "X2" superposé (image marketing multi-lots) : remplacée par une photo du
-- même modèle noir sans filigrane.
update products set image_url = 'https://cf.cjdropshipping.com/20180925/2340941028846.jpg'
where slug = 'chaussettes-compression';

-- Correction d'un bug de fond (2026-09-28) : le nom de transporteur par
-- défaut 'CJPacket Ordinary' n'existe pas parmi les options réelles
-- proposées par l'API freightCalculate de CJ pour les produits classés
-- "sensibles" (électronique/batterie) — la commande fournisseur automatique
-- aurait probablement échoué pour ces 7 produits. Remplacé par une option
-- valide et économique confirmée via l'API.
update products set cj_logistic_name = 'CJPacket Sensitive Over Length'
where slug = 'appareil-traction-cervicale';
update products set cj_logistic_name = 'CJPacket Euro Sensitive F'
where slug in ('correcteur-posture-intelligent', 'coussin-masseur-nuque', 'masseur-facial-led', 'miroir-led-sans-fil', 'veilleuse-lune-3d');
update products set cj_logistic_name = 'YunExpress Sensitive'
where slug = 'masseur-corps-electrique';
