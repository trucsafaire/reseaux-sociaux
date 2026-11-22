// Visuels 1080 × 1350 (format portrait Instagram/Facebook) aux couleurs de Trucs à faire.
// Rendu sans navigateur : satori (mise en page) puis resvg (PNG).
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { createRequire } from "node:module";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { nomJour, numJour, nomMois, periode, heure, couper, majuscule } from "./outils.mjs";
import { FORMATS } from "./selection.mjs";

const require = createRequire(import.meta.url);
const L = 1080, H = 1350;

const BLEU = "#2546D8", BLEU_FONCE = "#1A33A8", ENCRE = "#0E1226", GRIS = "#4D5470", CONFETTI = "#FF8A3D", TEINTE = "#E8EDFF";
const CATS = {
  brocante: { nom: "Brocante", c: "#A85A12", fond: "#FBEBDC" },
  fete: { nom: "Fête", c: "#C2255C", fond: "#F8E1EA" },
  spectacle: { nom: "Spectacle", c: "#6741D9", fond: "#ECE6FB" },
  culture: { nom: "Culture", c: "#0B7A5E", fond: "#DDF2EB" },
  sport: { nom: "Sport & nature", c: "#1971C2", fond: "#DEECF9" },
  famille: { nom: "En famille", c: "#8A6100", fond: "#F7EDD2" },
  pal: { nom: "Le Pal", c: "#4D7C0F", fond: "#E6F0D8" },
};

function polices() {
  const f = (pkg, fichier) => readFileSync(join(dirname(require.resolve(`${pkg}/package.json`)), "files", fichier));
  return [
    { name: "Outfit", weight: 600, data: f("@fontsource/outfit", "outfit-latin-600-normal.woff") },
    { name: "Outfit", weight: 700, data: f("@fontsource/outfit", "outfit-latin-700-normal.woff") },
    { name: "DM Sans", weight: 400, data: f("@fontsource/dm-sans", "dm-sans-latin-400-normal.woff") },
    { name: "DM Sans", weight: 500, data: f("@fontsource/dm-sans", "dm-sans-latin-500-normal.woff") },
    { name: "DM Sans", weight: 700, data: f("@fontsource/dm-sans", "dm-sans-latin-700-normal.woff") },
  ];
}

// h("div", {style}, enfants…) : petit équivalent de JSX pour satori
const h = (type, style = {}, ...enfants) => {
  const plats = enfants.flat().filter((x) => x !== null && x !== false && x !== undefined && x !== "");
  return { type, props: { style: { display: "flex", ...style }, children: plats.length === 1 ? plats[0] : plats } };
};
const img = (src, style) => ({ type: "img", props: { src, style } });
const svgUri = (svg) => "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64");

