// Contenus fixes de Salve : mystères du Rosaire, intentions, rythme de la semaine.
// Rien d'inventé côté Écriture : on ne cite que des références ; les méditations sont de courtes
// paraphrases fidèles aux récits évangéliques et au Catéchisme de l'Église catholique.

export const MYSTERES = {
  joyeux: {
    nom: "Mystères joyeux",
    liste: [
      { titre: "L'Annonciation", ref: "Lc 1, 26-38", fruit: "l'humilité", med: "L'ange Gabriel annonce à Marie qu'elle sera la mère du Fils de Dieu. Elle répond oui, dans la confiance : « Que tout m'advienne selon ta parole. »" },
      { titre: "La Visitation", ref: "Lc 1, 39-56", fruit: "la charité envers le prochain", med: "Marie part en hâte rendre visite à sa cousine Élisabeth. Elle porte Jésus et le donne déjà à ceux qu'elle rencontre." },
      { titre: "La Nativité", ref: "Lc 2, 1-20", fruit: "l'esprit de pauvreté", med: "Le Fils de Dieu naît à Bethléem, dans la pauvreté d'une crèche. Les bergers, les plus petits, sont les premiers à venir l'adorer." },
      { titre: "La Présentation au Temple", ref: "Lc 2, 22-40", fruit: "l'obéissance", med: "Marie et Joseph présentent Jésus au Seigneur. Le vieillard Syméon reconnaît en lui la lumière qui se révèle aux nations." },
      { titre: "Le Recouvrement de Jésus au Temple", ref: "Lc 2, 41-52", fruit: "la recherche de Dieu en toute chose", med: "Après trois jours d'angoisse, Marie et Joseph retrouvent Jésus au Temple. Il doit être chez son Père." },
    ],
  },
  lumineux: {
    nom: "Mystères lumineux",
    liste: [
      { titre: "Le Baptême du Christ", ref: "Mt 3, 13-17", fruit: "la fidélité à notre baptême", med: "Jésus est baptisé dans le Jourdain. L'Esprit descend sur lui et la voix du Père le désigne : voici mon Fils bien-aimé." },
      { titre: "Les Noces de Cana", ref: "Jn 2, 1-12", fruit: "la confiance en Marie", med: "À Cana, Marie remarque qu'il n'y a plus de vin et dit aux serviteurs : « Tout ce qu'il vous dira, faites-le. » Jésus accomplit son premier signe." },
      { titre: "L'Annonce du Royaume", ref: "Mc 1, 14-15", fruit: "la conversion du cœur", med: "Jésus proclame que le Règne de Dieu est tout proche et appelle chacun à se convertir et à croire à l'Évangile." },
      { titre: "La Transfiguration", ref: "Lc 9, 28-36", fruit: "le désir de la sainteté", med: "Sur la montagne, Jésus apparaît dans sa gloire devant Pierre, Jacques et Jean. Le Père dit : « Écoutez-le. »" },
      { titre: "L'Institution de l'Eucharistie", ref: "Mt 26, 26-29", fruit: "l'amour de l'Eucharistie", med: "Au soir de la Cène, Jésus prend le pain et la coupe : il se donne lui-même, pour toujours, à son Église." },
    ],
  },
  douloureux: {
    nom: "Mystères douloureux",
    liste: [
      { titre: "L'Agonie au jardin des Oliviers", ref: "Lc 22, 39-46", fruit: "l'abandon à la volonté de Dieu", med: "Dans l'angoisse, Jésus prie son Père : « Que soit faite non pas ma volonté, mais la tienne. » Il nous apprend à veiller et à prier." },
      { titre: "La Flagellation", ref: "Jn 19, 1", fruit: "la pureté du cœur et du corps", med: "Jésus est flagellé. Il porte nos blessures en silence, par amour pour chacun de nous." },
      { titre: "Le Couronnement d'épines", ref: "Mt 27, 27-31", fruit: "le courage et l'humilité", med: "Les soldats se moquent du Roi en le couronnant d'épines. Jésus accepte l'humiliation sans répondre." },
      { titre: "Le Portement de la Croix", ref: "Lc 23, 26-32", fruit: "la patience dans les épreuves", med: "Jésus porte sa croix jusqu'au Calvaire. Simon de Cyrène l'aide : nous aussi, nous pouvons aider ceux qui souffrent." },
      { titre: "La Crucifixion et la mort de Jésus", ref: "Lc 23, 33-46", fruit: "le don de soi", med: "Sur la croix, Jésus pardonne et remet son esprit entre les mains du Père. Il donne sa vie pour le salut du monde." },
    ],
  },
  glorieux: {
    nom: "Mystères glorieux",
    liste: [
      { titre: "La Résurrection", ref: "Mt 28, 1-10", fruit: "la foi", med: "Au matin de Pâques, le tombeau est vide : le Christ est vivant. Les femmes courent annoncer la nouvelle aux disciples." },
      { titre: "L'Ascension", ref: "Ac 1, 6-11", fruit: "l'espérance et le désir du Ciel", med: "Jésus monte vers le Père et envoie ses disciples jusqu'aux extrémités de la terre. Il nous précède dans la maison du Père." },
      { titre: "La Pentecôte", ref: "Ac 2, 1-11", fruit: "la docilité à l'Esprit Saint", med: "L'Esprit Saint descend sur les Apôtres réunis avec Marie. Remplis de sa force, ils annoncent les merveilles de Dieu." },
      { titre: "L'Assomption de Marie", ref: "CEC 966", fruit: "la grâce d'une sainte mort", med: "Au terme de sa vie terrestre, la Vierge Marie est élevée corps et âme dans la gloire du Ciel." },
      { titre: "Le Couronnement de Marie", ref: "Ap 12, 1", fruit: "la persévérance", med: "Marie est couronnée Reine du Ciel et de la terre. Elle intercède pour nous, ses enfants." },
    ],
  },
};

