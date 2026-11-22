# Page réseaux sociaux autonome — Trucs à faire

**Une page par département** (« Trucs à faire · Allier », « · Nièvre », « · Saône-et-Loire » pour commencer).
Chaque matin vers 7 h, sans intervention, GitHub Actions, pour chaque page active :

1. lit les sorties du département (`data/dep/<code>.json`, mises à jour chaque nuit) ;
2. choisit les meilleures pour le format du jour ;
3. fabrique un carrousel 1080 × 1350 aux couleurs de la marque (polices Outfit et DM Sans, illustrations de `marque/`) ;
4. écrit les légendes Instagram et Facebook (modèles variés, pas d'IA) ;
5. les programme dans **Postiz auto-hébergé**, chaque page à son heure (11 h 30, 12 h 10, 12 h 50…) pour ne pas tout publier d'un coup ;
6. retient ce qui a été publié pour ne jamais republier la même sortie (45 jours) ni la même série (7 jours).

Une page en panne n'empêche pas les autres de publier. En cas d'échec, GitHub envoie un e-mail : c'est la seule chose à surveiller.

## Les pages

Dans `config.json`, rubrique `pages` :

```json
{ "id": "allier", "actif": true, "departement": "03", "nom": "l’Allier", "heure": "11:30",
  "hashtags": ["#Allier", "#SortiesAllier", "#Moulins", "#Vichy", "#Montluçon"],
  "postiz": { "instagram": "", "facebook": "" } }
```

**Ajouter un département** : créez la page Facebook et le compte Instagram, connectez-les dans Postiz avec un nom qui contient le département (ex. « Trucs à faire Allier »), puis copiez un bloc, changez `id`, `departement`, `nom`, `heure` et `hashtags`. C'est tout. Si le nom ne suffit pas à retrouver le compte, collez l'identifiant du canal Postiz dans `postiz`.

**Quels départements ouvrir ensuite ?** `node src/lancer.mjs classement` les classe selon le nombre de sorties à venir. Fin novembre 2026 : 82 départements en ont plus de 60 sur 30 jours, la Saône-et-Loire 497, l'Allier 385, la Nièvre 301.

**Conseils pour ne pas être pris pour du spam par Meta** : ouvrez 2 ou 3 pages par semaine plutôt que 30 d'un coup, gardez au moins 30 à 40 minutes entre deux pages, et donnez à chaque page sa photo de profil et sa bio (« Les sorties dans l'Allier, chaque jour »).

## Le programme de la semaine

| Jour | Format | Contenu |
|---|---|---|
| Lundi | `semaine` | 6 sorties de la semaine, 2 maximum par jour |
| Mardi | `coup-de-coeur` | une seule sortie mise en avant (spectacle, culture, fête) |
| Mercredi | `famille` | sorties pour les enfants |
| Jeudi | `week-end` | le meilleur du vendredi au dimanche |
| Vendredi | `gratuit` | sorties gratuites du week-end |
| Samedi | `aujourdhui` | ce qui se passe le jour même |
| Dimanche | `brocantes` | brocantes, vide-greniers et bourses de la semaine |

Quand un format n'a pas assez de sorties (moins de 3), il se rabat automatiquement sur un autre (`gratuit` → `week-end`, `famille` → `semaine`…). Tout se règle dans `config.json` : territoire, planning, hashtags, titres à exclure.

## Mise en route (une seule fois)

### 1. Les comptes

Pour chaque département :
- une **page Facebook** « Trucs à faire · Allier » ;
- un **compte Instagram professionnel** (Entreprise ou Créateur), par exemple @trucsafaire03, relié à cette page.

Une seule application Meta et un seul Postiz servent pour toutes les pages.

### 2. Une application Meta (obligatoire pour Postiz auto-hébergé)

Sur developers.facebook.com → Mes applications → Créer → type « Entreprise ». Ajoutez les produits *Facebook Login for Business* et *Instagram*. Récupérez l'identifiant et la clé secrète de l'application.
En mode « Développement », l'application fonctionne pour les comptes dont vous êtes administrateur : comme vous ne publiez que sur vos propres pages, la validation de Meta ne devrait pas être nécessaire.

### 3. Postiz auto-hébergé

Postiz a besoin d'une machine allumée en permanence (2 Go de mémoire) et d'une adresse HTTPS publique, pour que Meta puisse revenir vers lui lors de la connexion des comptes.

