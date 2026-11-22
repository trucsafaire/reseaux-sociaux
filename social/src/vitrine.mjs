// Page « vitrine » (Trucs à faire, toute la France) : met en avant l'appli et la plateforme.
// Un visuel 1080 × 1350 par publication : un message, un écran de l'appli dans un vrai iPhone,
// les badges des stores et, quand c'est possible, un chiffre réel tiré des données du jour.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ajouterJours, jourSemaine, choisir, graine } from "./outils.mjs";
import { Atelier } from "./visuels.mjs";

const L = 1080, H = 1350;
const BLEU = "#2546D8", BLEU_FONCE = "#1A33A8", ENCRE = "#0E1226", GRIS = "#4D5470", CONFETTI = "#FF8A3D", CLAIR = "#F2F5FF";
const nombre = (n) => n.toLocaleString("fr-FR").replace(/ | /g, " ");

// --- Chiffres réels, recalculés à chaque publication --------------------------------------------
export function chiffres(toutes, jour) {
  const enCours = (a, b) => toutes.filter((e) => e.s <= b && (e.e || e.s) >= a).length;
  const j = jourSemaine(jour);                     // 1 = lundi … 7 = dimanche
  const samedi = j === 7 ? ajouterJours(jour, -1) : ajouterJours(jour, 6 - j);
  const dimanche = ajouterJours(samedi, 1);
  return {
    weekend: enCours(samedi, dimanche),
    aujourdhui: enCours(jour, jour),
    mois: enCours(jour, ajouterJours(jour, 30)),
  };
}

// --- Les messages -------------------------------------------------------------------------------
// ecran : capture placée dans marque/reseaux/vitrine/<ecran>.png
export const THEMES = [
  {
    id: "week-end", ecran: "accueil", fond: "bleu",
    pastille: (c) => `${nombre(c.weekend)} sorties ce week-end`,
    titre: "Que faire ce week-end ?",
    texte: "Brocantes, concerts, marchés, randos, spectacles… tout ce qui se passe près de chez vous, au même endroit.",
    legende: (c) => [
      `${nombre(c.weekend)} sorties ce week-end en France, et sûrement quelques-unes à deux pas de chez vous.`,
      "Trucs à faire rassemble les brocantes, concerts, fêtes, marchés, randos et spectacles de votre coin. Gratuit, sans inscription.",
    ],
  },
  {
    id: "carte", ecran: "carte", fond: "clair",
    titre: "Toutes les sorties sur une carte",
    texte: "Zoomez sur votre coin et voyez d’un coup d’œil ce qui se passe autour de vous.",
    legende: () => [
      "Où sortir autour de chez vous ? Ouvrez la carte.",
      "Chaque sortie est placée sur la carte, avec l’adresse et l’itinéraire. Filtrez par brocantes, fêtes, spectacles, sport ou sorties en famille.",
    ],
  },
  {
    id: "agenda", ecran: "agenda", fond: "bleu",
    pastille: (c) => `${nombre(c.aujourdhui)} sorties aujourd’hui`,
    titre: "Votre agenda des sorties, jour par jour",
    texte: "Choisissez une date, on vous dit tout ce qui se passe ce jour-là près de chez vous.",
    legende: (c) => [
      `Aujourd’hui, ${nombre(c.aujourdhui)} sorties en France. Et demain ?`,
      "Le calendrier de Trucs à faire vous montre, jour par jour, tout ce qui se passe près de chez vous : de quoi prévoir vos week-ends à l’avance.",
    ],
  },
  {
    id: "alertes", ecran: "sortie", fond: "clair",
    titre: "Ne ratez plus rien près de chez vous",
    texte: "Gardez vos coups de cœur, ajoutez-les à votre agenda et soyez prévenu des prochains trucs comme ça.",
    legende: () => [
      "Le marché de Noël que vous attendiez, le concert de votre groupe préféré… ne les ratez plus.",
      "Dans Trucs à faire, gardez une sortie en un geste, ajoutez-la à votre agenda avec un rappel, et demandez à être prévenu des prochaines du même genre près de chez vous.",
    ],
  },
  {
    id: "filtres", ecran: "liste", fond: "bleu",
    titre: "Gratuit, en famille, ce soir ?",
    texte: "Tapez ce que vous cherchez, en toutes lettres. Trucs à faire trouve les sorties qui vont avec.",
    legende: () => [
      "« En famille ce week-end », « concert ce soir », « brocante dimanche »… tapez-le comme vous le diriez.",
      "Trucs à faire trouve les sorties qui correspondent, près de chez vous. Gratuit, sans compte à créer.",
    ],
  },
  {
    id: "france", ecran: "accueil", fond: "clair",
    pastille: (c) => `${nombre(c.mois)} sorties ce mois-ci`,
    titre: "Partout en France, tout près de chez vous",
    texte: "100 départements, des milliers de sorties mises à jour chaque jour à partir des offices de tourisme et des organisateurs.",
    legende: (c) => [
      `${nombre(c.mois)} sorties dans les 30 prochains jours, dans les 100 départements.`,
      "Trucs à faire rassemble chaque jour les sorties publiées par les offices de tourisme, les communes et les organisateurs, pour que vous n’ayez plus à chercher partout.",
    ],
  },
  {
    id: "organisateurs", ecran: "sortie", fond: "bleu",
    titre: "Vous organisez une sortie ?",
    texte: "Brocante, concert, fête de village, loto… ajoutez-la gratuitement : elle apparaît dans l’appli, sur le site et sur la carte.",
    legende: () => [
      "Association, commune, comité des fêtes : faites connaître votre événement, gratuitement.",
      "Sur trucsafaire.fr, touchez « Proposer » et ajoutez votre sortie en une minute. Elle apparaît sur le site, dans l’appli et sur la carte, près des gens qui cherchent quoi faire.",
    ],
  },
];

