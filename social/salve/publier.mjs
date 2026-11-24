// Publication Salve via l'API Graph de Meta : stories (Instagram + Facebook) et post carrousel.
import { basename } from "node:path";
import { jetonDePage } from "../src/publier.mjs";

const GRAPH = "https://graph.facebook.com/v21.0";
let JETON;
async function graph(chemin, params) {
  const r = await fetch(`${GRAPH}/${chemin}`, { method: "POST", body: new URLSearchParams({ ...params, access_token: JETON }) });
  const j = await r.json();
  if (!r.ok || j.error) throw new Error(`Meta ${chemin} : ${j.error?.message || r.status}`);
  return j;
}
async function attendrePret(id) {
  for (let i = 0; i < 40; i++) {
    const r = await fetch(`${GRAPH}/${id}?fields=status_code&access_token=${JETON}`).then((x) => x.json());
    if (r.status_code === "FINISHED") return;
    if (r.status_code === "ERROR") throw new Error("Instagram a refusé une image");
    await new Promise((ok) => setTimeout(ok, 4000));
  }
  throw new Error("Instagram met trop de temps à traiter les images");
}

// Instagram répond parfois « Media ID is not available » juste après le traitement : on réessaie.
async function publierIg(ig, c) {
  for (let i = 0; ; i++) {
    try { return await graph(`${ig}/media_publish`, { creation_id: c }); }
    catch (e) { if (i >= 4 || !/not available|not ready|try again/i.test(e.message)) throw e; await new Promise((ok) => setTimeout(ok, 6000)); }
  }
}

export async function publierSalve(pub, config) {
  const page = { id: "salve", meta: { page_id: config.page_id } };
  const { jeton, fb, ig } = await jetonDePage(page);
  JETON = jeton;
  const base = process.env.URL_IMAGES;
  if (!base) throw new Error("URL_IMAGES manquante");
  const url = (f) => `${base}/${pub.moment}/${basename(f)}`;
  const erreurs = [];
  const essai = async (nom, fn) => { try { await fn(); console.log(`✓ salve ${nom}`); } catch (e) { erreurs.push(`${nom} : ${e.message}`); console.error(`✗ salve ${nom} : ${e.message}`); } };
  if (!ig) console.warn("! aucun compte Instagram relié à la page Salve : Facebook seulement");

  const story = async (s) => {
    if (ig) await essai(`story instagram ${basename(s)}`, async () => {
      const c = (await graph(`${ig}/media`, { image_url: url(s), media_type: "STORIES" })).id;
      await attendrePret(c);
      await publierIg(ig, c);
    });
    await essai(`story facebook ${basename(s)}`, async () => {
      const photo = (await graph(`${fb}/photos`, { url: url(s), published: "false" })).id;
      await graph(`${fb}/photo_stories`, { photo_id: photo });
    });
  };
  // Stories
  for (const s of pub.stories) await story(s);

  // Post
  if (pub.post) {
    const urls = pub.post.images.map(url);
    if (ig) await essai("post instagram", async () => {
      const enfants = [];
      for (const u of urls) enfants.push((await graph(`${ig}/media`, { image_url: u, is_carousel_item: "true" })).id);
      for (const id of enfants) await attendrePret(id);
      const c = (await graph(`${ig}/media`, { media_type: "CAROUSEL", children: enfants.join(","), caption: pub.post.legendes.instagram })).id;
      await attendrePret(c);
      await publierIg(ig, c);
    });
    await essai("post facebook", async () => {
      const photos = [];
      for (const u of urls) photos.push((await graph(`${fb}/photos`, { url: u, published: "false" })).id);
      const p = { message: pub.post.legendes.facebook };
      photos.forEach((id, i) => (p[`attached_media[${i}]`] = JSON.stringify({ media_fbid: id })));
      await graph(`${fb}/feed`, p);
    });
  }
  // Le post relayé en story, une fois le post en ligne
  for (const s of pub.storiesApres || []) await story(s);
  // Le post principal ne doit jamais manquer : on échoue s'il n'est parti nulle part.
  if (erreurs.some((e) => e.startsWith("post facebook")) && (!ig || erreurs.some((e) => e.startsWith("post instagram")))) throw new Error(erreurs.join(" | "));
  if (erreurs.length) process.exitCode = 1;
}
