# Créer les pages Facebook départementales (mode d'emploi pour la tâche programmée)

Objectif : une page Facebook « Trucs à faire <Département> » par département, toutes publiées automatiquement.
Meta limite la création à environ **3 pages par jour** pour un même compte : au-delà, « Impossible de créer la Page ».
Clément a donné son accord (22 novembre 2026) pour cocher, à chaque création, la case
« J'accepte les Conditions commerciales de Meta et les Règlements des Pages » au nom du portefeuille Trucs à faire.

## Ordre
`social/ordre-departements.txt` : un code par ligne, du département le plus actif au moins actif.
Le prochain à faire est le premier code qui **n'a pas** de `meta.page_id` dans `social/config.json`.

## Pour chaque département (3 maximum par jour)
Portefeuille Meta « Trucs à faire » : business_id `1832013594605051`. Utilisateur système « Publieur » : `61596600761209`.

1. **Visuels** : `marque/reseaux/departements/<code>/profil.png` et `couverture.png`.
   S'ils manquent : servir le dépôt du site (`python3 -m http.server 8765` dans trucsafaire/sorties-bourbonnais-loire)
   puis `python3 social/outils/kit.py <code>`.
2. **Créer la page** : https://business.facebook.com/latest/settings/pages?business_id=1832013594605051 →
   Ajouter → Créer une Page Facebook.
   - Nom : `Trucs à faire <Nom>` (nom dans `social/src/departements.mjs`, ex. « Trucs à faire Hérault »)
   - Catégorie : « Site Web de divertissement »
   - Bio : `Que faire <tournure> ? Brocantes, fêtes, concerts, sorties en famille, chaque jour.`
     (tournure dans departements.mjs : « dans l’Hérault », « en Gironde », « à Paris »…)
   - Next → cocher la case des conditions → Créer une Page → Terminé.
   - Si Meta répond « Impossible de créer la Page » : **arrêter pour aujourd'hui** (limite atteinte).
3. **Identifiant** : dans la liste des Pages, cliquer la nouvelle page : le panneau affiche « ID : <nombre> » (c'est le page_id).
4. **Accès robot** : Utilisateur(ice)s système → Publieur → menu « … » → Affecter des éléments → Pages Facebook →
   cocher la page → activer Contenu, Activité de la communauté, Statistiques → Affecter des éléments.
5. **Habillage** (sur facebook.com, page ouverte, bouton « Changer » pour agir en tant que la page, puis « Utiliser la Page ») :
   - photo de profil = profil.png (Enregistrer), photo de couverture = couverture.png (Enregistrer les modifications) ;
   - À propos → Liens (`&sk=directory_links`) : « Toutes les sorties près de chez vous » → `https://trucsafaire.fr/#dep=<code>`,
     « Appli iPhone (App Store) » → `https://apps.apple.com/fr/app/trucs-%C3%A0-faire/id6833949352`,
     « Appli Android (Google Play) » → `https://play.google.com/store/apps/details?id=fr.trucsafaire.app` → Enregistrer ;
   - Coordonnées (`&sk=directory_contact_info`) : e-mail `contact@trucsafaire.fr` → Enregistrer.
   - Ne jamais cliquer « Publier » sur la proposition « Créer une publication ? ».
6. **Activer** : `node social/src/lancer.mjs ajouter-page <code> --page-id <ID>` puis commit + push sur main.

## Instagram
Pas ici. Les comptes Instagram sont créés à la main par Clément sur son téléphone (identifiant `trucsafaire<code>`,
e-mail `insta<code>@trucsafaire.fr`, déjà redirigé vers clemmt@icloud.com), puis reliés à la page.
Une page sans Instagram publie sur Facebook seulement.