- **Sur votre Mac (gratuit)** : Docker Desktop + un tunnel Cloudflare (`cloudflared`) vers `postiz.trucsafaire.fr`. Le Mac doit rester allumé et ne jamais se mettre en veille.
- **Sur un petit serveur (4 à 6 € par mois)** : plus fiable si le Mac s'éteint parfois.

Installation : `git clone https://github.com/gitroomhq/postiz-docker-compose`, puis réglez dans le fichier :
`MAIN_URL` et `FRONTEND_URL` = `https://postiz.trucsafaire.fr`, `JWT_SECRET` (une longue phrase aléatoire), `FACEBOOK_APP_ID` et `FACEBOOK_APP_SECRET` (étape 2). Lancez `docker compose up -d`.
Dans l'application Meta, ajoutez l'adresse de retour `https://postiz.trucsafaire.fr/integrations/social/…` indiquée par Postiz lors de la connexion.

Dans Postiz : créez votre compte, connectez les comptes Instagram et les pages Facebook (nommés avec leur département), puis Réglages → *Public API* : copiez la clé.

### 4. Les réglages GitHub

Dépôt → Settings → Secrets and variables → Actions :

| Type | Nom | Valeur |
|---|---|---|
| Secret | `POSTIZ_API_URL` | adresse de l'API de votre Postiz (ex. `https://postiz.trucsafaire.fr/api`) |
| Secret | `POSTIZ_API_KEY` | la clé de l'étape 3 |
| Variable (facultatif) | `MODE_PUBLICATION` | `brouillon` pour vérifier les premiers jours dans Postiz, puis supprimez-la |

### 5. Premier essai

Actions → « Réseaux sociaux » → *Run workflow* → cochez **Essai** (et indiquez une page, ex. `allier`, pour n'en tester qu'une). Les images et légendes sont téléchargeables en bas de l'exécution (« publication »). Si elles vous plaisent, relancez sans cocher : c'est parti, tous les jours.

## Sans serveur : publier directement chez Meta

Si Postiz devient une contrainte (machine à garder allumée), le même système peut publier directement par l'API de Meta, sans aucun serveur : variable `PILOTE` = `meta`, un seul secret `META_TOKEN` (jeton de l'utilisateur système « Publieur » du portefeuille Trucs à faire, qui n'expire pas) et, dans `config.json`, `meta.page_id` de chaque page. Le jeton de chaque page et l'identifiant du compte Instagram relié sont retrouvés automatiquement. Pour ajouter une page : la partager avec le portefeuille Trucs à faire, l'affecter à « Publieur », puis renseigner son `page_id`. Dans ce mode, les pages publient à l'heure du workflow, pas à leur propre heure. Les images sont alors servies depuis la branche `reseaux` du dépôt.

## Commandes utiles (sur votre Mac)

```sh
cd social && npm install
node src/lancer.mjs semaine                      # aperçu des 7 prochains jours, page par page, dans social/apercu/
node src/lancer.mjs semaine --page nievre        # une seule page
node src/lancer.mjs preparer --format week-end   # prépare les posts du jour dans social/sortie/<page>/
node src/lancer.mjs classement                   # départements classés par nombre de sorties à venir
```

## Copier le système sur une autre appli

Le moteur est générique : seuls changent la source des contenus (`selection.mjs`), les modèles de textes (`textes.mjs`), les couleurs et le logo (`visuels.mjs`) et `config.json`. Pour Bons Codes, ParcZen ou Salve, on duplique le dossier `social/` dans leur dépôt et on adapte ces quatre fichiers.


## Page vitrine « Trucs à faire » (toute la France)

La page globale ne publie pas de sorties : elle met en avant l'appli et la plateforme, trois fois par semaine (mardi, jeudi, samedi : `jours` dans `config.json`).
Chaque publication est un visuel unique : un message, un écran de l'appli dans un iPhone, les badges App Store et Google Play, et un chiffre réel du jour quand il y en a un (« 15 740 sorties ce week-end »).

- Le jeudi, c'est toujours « Que faire ce week-end ? » ; les autres jours, les messages tournent : carte, agenda, alertes, recherche, partout en France, organisateurs.
- Les messages sont dans `social/src/vitrine.mjs` (`THEMES`) ; les écrans dans `marque/reseaux/vitrine/`.
- Aperçu d'un message : `node social/src/lancer.mjs preparer --page trucsafaire --theme carte`.
- Pour rafraîchir les écrans de l'appli (nouvelle version) : refaire les captures en mode clair (402 × 874, ×3) puis `python3 social/outils/maquettes.py marque/reseaux/apple-iphone-17-pro.png capture.png sortie.png`.
