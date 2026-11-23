// Visuels Salve (posts 1080×1350, stories 1080×1920) : bleu nuit, crème, or, couleurs liturgiques.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { createRequire } from "node:module";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { laDate } from "./contenus.mjs";

const require = createRequire(import.meta.url);
export const NUIT = "#14285F", NUIT_2 = "#1B3375", CREME = "#F4EFE4", OR = "#E9A23B", TEXTE = "#E6E9F2", DOUX = "#AEB8D6";
export const LITURGIE = { vert: "#2E9A6B", violet: "#6B4BC6", rose: "#D9609A", blanc: "#F4EFE4", rouge: "#D63649", or: "#E9A23B", noir: "#333" };
export const PALETTES = {
  vert:   { fond: "#123F2E", fond2: "#1A5440", creme: "#F4EFE4", titre: "#FFFFFF", texte: "#E3EDE7", doux: "#A9C4B6", accent: "#E9B54A", bande: "#2E9A6B" },
  violet: { fond: "#2B1B55", fond2: "#3A2770", creme: "#F4EFE4", titre: "#FFFFFF", texte: "#E7E2F3", doux: "#B7ACD6", accent: "#E9B54A", bande: "#6B4BC6" },
  rose:   { fond: "#5E2244", fond2: "#743057", creme: "#FBF1F4", titre: "#FFFFFF", texte: "#F5E3EA", doux: "#DDB0C3", accent: "#F2C46B", bande: "#D9609A" },
  rouge:  { fond: "#5A1219", fond2: "#721C24", creme: "#F7EEE6", titre: "#FFFFFF", texte: "#F3E1DF", doux: "#D9A9A6", accent: "#E9B54A", bande: "#D63649" },
  blanc:  { fond: "#F7F2E6", fond2: "#EDE4CF", creme: "#14285F", titre: "#14285F", texte: "#2B3658", doux: "#7B7F94", accent: "#B07A16", bande: "#D4AF37" },
  or:     { fond: "#F7F2E6", fond2: "#EDE4CF", creme: "#14285F", titre: "#14285F", texte: "#2B3658", doux: "#7B7F94", accent: "#B07A16", bande: "#D4AF37" },
};
const NOM_COULEUR = { vert: "Vert", violet: "Violet", rose: "Rose", blanc: "Blanc", rouge: "Rouge", or: "Or", noir: "Noir" };

function polices() {
  const f = (pkg, fichier) => readFileSync(join(dirname(require.resolve(`${pkg}/package.json`)), "files", fichier));
  return [
    { name: "Crimson", weight: 400, style: "normal", data: f("@fontsource/crimson-text", "crimson-text-latin-400-normal.woff") },
    { name: "Crimson", weight: 400, style: "italic", data: f("@fontsource/crimson-text", "crimson-text-latin-400-italic.woff") },
    { name: "Crimson", weight: 600, style: "normal", data: f("@fontsource/crimson-text", "crimson-text-latin-600-normal.woff") },
    { name: "Inter", weight: 400, data: f("@fontsource/inter", "inter-latin-400-normal.woff") },
    { name: "Inter", weight: 500, data: f("@fontsource/inter", "inter-latin-500-normal.woff") },
    { name: "Inter", weight: 600, data: f("@fontsource/inter", "inter-latin-600-normal.woff") },
  ];
}

const h = (type, style = {}, ...enfants) => {
  const plats = enfants.flat().filter((x) => x !== null && x !== false && x !== undefined && x !== "");
  return { type, props: { style: { display: "flex", ...style }, children: plats.length === 1 ? plats[0] : plats } };
};
const img = (src, style) => ({ type: "img", props: { src, style } });
const svgUri = (svg) => "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64");