// Répartition de la semaine (saint Jean-Paul II, Rosarium Virginis Mariae, 38) — 0 = dimanche
export const MYSTERES_SEMAINE = ["glorieux", "joyeux", "douloureux", "glorieux", "lumineux", "douloureux", "joyeux"];
export const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
export const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

export const INTENTIONS = [
  "nos familles", "les malades et ceux qui les soignent", "la paix dans le monde", "les défunts",
  "les jeunes", "les vocations", "les personnes seules", "l'Église et le pape",
  "ceux qui ne connaissent pas encore le Christ", "les couples et les fiancés", "les enfants",
  "ceux qui cherchent un travail", "les migrants et les réfugiés", "les chrétiens persécutés",
  "ceux qui doutent", "les personnes âgées", "nos amis", "les prêtres",
];

const jourDeLAn = (d) => Math.floor((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - Date.UTC(d.getUTCFullYear(), 0, 0)) / 864e5);

export function laDate(jour) {
  const d = new Date(jour + "T12:00:00Z");
  return { d, nomJour: JOURS[d.getUTCDay()], num: d.getUTCDate(), mois: MOIS[d.getUTCMonth()], annee: d.getUTCFullYear(), n: jourDeLAn(d) };
}

// Mystères du jour (story) et dizaine proposée (post) : on suit la semaine,
// et la dizaine avance chaque semaine (1re dizaine la 1re semaine, 2e la suivante…), toute l'année.
export function mysteresDuJour(jour) {
  const { d } = laDate(jour);
  const cle = MYSTERES_SEMAINE[d.getUTCDay()];
  return { cle, ...MYSTERES[cle] };
}
export function dizaineDuJour(jour) {
  const { d, n } = laDate(jour);
  const m = mysteresDuJour(jour);
  const semaine = Math.floor((n + 6) / 7);
  const rang = (semaine + d.getUTCDay()) % 5;
  return { ...m.liste[rang], rang: rang + 1, serie: m.nom, cle: m.cle, intention: INTENTIONS[n % INTENTIONS.length] };
}

// Incitation à installer l'appli : un jour sur trois
export const jourDePub = (jour) => laDate(jour).n % 3 === 0;
