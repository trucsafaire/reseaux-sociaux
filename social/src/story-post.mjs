// Story 1080×1920 qui reprend le post du jour (sa 1re image) pour le relayer en story, Facebook et Instagram.
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { createRequire } from "node:module";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";

const require = createRequire(import.meta.url);
let FONTS;
const polices = () => {
  const f = (fichier) => readFileSync(join(dirname(require.resolve("@fontsource/inter/package.json")), "files", fichier));
  return (FONTS ??= [
    { name: "Inter", weight: 500, data: f("inter-latin-500-normal.woff") },
    { name: "Inter", weight: 700, data: f("inter-latin-700-normal.woff") },
  ]);
};
const h = (type, style = {}, ...enfants) => {
  const e = enfants.flat().filter((x) => x !== null && x !== false && x !== undefined && x !== "");
  return { type, props: { style: { display: "flex", ...style }, children: e.length === 1 ? e[0] : e } };
};

/**
 * @param {string} image   1re image du post (PNG 1080×1350)
 * @param {string} sortie  fichier PNG de la story
 * @param {{fond?:string, texte?:string, accent?:string, haut?:string, bas?:string}} o
 */
export async function storyDepuisPost(image, sortie, o = {}) {
  const fond = o.fond || "#2546D8", texte = o.texte || "#FFFFFF", accent = o.accent || "#FF8A3D";
  const src = "data:image/png;base64," + readFileSync(image).toString("base64");
  const arbre = h("div", { width: 1080, height: 1920, background: fond, flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "Inter" },
    h("div", { fontSize: 46, fontWeight: 700, color: texte, marginBottom: 46, letterSpacing: 1 }, o.haut || "Nouvelle publication"),
    h("div", { borderRadius: 36, overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,0.35)", border: `6px solid ${texte}` },
      { type: "img", props: { src, style: { width: 900, height: 1125 } } }),
    h("div", { marginTop: 54, background: accent, color: fond === "#F7F2E6" ? "#14285F" : "#FFFFFF", borderRadius: 999, padding: "20px 44px", fontSize: 38, fontWeight: 700 }, o.bas || "À lire sur notre fil"));
  const svg = await satori(arbre, { width: 1080, height: 1920, fonts: polices() });
  writeFileSync(sortie, new Resvg(svg, { fitTo: { mode: "width", value: 1080 } }).render().asPng());
  return sortie;
}