const GRAINS = [[88, 176.28], [56.51, 142.9], [48.54, 97.71], [66.72, 55.58], [105.06, 30.36], [150.94, 30.36], [189.28, 55.58], [207.46, 97.71], [199.49, 142.9], [168, 176.28]];
const logoSvg = (c) => `<g fill="${c}">${GRAINS.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="17"/>`).join("")}<rect x="120" y="176" width="16" height="70" rx="2.4"/><rect x="106" y="190" width="44" height="16" rx="2.4"/></g>`;
export const LOGO = (c = CREME) => svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="20 0 216 256">${logoSvg(c)}</svg>`);
export function ROSACE(taille = 600) {
  const cx = 300, cy = 300, R1 = 280, R2 = 190, n = 16, cols = ["#2F5BD1", "#6B4BC6", "#D9609A", "#E9A23B", "#D63649", "#2E9A6B"];
  let w = "";
  for (let i = 0; i < n; i++) {
    const a0 = ((-90 + (360 * i) / n + 1.2) * Math.PI) / 180, a1 = ((-90 + (360 * (i + 1)) / n - 1.2) * Math.PI) / 180;
    const p = (r, a) => `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
    w += `<path d="M${p(R1, a0)} A${R1},${R1} 0 0 1 ${p(R1, a1)} L${p(R2, a1)} A${R2},${R2} 0 0 0 ${p(R2, a0)} Z" fill="${cols[i % 6]}"/>`;
  }
  return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" width="${taille}" height="${taille}" viewBox="0 0 600 600"><circle cx="300" cy="300" r="296" fill="#fff"/>${w}<circle cx="300" cy="300" r="184" fill="#fff"/><g transform="translate(300 306) scale(1.15) translate(-128 -138)">${logoSvg(NUIT)}</g></svg>`);
}

// Coupe un texte en morceaux d'au plus `max` caractères, en respectant les phrases.
export function decouper(texte, max) {
  const phrases = texte.replace(/\n\n/g, " ¶ ").match(/[^.!?»…¶]+[.!?»…]*\s*|¶\s*/g) || [texte];
  const blocs = [];
  let cur = "";
  for (const ph of phrases) {
    const p = ph.trim() === "¶" ? "\n\n" : ph;
    if ((cur + p).length > max && cur.trim()) { blocs.push(cur.trim()); cur = p.trim() === "" ? "" : p; }
    else cur += p;
  }
  if (cur.trim()) blocs.push(cur.trim());
  return blocs.map((b) => b.replace(/^\s+|\s+$/g, "").replace(/\n{3,}/g, "\n\n"));
}

const dateLongue = (jour) => { const d = laDate(jour); return `${d.nomJour[0].toUpperCase()}${d.nomJour.slice(1)} ${d.num === 1 ? "1er" : d.num} ${d.mois}`; };

export class AtelierSalve {
  constructor() { this.fonts = polices(); this.p = PALETTES.vert; }
  // Couleurs du jour : tous les visuels suivent la couleur liturgique
  liturgie(couleur) { this.p = PALETTES[couleur] || PALETTES.vert; this.couleur = couleur; return this; }
  async png(arbre, l = 1080, haut = 1350) {
    const svg = await satori(arbre, { width: l, height: haut, fonts: this.fonts });
    return new Resvg(svg, { fitTo: { mode: "width", value: l } }).render().asPng();
  }

  marque(taille = 34) {
    return h("div", { alignItems: "center" }, img(LOGO(this.p.creme), { width: taille, height: taille * 256 / 216 }), h("div", { marginLeft: 14, fontFamily: "Crimson", fontSize: taille * 1.15, color: this.p.creme }, "Salve"));
  }
  pastille(couleur) {
    const c = /blanc|or/.test(couleur) ? this.p.bande : LITURGIE[couleur] || LITURGIE.vert;
    return h("div", { alignItems: "center", border: `2px solid ${c}`, borderRadius: 999, padding: "8px 20px", fontFamily: "Inter", fontSize: 24, color: this.p.creme },
      h("div", { width: 18, height: 18, borderRadius: 999, background: c, marginRight: 12 }), `Couleur liturgique : ${NOM_COULEUR[couleur] || couleur}`);
  }
  cadre(enfants, { l = 1080, haut = 1350, couleur, pad = 84 } = {}) {
    return h("div", { width: l, height: haut, background: this.p.fond, color: this.p.creme, flexDirection: "column", padding: pad, position: "relative", fontFamily: "Inter" },
      h("div", { position: "absolute", left: 0, top: 0, width: l, height: 14, background: this.p.bande }),
      ...enfants);
  }
  pied(texte = "salve-rosaire.fr") {
    return h("div", { marginTop: "auto", justifyContent: "space-between", alignItems: "center", fontSize: 24, color: this.p.doux }, this.marque(26), h("div", {}, texte));
  }

