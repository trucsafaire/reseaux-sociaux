// Données du jour pour Salve : lectures AELF (via le robot Salve, sinon api.aelf.org) et homélie IA du robot Salve.
const BOT = process.env.SALVE_BOT || "https://salve-bot.batiazur-mail.workers.dev";

async function json(url) {
  const r = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 (salve-reseaux)", origin: "https://salve-rosaire.fr", referer: "https://salve-rosaire.fr/" } });
  if (!r.ok) throw new Error(`${url} : HTTP ${r.status}`);
  return r.json();
}

const ENTITES = { nbsp: " ", rsquo: "’", lsquo: "‘", laquo: "«", raquo: "»", hellip: "…", amp: "&", quot: '"', apos: "'", ndash: "–", mdash: "—", oelig: "œ", OElig: "Œ", eacute: "é", egrave: "è", agrave: "à", ccedil: "ç", ecirc: "ê", ocirc: "ô", icirc: "î", ucirc: "û", acirc: "â", euml: "ë", iuml: "ï", Eacute: "É" };
export function texteBrut(html = "") {
  return html
    .replace(/\s*\n\s*/g, " ")
    .replace(/<sup[^>]*>.*?<\/sup>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&([a-zA-Z]+);/g, (m, e) => ENTITES[e] ?? m)
    .split(/\n{2,}/)
    .map((p) => p.split("\n").map((l) => l.trim()).filter(Boolean).join(" ").replace(/\s+/g, " ").replace(/ ([,.;:!?»])/g, (m, c) => (/[;:!?»]/.test(c) ? " " + c : c)).trim())
    .filter(Boolean)
    .join("\n\n");
}

async function lectures(jour) {
  try {
    const a = await json(`${BOT}/aelf?date=${jour}`);
    return a[jour] || a;
  } catch (e) {
    console.warn(`! robot Salve indisponible pour les lectures (${e.message}), repli sur api.aelf.org`);
    return json(`https://api.aelf.org/v1/messes/${jour}/romain`);
  }
}

const ABREV = [[/^S\. /, "Saint "], [/^Ste /, "Sainte "], [/^Ss /, "Saints "], [/^Stes /, "Saintes "], [/^Bx /, "Bienheureux "], [/^Bse /, "Bienheureuse "], [/^Bses /, "Bienheureuses "], [/ S\. /g, " saint "], [/ Ste /g, " sainte "]];
function saintDuJour(info) {
  const lignes = [info.fete, info.ligne2, info.ligne3].filter(Boolean);
  const vu = new Set();
  const saints = [];
  for (const l of lignes) {
    const m = l.match(/^(.*?)\.?\s*(Mémoire facultative|Mémoire obligatoire|Mémoire|Fête|Solennité)?\.?$/);
    let nom = (m?.[1] || l).trim().replace(/\.$/, "");
    if (!/^(S\.|Ste|Ss|Stes|Bx|Bse|Saint|Sainte|Notre-Dame|La |Le |Les |Dédicace|Présentation|Nativité|Assomption|Immaculée|Toussaint|Tous les)/.test(nom)) continue;
    for (const [re, r] of ABREV) nom = nom.replace(re, r);
    if (vu.has(nom)) continue;
    vu.add(nom);
    saints.push({ nom, degre: m?.[2] || info.degre || "" });
  }
  return saints;
}

export async function donneesDuJour(jour) {
  const a = await lectures(jour);
  const info = a.informations || {};
  const messe = (a.messes || [])[0] || { lectures: [] };
  const ev = messe.lectures.find((l) => l.type === "evangile");
  if (!ev) throw new Error(`Pas d'Évangile trouvé pour le ${jour}`);
  let homelie = null;
  try {
    homelie = await json(`${BOT}/homelie?date=${jour}`);
    if (!homelie?.parties?.length) homelie = null;
  } catch (e) {
    console.warn(`! homélie indisponible (${e.message}) : post Évangile sans homélie`);
  }
  return {
    jour,
    info,
    couleur: info.couleur || "vert",
    jourLiturgique: info.ligne1 || "",
    nomLiturgique: info.jour_liturgique_nom || "",
    saints: await saintsAvecHistoire(jour, saintDuJour(info)),
    evangile: {
      ref: ev.ref,
      titre: texteBrut(ev.titre || "").replace(/^«\s*|\s*»$/g, ""),
      intro: texteBrut(ev.intro_lue || "Évangile de Jésus Christ"),
      texte: texteBrut(ev.contenu || "").replace(/\s*[–—-]\s*Acclamons la Parole de Dieu\.?\s*$/i, "").trim(),
    },
    homelie,
  };
}

