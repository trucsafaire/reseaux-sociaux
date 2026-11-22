// Petits outils partagés : dates à l'heure de Paris, texte, hasard reproductible.

export const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
export const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
export const MOIS_COURTS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

/** Date du jour (AAAA-MM-JJ) dans le fuseau donné. */
export function aujourdhui(fuseau = "Europe/Paris", maintenant = new Date()) {
  return new Intl.DateTimeFormat("fr-CA", { timeZone: fuseau, year: "numeric", month: "2-digit", day: "2-digit" }).format(maintenant);
}

const versDate = (iso) => new Date(iso + "T12:00:00Z");
export const ajouterJours = (iso, n) => { const d = versDate(iso); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
export const ecartJours = (a, b) => Math.round((versDate(b) - versDate(a)) / 864e5);
/** 1 = lundi … 7 = dimanche */
export const jourSemaine = (iso) => { const j = versDate(iso).getUTCDay(); return j === 0 ? 7 : j; };
export const nomJour = (iso) => JOURS[versDate(iso).getUTCDay()];
export const numJour = (iso) => versDate(iso).getUTCDate();
export const nomMois = (iso) => MOIS[versDate(iso).getUTCMonth()];
export const moisCourt = (iso) => MOIS_COURTS[versDate(iso).getUTCMonth()];

/** « samedi 28 novembre » */
export const dateLongue = (iso) => `${nomJour(iso)} ${numJour(iso) === 1 ? "1er" : numJour(iso)} ${nomMois(iso)}`;
/** « du 27 au 29 novembre » ou « du 30 novembre au 2 décembre » */
export function periode(debut, fin) {
  if (!fin || fin === debut) return dateLongue(debut);
  const memeMois = debut.slice(0, 7) === fin.slice(0, 7);
  return `du ${numJour(debut)}${memeMois ? "" : " " + nomMois(debut)} au ${numJour(fin)} ${nomMois(fin)}`;
}
/** « 14:30 » → « 14 h 30 », « 09:00 » → « 9 h » */
export function heure(h) {
  if (!h || !/^\d{1,2}:\d{2}/.test(h)) return "";
  const [H, M] = h.split(":");
  return `${+H} h${M === "00" ? "" : " " + M}`;
}

export const majuscule = (s) => (s ? s[0].toLocaleUpperCase("fr") + s.slice(1) : s);

/** Remet en casse normale les titres écrits tout en capitales. */
export function sansCapitales(t) {
  const lettres = t.replace(/[^A-Za-zÀ-ÿ]/g, "");
  if (lettres.length < 4) return t;
  const maj = lettres.replace(/[^A-ZÀ-Þ]/g, "").length;
  if (maj / lettres.length < 0.7) return t;
  return majuscule(t.toLocaleLowerCase("fr"));
}

export function nettoyer(texte = "") {
  return texte.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
}

/** Coupe proprement à la fin d'une phrase ou d'un mot. */
export function couper(texte, max) {
  const t = nettoyer(texte);
  if (t.length <= max) return t;
  const bout = t.slice(0, max);
  const finPhrase = Math.max(bout.lastIndexOf(". "), bout.lastIndexOf("! "), bout.lastIndexOf("? "));
  if (finPhrase > max * 0.55) return bout.slice(0, finPhrase + 1);
  return bout.slice(0, bout.lastIndexOf(" ")).replace(/[,;:\-–]+$/, "") + "…";
}

export const normaliser = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

/** Hasard reproductible : même graine → même tirage (utile pour relancer une journée). */
export function graine(chaine) {
  let h = 2166136261;
  for (const c of chaine) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 1e6) / 1e6; };
}
export const choisir = (liste, alea) => liste[Math.floor(alea() * liste.length)];

/** « Bourbon-l'Archambault » → « #BourbonLArchambault » */
export function hashtag(nom) {
  const mots = nom.normalize("NFC").replace(/[’']/g, " ").split(/[\s\-]+/).filter(Boolean);
  return "#" + mots.map((m) => majuscule(m.toLocaleLowerCase("fr"))).join("").replace(/[^\p{L}\p{N}]/gu, "");
}

/** « 2026-11-24 » + « 11:30 » à Paris → instant ISO (UTC), heure d'été comprise. */
export function instant(jour, hhmm, fuseau = "Europe/Paris") {
  const naif = new Date(`${jour}T${hhmm}:00Z`);
  const vu = new Date(naif.toLocaleString("en-US", { timeZone: fuseau }));
  const ecart = vu - new Date(naif.toLocaleString("en-US", { timeZone: "UTC" }));
  return new Date(naif - ecart).toISOString();
}
