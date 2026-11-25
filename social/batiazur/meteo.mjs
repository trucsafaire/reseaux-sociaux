// Météo piscine Bati Azur : prévisions du jour (Open-Meteo, sans clé) et conseil de filtration, toute l'année.
// Règles Bati Azur :
//  - hivernage actif (eau froide, de novembre à mars ou maximum < 12 °C) : filtration 2 h / jour, de 4 h à 6 h ;
//  - gel annoncé : marche forcée de la filtration ;
//  - en saison : durée selon la température (même calcul que la story météo publiée en juin 2026) ;
//  - alertes canicule et orage avec les gestes à faire.

export const VILLES = [
  { nom: "Moulins", lat: 46.566, lon: 3.333 },
  { nom: "Vichy", lat: 46.127, lon: 3.426 },
  { nom: "Nevers", lat: 46.990, lon: 3.159 },
  { nom: "Decize", lat: 46.828, lon: 3.461 },
];

// Codes météo WMO → texte
const CIEL = [
  [[0], "Ciel dégagé"], [[1], "Plutôt ensoleillé"], [[2], "Éclaircies"], [[3], "Couvert"],
  [[45, 48], "Brouillard"], [[51, 53, 55, 56, 57], "Bruine"], [[61, 63, 80, 81], "Pluie"], [[65, 82], "Fortes pluies"],
  [[66, 67], "Pluie verglaçante"], [[71, 73, 75, 77, 85, 86], "Neige"], [[95, 96, 99], "Orages"],
];
const ciel = (code) => (CIEL.find(([c]) => c.includes(code)) || [, "Variable"])[1];

export async function previsions(fetcher = fetch) {
  const q = new URLSearchParams({
    latitude: VILLES.map((v) => v.lat).join(","), longitude: VILLES.map((v) => v.lon).join(","),
    daily: "temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max",
    timezone: "Europe/Paris", forecast_days: "2",
  });
  const r = await fetcher(`https://api.open-meteo.com/v1/forecast?${q}`);
  if (!r.ok) throw new Error(`Open-Meteo : ${r.status}`);
  const d = await r.json();
  const liste = Array.isArray(d) ? d : [d];
  return VILLES.map((v, i) => {
    const j = liste[i].daily;
    return { nom: v.nom, max: Math.round(j.temperature_2m_max[0]), min: Math.round(j.temperature_2m_min[0]),
      minDemain: Math.round(j.temperature_2m_min[1]), code: j.weather_code[0], pluie: j.precipitation_probability_max[0] ?? 0 };
  });
}

const h2 = (n) => `${n} h`;

/** Conseil du jour à partir de la météo de Moulins. */
export function conseil(m, date = new Date()) {
  const mois = date.getMonth() + 1;
  const gel = m.min <= 0 || m.minDemain <= 0;
  const orage = [95, 96, 99].includes(m.code);
  const hiver = [11, 12, 1, 2, 3].includes(mois) || m.max < 12;
  if (hiver) {
    return {
      type: gel ? "gel" : "hivernage",
      titre: "HIVERNAGE ACTIF", valeur: "2 h / jour", detail: "de 4 h à 6 h du matin",
      alerte: gel ? `Gel annoncé ${m.min <= 0 ? "ce matin" : "cette nuit"} : passez la filtration en marche forcée.` : null,
    };
  }
  let h = Math.max(6, Math.min(14, (m.max - 3) / 2));
  if (m.max > 30) h *= 1.2;
  if (orage || m.code >= 61) h += 2;
  h = m.max >= 33 ? 24 : Math.round(Math.min(14, h));
  const debut = h >= 24 ? 0 : Math.max(6, 12 - Math.floor(h / 2)), fin = h >= 24 ? 24 : Math.min(22, debut + h);
  const c = { type: "saison", titre: "FILTRATION CONSEILLÉE", valeur: h >= 24 ? "24 h / 24" : `${h} h / jour`, detail: h >= 24 ? "en continu pendant la canicule" : `entre ${h2(debut)} et ${h2(fin)}`, alerte: null };
  if (m.max >= 33) { c.type = "canicule"; c.alerte = "Canicule : filtrez en continu, contrôlez pH et chlore chaque soir et complétez le niveau d'eau."; }
  else if (orage) { c.type = "orage"; c.alerte = "Orages annoncés : après l'orage, videz le panier du skimmer, contrôlez le pH et filtrez 24 h si l'eau se trouble."; }
  else if (gel) { c.type = "gel"; c.alerte = "Gel annoncé cette nuit : passez la filtration en marche forcée."; }
  return c;
}

/** Données de la story météo du jour. */
export async function meteoDuJour(date = new Date(), fetcher = fetch) {
  const villes = await previsions(fetcher);
  const moulins = villes[0];
  const c = conseil(moulins, date);
  return {
    ville: "Moulins", temp: moulins.max, min: moulins.min, max: moulins.max, ciel: ciel(moulins.code), code: moulins.code,
    villes: villes.map(({ nom, min, max }) => ({ nom, min, max })), conseil: c,
  };
}

export function legendeMeteo(m) {
  const base = `Météo piscine — Moulins et alentours · ${m.max}°C · ${m.ciel}.\n${m.conseil.titre === "HIVERNAGE ACTIF" ? "Hivernage actif" : "Filtration conseillée"} : ${m.conseil.valeur}, ${m.conseil.detail}.`;
  return (m.conseil.alerte ? `${base}\n\n${m.conseil.alerte}` : base) + `\n\nUne question ? Bati Azur, 04 70 34 21 96.\n#piscine #moulins #allier #batiazur`;
}
