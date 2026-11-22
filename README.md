# Trucs à faire — réseaux sociaux autonomes

Publie chaque jour, sans intervention, un carrousel de sorties sur les pages Facebook et les comptes Instagram de Trucs à faire (une page par département).

- Les sorties viennent du dépôt du site (`trucsafaire/sorties-bourbonnais-loire`, dossier `data/`).
- Les visuels et les légendes sont fabriqués par `social/` ; les réglages sont dans `social/config.json`.
- La publication passe par l'API de Meta (variable `PILOTE` = `meta`, secret `META_TOKEN`).
- Les images du jour et l'historique vivent sur la branche `reseaux` (le dépôt doit rester public pour que Meta puisse lire les images).

Mode d'emploi complet : [social/LISEZMOI.md](social/LISEZMOI.md).
