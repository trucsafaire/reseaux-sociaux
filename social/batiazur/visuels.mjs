// Visuels Bati Azur (posts 1080×1350, stories 1080×1920), d'après la charte officielle :
// crème #FDFAEF, bleu #5284CB, bleu profond #3E6398, jaune #FFBE00, marron #CB703B, police Quicksand, motif « ba ».
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";

const require = createRequire(import.meta.url);
const ICI = dirname(fileURLToPath(import.meta.url));
const CHARTE = JSON.parse(readFileSync(join(ICI, "charte.json"), "utf8"));
export const C = CHARTE.couleurs; // creme, bleu, jaune, bleu_profond, marron, encre
const P = C.bleu_profond;
export const TEL = "04 70 34 21 96";

const police = (poids) => readFileSync(join(dirname(require.resolve("@fontsource/quicksand/package.json")), "files", `quicksand-latin-${poids}-normal.woff`));
const FONTS = [500, 600, 700].map((w) => ({ name: "Quicksand", weight: w, style: "normal", data: police(w) }));

const h = (type, style = {}, ...enfants) => {
  const e = enfants.flat().filter((x) => x !== null && x !== false && x !== undefined && x !== "");
  return { type, props: { style: { display: "flex", ...style }, children: e.length === 1 ? e[0] : e } };
};
const img = (src, style) => ({ type: "img", props: { src, style } });
const dataUri = (octets) => `data:${octets[0] === 0xff && octets[1] === 0xd8 ? "image/jpeg" : "image/png"};base64,${octets.toString("base64")}`;
const marque = (n) => dataUri(readFileSync(join(ICI, "marque", n)));
const LOGO = { blanc: marque("logo-blanc.png"), bleu: marque("logo-bleu.png") };
const EMBLEME = { blanc: marque("embleme-blanc.png"), bleu: marque("embleme-bleu.png") };
const logo = (couleur, l) => img(LOGO[couleur], { width: l, height: Math.round((l * 453) / 1634) });
const embleme = (couleur, l) => img(EMBLEME[couleur], { width: l, height: Math.round((l * 448) / 431) });
const photo = (fichier) => dataUri(readFileSync(fichier));

/** Motif « ba » de la charte : le monogramme répété dans les quatre sens. */
function motif(l, haut, couleur, opacite = 1, pas = 120) {
  const els = [];
  const sens = [0, 90, 180, 270];
  for (let y = -20, j = 0; y < haut; y += pas * 0.72, j++)
    for (let x = -20, i = 0; x < l; x += pas * 0.8, i++)
      els.push(h("div", { position: "absolute", left: x, top: y, fontSize: pas * 0.62, fontWeight: 700, color: couleur, transform: `rotate(${sens[(i + j * 3) % 4]}deg)`, lineHeight: 1 }, "ba"));
  return h("div", { position: "absolute", left: 0, top: 0, width: l, height: haut, opacity: opacite, overflow: "hidden" }, els);
}

const pastille = (texte, fond = C.jaune, couleur = C.encre, taille = 30) =>
  h("div", { background: fond, color: couleur, borderRadius: 999, padding: `${taille * 0.4}px ${taille * 0.9}px`, fontSize: taille, fontWeight: 700, letterSpacing: 2, alignSelf: "flex-start" }, texte);

export class AtelierBatiAzur {
  async png(arbre, l = 1080, haut = 1350) {
    const svg = await satori(h("div", { width: l, height: haut, fontFamily: "Quicksand", position: "relative", overflow: "hidden" }, arbre), { width: l, height: haut, fonts: FONTS });
    return new Resvg(svg, { fitTo: { mode: "width", value: l } }).render().asPng();
  }

