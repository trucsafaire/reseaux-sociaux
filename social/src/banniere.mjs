#!/usr/bin/env node
// Bannière de couverture Facebook (1640 × 624) : titre, badges des boutiques, maquettes ordi / tablette / téléphone.
//   node social/src/banniere.mjs --titre "Que faire dans l’Allier ?" --ecrans /tmp/ecrans-03 --sortie couverture.png
// --ecrans : dossier contenant ordi.png, tablette.png, tel.png : captures déjà placées dans les maquettes Apple.
// Badges officiels attendus dans marque/boutiques/ : app-store.svg (Apple) et google-play.png (Google).
// Sans eux, un emplacement vide marque leur place.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";

const require = createRequire(import.meta.url);
const DEPOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf("--" + n); return i >= 0 ? args[i + 1] : d; };
const titre = opt("titre", "Que faire autour de chez vous ?");
const ecrans = opt("ecrans");
const sortie = opt("sortie", "couverture.png");

const W = 1640, H = 624, BLEU = "#2546D8", BLEU_FONCE = "#1A33A8", CONFETTI = "#FF8A3D", CADRE = "#11152B";
const police = (p, f) => readFileSync(join(dirname(require.resolve(`${p}/package.json`)), "files", f));
const fonts = [
  { name: "Outfit", weight: 700, data: police("@fontsource/outfit", "outfit-latin-700-normal.woff") },
  { name: "DM Sans", weight: 500, data: police("@fontsource/dm-sans", "dm-sans-latin-500-normal.woff") },
];
const h = (t, s = {}, ...c) => { c = c.flat().filter(Boolean); return { type: t, props: { style: { display: "flex", ...s }, children: c.length === 1 ? c[0] : c } }; };
const img = (src, style) => ({ type: "img", props: { src, style } });
const uri = (f) => {
  const ext = f.split(".").pop().toLowerCase();
  const mime = ext === "svg" ? "image/svg+xml" : ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "image/png";
  return `data:${mime};base64,${readFileSync(f).toString("base64")}`;
};
const ecran = (nom) => uri(join(ecrans, `${nom}.png`));

// Les badges gardent leurs proportions officielles ; hauteur commune.
const HB = 64;
function badge(fichier, ratio, libelle) {
  const f = join(DEPOT, "marque", "boutiques", fichier);
  if (existsSync(f)) return img(uri(f), { height: HB, width: Math.round(HB * ratio) });
  return h("div", { height: HB, width: Math.round(HB * ratio), border: "2px dashed rgba(255,255,255,.6)", borderRadius: 12,
    alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 18, fontFamily: "DM Sans" }, libelle);
}

// Maquettes officielles Apple déjà composées (social/outils/maquettes.py) : ordi.png, tablette.png, tel.png
const ombre = "drop-shadow(0 18px 30px rgba(6,10,40,.45))";
const ordi = img(ecran("ordi"), { position: "absolute", left: 1010, top: 118, width: 580, height: 382 });
const tablette = img(ecran("tablette"), { position: "absolute", left: 890, top: 228, width: 250, height: 345 });
const tel = img(ecran("tel"), { position: "absolute", left: 1445, top: 262, width: 152, height: 311 });

const arbre = h("div", { width: W, height: H, background: BLEU, position: "relative", overflow: "hidden", color: "#fff", fontFamily: "DM Sans" },
  h("div", { position: "absolute", right: -160, top: -260, width: 760, height: 760, borderRadius: 999, background: BLEU_FONCE }),
  h("div", { position: "absolute", left: 640, top: 60, width: 46, height: 46, borderRadius: 99, background: CONFETTI }),
  // texte à gauche : la photo de profil se pose au centre, en bas
  h("div", { position: "absolute", left: 70, top: 70, flexDirection: "column", width: 640 },
    img(uri(join(DEPOT, "marque", "logo-horizontal-blanc.svg")), { width: 360, height: 75 }),
    // « | » force le retour à la ligne (jamais au milieu d'un nom composé) ; la taille s'adapte à la plus longue ligne
    h("div", { marginTop: 30, flexDirection: "column", fontFamily: "Outfit", fontWeight: 700, lineHeight: 1.05,
      fontSize: Math.min(56, Math.floor(760 / (0.5 * Math.max(...titre.split("|").map((l) => l.length))))) },
      titre.split("|").map((l) => h("div", { whiteSpace: "nowrap" }, l.trim()))),
    h("div", { marginTop: 14, fontSize: 28, opacity: 0.85 }, "Brocantes, fêtes, concerts, sorties en famille"),
    h("div", { marginTop: 34, alignItems: "center" },
      // Apple demande que son badge passe en premier
      badge("app-store.svg", 3.16, "App Store"),
      h("div", { width: 18 }),
      badge("google-play.png", 3.365, "Google Play"))),
  ordi, tablette, tel);

writeFileSync(sortie, new Resvg(await satori(arbre, { width: W, height: H, fonts })).render().asPng());
console.log("Bannière :", sortie);
