// Tous les départements : nom, tournure (« dans la Nièvre », « en Saône-et-Loire ») et villes pour les hashtags.
// Sert à créer une nouvelle page en une commande : node social/src/lancer.mjs ajouter-page 58
import { hashtag } from "./outils.mjs";

// code: [nom, tournure, villes principales]
export const DEPARTEMENTS = {
  "01": ["Ain", "dans l’Ain", ["Bourg-en-Bresse", "Oyonnax"]],
  "02": ["Aisne", "dans l’Aisne", ["Laon", "Saint-Quentin", "Soissons"]],
  "03": ["Allier", "dans l’Allier", ["Moulins", "Vichy", "Montluçon"]],
  "04": ["Alpes-de-Haute-Provence", "dans les Alpes-de-Haute-Provence", ["Digne-les-Bains", "Manosque"]],
  "05": ["Hautes-Alpes", "dans les Hautes-Alpes", ["Gap", "Briançon"]],
  "06": ["Alpes-Maritimes", "dans les Alpes-Maritimes", ["Nice", "Cannes", "Antibes"]],
  "07": ["Ardèche", "en Ardèche", ["Privas", "Aubenas", "Annonay"]],
  "08": ["Ardennes", "dans les Ardennes", ["Charleville-Mézières", "Sedan"]],
  "09": ["Ariège", "en Ariège", ["Foix", "Pamiers"]],
  "10": ["Aube", "dans l’Aube", ["Troyes"]],
  "11": ["Aude", "dans l’Aude", ["Carcassonne", "Narbonne"]],
  "12": ["Aveyron", "en Aveyron", ["Rodez", "Millau"]],
  "13": ["Bouches-du-Rhône", "dans les Bouches-du-Rhône", ["Marseille", "Aix-en-Provence", "Arles"]],
  "14": ["Calvados", "dans le Calvados", ["Caen", "Bayeux", "Lisieux"]],
  "15": ["Cantal", "dans le Cantal", ["Aurillac", "Saint-Flour"]],
  "16": ["Charente", "en Charente", ["Angoulême", "Cognac"]],
  "17": ["Charente-Maritime", "en Charente-Maritime", ["La Rochelle", "Saintes", "Rochefort"]],
  "18": ["Cher", "dans le Cher", ["Bourges", "Vierzon"]],
  "19": ["Corrèze", "en Corrèze", ["Tulle", "Brive-la-Gaillarde"]],
  "21": ["Côte-d’Or", "en Côte-d’Or", ["Dijon", "Beaune"]],
  "22": ["Côtes-d’Armor", "dans les Côtes-d’Armor", ["Saint-Brieuc", "Lannion", "Dinan"]],
  "23": ["Creuse", "dans la Creuse", ["Guéret", "Aubusson"]],
  "24": ["Dordogne", "en Dordogne", ["Périgueux", "Bergerac", "Sarlat"]],
  "25": ["Doubs", "dans le Doubs", ["Besançon", "Montbéliard", "Pontarlier"]],
  "26": ["Drôme", "dans la Drôme", ["Valence", "Montélimar", "Romans-sur-Isère"]],
  "27": ["Eure", "dans l’Eure", ["Évreux", "Vernon"]],
  "28": ["Eure-et-Loir", "en Eure-et-Loir", ["Chartres", "Dreux"]],
  "29": ["Finistère", "dans le Finistère", ["Brest", "Quimper", "Morlaix"]],
  "2A": ["Corse-du-Sud", "en Corse-du-Sud", ["Ajaccio", "Porto-Vecchio"]],
  "2B": ["Haute-Corse", "en Haute-Corse", ["Bastia", "Corte", "Calvi"]],
  "30": ["Gard", "dans le Gard", ["Nîmes", "Alès", "Uzès"]],
  "31": ["Haute-Garonne", "en Haute-Garonne", ["Toulouse", "Saint-Gaudens"]],
  "32": ["Gers", "dans le Gers", ["Auch", "Condom"]],
  "33": ["Gironde", "en Gironde", ["Bordeaux", "Arcachon", "Libourne"]],
  "34": ["Hérault", "dans l’Hérault", ["Montpellier", "Béziers", "Sète"]],
  "35": ["Ille-et-Vilaine", "en Ille-et-Vilaine", ["Rennes", "Saint-Malo", "Fougères"]],
  "36": ["Indre", "dans l’Indre", ["Châteauroux", "Issoudun"]],
  "37": ["Indre-et-Loire", "en Indre-et-Loire", ["Tours", "Amboise", "Chinon"]],
  "38": ["Isère", "en Isère", ["Grenoble", "Vienne", "Bourgoin-Jallieu"]],
  "39": ["Jura", "dans le Jura", ["Lons-le-Saunier", "Dole", "Saint-Claude"]],
  "40": ["Landes", "dans les Landes", ["Mont-de-Marsan", "Dax"]],
  "41": ["Loir-et-Cher", "en Loir-et-Cher", ["Blois", "Vendôme", "Romorantin"]],
  "42": ["Loire", "dans la Loire", ["Saint-Étienne", "Roanne", "Montbrison"]],
  "43": ["Haute-Loire", "en Haute-Loire", ["Le Puy-en-Velay", "Yssingeaux"]],
  "44": ["Loire-Atlantique", "en Loire-Atlantique", ["Nantes", "Saint-Nazaire", "La Baule"]],
  "45": ["Loiret", "dans le Loiret", ["Orléans", "Montargis"]],
  "46": ["Lot", "dans le Lot", ["Cahors", "Figeac"]],
  "47": ["Lot-et-Garonne", "en Lot-et-Garonne", ["Agen", "Villeneuve-sur-Lot", "Marmande"]],
  "48": ["Lozère", "en Lozère", ["Mende"]],
  "49": ["Maine-et-Loire", "en Maine-et-Loire", ["Angers", "Cholet", "Saumur"]],
  "50": ["Manche", "dans la Manche", ["Saint-Lô", "Cherbourg", "Granville"]],
  "51": ["Marne", "dans la Marne", ["Reims", "Châlons-en-Champagne", "Épernay"]],
  "52": ["Haute-Marne", "en Haute-Marne", ["Chaumont", "Langres", "Saint-Dizier"]],
  "53": ["Mayenne", "en Mayenne", ["Laval", "Mayenne", "Château-Gontier"]],
  "54": ["Meurthe-et-Moselle", "en Meurthe-et-Moselle", ["Nancy", "Lunéville"]],
  "55": ["Meuse", "dans la Meuse", ["Bar-le-Duc", "Verdun"]],
  "56": ["Morbihan", "dans le Morbihan", ["Vannes", "Lorient", "Pontivy"]],
  "57": ["Moselle", "en Moselle", ["Metz", "Thionville", "Sarreguemines"]],
  "58": ["Nièvre", "dans la Nièvre", ["Nevers", "Decize", "Cosne-Cours-sur-Loire"]],
  "59": ["Nord", "dans le Nord", ["Lille", "Dunkerque", "Valenciennes"]],
  "60": ["Oise", "dans l’Oise", ["Beauvais", "Compiègne", "Senlis"]],
  "61": ["Orne", "dans l’Orne", ["Alençon", "Flers", "Argentan"]],
  "62": ["Pas-de-Calais", "dans le Pas-de-Calais", ["Arras", "Calais", "Boulogne-sur-Mer"]],
  "63": ["Puy-de-Dôme", "dans le Puy-de-Dôme", ["Clermont-Ferrand", "Riom", "Issoire"]],
  "64": ["Pyrénées-Atlantiques", "dans les Pyrénées-Atlantiques", ["Pau", "Bayonne", "Biarritz"]],
  "65": ["Hautes-Pyrénées", "dans les Hautes-Pyrénées", ["Tarbes", "Lourdes"]],
  "66": ["Pyrénées-Orientales", "dans les Pyrénées-Orientales", ["Perpignan", "Collioure"]],
  "67": ["Bas-Rhin", "dans le Bas-Rhin", ["Strasbourg", "Haguenau", "Sélestat"]],
  "68": ["Haut-Rhin", "dans le Haut-Rhin", ["Colmar", "Mulhouse"]],
  "69": ["Rhône", "dans le Rhône", ["Lyon", "Villefranche-sur-Saône"]],
  "70": ["Haute-Saône", "en Haute-Saône", ["Vesoul", "Lure", "Gray"]],
  "71": ["Saône-et-Loire", "en Saône-et-Loire", ["Mâcon", "Chalon-sur-Saône", "Paray-le-Monial", "Digoin"]],
  "72": ["Sarthe", "dans la Sarthe", ["Le Mans", "La Flèche"]],
  "73": ["Savoie", "en Savoie", ["Chambéry", "Aix-les-Bains", "Albertville"]],
  "74": ["Haute-Savoie", "en Haute-Savoie", ["Annecy", "Annemasse", "Chamonix"]],
  "75": ["Paris", "à Paris", ["Paris"]],
  "76": ["Seine-Maritime", "en Seine-Maritime", ["Rouen", "Le Havre", "Dieppe"]],
  "77": ["Seine-et-Marne", "en Seine-et-Marne", ["Melun", "Meaux", "Fontainebleau"]],
  "78": ["Yvelines", "dans les Yvelines", ["Versailles", "Saint-Germain-en-Laye"]],
  "79": ["Deux-Sèvres", "dans les Deux-Sèvres", ["Niort", "Bressuire", "Parthenay"]],
  "80": ["Somme", "dans la Somme", ["Amiens", "Abbeville"]],
  "81": ["Tarn", "dans le Tarn", ["Albi", "Castres"]],
  "82": ["Tarn-et-Garonne", "dans le Tarn-et-Garonne", ["Montauban", "Moissac"]],
  "83": ["Var", "dans le Var", ["Toulon", "Fréjus", "Hyères"]],
  "84": ["Vaucluse", "dans le Vaucluse", ["Avignon", "Carpentras", "Orange"]],
  "85": ["Vendée", "en Vendée", ["La Roche-sur-Yon", "Les Sables-d’Olonne"]],
  "86": ["Vienne", "dans la Vienne", ["Poitiers", "Châtellerault"]],
  "87": ["Haute-Vienne", "en Haute-Vienne", ["Limoges"]],
  "88": ["Vosges", "dans les Vosges", ["Épinal", "Saint-Dié-des-Vosges", "Gérardmer"]],
  "89": ["Yonne", "dans l’Yonne", ["Auxerre", "Sens"]],
  "90": ["Territoire de Belfort", "dans le Territoire de Belfort", ["Belfort"]],
  "91": ["Essonne", "dans l’Essonne", ["Évry", "Étampes"]],
  "92": ["Hauts-de-Seine", "dans les Hauts-de-Seine", ["Nanterre", "Boulogne-Billancourt"]],
  "93": ["Seine-Saint-Denis", "en Seine-Saint-Denis", ["Saint-Denis", "Montreuil", "Bobigny"]],
  "94": ["Val-de-Marne", "dans le Val-de-Marne", ["Créteil", "Vincennes"]],
  "95": ["Val-d’Oise", "dans le Val-d’Oise", ["Cergy", "Pontoise", "Argenteuil"]],
  "971": ["Guadeloupe", "en Guadeloupe", ["Pointe-à-Pitre", "Basse-Terre"]],
  "972": ["Martinique", "en Martinique", ["Fort-de-France"]],
  "973": ["Guyane", "en Guyane", ["Cayenne", "Kourou"]],
  "974": ["La Réunion", "à La Réunion", ["Saint-Denis", "Saint-Pierre"]],
};

