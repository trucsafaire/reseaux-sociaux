// Salve sur les réseaux, 100 % automatique.
//   node social/salve/lancer.mjs preparer matin|soir [--jour AAAA-MM-JJ] [--donnees fichier.json]
//   node social/salve/lancer.mjs publier  matin|soir [--jour …]
// matin : stories (parole du jour, saint du jour, mystères du jour, appli 1 jour sur 3) + post « Évangile et méditation »
// soir  : post « Une dizaine pour aujourd'hui »
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { donneesDuJour, couleurDuJour } from "./donnees.mjs";
import { mysteresDuJour, dizaineDuJour, jourDePub } from "./contenus.mjs";
import { AtelierSalve, decouper } from "./visuels.mjs";
import { publierSalve } from "./publier.mjs";
import { storyDepuisPost } from "../src/story-post.mjs";

const ICI = dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(readFileSync(join(ICI, "config.json"), "utf8"));
const [commande, moment = "matin", ...reste] = process.argv.slice(2);
const opt = (n) => { const i = reste.indexOf("--" + n); return i >= 0 ? reste[i + 1] : undefined; };
const jour = opt("jour") || new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris" }).format(new Date());
const SORTIE = join(ICI, "sortie", moment);
const HISTO = join(ICI, "historique.json");
const lireHisto = () => (existsSync(HISTO) ? JSON.parse(readFileSync(HISTO, "utf8")) : {});

const pied = (lignes) => lignes.filter(Boolean).join("\n\n");
const APPLI = () => `📲 ${config.appli}`;