const PICTO_LIEU = (c) => svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" fill="${c}"/></svg>`);
const FLECHE = (c) => svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="${c}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`);
const PICTO_HEURE = (c) => svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="${c}" stroke-width="2.4"/><path d="M12 7v5l3.5 2" fill="none" stroke="${c}" stroke-width="2.4" stroke-linecap="round"/></svg>`);

const ILLUS_FORMAT = { "semaine": "fete", "famille": "famille", "week-end": "spectacle", "gratuit": "culture", "aujourdhui": "sport", "brocantes": "brocante" };

export class Atelier {
  constructor(racineDepot) {
    this.racine = racineDepot;
    this.fonts = polices();
    const lire = (p) => readFileSync(join(racineDepot, p), "utf8");
    this.logoBlanc = svgUri(lire("marque/logo-horizontal-blanc.svg"));
    this.logo = svgUri(lire("marque/logo-horizontal.svg"));
    this.illus = {};
    for (const c of Object.keys(CATS)) { try { this.illus[c] = svgUri(lire(`marque/illustrations/${c}.svg`)); } catch { /* facultatif */ } }
  }

  async png(arbre) {
    const svg = await satori(arbre, { width: L, height: H, fonts: this.fonts });
    return new Resvg(svg, { fitTo: { mode: "width", value: L } }).render().asPng();
  }

  // ---------- Diapositives ----------

  couverture(sel, config) {
    const F = FORMATS[sel.format];
    const dates = sel.format === "aujourdhui" ? `${majuscule(nomJour(sel.debut))} ${numJour(sel.debut)} ${nomMois(sel.debut)}` : majuscule(periode(sel.debut, sel.fin));
    return h("div", { width: L, height: H, background: BLEU, position: "relative", flexDirection: "column", padding: "88px 84px", fontFamily: "DM Sans", color: "#fff", overflow: "hidden" },
      h("div", { position: "absolute", right: -170, top: -150, width: 560, height: 560, borderRadius: 999, background: BLEU_FONCE }),
      h("div", { position: "absolute", right: 120, top: 330, width: 64, height: 64, borderRadius: 999, background: CONFETTI }),
      h("div", { position: "absolute", left: -120, bottom: -260, width: 620, height: 620, borderRadius: 999, background: "#3A5AE6" }),
      img(this.logoBlanc, { width: 400, height: 83 }),
      // illustration propre à chaque format : le fil ne se ressemble pas d'un jour à l'autre
      this.illus[ILLUS_FORMAT[sel.format]] ? h("div", { marginTop: 56, width: 912, height: 420, borderRadius: 44, overflow: "hidden", position: "relative" },
        img(this.illus[ILLUS_FORMAT[sel.format]], { width: 912, height: 513, position: "absolute", top: -40, left: 0 })) : null,
      h("div", { flexDirection: "column", marginTop: "auto" },
        h("div", { alignItems: "center", marginBottom: 14 },
          h("div", { background: CONFETTI, color: ENCRE, borderRadius: 14, padding: "4px 16px", fontFamily: "Outfit", fontWeight: 700, fontSize: 40, marginRight: 18 }, config.page.departement),
          h("div", { fontSize: 46, fontWeight: 700 }, `Dans ${config.page.nom}`)),
        h("div", { fontFamily: "Outfit", fontWeight: 700, fontSize: F.titre.length > 16 ? 112 : F.titre.length > 9 ? 138 : 170, lineHeight: 1.0, letterSpacing: -3 }, F.titre),
        h("div", { marginTop: 36, alignSelf: "flex-start", alignItems: "center", background: "#fff", color: ENCRE, borderRadius: 999, padding: "18px 34px", fontSize: 40, fontWeight: 700 },
          h("div", { width: 18, height: 18, borderRadius: 99, background: CONFETTI, marginRight: 18 }), dates),
      ),
      h("div", { marginTop: 60, alignItems: "center", justifyContent: "space-between", fontSize: 34, fontWeight: 500 },
        h("div", {}, `${sel.sorties.length} idées de sorties`),
        h("div", { alignItems: "center", fontWeight: 700 }, "Faites glisser", img(FLECHE("#fff"), { width: 44, height: 44, marginLeft: 14 }))),
    );
  }

  sortie(e, i, total, etiquette) {
    const cat = CATS[e.cat] || CATS.fete;
    const tTitre = e.t.length > 70 ? 60 : e.t.length > 45 ? 70 : 84;
    // description sans répéter le titre
    let desc = e.d || "";
    if (desc.toLowerCase().startsWith(e.t.toLowerCase())) desc = desc.slice(e.t.length).replace(/^[\s,.:;–-]+/, "");
    desc = majuscule(desc);
    const lieu = e.lieu && e.lieu !== e.w && e.lieu.length < 60 ? `${e.lieu}, ${e.w}` : e.w;
    const plusieursJours = e.s !== e.e;
    return h("div", { width: L, height: H, background: "#fff", flexDirection: "column", fontFamily: "DM Sans", color: ENCRE, position: "relative" },
      // bandeau illustré de la catégorie
      h("div", { width: L, height: 480, background: cat.fond, position: "relative", overflow: "hidden" },
        this.illus[e.cat] ? img(this.illus[e.cat], { width: L, height: 608, position: "absolute", top: -64, left: 0 }) : null,
        h("div", { position: "absolute", left: 72, top: 64, background: "#fff", color: cat.c, borderRadius: 999, padding: "12px 28px", fontSize: 30, fontWeight: 700 }, etiquette || cat.nom),
        total > 1 ? h("div", { position: "absolute", right: 72, top: 64, background: "rgba(14,18,38,.75)", color: "#fff", borderRadius: 999, padding: "12px 24px", fontSize: 28, fontWeight: 700 }, `${i}/${total}`) : null,
      ),
      // bloc date qui chevauche le bandeau
      h("div", { position: "absolute", left: 72, top: 380, width: 210, flexDirection: "column", alignItems: "center", background: "#fff", borderRadius: 32, padding: "22px 0 26px", boxShadow: "0 10px 30px rgba(14,18,38,.16)" },
        h("div", { fontSize: 30, fontWeight: 700, color: cat.c, textTransform: "uppercase", letterSpacing: 1 }, nomJour(e.s).slice(0, 3) + "."),
        h("div", { fontFamily: "Outfit", fontWeight: 700, fontSize: 104, lineHeight: 1, marginTop: 4 }, String(numJour(e.s))),
        h("div", { fontSize: 30, fontWeight: 500, color: GRIS }, nomMois(e.s)),
      ),
      h("div", { flexDirection: "column", padding: "0 72px", marginTop: 150, flexGrow: 1 },
        h("div", { fontFamily: "Outfit", fontWeight: 700, fontSize: tTitre, lineHeight: 1.08, letterSpacing: -1 }, couper(e.t, 95)),
        h("div", { marginTop: 34, alignItems: "center", fontSize: 34, fontWeight: 500, color: GRIS },
          img(PICTO_LIEU(cat.c), { width: 38, height: 38, marginRight: 14 }), couper(lieu, 60)),
        (e.h || plusieursJours || e.g) ? h("div", { marginTop: 18, alignItems: "center", fontSize: 34, fontWeight: 500, color: GRIS },
          img(PICTO_HEURE(cat.c), { width: 38, height: 38, marginRight: 14 }),
          [plusieursJours ? majuscule(periode(e.s, e.e)) : null, e.h ? heure(e.h) : null].filter(Boolean).join(" · ") || "Toute la journée",
          e.g ? h("div", { marginLeft: 22, background: "#DDF2EB", color: "#0B7A5E", borderRadius: 999, padding: "6px 20px", fontSize: 28, fontWeight: 700 }, "Gratuit") : null,
        ) : null,
        desc ? h("div", { marginTop: 40, fontSize: 34, lineHeight: 1.42, color: "#2B3150" }, couper(desc, total === 1 ? 480 : e.t.length > 45 ? 210 : 260)) : null,
      ),
      h("div", { borderTop: "2px solid #E6E8F0", padding: "30px 72px", alignItems: "center", justifyContent: "space-between" },
        img(this.logo, { width: 250, height: 52 }),
        h("div", { fontSize: 28, fontWeight: 500, color: GRIS }, "Infos et itinéraire sur trucsafaire.fr")),
    );
  }

  fin(config) {
    const badge = (f, ratio) => {
      const chemin = join(this.racine, "marque", "boutiques", f);
      if (!existsSync(chemin)) return null;
      const mime = f.endsWith(".svg") ? "image/svg+xml" : "image/png";
      return img(`data:${mime};base64,${readFileSync(chemin).toString("base64")}`, { height: 78, width: Math.round(78 * ratio) });
    };
    const tel = join(this.racine, "marque", "reseaux", "maquette-iphone.png");
    return h("div", { width: L, height: H, background: BLEU, flexDirection: "column", padding: "100px 84px", fontFamily: "DM Sans", color: "#fff", position: "relative", overflow: "hidden" },
      h("div", { position: "absolute", left: -200, top: -200, width: 600, height: 600, borderRadius: 999, background: BLEU_FONCE }),
      h("div", { position: "absolute", right: 120, top: 120, width: 64, height: 64, borderRadius: 999, background: CONFETTI }),
      existsSync(tel) ? img(`data:image/png;base64,${readFileSync(tel).toString("base64")}`, { position: "absolute", right: 56, bottom: -150, width: 360, height: 736 }) : null,
      img(this.logoBlanc, { width: 460, height: 95 }),
      h("div", { marginTop: 64, width: 600, fontFamily: "Outfit", fontWeight: 700, fontSize: 76, lineHeight: 1.05, letterSpacing: -2 }, "Et des centaines d’autres sorties près de chez vous"),
      h("div", { marginTop: 36, width: 560, fontSize: 36, lineHeight: 1.4, opacity: 0.9 }, "Carte, calendrier, horaires et itinéraires, gratuitement."),
      h("div", { marginTop: 52, alignSelf: "flex-start", background: "#fff", color: BLEU, borderRadius: 999, padding: "20px 38px", fontSize: 38, fontWeight: 700 }, "trucsafaire.fr · lien en bio"),
      h("div", { marginTop: 56, fontSize: 30, opacity: 0.85 }, "Aussi en appli :"),
      // badges officiels : App Store en premier, même hauteur
      h("div", { marginTop: 20, alignItems: "center" }, badge("app-store.svg", 3.163), h("div", { width: 22 }), badge("google-play.png", 3.365)),
      h("div", { marginTop: "auto", width: 560, fontSize: 28, lineHeight: 1.35, opacity: 0.75 }, "Vous organisez une sortie ? Ajoutez-la gratuitement."),
    );
  }

  /** Produit tous les PNG d'une sélection et renvoie leurs chemins. */
  async produire(sel, config, dossier, prefixe = "") {
    mkdirSync(dossier, { recursive: true });
    const diapos = [];
    if (sel.sorties.length === 1) {
      diapos.push(this.sortie(sel.sorties[0], 1, 1, sel.format === "coup-de-coeur" ? "Coup de cœur" : null));
    } else {
      diapos.push(this.couverture(sel, config));
      sel.sorties.forEach((e, i) => diapos.push(this.sortie(e, i + 1, sel.sorties.length)));
      diapos.push(this.fin(config));
    }
    const fichiers = [];
    for (const [i, d] of diapos.entries()) {
      const f = join(dossier, `${prefixe}${String(i + 1).padStart(2, "0")}.png`);
      writeFileSync(f, await this.png(d));
      fichiers.push(f);
    }
    return fichiers;
  }
}