  /* ------------------------------------------------------------ météo */
  // m = { ville, temp, min, max, ciel, villes:[{nom,min,max}], conseil:{ titre, valeur, detail, alerte? } }
  storyMeteo(m) {
    const carte = (enfants, style = {}) => h("div", { flexDirection: "column", background: "rgba(255,255,255,0.13)", border: "2px solid rgba(255,255,255,0.22)", borderRadius: 40, padding: "38px 44px", ...style }, enfants);
    return this.png(h("div", { width: 1080, height: 1920, flexDirection: "column", alignItems: "center", background: `linear-gradient(180deg, #7DAAE0 0%, ${C.bleu} 45%, ${P} 100%)`, color: C.creme },
      motif(1080, 1920, "#FFFFFF", 0.05, 150),
      h("div", { marginTop: 130 }, logo("blanc", 330)),
      h("div", { marginTop: 110, fontSize: 34, fontWeight: 700, letterSpacing: 8, opacity: 0.75 }, "MÉTÉO PISCINE · " + m.ville.toUpperCase()),
      h("div", { fontSize: 300, fontWeight: 700, lineHeight: 1, marginTop: 20 }, `${m.temp}°`),
      h("div", { fontSize: 54, fontWeight: 600, marginTop: 10 }, m.ciel),
      h("div", { fontSize: 34, fontWeight: 500, opacity: 0.7, marginTop: 10 }, `Max ${m.max}° · Min ${m.min}°`),
      h("div", { flexDirection: "column", position: "absolute", left: 60, right: 60, bottom: 150, gap: 26 },
        carte([
          h("div", { fontSize: 26, fontWeight: 700, letterSpacing: 5, opacity: 0.7, marginBottom: 14 }, "DANS LE SECTEUR"),
          h("div", { flexWrap: "wrap", gap: "16px 0" }, m.villes.map((v) => h("div", { width: "50%", justifyContent: "space-between", paddingRight: 30, fontSize: 36 },
            h("div", { fontWeight: 700 }, v.nom), h("div", { fontWeight: 500, opacity: 0.85 }, `${v.max}° / ${v.min}°`)))),
        ]),
        carte([
          h("div", { fontSize: 26, fontWeight: 700, letterSpacing: 5, opacity: 0.7 }, m.conseil.titre),
          h("div", { fontSize: 96, fontWeight: 700, color: C.jaune, marginTop: 6 }, m.conseil.valeur),
          h("div", { fontSize: 36, fontWeight: 600, marginTop: 4 }, m.conseil.detail),
        ]),
        m.conseil.alerte ? h("div", { background: C.jaune, color: C.encre, borderRadius: 32, padding: "28px 40px", fontSize: 36, fontWeight: 700, lineHeight: 1.3 }, m.conseil.alerte) : null),
      h("div", { position: "absolute", bottom: 70, fontSize: 30, fontWeight: 600, opacity: 0.8 }, `Bati Azur · Avermes · ${TEL}`)), 1080, 1920);
  }

  /* ---------------------------------------------------------- L'Expert */
  couvertureExpert(sujet, n) {
    return this.png(h("div", { width: 1080, height: 1350, flexDirection: "column", background: C.bleu, color: C.creme, padding: "80px 84px" },
      motif(1080, 1350, P, 0.35, 170),
      h("div", { justifyContent: "space-between", alignItems: "center" }, logo("blanc", 300), h("div", { fontSize: 28, fontWeight: 600, opacity: 0.8 }, `1 / ${n}`)),
      h("div", { flexDirection: "column", marginTop: "auto", marginBottom: "auto", gap: 40 },
        pastille("L'EXPERT BATI AZUR"),
        h("div", { fontSize: 96, fontWeight: 700, lineHeight: 1.08, letterSpacing: -1 }, sujet.titre),
        sujet.sousTitre ? h("div", { fontSize: 42, fontWeight: 500, lineHeight: 1.35, opacity: 0.9 }, sujet.sousTitre) : null),
      h("div", { alignItems: "center", gap: 18, fontSize: 32, fontWeight: 700 }, "Glissez pour lire",
        h("div", { width: 70, height: 6, background: C.jaune, borderRadius: 3 }))));
  }