const slug = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[’']/g, "-").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Entrée de config.json pour une nouvelle page départementale (inactive tant que page_id est vide). */
export function nouvellePage(code) {
  const d = DEPARTEMENTS[code];
  if (!d) throw new Error(`Département inconnu : ${code}`);
  const [nom, dans, villes] = d;
  return {
    id: code === "75" ? "paris" : slug(nom),
    actif: false,
    departement: code,
    nom: dans.replace(/^(dans|en|à) /, ""),   // « la Nièvre », « Saône-et-Loire »
    dans,                                     // « dans la Nièvre », « en Saône-et-Loire »
    heure: "11:30",
    hashtags: [...new Set([hashtag(nom), hashtag("Sorties " + nom), ...villes.slice(0, 3).map(hashtag)])],
    meta: { page_id: "", ig_user_id: "" },
    instagram: `trucsafaire${code.toLowerCase()}`,
  };
}

/** Bio Instagram (150 caractères max) et description Facebook. */
export function textesProfil(code) {
  const [nom, dans] = DEPARTEMENTS[code];
  const ig = `Que faire ${dans} ? 🎪 Brocantes, fêtes, concerts, sorties en famille… Chaque jour, les meilleures idées près de chez vous 👇`;
  const fb = `Que faire ${dans} ? Chaque jour, une sélection de sorties près de chez vous : brocantes, fêtes, concerts, spectacles, randos et sorties en famille. Toutes les infos, horaires et itinéraires sur trucsafaire.fr et dans l’appli gratuite Trucs à faire.`;
  return { nom: `Trucs à faire ${nom}`, ig: ig.length <= 150 ? ig : `Que faire ${dans} ? Brocantes, fêtes, concerts, sorties en famille, chaque jour 👇`, fb };
}