  // ---------- Post 1 : Évangile + méditation ----------
  couvertureEvangile(d) {
    const titre = d.homelie?.titre || d.evangile.titre;
    return this.cadre([
      h("div", { justifyContent: "space-between", alignItems: "center" }, this.marque(), h("div", { fontSize: 28, color: this.p.doux }, dateLongue(d.jour))),
      h("div", { marginTop: 120, fontSize: 30, color: this.p.accent, fontWeight: 600, letterSpacing: 2 }, "L'ÉVANGILE DU JOUR"),
      h("div", { marginTop: 24, fontFamily: "Crimson", fontWeight: 600, fontSize: titre.length > 60 ? 78 : 96, lineHeight: 1.05, color: this.p.titre }, titre),
      h("div", { marginTop: 34, fontFamily: "Crimson", fontStyle: "italic", fontSize: 40, color: this.p.texte }, `${d.evangile.intro} · ${d.evangile.ref}`),
      d.homelie?.accroche ? h("div", { marginTop: 40, fontSize: 32, lineHeight: 1.45, color: this.p.texte }, d.homelie.accroche) : null,
      h("div", { marginTop: "auto", flexDirection: "column" },
        h("div", {}, this.pastille(d.couleur)),
        h("div", { marginTop: 26, fontSize: 26, color: this.p.doux }, d.jourLiturgique.replace(/\s*\(.*\)$/, "")),
        h("div", { marginTop: 40, fontSize: 28, fontWeight: 600, color: this.p.accent }, "Faites défiler pour lire et méditer")),
    ], { couleur: d.couleur });
  }
  pageTexte({ surtitre, titre, texte, serif = true, n, total, couleur }) {
    return this.cadre([
      h("div", { justifyContent: "space-between", alignItems: "center", fontSize: 24, color: this.p.doux }, h("div", { color: this.p.accent, fontWeight: 600, letterSpacing: 1.5 }, surtitre.toUpperCase()), total > 1 ? h("div", {}, `${n}/${total}`) : null),
      titre ? h("div", { marginTop: 30, fontFamily: "Crimson", fontWeight: 600, fontSize: 56, lineHeight: 1.1, color: this.p.titre }, titre) : null,
      h("div", { marginTop: titre ? 34 : 46, flexDirection: "column" },
        ...texte.split("\n\n").map((p) => h("div", { marginBottom: 22, fontFamily: serif ? "Crimson" : "Inter", fontSize: serif ? (texte.length > 520 ? 39 : 43) : (texte.length > 600 ? 31 : 34), lineHeight: serif ? 1.38 : 1.5, color: serif ? this.p.creme : this.p.texte }, p))),
      this.pied(),
    ], { couleur });
  }
  priere(d) {
    return this.cadre([
      h("div", { fontSize: 26, color: this.p.accent, fontWeight: 600, letterSpacing: 2 }, "PRIONS"),
      h("div", { flex: 1, alignItems: "center", justifyContent: "center", textAlign: "center", fontFamily: "Crimson", fontStyle: "italic", fontSize: d.homelie.priere.length > 260 ? 50 : 58, lineHeight: 1.3, color: this.p.titre }, d.homelie.priere),
      h("div", { justifyContent: "center", fontFamily: "Crimson", fontSize: 44, color: this.p.accent }, "Amen."),
      this.pied(),
    ], { couleur: d.couleur });
  }
  fin({ ia = true } = {}) {
    return this.cadre([
      h("div", { flex: 1, flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" },
        img(ROSACE(460), { width: 460, height: 460 }),
        h("div", { marginTop: 56, fontFamily: "Crimson", fontWeight: 600, fontSize: 64, color: this.p.titre }, "Prier le chapelet et le Rosaire"),
        h("div", { marginTop: 20, fontSize: 32, color: this.p.texte, textAlign: "center" }, "Mystères du jour, voix qui prie avec toi, saints et Évangile."),
        h("div", { marginTop: 36, background: this.p.accent, color: this.p.fond, borderRadius: 999, padding: "16px 34px", fontSize: 30, fontWeight: 600 }, "Salve · appli gratuite sur l'App Store")),
      h("div", { justifyContent: "center", textAlign: "center", fontSize: 22, color: this.p.doux, lineHeight: 1.45 },
        ia ? "Méditation générée par IA à partir de l'Évangile du jour. Textes liturgiques © AELF." : "Textes : la Bible et le Catéchisme de l'Église catholique."),
    ]);
  }

  // ---------- Post 2 : une dizaine pour aujourd'hui ----------
  couvertureDizaine(z, jour) {
    return this.cadre([
      h("div", { justifyContent: "space-between", alignItems: "center" }, this.marque(), h("div", { fontSize: 28, color: this.p.doux }, dateLongue(jour))),
      h("div", { marginTop: 110, fontSize: 30, color: this.p.accent, fontWeight: 600, letterSpacing: 2 }, "UNE DIZAINE POUR AUJOURD'HUI"),
      h("div", { marginTop: 26, fontSize: 34, color: this.p.texte }, `${z.serie} · ${z.rang === 1 ? "1er" : z.rang + "e"} mystère`),
      h("div", { marginTop: 18, fontFamily: "Crimson", fontWeight: 600, fontSize: z.titre.length > 28 ? 84 : 100, lineHeight: 1.04, color: this.p.titre }, z.titre),
      h("div", { marginTop: 44, alignItems: "center" }, ...Array.from({ length: 10 }, (_, i) => h("div", { width: 34, height: 34, borderRadius: 999, background: i < 10 ? this.p.creme : this.p.accent, marginRight: 16, opacity: 0.95 }))),
      h("div", { marginTop: "auto", flexDirection: "column" },
        h("div", { fontSize: 28, color: this.p.doux }, "À l'intention de"),
        h("div", { marginTop: 8, fontFamily: "Crimson", fontStyle: "italic", fontSize: 54, color: this.p.accent }, z.intention),
        h("div", { marginTop: 40, fontSize: 28, fontWeight: 600, color: this.p.accent }, "Faites défiler")),
    ]);
  }
  meditationDizaine(z) {
    return this.cadre([
      h("div", { fontSize: 24, color: this.p.accent, fontWeight: 600, letterSpacing: 1.5 }, "MÉDITER LE MYSTÈRE"),
      h("div", { marginTop: 30, fontFamily: "Crimson", fontWeight: 600, fontSize: 60, color: this.p.titre }, z.titre),
      h("div", { marginTop: 10, fontFamily: "Crimson", fontStyle: "italic", fontSize: 36, color: this.p.doux }, z.ref.startsWith("CEC") ? `Catéchisme de l'Église catholique, ${z.ref.slice(4)}` : z.ref),
      h("div", { marginTop: 46, fontFamily: "Crimson", fontSize: 46, lineHeight: 1.38, color: this.p.creme }, z.med),
      h("div", { marginTop: 50, borderLeft: `6px solid ${this.p.accent}`, paddingLeft: 28, flexDirection: "column" },
        h("div", { fontSize: 26, color: this.p.doux }, "Fruit du mystère"),
        h("div", { marginTop: 6, fontFamily: "Crimson", fontSize: 48, color: this.p.accent }, z.fruit.replace(/^./, (c) => c.toUpperCase()))),
      this.pied(),
    ]);
  }
  commentPrier(z) {
    const ligne = (n, texte, sous) => h("div", { alignItems: "center", marginBottom: 34 },
      h("div", { width: 92, height: 92, borderRadius: 999, background: this.p.fond2, border: `2px solid ${this.p.accent}`, alignItems: "center", justifyContent: "center", fontFamily: "Crimson", fontSize: 44, color: this.p.accent }, n),
      h("div", { marginLeft: 32, flexDirection: "column" }, h("div", { fontFamily: "Crimson", fontWeight: 600, fontSize: 48, color: this.p.titre }, texte), sous ? h("div", { marginTop: 4, fontSize: 26, color: this.p.doux }, sous) : null));
    return this.cadre([
      h("div", { fontSize: 24, color: this.p.accent, fontWeight: 600, letterSpacing: 1.5 }, "COMMENT PRIER LA DIZAINE"),
      h("div", { marginTop: 30, fontSize: 32, lineHeight: 1.45, color: this.p.texte, marginBottom: 54 }, `Annonce le mystère : « ${z.titre} », puis confie ton intention.`),
      ligne("1", "Notre Père", null),
      ligne("10", "Je vous salue Marie", "en méditant le mystère"),
      ligne("1", "Gloire au Père", null),
      ligne("+", "Ô mon Jésus", "prière de Fatima, si tu le souhaites"),
      this.pied("Prie-la avec Salve, l'appli gratuite"),
    ]);
  }

  // ---------- Stories 1080×1920 ----------
  story(enfants, couleur) { return this.cadre(enfants, { l: 1080, haut: 1920, couleur, pad: 96 }); }
  storyParole(d) {
    return this.story([
      h("div", { marginTop: 60, justifyContent: "space-between", alignItems: "center" }, this.marque(40), h("div", { fontSize: 30, color: this.p.doux }, dateLongue(d.jour))),
      h("div", { flex: 1, flexDirection: "column", justifyContent: "center" },
        h("div", { fontSize: 32, color: this.p.accent, fontWeight: 600, letterSpacing: 2 }, "LA PAROLE DU JOUR"),
        h("div", { marginTop: 30, fontFamily: "Crimson", fontSize: 200, lineHeight: 0.7, color: this.p.accent }, "«"),
        h("div", { fontFamily: "Crimson", fontWeight: 600, fontSize: d.evangile.titre.length > 90 ? 76 : 90, lineHeight: 1.12, color: this.p.titre }, d.evangile.titre),
        h("div", { marginTop: 40, fontFamily: "Crimson", fontStyle: "italic", fontSize: 42, color: this.p.texte }, `${d.evangile.intro} · ${d.evangile.ref}`)),
      h("div", { marginBottom: 80, fontSize: 30, color: this.p.doux }, "L'Évangile et sa méditation sont sur notre fil."),
    ], d.couleur);
  }
  storySaint(d) {
    const s = d.saints;
    return this.story([
      h("div", { marginTop: 60, justifyContent: "space-between", alignItems: "center" }, this.marque(40), h("div", { fontSize: 30, color: this.p.doux }, dateLongue(d.jour))),
      h("div", { flex: 1, flexDirection: "column", justifyContent: "center" },
        h("div", { fontSize: 32, color: this.p.accent, fontWeight: 600, letterSpacing: 2 }, s.length > 1 ? "LES SAINTS DU JOUR" : "LE SAINT DU JOUR"),
        h("div", { marginTop: 40, fontSize: 36, color: this.p.texte }, "Aujourd'hui, l'Église fête"),
        ...s.slice(0, 3).map((x, i) => h("div", { marginTop: i ? 44 : 24, flexDirection: "column" },
          h("div", { fontFamily: "Crimson", fontWeight: 600, fontSize: s.length > 1 ? 74 : 96, lineHeight: 1.05, color: this.p.titre }, x.nom),
          x.degre ? h("div", { marginTop: 10, fontSize: 30, color: this.p.doux }, x.degre) : null)),
        h("div", { marginTop: 70 }, this.pastille(d.couleur))),
      h("div", { marginBottom: 80, fontFamily: "Crimson", fontStyle: "italic", fontSize: 44, color: this.p.accent }, s.every((x) => /^(Saint|Sainte|Saints|Saintes|Bienheureu)/.test(x.nom)) ? (s.length === 1 && s[0].nom.length < 42 ? `${s[0].nom.replace(/,.*$/, "")}, priez pour nous.` : "Priez pour nous.") : "Prions avec toute l'Église."),
    ], d.couleur);
  }
  storyMysteres(m, jour) {
    const { nomJour } = laDate(jour);
    return this.story([
      h("div", { marginTop: 60, justifyContent: "space-between", alignItems: "center" }, this.marque(40), h("div", { fontSize: 30, color: this.p.doux }, dateLongue(jour))),
      h("div", { flex: 1, flexDirection: "column", justifyContent: "center" },
        h("div", { fontSize: 32, color: this.p.accent, fontWeight: 600, letterSpacing: 2 }, `NOUS SOMMES ${nomJour.toUpperCase()}`),
        h("div", { marginTop: 24, fontFamily: "Crimson", fontWeight: 600, fontSize: 104, lineHeight: 1, color: this.p.titre }, m.nom),
        h("div", { marginTop: 56, flexDirection: "column" }, ...m.liste.map((x, i) => h("div", { alignItems: "center", marginBottom: 30 },
          h("div", { width: 64, height: 64, borderRadius: 999, background: this.p.fond2, border: `2px solid ${this.p.accent}`, alignItems: "center", justifyContent: "center", fontFamily: "Crimson", fontSize: 34, color: this.p.accent }, String(i + 1)),
          h("div", { marginLeft: 28, fontFamily: "Crimson", fontSize: 50, color: this.p.creme }, x.titre))))),
      h("div", { marginBottom: 80, fontSize: 32, color: this.p.doux }, "Une dizaine aujourd'hui ? On t'en propose une sur notre fil."),
    ]);
  }
  storyAppli() {
    return this.story([
      h("div", { marginTop: 60 }, this.marque(44)),
      h("div", { flex: 1, flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" },
        img(ROSACE(640), { width: 640, height: 640 }),
        h("div", { marginTop: 70, fontFamily: "Crimson", fontWeight: 600, fontSize: 96, lineHeight: 1.04, color: this.p.titre, textAlign: "center" }, "Prie le chapelet avec Salve"),
        h("div", { marginTop: 30, fontSize: 38, lineHeight: 1.4, color: this.p.texte, textAlign: "center" }, "Mystères du jour, voix qui prie avec toi, saints, Évangile et catéchisme."),
        h("div", { marginTop: 50, background: this.p.accent, color: this.p.fond, borderRadius: 999, padding: "22px 48px", fontSize: 40, fontWeight: 600 }, "Gratuit sur l'App Store")),
      h("div", { marginBottom: 80, justifyContent: "center", fontSize: 32, color: this.p.doux }, "Lien en bio · salve-rosaire.fr"),
    ]);
  }
}