  pageExpert(etape, i, n) {
    return this.png(h("div", { width: 1080, height: 1350, flexDirection: "column", background: C.creme, color: C.encre, padding: "80px 84px" },
      h("div", { justifyContent: "space-between", alignItems: "center" },
        h("div", { width: 110, height: 110, borderRadius: 55, background: C.jaune, alignItems: "center", justifyContent: "center", fontSize: 60, fontWeight: 700 }, String(i - 1)),
        h("div", { fontSize: 28, fontWeight: 600, color: P, opacity: 0.7 }, `${i} / ${n}`)),
      h("div", { fontSize: 66, fontWeight: 700, color: P, lineHeight: 1.12, marginTop: 70 }, etape.titre),
      h("div", { width: 90, height: 8, background: C.bleu, borderRadius: 4, marginTop: 40, marginBottom: 40 }),
      h("div", { fontSize: 42, fontWeight: 500, lineHeight: 1.5 }, etape.texte),
      h("div", { marginTop: "auto", alignItems: "center", justifyContent: "space-between" }, logo("bleu", 230), h("div", { fontSize: 28, fontWeight: 600, color: P }, "L'Expert Bati Azur"))));
  }

  /* ------------------------------------------------------- fin de post */
  fin(titre = "Une question sur votre piscine ?", ligne = "Magasin, conseils et matériel à Avermes") {
    return this.png(h("div", { width: 1080, height: 1350, flexDirection: "column", alignItems: "center", justifyContent: "center", background: P, color: C.creme, textAlign: "center", padding: 90 },
      motif(1080, 1350, C.jaune, 0.12, 150),
      embleme("blanc", 170),
      h("div", { fontSize: 76, fontWeight: 700, lineHeight: 1.15, marginTop: 60, maxWidth: 860, justifyContent: "center" }, titre),
      h("div", { fontSize: 40, fontWeight: 500, opacity: 0.85, marginTop: 30 }, ligne),
      h("div", { background: C.jaune, color: C.encre, borderRadius: 999, padding: "26px 60px", fontSize: 64, fontWeight: 700, marginTop: 70 }, TEL),
      h("div", { fontSize: 34, fontWeight: 600, marginTop: 34, opacity: 0.85 }, "ou en message sur cette page"),
      h("div", { position: "absolute", bottom: 70 }, logo("blanc", 280))));
  }

  /* ------------------------------------------------------ réalisations */
  // r = { etiquette: "RÉALISATION" | "LE CHANTIER" | "AVANT / APRÈS", titre, ligne, photo }
  couverturePhoto(r) {
    return this.png(h("div", { width: 1080, height: 1350, flexDirection: "column", background: P },
      img(photo(r.photo), { position: "absolute", left: 0, top: 0, width: 1080, height: 1350, objectFit: "cover" }),
      h("div", { position: "absolute", left: 0, top: 0, width: 1080, height: 360, background: "linear-gradient(180deg, rgba(20,32,46,0.55), rgba(20,32,46,0))" }),
      h("div", { position: "absolute", left: 0, bottom: 0, width: 1080, height: 700, background: "linear-gradient(0deg, rgba(30,48,76,0.92) 0%, rgba(30,48,76,0.55) 55%, rgba(30,48,76,0) 100%)" }),
      h("div", { position: "absolute", left: 72, top: 70 }, logo("blanc", 290)),
      h("div", { position: "absolute", left: 72, right: 72, bottom: 90, flexDirection: "column", gap: 26, color: C.creme },
        pastille(r.etiquette),
        h("div", { fontSize: 92, fontWeight: 700, lineHeight: 1.05 }, r.titre),
        r.ligne ? h("div", { fontSize: 40, fontWeight: 600, opacity: 0.9 }, r.ligne) : null)));
  }

