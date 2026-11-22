// Publication. Deux pilotes au choix (variable PILOTE) :
//  - "postiz" (par défaut) : votre Postiz auto-hébergé, via son outil en ligne de commande ;
//  - "meta"   : directement sur l'API de Meta (Instagram + page Facebook), sans serveur.
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { basename } from "node:path";

const exec = promisify(execFile);

// ---------------------------------------------------------------- Postiz

/** Le CLI Postiz affiche parfois une ligne avant le JSON : on ne garde que le JSON. */
function json(sortie) {
  const i = sortie.search(/[[{]/);
  if (i < 0) throw new Error("Réponse Postiz illisible : " + sortie.slice(0, 300));
  return JSON.parse(sortie.slice(i));
}
async function postiz(...args) {
  const { stdout } = await exec("postiz", args, { env: process.env, maxBuffer: 20e6 });
  return json(stdout);
}

let listePostiz;
const sansAccent = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
/** Nom court du département : « l’Allier » → « allier », « la Saône-et-Loire » → « saone-et-loire » */
const motCle = (page) => sansAccent(page.nom.replace(/^(l[’']|la |le |les )/i, ""));

async function canauxPostiz(reseaux, page) {
  listePostiz ??= await postiz("integrations:list");
  const canaux = {};
  for (const r of reseaux) {
    if (page.postiz?.[r]) { canaux[r] = page.postiz[r]; continue; }
    const c = listePostiz.find((x) => !x.disabled
      && (x.identifier === r || x.identifier?.startsWith(r + "-") || x.providerIdentifier === r)
      && sansAccent(x.name || "").includes(motCle(page)));
    if (!c) throw new Error(`Page ${page.id} : aucun compte ${r} dont le nom contient « ${motCle(page)} » dans Postiz (comptes vus : ${listePostiz.map((x) => `${x.identifier}:${x.name}`).join(", ")}). Renommez le compte dans Postiz ou indiquez son identifiant dans config.json.`);
    canaux[r] = c.id;
  }
  return canaux;
}

async function publierPostiz(pub, { reseaux, mode, page, quand }) {
  const canaux = await canauxPostiz(reseaux, page);
  const medias = [];
  for (const f of pub.images) medias.push((await postiz("upload", f)).path);
  const resultats = {};
  for (const r of reseaux) {
    const reglages = await postiz("integrations:settings", canaux[r]).catch(() => null);
    if (reglages?.output?.rules) console.log(`Règles Postiz ${r} :`, reglages.output.rules);
    const args = ["posts:create", "-c", pub.legendes[r], "-m", medias.join(","), "-s", quand, "-i", canaux[r]];
    if (r === "instagram") args.push("--settings", JSON.stringify({ post_type: "post" }));
    if (mode === "brouillon") args.push("-t", "draft");
    resultats[r] = await postiz(...args);
    console.log(`✓ ${page.id} ${r} : ${mode === "brouillon" ? "brouillon créé" : "planifié pour " + quand}`);
  }
  return resultats;
}

// ---------------------------------------------------------------- Meta (sans serveur)

const GRAPH = "https://graph.facebook.com/v21.0";
let JETON;
async function graph(chemin, params) {
  const corps = new URLSearchParams({ ...params, access_token: JETON });
  const r = await fetch(`${GRAPH}/${chemin}`, { method: "POST", body: corps });
  const j = await r.json();
  if (!r.ok || j.error) throw new Error(`Meta ${chemin} : ${j.error?.message || r.status}`);
  return j;
}
async function attendrePret(id) {
  for (let i = 0; i < 30; i++) {
    const r = await fetch(`${GRAPH}/${id}?fields=status_code&access_token=${JETON}`).then((x) => x.json());
    if (r.status_code === "FINISHED") return;
    if (r.status_code === "ERROR") throw new Error("Instagram a refusé une image");
    await new Promise((ok) => setTimeout(ok, 4000));
  }
  throw new Error("Instagram met trop de temps à traiter les images");
}

// Jeton de la page : soit un jeton de page dédié (META_PAGE_TOKEN_ALLIER…),
// soit — recommandé — le jeton unique de l'utilisateur système (META_TOKEN),
// à partir duquel on récupère le jeton de chaque page et son compte Instagram lié.
async function jetonDePage(page) {
  const secrets = process.env.SECRETS_JSON ? JSON.parse(process.env.SECRETS_JSON) : process.env;
  const dedie = secrets["META_PAGE_TOKEN_" + page.id.toUpperCase().replace(/-/g, "_")] || secrets.META_PAGE_TOKEN;
  const fb = page.meta?.page_id;
  if (!fb) throw new Error(`Page ${page.id} : page_id Meta manquant dans config.json`);
  let jeton = dedie, ig = page.meta?.ig_user_id;
  if (!jeton || !ig) {
    const systeme = secrets.META_TOKEN;
    if (!jeton && !systeme) throw new Error(`Page ${page.id} : jeton Meta manquant (secret META_TOKEN)`);
    const r = await fetch(`${GRAPH}/${fb}?fields=access_token,instagram_business_account&access_token=${encodeURIComponent(jeton || systeme)}`).then((x) => x.json());
    if (r.error) throw new Error(`Page ${page.id} : ${r.error.message}`);
    jeton = jeton || r.access_token;
    ig = ig || r.instagram_business_account?.id;
  }
  return { jeton, fb, ig };
}

async function publierMeta(pub, { reseaux, page }) {
  const infos = await jetonDePage(page);
  JETON = infos.jeton;
  if (!JETON) throw new Error(`Page ${page.id} : impossible d'obtenir le jeton de la page`);
  const base = process.env.URL_IMAGES; // ex. https://raw.githubusercontent.com/trucsafaire/sorties-bourbonnais-loire/reseaux-images
  if (!base) throw new Error("URL_IMAGES manquante (adresse publique des images)");
  const urls = pub.images.map((f) => `${base}/${basename(f)}`);
  const res = {};
  if (reseaux.includes("instagram")) {
    const ig = infos.ig;
    if (!ig) throw new Error(`Page ${page.id} : aucun compte Instagram relié à la page`);
    let conteneur;
    if (urls.length === 1) {
      conteneur = (await graph(`${ig}/media`, { image_url: urls[0], caption: pub.legendes.instagram })).id;
    } else {
      const enfants = [];
      for (const u of urls) enfants.push((await graph(`${ig}/media`, { image_url: u, is_carousel_item: "true" })).id);
      for (const id of enfants) await attendrePret(id);
      conteneur = (await graph(`${ig}/media`, { media_type: "CAROUSEL", children: enfants.join(","), caption: pub.legendes.instagram })).id;
    }
    await attendrePret(conteneur);
    res.instagram = await graph(`${ig}/media_publish`, { creation_id: conteneur });
    console.log(`✓ ${page.id} instagram publié`);
  }
  if (reseaux.includes("facebook")) {
    const fb = infos.fb;
    const photos = [];
    for (const u of urls) photos.push((await graph(`${fb}/photos`, { url: u, published: "false" })).id);
    const p = { message: pub.legendes.facebook };
    photos.forEach((id, i) => (p[`attached_media[${i}]`] = JSON.stringify({ media_fbid: id })));
    res.facebook = await graph(`${fb}/feed`, p);
    console.log(`✓ ${page.id} facebook publié`);
  }
  return res;
}

export async function publier(pub, options) {
  const pilote = (process.env.PILOTE || "postiz").toLowerCase();
  if (pilote === "meta") return publierMeta(pub, options);
  return publierPostiz(pub, options);
}
