#!/usr/bin/env node
// Point d'entrée. Une page = un département (voir « pages » dans config.json).
//   node social/src/lancer.mjs preparer   [--jour AAAA-MM-JJ] [--format week-end] [--page allier]
//   node social/src/lancer.mjs publier    [--page allier] [--forcer]
//   node social/src/lancer.mjs verifier   [--page allier]   teste l'accès Meta sans rien publier
//   node social/src/lancer.mjs semaine    [--jour …] [--page …]   aperçu des 7 prochains jours, sans rien publier
//   node social/src/lancer.mjs classement                          quels départements ont assez de sorties pour une page ?
import { readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { aujourdhui, ajouterJours, jourSemaine, ecartJours, instant } from "./outils.mjs";
import { chargerSorties, selectionner, cleSerie } from "./selection.mjs";
import { Atelier } from "./visuels.mjs";
import { legendes } from "./textes.mjs";
import { storyDepuisPost } from "./story-post.mjs";
import { publier, verifierMeta, compteInstagram, jetonDePage } from "./publier.mjs";
import { preparerVitrine } from "./vitrine.mjs";
import { nouvellePage, textesProfil } from "./departements.mjs";

const ICI = dirname(dirname(fileURLToPath(import.meta.url)));   // social/
const DEPOT = dirname(ICI);
const DONNEES = join(DEPOT, "data");
const SORTIE = join(ICI, "sortie");
const HISTO = join(ICI, "historique.json");

const config = JSON.parse(readFileSync(join(ICI, "config.json"), "utf8"));
const [, , commande = "preparer", ...reste] = process.argv;
const opt = (nom) => { const i = reste.indexOf("--" + nom); return i >= 0 ? reste[i + 1] : undefined; };
const jour = opt("jour") || aujourdhui(config.fuseau);

// Historique : { allier: { cle: jour, … }, nievre: { … } }
const lireHisto = () => (existsSync(HISTO) ? JSON.parse(readFileSync(HISTO, "utf8")) : {});
const ecrireHisto = (h) => writeFileSync(HISTO, JSON.stringify(h, null, 1) + "\n");

function pagesVisees() {
  const choix = opt("page");
  const pages = config.pages.filter((p) => (choix ? p.id === choix : p.actif));
  if (!pages.length) throw new Error(choix ? `Page inconnue : ${choix}` : "Aucune page active dans config.json");
  return pages;
}
const configPage = (page) => ({ ...config, page });

let atelier, france;
const estVitrine = (page) => page.type === "vitrine";

// Les pages se citent entre elles : chaque département renvoie vers la page vitrine,
// la vitrine cite quelques départements (à tour de rôle) qui ont un compte Instagram.
const cacheIg = new Map();
const igDe = async (p) => (cacheIg.has(p.id) ? cacheIg.get(p.id) : (cacheIg.set(p.id, await compteInstagram(p)), cacheIg.get(p.id)));
const court = (p) => (p.nom || "").replace(/^(la |le |les |l’|l')/i, "");
async function liensEntrePages(page, jour) {
  const vitrine = config.pages.find((p) => estVitrine(p) && p.meta?.page_id);
  if (!vitrine) return undefined;
  if (!estVitrine(page)) {
    const ig = await igDe(vitrine);
    return {
      instagram: ig ? `📍 Les sorties partout en France : @${ig}` : undefined,
      identifier: ig ? [ig] : [],
      facebook: `📍 Les sorties partout en France : Trucs à faire → https://www.facebook.com/${vitrine.meta.page_id}`,
    };
  }
  const deps = config.pages.filter((p) => p.actif && p.departement && p.meta?.page_id);
  if (!deps.length) return undefined;
  const n = Math.min(5, deps.length), debut = Math.floor(Date.parse(jour) / 864e5) * n % deps.length;
  const choix = Array.from({ length: n }, (_, i) => deps[(debut + i) % deps.length]);
  const comptes = (await Promise.all(choix.map(igDe))).filter(Boolean);
  return {
    instagram: comptes.length ? `📍 Suivez aussi votre département : ${comptes.map((c) => "@" + c).join(" ")}` : undefined,
    identifier: comptes,
    facebook: `📍 Suivez aussi la page de votre département :\n${choix.map((p) => `• ${court(p)} → https://www.facebook.com/${p.meta.page_id}`).join("\n")}`,
  };
}
const jourDePublication = (page, j) => !page.jours || page.jours.includes(jourSemaine(j));

async function preparer(page, j, format, dossier, historique) {
  if (estVitrine(page)) {
    rmSync(dossier, { recursive: true, force: true });
    france ??= chargerSorties(DONNEES, { departements: JSON.parse(readFileSync(join(DONNEES, "departements.json"), "utf8")).departements.map((d) => d.code) });
    const pub = await preparerVitrine({ racine: DEPOT, toutes: france, jour: j, page, historique, dossier, theme: opt("theme") });
    pub.story = await storyDepuisPost(pub.images[0], join(dossier, `${j}-${page.id}-story.png`));
    writeFileSync(join(dossier, "publication.json"), JSON.stringify(pub, null, 2));
    writeFileSync(join(dossier, "instagram.txt"), pub.legendes.instagram);
    writeFileSync(join(dossier, "facebook.txt"), pub.legendes.facebook);
    return pub;
  }
  const toutes = chargerSorties(DONNEES, { departements: [page.departement] });
  const cfg = configPage(page);
  const sel = selectionner({ toutes, jour: j, format, config: cfg, historique });
  if (!sel) throw new Error(`Page ${page.id} : aucune sortie pour le ${j} (format ${format}).`);
  rmSync(dossier, { recursive: true, force: true });
  atelier ??= new Atelier(DEPOT);
  const images = await atelier.produire(sel, cfg, dossier, `${j}-${page.id}-`); // nom unique : évite les caches
  const pub = { page: page.id, jour: j, format: sel.format, demande: format, images, legendes: legendes(sel, cfg),
    sorties: sel.sorties.map((e) => ({ id: e.id, cle: e._cle, serie: cleSerie(e.t), t: e.t, s: e.s, w: e.w })) };
  pub.story = await storyDepuisPost(images[0], join(dossier, `${j}-${page.id}-story.png`));
  writeFileSync(join(dossier, "publication.json"), JSON.stringify(pub, null, 2));
  writeFileSync(join(dossier, "instagram.txt"), pub.legendes.instagram);
  writeFileSync(join(dossier, "facebook.txt"), pub.legendes.facebook);
  return pub;
}

function memoriser(h, pub) {
  if (pub.theme) h["theme:" + pub.theme] = pub.jour;
  for (const e of pub.sorties) { h[e.cle] = pub.jour; h[e.id] = pub.jour; h["serie:" + e.serie] = pub.jour; }
}
function oublierVieux(h, j) {
  const limite = ajouterJours(j, -120);
  for (const k of Object.keys(h)) if (h[k] < limite) delete h[k];
}

// Une page en échec n'empêche pas les autres : on continue, puis on signale l'échec à la fin.
async function pourChaquePage(action) {
  const echecs = [];
  for (const page of pagesVisees()) {
    try { await action(page); } catch (err) { echecs.push(page.id); console.error(`✗ ${page.id} : ${err.message}`); }
  }
  if (echecs.length) { console.error(`\nÉchec pour : ${echecs.join(", ")}`); process.exitCode = 1; }
}

if (commande === "preparer") {
  const histo = lireHisto();
  const format = opt("format") || config.planning[jourSemaine(jour)];
  await pourChaquePage(async (page) => {
    if (!jourDePublication(page, jour) && !opt("page")) { rmSync(join(SORTIE, page.id), { recursive: true, force: true }); console.log(`${page.id} : pas de publication ce jour-là`); return; }
    const pub = await preparer(page, jour, format, join(SORTIE, page.id), histo[page.id] || {});
    console.log(`Préparé ${page.id} : ${pub.format} (${pub.sorties.length} sorties, ${pub.images.length} images)`);
  });

} else if (commande === "ajouter-page") {
  // node social/src/lancer.mjs ajouter-page 58 [--page-id 123] : ajoute (ou complète) la page d'un département
  const code = reste.find((x) => !x.startsWith("--")) ;
  let page = config.pages.find((p) => p.departement === code);
  if (!page) { page = nouvellePage(code); config.pages.push(page); }
  else page = Object.assign(page, { ...nouvellePage(code), ...page, dans: page.dans || nouvellePage(code).dans });
  if (opt("page-id")) { page.meta.page_id = opt("page-id"); page.actif = true; }
  writeFileSync(join(ICI, "config.json"), JSON.stringify(config, null, 2) + "\n");
  const t = textesProfil(code);
  console.log(JSON.stringify({ page, profil: t }, null, 2));

} else if (commande === "relayer-stories") {
  // Rattrapage : relaie en story le post déjà publié aujourd'hui sur chaque page (Facebook + Instagram).
  const G = "https://graph.facebook.com/v21.0";
  const { mkdtempSync } = await import("node:fs");
  const tmp = mkdtempSync("/tmp/relais-");
  await pourChaquePage(async (page) => {
    const { jeton, fb, ig } = await jetonDePage(page);
    const q = (u, o) => fetch(u, o).then((x) => x.json()).then((r) => { if (r.error) throw new Error(r.error.message); return r; });
    const posts = await q(`${G}/${fb}/posts?fields=full_picture,created_time&limit=3&access_token=${encodeURIComponent(jeton)}`);
    const post = (posts.data || []).find((x) => x.full_picture && new Date(x.created_time) > new Date(Date.now() - 20 * 3600e3));
    if (!post) { console.log(`${page.id} : pas de post récent`); return; }
    const img = Buffer.from(await fetch(post.full_picture).then((r) => r.arrayBuffer()));
    const brut = join(tmp, `${page.id}.img`); writeFileSync(brut, img);
    const story = await storyDepuisPost(brut, join(tmp, `${page.id}-story.png`));
    const form = new FormData();
    form.append("source", new Blob([readFileSync(story)], { type: "image/png" }), "story.png");
    form.append("published", "false"); form.append("access_token", jeton);
    const photo = await q(`${G}/${fb}/photos`, { method: "POST", body: form });
    await q(`${G}/${fb}/photo_stories`, { method: "POST", body: new URLSearchParams({ photo_id: photo.id, access_token: jeton }) });
    console.log(`✓ ${page.id} story facebook`);
    if (ig) {
      const url = (await q(`${G}/${photo.id}?fields=images&access_token=${encodeURIComponent(jeton)}`)).images?.[0]?.source;
      const c = await q(`${G}/${ig}/media`, { method: "POST", body: new URLSearchParams({ image_url: url, media_type: "STORIES", access_token: jeton }) });
      for (let i = 0; i < 20; i++) { const st = await q(`${G}/${c.id}?fields=status_code&access_token=${encodeURIComponent(jeton)}`); if (st.status_code === "FINISHED") break; await new Promise((ok) => setTimeout(ok, 3000)); }
      for (let i = 0; ; i++) { try { await q(`${G}/${ig}/media_publish`, { method: "POST", body: new URLSearchParams({ creation_id: c.id, access_token: jeton }) }); break; } catch (e) { if (i >= 4) throw e; await new Promise((ok) => setTimeout(ok, 6000)); } }
      console.log(`✓ ${page.id} story instagram`);
    }
  });

} else if (commande === "liens-facebook") {
  // Ajoute après coup le lien vers la page vitrine aux posts Facebook du jour (déjà publiés) des départements.
  await pourChaquePage(async (page) => {
    if (estVitrine(page)) return;
    const ajout = (await liensEntrePages(page, jour))?.facebook;
    const { jeton, fb } = await jetonDePage(page);
    const G = "https://graph.facebook.com/v21.0";
    const depuis = Math.floor(Date.parse(jour + "T00:00:00+01:00") / 1000);
    const r = await fetch(`${G}/${fb}/posts?fields=id,message&since=${depuis}&access_token=${encodeURIComponent(jeton)}`).then((x) => x.json());
    if (r.error) throw new Error(r.error.message);
    for (const post of r.data || []) {
      if (!post.message || post.message.includes(ajout)) { console.log(`${page.id} : ${post.id} déjà à jour`); continue; }
      const i = post.message.search(/\n[^\n]*#\S+[^\n]*$/);
      const message = i > 0 ? `${post.message.slice(0, i)}\n\n${ajout}${post.message.slice(i)}` : `${post.message}\n\n${ajout}`;
      const m = await fetch(`${G}/${post.id}`, { method: "POST", body: new URLSearchParams({ message, access_token: jeton }) }).then((x) => x.json());
      if (m.error) throw new Error(`${post.id} : ${m.error.message}`);
      console.log(`✓ ${page.id} : ${post.id} modifié`);
    }
  });

} else if (commande === "verifier") {
  await pourChaquePage(async (page) => {
    console.log(`✓ ${page.id} : ${await verifierMeta(page)}`);
    console.log(JSON.stringify(await liensEntrePages(page, jour), null, 1));
  });

} else if (commande === "publier") {
  const maintenant = Date.now();
  await pourChaquePage(async (page) => {
    const f = join(SORTIE, page.id, "publication.json");
    if (!existsSync(f)) { if (jourDePublication(page, jour) || opt("page")) throw new Error("rien de préparé"); return; }
    const pub = JSON.parse(readFileSync(f, "utf8"));
    const histo = lireHisto();
    const h = (histo[page.id] ??= {});
    if (h["publie:" + pub.jour] && !reste.includes("--forcer")) { console.log(`${page.id} : déjà publié le ${pub.jour}`); return; }
    // Postiz programme chaque page à son heure ; si l'heure est passée, dans 5 minutes.
    let quand = instant(pub.jour, page.heure || "11:30", config.fuseau);
    if (new Date(quand) - maintenant < 5 * 60e3) quand = new Date(maintenant + 5 * 60e3).toISOString();
    const liens = (process.env.PILOTE || "").toLowerCase() === "meta" ? await liensEntrePages(page, pub.jour) : undefined;
    await publier(pub, { reseaux: config.reseaux, mode: process.env.MODE_PUBLICATION || "direct", page, quand, liens });
    memoriser(h, pub);
    h["publie:" + pub.jour] = pub.jour;
    oublierVieux(h, pub.jour);
    ecrireHisto(histo);
  });

} else if (commande === "semaine") {
  // Aperçu : simule 7 jours d'affilée par page, en tenant compte de l'historique au fil des jours.
  const histo = lireHisto();
  await pourChaquePage(async (page) => {
    const h = { ...(histo[page.id] || {}) };
    console.log(`\n— ${page.id} (${page.departement})`);
    for (let i = 0; i < 7; i++) {
      const j = ajouterJours(jour, i);
      const format = config.planning[jourSemaine(j)];
      const pub = await preparer(page, j, format, join(ICI, "apercu", page.id, `${j}-${format}`), h);
      memoriser(h, pub);
      console.log(`${j} ${format.padEnd(13)} → ${pub.format.padEnd(13)} ${pub.sorties.length} : ${pub.sorties.map((e) => e.t.slice(0, 26)).join(" | ")}`);
    }
  });

} else if (commande === "classement") {
  // Sorties courtes (3 jours max) dans les 30 prochains jours, par département.
  const deps = JSON.parse(readFileSync(join(DONNEES, "departements.json"), "utf8")).departements;
  const lignes = [];
  for (const d of deps) {
    const toutes = chargerSorties(DONNEES, { departements: [d.code] });
    const n = toutes.filter((e) => e.s >= jour && e.s <= ajouterJours(jour, 30) && ecartJours(e.s, e.e) <= 3).length;
    lignes.push({ code: d.code, nom: d.nom, n, page: config.pages.find((p) => p.departement === d.code)?.id || "" });
  }
  lignes.sort((a, b) => b.n - a.n);
  console.log("Sorties d'1 à 3 jours dans les 30 prochains jours (une page tient bien au-dessus de ~60) :\n");
  for (const l of lignes) console.log(`${l.code.padEnd(4)}${l.nom.padEnd(28)}${String(l.n).padStart(5)}  ${l.page ? "← page " + l.page : ""}`);

} else {
  console.log("Commandes : preparer | publier | semaine | classement");
}
