// Choix des sorties à mettre en avant, selon le format du jour.
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ajouterJours, ecartJours, jourSemaine, normaliser, graine, sansCapitales, nettoyer } from "./outils.mjs";

const RE_FAMILLE = /\b(enfant|enfants|famille|familial|jeune public|kids?|conte|contes|marionnette|chasse aux (œufs|oeufs|bonbons)|goûter|des \d+ ans|dès \d+ ans|ludique|jeux)\b/i;
const RE_BROCANTE = /\b(brocante|vide[- ]?greniers?|vide[- ]?dressing|bourse aux|braderie|puces|troc)\b/i;

/** Fenêtre de dates et filtre propres à chaque format. */
export const FORMATS = {
  "semaine": {
    titre: "Cette semaine", carrousel: true,
    fenetre: (j) => [j, ajouterJours(j, 6)],
  },
  "coup-de-coeur": {
    titre: "Coup de cœur", carrousel: false,
    fenetre: (j) => [ajouterJours(j, 1), ajouterJours(j, 10)],
  },
  "famille": {
    titre: "En famille", carrousel: true,
    fenetre: (j) => [j, ajouterJours(j, 7)],
    garder: (e) => e.cat === "famille" || RE_FAMILLE.test(e.t + " " + e.d),
  },
  "week-end": {
    titre: "Ce week-end", carrousel: true,
    // du vendredi au dimanche qui viennent
    fenetre: (j) => { const v = ajouterJours(j, (5 - jourSemaine(j) + 7) % 7); return [v, ajouterJours(v, 2)]; },
  },
  "gratuit": {
    titre: "Gratuit ce week-end", carrousel: true,
    fenetre: (j) => { const v = ajouterJours(j, (5 - jourSemaine(j) + 7) % 7); return [v, ajouterJours(v, 2)]; },
    garder: (e) => !!e.g,
  },
  "aujourdhui": {
    titre: "Aujourd’hui", carrousel: true,
    fenetre: (j) => [j, j],
  },
  "brocantes": {
    titre: "Brocantes & vide-greniers", carrousel: true,
    fenetre: (j) => [ajouterJours(j, 1), ajouterJours(j, 7)],
    garder: (e) => e.cat === "brocante" || RE_BROCANTE.test(e.t),
  },
};

/** Si un format n'a pas assez de sorties, on se rabat sur un autre. */
const REPLI = { "famille": "semaine", "gratuit": "coup-de-coeur", "brocantes": "coup-de-coeur", "aujourdhui": "semaine", "week-end": "semaine", "semaine": "coup-de-coeur" };

const km = (a, b) => {
  const r = Math.PI / 180, x = (b.lon - a.lon) * r * Math.cos(((a.lat + b.lat) / 2) * r), y = (b.lat - a.lat) * r;
  return Math.sqrt(x * x + y * y) * 6371;
};
/** Clé de « série » : « Rando célibataires — Vendat » et « Rando célibataires — Vichy » vont ensemble. */
export const cleSerie = (t) => normaliser(t.split(/ [—–-] | : /)[0]);

export function chargerSorties(dossierDonnees, territoire) {
  const { departements, centre, rayon_km } = territoire;
  const toutes = [];
  for (const code of departements) {
    const f = join(dossierDonnees, "dep", `${code}.json`);
    if (!existsSync(f)) { console.warn(`! données absentes pour le département ${code}`); continue; }
    for (const e of JSON.parse(readFileSync(f, "utf8"))) {
      if (centre && rayon_km && !(km(centre, e) <= rayon_km)) continue;
      toutes.push({ ...e, t: sansCapitales(nettoyer(e.t)), d: nettoyer(e.d), e: e.e || e.s });
    }
  }
  // Les organisateurs qui publient des dizaines de dates identiques ne doivent pas envahir la page.
  const series = {};
  for (const e of toutes) series[cleSerie(e.t)] = (series[cleSerie(e.t)] || 0) + 1;
  for (const e of toutes) e._serie = series[cleSerie(e.t)];
  return toutes;
}

