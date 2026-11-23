// Carrousel d'annonce des pages départementales, publié sur la page vitrine Trucs à faire.
//   node social/src/annonce.mjs <dossier-sortie> [codes…]   (par défaut : les pages actives de config.json)
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Atelier } from "./visuels.mjs";
import { DEPARTEMENTS } from "./departements.mjs";

const RACINE = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const config = JSON.parse(readFileSync(join(RACINE, "social", "config.json"), "utf8"));
const L = 1080, H = 1350, BLEU = "#2546D8", BLEU_FONCE = "#1A33A8", CLAIR = "#F2F5FF", ENCRE = "#0E1226", GRIS = "#4D5470", CONFETTI = "#FF8A3D";

const h = (type, style = {}, ...enfants) => {
  const plats = enfants.flat().filter((x) => x !== null && x !== false && x !== undefined && x !== "");
  return { type, props: { style: { display: "flex", ...style }, children: plats.length === 1 ? plats[0] : plats } };
};
const img = (src, style) => ({ type: "img", props: { src, style } });
const png = (p) => `data:image/png;base64,${readFileSync(p).toString("base64")}`;

const args = process.argv.slice(2);
const optIg = args.indexOf("--ig");                 // --ig 03,58 : comptes Instagram déjà en ligne
const avecIg = optIg >= 0 ? args.splice(optIg, 2)[1].split(",") : null;
const sortie = args[0] || "/tmp/annonce";
const codes = args.slice(1).length ? args.slice(1)
  : config.pages.filter((p) => p.actif && p.departement && p.meta?.page_id).map((p) => p.departement);
const pages = codes.map((c) => {
  const p = config.pages.find((x) => x.departement === c) || {};
  const profil = [join(RACINE, "marque/reseaux/departements", c, "profil.png"), join(RACINE, "marque/reseaux", `profil-${p.id}.png`)].find(existsSync);
  const ig = !avecIg || avecIg.includes(c) ? "@" + (p.instagram || `trucsafaire${c.toLowerCase()}`) : null;
  return { code: c, nom: DEPARTEMENTS[c][0], ig, profil };
});

const atelier = new Atelier(RACINE);
mkdirSync(sortie, { recursive: true });

// 1. Couverture
const couverture = h("div", { width: L, height: H, background: BLEU, color: "#fff", fontFamily: "DM Sans", flexDirection: "column", padding: 90, position: "relative", overflow: "hidden" },
  h("div", { position: "absolute", right: -200, bottom: -160, width: 760, height: 760, borderRadius: 999, background: BLEU_FONCE }),
  h("div", { position: "absolute", right: 120, top: 260, width: 70, height: 70, borderRadius: 999, background: CONFETTI }),
  img(atelier.logoBlanc, { width: 400, height: 83 }),
  h("div", { marginTop: 150, alignSelf: "flex-start", background: CONFETTI, borderRadius: 999, padding: "14px 28px", fontSize: 32, fontWeight: 700 }, "Nouveau"),
  h("div", { marginTop: 40, fontFamily: "Outfit", fontWeight: 700, fontSize: 104, lineHeight: 1.02, letterSpacing: -3 }, "Trucs à faire arrive dans votre département"),
  h("div", { marginTop: 40, fontSize: 40, lineHeight: 1.35, color: "rgba(255,255,255,.9)" }, "Une page par département, avec chaque jour les sorties près de chez vous."),
  h("div", { marginTop: "auto", fontSize: 32, fontWeight: 700 }, "Faites défiler"),
);

// 2. Les pages (4 par visuel)
const tuiles = [];
for (let i = 0; i < pages.length; i += 4) {
  const lot = pages.slice(i, i + 4);
  tuiles.push(h("div", { width: L, height: H, background: CLAIR, color: ENCRE, fontFamily: "DM Sans", flexDirection: "column", padding: 80 },
    h("div", { fontFamily: "Outfit", fontWeight: 700, fontSize: 64, letterSpacing: -1.5 }, i === 0 ? "Déjà en ligne" : "Et aussi"),
    h("div", { marginTop: 16, fontSize: 32, color: GRIS }, "Abonnez-vous à celle de chez vous"),
    h("div", { marginTop: 56, flexDirection: "column" },
      lot.map((p) => h("div", { alignItems: "center", background: "#fff", borderRadius: 32, padding: "26px 32px", marginBottom: 28, boxShadow: "0 6px 24px rgba(37,70,216,.10)" },
        p.profil ? img(png(p.profil), { width: 140, height: 140, borderRadius: 999 }) : h("div", { width: 140, height: 140 }),
        h("div", { marginLeft: 36, flexDirection: "column" },
          h("div", { fontFamily: "Outfit", fontWeight: 700, fontSize: 48 }, p.nom),
          h("div", { marginTop: 6, fontSize: 30, color: BLEU, fontWeight: 700 }, p.ig ? `Facebook + ${p.ig}` : "Page Facebook · Instagram bientôt"),
        ),
      )),
    ),
  ));
}

// 3. Fin
const fin = h("div", { width: L, height: H, background: BLEU, color: "#fff", fontFamily: "DM Sans", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 90, textAlign: "center" },
  img(atelier.logoBlanc, { width: 460, height: 95 }),
  h("div", { marginTop: 80, fontFamily: "Outfit", fontWeight: 700, fontSize: 78, lineHeight: 1.08, textAlign: "center" }, "Votre département n’y est pas encore ?"),
  h("div", { marginTop: 36, fontSize: 40, lineHeight: 1.4, textAlign: "center", color: "rgba(255,255,255,.9)" }, "De nouvelles pages arrivent chaque semaine, partout en France. En attendant, toutes les sorties sont sur trucsafaire.fr et dans l’appli."),
);

const visuels = [couverture, ...tuiles, fin];
for (const [i, v] of visuels.entries()) writeFileSync(join(sortie, `annonce-${String(i + 1).padStart(2, "0")}.png`), await atelier.png(v));
console.log(`${visuels.length} visuels → ${sortie}`);
