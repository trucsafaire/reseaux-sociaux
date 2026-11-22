// Légendes Instagram et Facebook. Écrites à partir de modèles variés, sans IA : ton simple et local.
import { periode, dateLongue, heure, couper, choisir, graine, hashtag, majuscule, nomJour, numJour, moisCourt } from "./outils.mjs";

const ACCROCHES = {
  "semaine": [
    "Une semaine bien remplie autour de chez vous. On a fait le tri pour vous :",
    "Pas d’idée pour cette semaine ? En voici {n}, près de chez vous :",
    "Le programme de la semaine, {periode} :",
  ],
  "coup-de-coeur": [
    "Notre coup de cœur des prochains jours :",
    "Celle-ci, on ne voulait pas que vous la ratiez :",
    "À noter dans l’agenda :",
  ],
  "famille": [
    "Mercredi, c’est le jour des enfants. Des idées pour sortir en famille cette semaine :",
    "Envie de sortir avec les enfants ? {n} idées près de chez vous :",
    "Petits et grands, voici de quoi occuper la semaine :",
  ],
  "week-end": [
    "Ce week-end, {periode}, on sort ! Notre sélection :",
    "Le week-end approche. Voici {n} bonnes raisons de sortir :",
    "Que faire ce week-end autour de chez vous ? On a trouvé :",
  ],
  "gratuit": [
    "Sortir sans dépenser un centime ce week-end, c’est possible :",
    "Gratuit et près de chez vous, {periode} :",
    "Petit budget ? Ces sorties sont gratuites ce week-end :",
  ],
  "aujourdhui": [
    "Encore rien de prévu aujourd’hui ? Il est temps :",
    "Aujourd’hui, {date}, ça se passe ici :",
    "Pour une sortie de dernière minute aujourd’hui :",
  ],
  "brocantes": [
    "Chineurs, à vos agendas ! Les brocantes et bourses des prochains jours :",
    "Vide-greniers, bourses et brocantes à venir près de chez vous :",
    "Le rendez-vous des chineurs, {periode} :",
  ],
};

const FINS_IG = [
  "Horaires, adresses et itinéraires sur trucsafaire.fr (lien dans la bio).",
  "Toutes les infos et des centaines d’autres sorties sur trucsafaire.fr, lien dans la bio.",
  "Le détail de chaque sortie est sur trucsafaire.fr (lien dans la bio).",
];
const RAPPELS = [
  "Enregistrez ce post pour ne rien oublier, et partagez-le à ceux qui viendront avec vous.",
  "Taguez la personne qui vient avec vous 👇",
  "Vous organisez une sortie ? Ajoutez-la gratuitement sur trucsafaire.fr.",
  "Enregistrez le post pour l’avoir sous la main le jour J.",
];

const quand = (e) => {
  const j = e.s === e.e ? `${majuscule(nomJour(e.s))} ${numJour(e.s)} ${moisCourt(e.s)}` : majuscule(periode(e.s, e.e));
  return j + (e.h ? `, ${heure(e.h)}` : "");
};

function hashtags(sel, config, max) {
  const tags = new Set(config.hashtags_fixes);
  for (const t of config.page.hashtags.slice(0, 3)) tags.add(t);
  for (const e of sel.sorties.slice(0, 4)) if (e.w.length < 22) tags.add(hashtag(e.w));
  if (sel.format === "brocantes") tags.add("#Brocante").add("#VideGrenier");
  if (sel.format === "famille") tags.add("#SortieEnFamille");
  if (sel.format === "gratuit") tags.add("#Gratuit");
  return [...tags].slice(0, max).join(" ");
}

export function legendes(sel, config) {
  const alea = graine(sel.debut + sel.format + "texte" + config.page.id);
  const remplir = (s) => s.replace("{n}", sel.sorties.length).replace("{periode}", periode(sel.debut, sel.fin)).replace("{date}", dateLongue(sel.debut));
  const accroche = remplir(choisir(ACCROCHES[sel.format], alea));
  const unique = sel.sorties.length === 1;

  let corps;
  if (unique) {
    const e = sel.sorties[0];
    corps = [
      `${e.t}`,
      `📍 ${e.lieu && e.lieu !== e.w ? e.lieu + ", " : ""}${e.w}`,
      `🗓 ${quand(e)}${e.g ? " · gratuit" : ""}`,
      "",
      couper(e.d, 400),
    ].join("\n");
  } else {
    corps = sel.sorties.map((e) => `▸ ${e.t}\n   ${quand(e)} · ${e.w}${e.g ? " · gratuit" : ""}`).join("\n\n");
  }

  const instagram = [
    accroche, "", corps, "",
    choisir(FINS_IG, alea),
    choisir(RAPPELS, alea), "",
    hashtags(sel, config, 12),
  ].join("\n");

  const lien = unique
    ? `${config.site}/#sortie=${encodeURIComponent(sel.sorties[0].id)}`
    : `${config.site}/#dep=${config.page.departement}`;
  const facebook = [
    accroche, "", corps, "",
    `👉 Toutes les infos : ${lien}`, "",
    hashtags(sel, config, 4),
  ].join("\n");

  return { instagram, facebook, lien };
}