function note(e, j, config, alea) {
  let n = 0;
  if (e.d.length > 80) n += 3; else if (e.d.length > 30) n += 1;
  if (e.u || e.b) n += 2;
  if (e.img) n += 2;
  if (e.h) n += 1;
  if (e.g) n += 1;
  if (e.t.length < 8) n -= 3;
  if (e._serie > 3) n -= 3;
  if (ecartJours(e.s, e.e) > 0) n -= 0.5; // les sorties d'un jour donnent un visuel plus clair
  return n + alea() * 2.5; // un peu de variété d'un jour à l'autre
}

/**
 * Renvoie { format, debut, fin, sorties } prêt à mettre en page.
 * historique : { cle: "AAAA-MM-JJ" } des sorties déjà publiées.
 */
export function selectionner({ toutes, jour, format, config, historique = {} }) {
  const exclus = config.exclure_titres.map((r) => new RegExp(r, "i"));
  const exclusDesc = (config.exclure_descriptions || []).map((r) => new RegExp(r, "i"));
  const serieRecente = (e) => { const d = historique["serie:" + cleSerie(e.t)]; return d && ecartJours(d, jour) < (config.serie_pause_jours || 7); };
  const recent = (cle) => historique[cle] && ecartJours(historique[cle], jour) < config.sans_repetition_jours;
  const visites = new Set();

  let nomFormat = format;
  while (nomFormat) {
    if (visites.has(nomFormat)) break;
    visites.add(nomFormat);
    const F = FORMATS[nomFormat];
    const [debut, fin] = F.fenetre(jour);
    const alea = graine(jour + nomFormat);
    const vues = new Map();

    for (const e of toutes) {
      if (e.s > fin || e.e < debut) continue;               // hors fenêtre
      if (ecartJours(e.s, e.e) > 3) continue;                // expositions et activités au long cours
      if (exclus.some((r) => r.test(e.t)) || exclusDesc.some((r) => r.test(e.d))) continue;
      if (F.garder && !F.garder(e)) continue;
      const cle = normaliser(e.t + " " + e.w);
      if (recent(cle) || recent(e.id) || serieRecente(e)) continue;
      // même sortie à plusieurs dates : on garde la première dans la fenêtre
      const deja = vues.get(cle);
      if (deja) { deja._dates = (deja._dates || 1) + 1; continue; }
      let n = note(e, jour, config, alea);
      if (nomFormat === "coup-de-coeur") n += (["spectacle", "culture", "fete"].includes(e.cat) ? 2 : -2) + (e.img ? 2 : 0) + (e._serie > 1 ? -4 : 0);
      vues.set(cle, { ...e, _cle: cle, _note: n });
    }

    const candidates = [...vues.values()].sort((a, b) => b._note - a._note);
    const voulu = F.carrousel ? config.sorties_par_carrousel : 1;
    const choix = [], parCommune = {}, parCat = {}, parJour = {}, parSerie = {};
    const themeLibre = !!F.garder; // formats thématiques : pas de limite par catégorie
    for (const e of candidates) {
      if (choix.length >= voulu) break;
      if ((parCommune[e.w] || 0) >= 1) continue;
      if (parSerie[cleSerie(e.t)]) continue;
      if (!themeLibre && (parCat[e.cat] || 0) >= 2) continue;
      if (nomFormat === "semaine" && (parJour[e.s] || 0) >= 2) continue;
      choix.push(e);
      parCommune[e.w] = (parCommune[e.w] || 0) + 1;
      parCat[e.cat] = (parCat[e.cat] || 0) + 1;
      parJour[e.s] = (parJour[e.s] || 0) + 1;
      parSerie[cleSerie(e.t)] = 1;
    }

    const minimum = F.carrousel ? 3 : 1;
    if (choix.length >= minimum) {
      choix.sort((a, b) => (a.s + (a.h || "")).localeCompare(b.s + (b.h || "")));
      return { format: nomFormat, demande: format, debut, fin, sorties: choix };
    }
    console.warn(`! « ${nomFormat} » : seulement ${choix.length} sortie(s), repli sur « ${REPLI[nomFormat]} »`);
    nomFormat = REPLI[nomFormat];
  }
  return null;
}