async function preparer() {
  rmSync(SORTIE, { recursive: true, force: true });
  mkdirSync(SORTIE, { recursive: true });
  const a = new AtelierSalve();
  const ecrire = async (nom, arbre, story = false) => {
    const f = join(SORTIE, nom);
    writeFileSync(f, await a.png(arbre, 1080, story ? 1920 : 1350));
    return f;
  };
  const pub = { jour, moment, stories: [], post: null };

  if (moment === "matin") {
    const d = opt("donnees") ? JSON.parse(readFileSync(opt("donnees"), "utf8")) : await donneesDuJour(jour);
    if (opt("couleur")) d.couleur = opt("couleur");
    a.liturgie(d.couleur);
    // Stories
    pub.stories.push(await ecrire("story-1-parole.png", a.storyParole(d), true));
    for (const [i, x] of d.saints.entries()) pub.stories.push(await ecrire(`story-2-saint-${i + 1}.png`, a.storyUnSaint(d, x, i + 1, d.saints.length), true));
    pub.stories.push(await ecrire("story-3-mysteres.png", a.storyMysteres(mysteresDuJour(jour), jour), true));
    if (jourDePub(jour)) pub.stories.push(await ecrire("story-4-appli.png", a.storyAppli(), true));

    // Post Évangile + méditation (10 visuels au plus)
    const images = [await ecrire("post-01.png", a.couvertureEvangile(d))];
    const ev = decouper(d.evangile.texte, 560).slice(0, 3);
    for (const [i, t] of ev.entries())
      images.push(await ecrire(`post-0${images.length + 1}.png`, a.pageTexte({ surtitre: `${d.evangile.intro} · ${d.evangile.ref}`, texte: t, serif: true, n: i + 1, total: ev.length, couleur: d.couleur })));
    if (d.homelie) {
      const parts = d.homelie.parties.flatMap((p) => decouper(p.texte, 640).map((t, k) => ({ titre: k ? null : p.titre, t })));
      for (const [i, p] of parts.slice(0, 8 - images.length).entries())
        images.push(await ecrire(`post-${String(images.length + 1).padStart(2, "0")}.png`, a.pageTexte({ surtitre: "Méditation", titre: p.titre, texte: p.t, serif: false, n: i + 1, total: Math.min(parts.length, 8 - images.length + i), couleur: d.couleur })));
      if (d.homelie.priere) images.push(await ecrire(`post-${String(images.length + 1).padStart(2, "0")}.png`, a.priere(d)));
    }
    images.push(await ecrire(`post-${String(images.length + 1).padStart(2, "0")}.png`, a.fin({ ia: !!d.homelie })));

    const titre = d.homelie?.titre || d.evangile.titre;
    const texteEv = d.evangile.texte;
    const corps = pied([
      `📖 ${titre}`,
      `${d.evangile.intro} (${d.evangile.ref})`,
      texteEv.length < 1400 ? texteEv : texteEv.slice(0, texteEv.lastIndexOf(" ", 1350)) + "…",
      d.homelie?.accroche ? `🕊️ ${d.homelie.accroche}` : null,
      d.homelie ? "La méditation complète est à faire défiler en images." : null,
      jourDePub(jour) ? APPLI() : null,
      d.homelie ? "Méditation générée par IA à partir de l'Évangile du jour. Textes liturgiques © AELF." : "Textes liturgiques © AELF.",
    ]);
    pub.post = { images, legendes: { instagram: corps + "\n\n" + config.hashtags.evangile, facebook: corps } };
    pub.storiesApres = [await storyDepuisPost(images[0], join(SORTIE, "story-5-post.png"), { fond: a.p.fond, texte: a.p.titre, accent: a.p.accent, haut: "L'Évangile du jour", bas: "La méditation est sur notre fil" })];
  } else {
    const z = dizaineDuJour(jour);
    a.liturgie(opt("couleur") || (await couleurDuJour(jour)));
    const images = [
      await ecrire("post-01.png", a.couvertureDizaine(z, jour)),
      await ecrire("post-02.png", a.meditationDizaine(z)),
      await ecrire("post-03.png", a.commentPrier(z)),
      await ecrire("post-04.png", a.fin({ ia: false })),
    ];
    const corps = pied([
      `📿 Une dizaine pour aujourd'hui : ${z.titre}`,
      `${z.serie}, ${z.rang === 1 ? "1er" : z.rang + "e"} mystère (${z.ref.startsWith("CEC") ? "Catéchisme de l'Église catholique, " + z.ref.slice(4) : z.ref}).`,
      z.med,
      `Fruit du mystère : ${z.fruit}.\nIntention du jour : prions pour ${z.intention}.`,
      "Un Notre Père, dix Je vous salue Marie, un Gloire au Père. Dix minutes pour confier la journée à Marie.",
      null,
    ]);
    pub.post = { images, legendes: { instagram: corps + "\n\n" + config.hashtags.dizaine, facebook: corps } };
    pub.storiesApres = [await storyDepuisPost(images[0], join(SORTIE, "story-post.png"), { fond: a.p.fond, texte: a.p.titre, accent: a.p.accent, haut: "Une dizaine pour aujourd'hui", bas: "À prier sur notre fil" })];
  }
  writeFileSync(join(SORTIE, "publication.json"), JSON.stringify(pub, null, 2));
  console.log(`✓ ${moment} ${jour} : ${pub.stories.length} stories, post de ${pub.post.images.length} visuels → ${SORTIE}`);
}

async function publier() {
  const f = join(SORTIE, "publication.json");
  if (!existsSync(f)) throw new Error("rien de préparé");
  if (!config.page_id) { console.warn("! Salve : page_id manquant dans social/salve/config.json, rien n'est publié"); return; }
  const pub = JSON.parse(readFileSync(f, "utf8"));
  const histo = lireHisto();
  const cle = `${pub.moment}:${pub.jour}`;
  if (histo[cle] && !reste.includes("--forcer")) { console.log(`Salve ${cle} : déjà publié`); return; }
  await publierSalve(pub, config);
  histo[cle] = new Date().toISOString();
  for (const k of Object.keys(histo)) if (k.split(":")[1] < pub.jour.slice(0, 8) + "01" && Object.keys(histo).length > 120) delete histo[k];
  writeFileSync(HISTO, JSON.stringify(histo, null, 1));
}

if (commande === "preparer") await preparer();
else if (commande === "publier") await publier();
else { console.error("Commandes : preparer|publier matin|soir"); process.exit(1); }