/** Thème du jour : le jeudi, le week-end ; sinon celui qu'on n'a pas montré depuis le plus longtemps. */
export function choisirTheme(jour, historique = {}) {
  if (jourSemaine(jour) === 4) return THEMES.find((t) => t.id === "week-end");
  const autres = THEMES.filter((t) => t.id !== "week-end");
  return autres.sort((a, b) => (historique["theme:" + a.id] || "").localeCompare(historique["theme:" + b.id] || ""))[0];
}

// --- Visuel -------------------------------------------------------------------------------------
const h = (type, style = {}, ...enfants) => {
  const plats = enfants.flat().filter((x) => x !== null && x !== false && x !== undefined && x !== "");
  return { type, props: { style: { display: "flex", ...style }, children: plats.length === 1 ? plats[0] : plats } };
};
const img = (src, style) => ({ type: "img", props: { src, style } });
const fichier = (chemin, mime) => `data:${mime};base64,${readFileSync(chemin).toString("base64")}`;

function visuel(atelier, racine, theme, c) {
  const bleu = theme.fond === "bleu";
  const encre = bleu ? "#fff" : ENCRE;
  const badge = (f, ratio, haut) => {
    const p = join(racine, "marque", "boutiques", f);
    return existsSync(p) ? img(fichier(p, f.endsWith(".svg") ? "image/svg+xml" : "image/png"), { height: haut, width: Math.round(haut * ratio) }) : null;
  };
  const tel = join(racine, "marque", "reseaux", "vitrine", `${theme.ecran}.png`);
  const long = theme.titre.length > 30;
  return h("div", { width: L, height: H, background: bleu ? BLEU : CLAIR, position: "relative", fontFamily: "DM Sans", color: encre, overflow: "hidden" },
    // décor
    h("div", { position: "absolute", right: -160, top: 170, width: 760, height: 760, borderRadius: 999, background: bleu ? BLEU_FONCE : "#DDE4FF" }),
    h("div", { position: "absolute", left: 960, top: 236, width: 52, height: 52, borderRadius: 999, background: CONFETTI }),
    h("div", { position: "absolute", left: -140, bottom: -220, width: 460, height: 460, borderRadius: 999, background: bleu ? "#3A5AE6" : "#E6EBFF" }),
    // téléphone
    existsSync(tel) ? img(fichier(tel, "image/png"), { position: "absolute", right: 36, top: 316, width: 440, height: 899 }) : null,
    // texte
    h("div", { position: "absolute", left: 84, top: 88, width: 480, height: H - 88 - 96, flexDirection: "column" },
      img(bleu ? atelier.logoBlanc : atelier.logo, { width: 360, height: 75 }),
      theme.pastille ? h("div", { marginTop: 96, alignSelf: "flex-start", background: CONFETTI, color: "#fff", borderRadius: 999, padding: "14px 26px", fontSize: 30, fontWeight: 700 }, theme.pastille(c)) : h("div", { marginTop: 96 }),
      h("div", { marginTop: 34, fontFamily: "Outfit", fontWeight: 700, fontSize: long ? 66 : 78, lineHeight: 1.04, letterSpacing: -2 }, theme.titre),
      h("div", { marginTop: 32, fontSize: 31, lineHeight: 1.4, color: bleu ? "rgba(255,255,255,.9)" : GRIS }, theme.texte),
      h("div", { marginTop: "auto", flexDirection: "column" },
        h("div", { fontSize: 28, fontWeight: 700, color: bleu ? "#fff" : BLEU, marginBottom: 18 }, "Gratuit · trucsafaire.fr"),
        h("div", { alignItems: "center" }, badge("app-store.svg", 3.163, 64), h("div", { width: 16 }), badge("google-play.png", 3.365, 64)),
      ),
    ),
  );
}

