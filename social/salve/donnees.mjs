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
    saints: saintDuJour(info),
    evangile: {
      ref: ev.ref,
      titre: texteBrut(ev.titre || "").replace(/^«\s*|\s*»$/g, ""),
      intro: texteBrut(ev.intro_lue || "Évangile de Jésus Christ"),
      texte: texteBrut(ev.contenu || ""),
    },
    homelie,
  };
}

// Couleur liturgique du jour seule (pour le post du soir)
export async function couleurDuJour(jour) {
  try { return (await lectures(jour)).informations?.couleur || "vert"; } catch { return "vert"; }
}