  photoSeule(fichier) {
    return this.png(h("div", { width: 1080, height: 1350, background: P },
      img(photo(fichier), { position: "absolute", left: 0, top: 0, width: 1080, height: 1350, objectFit: "cover" }),
      h("div", { position: "absolute", right: 44, bottom: 44, background: "rgba(62,99,152,0.75)", borderRadius: 999, padding: 18 }, embleme("blanc", 70))));
  }

  avantApres(avant, apres) {
    const moitie = (f, etiquette, fond, couleur) => h("div", { width: 1080, height: 671, position: "relative" },
      img(photo(f), { position: "absolute", left: 0, top: 0, width: 1080, height: 671, objectFit: "cover" }),
      h("div", { position: "absolute", left: 50, top: 46 }, pastille(etiquette, fond, couleur, 34)));
    return this.png(h("div", { width: 1080, height: 1350, flexDirection: "column", background: C.creme, justifyContent: "space-between" },
      moitie(avant, "AVANT", C.creme, P), moitie(apres, "APRÈS", C.jaune, C.encre),
      h("div", { position: "absolute", left: 470, top: 615, width: 140, height: 120, borderRadius: 60, background: C.creme, alignItems: "center", justifyContent: "center" }, embleme("bleu", 80))));
  }

  /* ------------------------------------------------ annonce du magasin */
  // a = { titre, date, cartes:[{haut,bas}], bandeau:{ texte, detail } }
  annonce(a) {
    return this.png(h("div", { width: 1080, height: 1350, flexDirection: "column", background: C.marron, color: C.creme, padding: "84px 84px" },
      h("div", { position: "absolute", right: -260, bottom: -260, width: 820, height: 820, borderRadius: 410, background: "rgba(0,0,0,0.08)" }),
      h("div", { justifyContent: "space-between", alignItems: "center" }, logo("blanc", 290), h("div", { fontSize: 36, fontWeight: 700 }, a.date)),
      h("div", { fontSize: 120, fontWeight: 700, marginTop: 90, letterSpacing: -2 }, a.titre),
      h("div", { gap: 24, marginTop: 60 }, a.cartes.map((c) => h("div", { flex: 1, flexDirection: "column", alignItems: "center", background: C.creme, color: C.marron, borderRadius: 30, padding: "40px 16px", gap: 14 },
        h("div", { fontSize: 38, fontWeight: 700 }, c.haut), h("div", { fontSize: 40, fontWeight: 600, color: C.encre }, c.bas)))),
      h("div", { marginTop: "auto", background: "rgba(0,0,0,0.14)", borderRadius: 30, padding: "34px 40px", justifyContent: "space-between", alignItems: "center" },
        h("div", { flexDirection: "column", gap: 8 }, h("div", { fontSize: 38, fontWeight: 700 }, a.bandeau.texte), a.bandeau.detail ? h("div", { fontSize: 30, fontWeight: 500, opacity: 0.85 }, a.bandeau.detail) : null),
        h("div", { fontSize: 38, fontWeight: 700 }, TEL))));
  }

  /* --------------------------------------------- relais d'un post en story */
  storyRelais(premiere, etiquette = "Nouvelle publication") {
    return this.png(h("div", { width: 1080, height: 1920, flexDirection: "column", alignItems: "center", justifyContent: "center", background: C.bleu, color: C.creme },
      motif(1080, 1920, P, 0.35, 170),
      h("div", { position: "absolute", top: 120 }, logo("blanc", 300)),
      h("div", { fontSize: 46, fontWeight: 700, marginBottom: 46 }, etiquette),
      h("div", { borderRadius: 40, overflow: "hidden", border: `8px solid ${C.creme}` }, img(dataUri(premiere), { width: 860, height: 1075 })),
      h("div", { marginTop: 56, background: C.jaune, color: C.encre, borderRadius: 999, padding: "22px 50px", fontSize: 40, fontWeight: 700 }, "À voir sur notre fil")), 1080, 1920);
  }
}