// --- Légendes -----------------------------------------------------------------------------------
const APPELS_IG = [
  "Téléchargez l’appli Trucs à faire (App Store et Google Play) ou ouvrez trucsafaire.fr : lien dans la bio.",
  "L’appli est gratuite sur l’App Store et Google Play, et tout est aussi sur trucsafaire.fr (lien dans la bio).",
];
const LIENS_FB = "📱 iPhone : https://apps.apple.com/fr/app/trucs-%C3%A0-faire/id6833949352\n🤖 Android : https://play.google.com/store/apps/details?id=fr.trucsafaire.app\n🌐 https://trucsafaire.fr";
const TAGS = ["#TrucsAFaire", "#QueFaire", "#Sorties", "#SortiesEnFrance", "#IdéesSorties", "#Weekend", "#AppliGratuite"];

function legendes(theme, c, jour) {
  const alea = graine(jour + theme.id);
  const [accroche, corps] = theme.legende(c);
  const ig = [accroche, "", corps, "", choisir(APPELS_IG, alea), "", TAGS.join(" ")].join("\n");
  const fb = [accroche, "", corps, "", "Gratuit, sur votre téléphone ou sur le site :", LIENS_FB].join("\n");
  return { instagram: ig, facebook: fb };
}

/** Prépare la publication vitrine du jour : un PNG + les légendes. */
export async function preparerVitrine({ racine, toutes, jour, page, historique, dossier, theme: forcer }) {
  const theme = (forcer && THEMES.find((t) => t.id === forcer)) || choisirTheme(jour, historique);
  const c = chiffres(toutes, jour);
  const atelier = new Atelier(racine);
  mkdirSync(dossier, { recursive: true });
  const f = join(dossier, `${jour}-${page.id}-01.png`);
  writeFileSync(f, await atelier.png(visuel(atelier, racine, theme, c)));
  return { page: page.id, jour, format: "vitrine:" + theme.id, theme: theme.id, images: [f], legendes: legendes(theme, c, jour), sorties: [] };
}
