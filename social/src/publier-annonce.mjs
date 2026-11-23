// Publie le carrousel d'annonce des pages départementales sur la page vitrine (Facebook + Instagram en collab).
//   node social/src/publier-annonce.mjs <dossier-images> <collab1,collab2>
// Les images doivent déjà être en ligne sous $URL_IMAGES.
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { publier } from "./publier.mjs";

const RACINE = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const config = JSON.parse(readFileSync(join(RACINE, "social", "config.json"), "utf8"));
const [dossier = "/tmp/annonce", collabs = ""] = process.argv.slice(2);
const images = readdirSync(dossier).filter((f) => f.endsWith(".png")).sort().map((f) => join(dossier, f));
const vitrine = config.pages.find((p) => p.type === "vitrine");
const court = (p) => p.nom.replace(/^(la |le |les |l’|l')/i, "");
const deps = config.pages.filter((p) => p.actif && p.departement && p.meta?.page_id);

const instagram = `Nouveau : Trucs à faire a maintenant sa page dans votre département 📍

Chaque jour, les sorties près de chez vous : brocantes, fêtes, concerts, spectacles, sorties en famille.

Déjà en ligne :
${deps.map((p) => `• ${court(p)}${p.instagram && collabs.split(",").includes(p.instagram) ? ` → @${p.instagram}` : " (Facebook, Instagram bientôt)"}`).join("\n")}

Abonnez-vous à celle de chez vous 👆 De nouveaux départements arrivent chaque semaine.

#trucsafaire #sorties #quefaire #agenda #sortiesenfamille`;

const facebook = `📍 Trucs à faire arrive dans votre département !

Chaque jour, une sélection de sorties près de chez vous : brocantes, fêtes, concerts, spectacles et sorties en famille. Abonnez-vous à la page de chez vous :

${deps.map((p) => `• Trucs à faire ${court(p)} : https://www.facebook.com/${p.meta.page_id}`).join("\n")}

De nouvelles pages arrivent chaque semaine, partout en France. En attendant, toutes les sorties sont sur https://trucsafaire.fr et dans l’appli gratuite.`;

console.log(instagram, "\n---\n", facebook);
if (process.env.ESSAI) process.exit(0);
const r = await publier({ images, legendes: { instagram, facebook } }, { reseaux: ["instagram", "facebook"], page: vitrine, collaborateurs: collabs.split(",").filter(Boolean) });
console.log(JSON.stringify(r));
