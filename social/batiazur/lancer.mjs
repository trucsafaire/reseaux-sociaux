// Robot Bati Azur.
//   node social/batiazur/lancer.mjs preparer meteo      → sortie/meteo/ (story du jour + publication.json)
//   node social/batiazur/lancer.mjs publier meteo       → publie (sauf si déjà fait aujourd'hui)
//   options : --forcer (republie même si déjà fait), --essai-meteo '<json>' (données de test)
import { writeFileSync, readFileSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { AtelierBatiAzur } from "./visuels.mjs";
import { meteoDuJour, legendeMeteo } from "./meteo.mjs";
import { publierBatiAzur } from "./publier.mjs";

const ICI = dirname(fileURLToPath(import.meta.url));
const [commande, moment = "meteo", ...reste] = process.argv.slice(2);
const opt = (n) => { const i = reste.indexOf(`--${n}`); return i < 0 ? null : (reste[i + 1] && !reste[i + 1].startsWith("--") ? reste[i + 1] : true); };
const config = JSON.parse(readFileSync(join(ICI, "config.json"), "utf8"));
const HISTO = join(ICI, "historique.json");
const histo = existsSync(HISTO) ? JSON.parse(readFileSync(HISTO, "utf8")) : {};
const jour = new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris" }).format(new Date());
const cle = `${jour}-${moment}`;
const dossier = join(ICI, "sortie", moment);

if (commande === "preparer") {
  rmSync(dossier, { recursive: true, force: true }); mkdirSync(dossier, { recursive: true });
  const a = new AtelierBatiAzur();
  const pub = { moment, dossier: moment, jour, stories: [] };
  if (moment === "meteo") {
    const m = opt("essai-meteo") ? JSON.parse(opt("essai-meteo")) : await meteoDuJour();
    const f = join(dossier, `${jour}-meteo.png`);
    writeFileSync(f, await a.storyMeteo(m));
    pub.stories.push(f);
    pub.legende = legendeMeteo(m);
    pub.meteo = m;
    console.log(`Météo ${m.max}° / ${m.min}° · ${m.ciel} · ${m.conseil.valeur} ${m.conseil.detail}${m.conseil.alerte ? " · ALERTE " + m.conseil.type : ""}`);
  } else throw new Error(`moment inconnu : ${moment}`);
  writeFileSync(join(dossier, "publication.json"), JSON.stringify(pub, null, 2));
  console.log(`✓ préparé : ${pub.stories.length} story(s)`);

} else if (commande === "publier") {
  if (histo[cle] && !opt("forcer")) { console.log(`Déjà publié (${cle}), rien à faire.`); process.exit(0); }
  if (!config.page_id) { console.log("! page_id Bati Azur vide dans config.json : visuels préparés, rien publié."); process.exit(0); }
  const pub = JSON.parse(readFileSync(join(dossier, "publication.json"), "utf8"));
  if (pub.jour !== jour) throw new Error(`publication préparée pour ${pub.jour}, pas pour aujourd'hui`);
  await publierBatiAzur(pub, config);
  histo[cle] = new Date().toISOString();
  writeFileSync(HISTO, JSON.stringify(histo, null, 2));
} else {
  console.log("Usage : lancer.mjs preparer|publier meteo");
}