// Couleur liturgique du jour seule (pour le post du soir)
export async function couleurDuJour(jour) {
  try { return (await lectures(jour)).informations?.couleur || "vert"; } catch { return "vert"; }
}

// ---------- Saints du jour et leur histoire (Wikipédia, licence CC BY-SA : la source est citée) ----------
const WIKI = "https://fr.wikipedia.org/w/api.php";
const wiki = (params) => json(`${WIKI}?${new URLSearchParams({ format: "json", formatversion: "2", origin: "*", ...params })}`);
const sansTitre = (nom) => nom.replace(/^(Saints?|Saintes?|Bienheureu\w+|Notre-Dame)\s+/i, "").trim();
const MOIS_FR = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

// Résumé d'un article, coupé proprement à la phrase
async function resume(titre, max = 720) {
  const r = await wiki({ action: "query", prop: "extracts", exintro: "1", explaintext: "1", redirects: "1", titles: titre });
  let t = (r.query?.pages?.[0]?.extract || "").replace(/\s*\([^()]*\)/g, (m) => (m.length > 60 ? "" : m)).replace(/\s+/g, " ").trim();
  if (t.length > max) { const coupe = t.slice(0, max); t = coupe.slice(0, Math.max(coupe.lastIndexOf(". "), coupe.lastIndexOf(" ; ")) + 1) || coupe + "…"; }
  return t;
}
// Trouve l'article d'un saint à partir de son nom (« Saint Clément Ier, pape et martyr »)
async function articleSaint(nom) {
  const cle = sansTitre(nom).split(",")[0];
  const r = await wiki({ action: "query", list: "search", srsearch: `${cle} saint`, srlimit: "5" });
  const mot = cle.split(/\s+/)[0].toLowerCase();
  const res = (r.query?.search || []).find((x) => x.title.toLowerCase().includes(mot) && !/homonymie|liste|église|basilique|cathédrale|commune/i.test(x.title));
  return res?.title || null;
}
// Le saint du calendrier (« Bonne fête aux … ») de la page Wikipédia du jour
async function saintDuCalendrier(jour) {
  const d = new Date(jour + "T12:00:00Z");
  const page = `${d.getUTCDate() === 1 ? "1er" : d.getUTCDate()} ${MOIS_FR[d.getUTCMonth()]}`;
  const r = await wiki({ action: "parse", page, prop: "wikitext" });
  const txt = r.parse?.wikitext || "";
  const ligne = txt.split("\n").find((l) => /Bonne fête aux?/i.test(l));
  const prenom = ligne?.match(/\[\[[^\]|]+\|([^\]]+)\]\]|\[\[([^\]]+)\]\]/);
  const p = (prenom?.[1] || prenom?.[2] || "").replace(/\s*\(.*\)$/, "").trim();
  if (!p) return null;
  // l'entrée correspondante dans la liste des saints du jour
  const entree = txt.split("\n").find((l) => /^\*+\s*\[\[/.test(l) && new RegExp(`\\[\\[(?:[^\\]|]*\\|)?${p}\\b`, "i").test(l));
  const lien = entree?.match(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/)?.[1];
  return lien ? { titre: lien, prenom: p } : { titre: null, prenom: p };
}

export async function saintsAvecHistoire(jour, saintsLiturgiques) {
  const out = [];
  for (const s of saintsLiturgiques.slice(0, 3)) {
    let histoire = "", source = null;
    try { const t = await articleSaint(s.nom); if (t) { histoire = await resume(t); source = t; } } catch (e) { console.warn(`! histoire de ${s.nom} : ${e.message}`); }
    out.push({ ...s, histoire, source, calendrier: false });
  }
  try {
    const c = await saintDuCalendrier(jour);
    if (c && !out.some((s) => s.nom.toLowerCase().includes(c.prenom.toLowerCase()))) {
      const histoire = c.titre ? await resume(c.titre) : "";
      const nom = c.titre ? c.titre.replace(/\s*\(.*\)$/, "") : c.prenom;
      out.push({ nom: /^(Saint|Sainte|Bienheureu)/.test(nom) ? nom : `${/a$|e$/.test(c.prenom) ? "Sainte" : "Saint"} ${nom}`, degree: "", degre: `Bonne fête aux ${c.prenom} !`, histoire, source: c.titre, calendrier: true });
    }
  } catch (e) { console.warn(`! saint du calendrier : ${e.message}`); }
  return out;
}
