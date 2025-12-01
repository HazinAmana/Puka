/* ===============================================
  DATA LOADER - Chargement des données JSON
  ===============================================

  Ce module charge et normalise les données depuis dancers.json.
  Compatible avec Live Server et GitHub Pages.

  EXPORTS :
  - loadDancersData() : Fonction principale de chargement
  - dancersData : Données chargées (tableau)
  - allDancers : Liste aplatie de tous les danseurs

  ⚠️ CRITIQUE : Ce module doit être chargé en premier.

  💡 MODIFIABLE : Paths, logique de fallback, gestion d'erreurs.
*/

// ===============================================
// VARIABLES GLOBALES
// ===============================================

let dancersData = []; // Données brutes du JSON
let allDancers = []; // Liste aplatie de tous les danseurs avec métadonnées
let defaultContent = null; // Contenu par défaut (NYC Dance Project)

// ===============================================
// CONFIGURATION
// ===============================================

const CONFIG = {
  // Chemins possibles pour le JSON (Live Server vs GitHub Pages)
  jsonPaths: [
    "assets/dancers.json",
    "./assets/dancers.json",
    "../assets/dancers.json",
  ],

  // Préfixe pour les images
  imagesBasePath: "images/",

  // Noms des vignettes de groupe (non cliquables)
  // groupThumbnails: ["ENSEMBLE", "WOMEN", "MEN"],
  groupThumbnails: ["WOMEN", "MEN", "ENSEMBLE"],

  // Image de fallback si une image n'existe pas
  fallbackImage:
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="250"%3E%3Crect fill="%23252525" width="200" height="250"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%239b8400" font-family="Arial" font-size="14"%3EImage non disponible%3C/text%3E%3C/svg%3E',
};

// ===============================================
// FONCTION PRINCIPALE - Chargement des données
// ===============================================

/**
 * Charge les données JSON depuis le fichier dancers.json
 * Compatible avec Live Server et GitHub Pages
 *
 * @returns {Promise<Array>} Tableau des danseurs traités
 */
async function loadDancersData() {
  console.log("📂 Chargement des données JSON...");

  // Essayer différents chemins pour le JSON
  for (const path of CONFIG.jsonPaths) {
    try {
      const response = await fetch(path);

      if (!response.ok) {
        console.warn(`⚠️ Échec du chargement depuis ${path}`);
        continue;
      }

      dancersData = await response.json();
      console.log(`✅ Données chargées depuis ${path}`, dancersData);

      // Normaliser et aplatir les données
      allDancers = normalizeDancersData(dancersData);
      console.log(`✅ ${allDancers.length} danseurs traités`, allDancers);

      return allDancers;
    } catch (error) {
      console.warn(`⚠️ Erreur lors du chargement depuis ${path}:`, error);
    }
  }

  // Si aucun chemin n'a fonctionné
  console.error("❌ Impossible de charger dancers.json depuis aucun chemin");
  throw new Error("Impossible de charger les données JSON");
}

// ===============================================
// NORMALISATION DES DONNÉES
// ===============================================

/**
 * Normalise et aplatit la structure JSON hiérarchique
 * Transforme Groupe → Dancers en une liste plate avec métadonnées
 *
 * @param {Array} data - Données JSON brutes
 * @returns {Array} Liste aplatie de danseurs avec métadonnées
 */
function normalizeDancersData(data) {
  const normalized = [];

  data.forEach((groupData) => {
    const groupName = groupData.Groupe; // "Default", "Women", "Men", "Ensemble"
    const dancers = groupData.Dancers || [];

    // Traiter tous les groupes, y compris "Default"
    dancers.forEach((dancer, index) => {
      // Déterminer si c'est une vignette de groupe (non cliquable)
      // Note: "Default" n'est pas dans CONFIG.groupThumbnails, donc il sera cliquable
      const isGroupThumbnail = CONFIG.groupThumbnails.includes(
        dancer.Nom.toUpperCase()
      );

      // Construire le chemin du dossier pour les images
      const dancerFolder = sanitizeFolderName(dancer.Nom);

      // Normaliser les chemins d'images
      // Pour Default, pas de sous-dossier spécifique si ce n'est celui du groupe
      const folder = groupName === "Default" ? "" : dancerFolder;

      const normalizedImages = normalizeImagePaths(
        dancer.Images,
        groupName,
        folder,
        isGroupThumbnail
      );

      // Nettoyer la description
      const description = Array.isArray(dancer.Description)
        ? dancer.Description.join("")
        : dancer.Description;

      // Créer l'objet danseur
      const dancerObj = {
        id: `${groupName}-${index}`,
        nom: dancer.Nom,
        groupe: groupName,
        description: description || "",
        images: normalizedImages,
        isGroupThumbnail: isGroupThumbnail,
        clickable: !isGroupThumbnail,
        thumbnailImage: normalizedImages[0] || CONFIG.fallbackImage,
      };

      // Ajouter à la liste normalisée
      normalized.push(dancerObj);

      // Si c'est le groupe Default, on le stocke aussi comme contenu par défaut
      if (groupName === "Default" && index === 0) {
        defaultContent = { ...dancerObj, clickable: false }; // Copie pour usage interne
        console.log("✅ Contenu par défaut extrait:", defaultContent.nom);
      }
    });
  });

  return normalized;
}

// ===============================================
// UTILITAIRES - Normalisation des chemins
// ===============================================

/**
 * Normalise les chemins d'images en ajoutant le préfixe complet
 *
 * @param {Array} images - Tableau de noms d'images
 * @param {String} groupe - Nom du groupe ( Default, Women, Men,Ensemble)
 * @param {String} folder - Nom du dossier du danseur
 * @param {Boolean} isGroup - Si c'est une vignette de groupe
 * @returns {Array} Chemins complets des images
 */
function normalizeImagePaths(images, groupe, folder, isGroup) {
  if (!Array.isArray(images) || images.length === 0) {
    return [CONFIG.fallbackImage];
  }

  return images.map((imageName) => {
    // Si l'image commence déjà par "images/" ou "data:", la retourner telle quelle
    if (imageName.startsWith("images/") || imageName.startsWith("data:")) {
      return imageName;
    }

    // Construction du chemin
    if (groupe === "Default") {
      return `${CONFIG.imagesBasePath}${groupe}/${imageName}`;
    }

    if (isGroup) {
      return `${CONFIG.imagesBasePath}${groupe}/${imageName}`;
    } else {
      return `${CONFIG.imagesBasePath}${groupe}/${folder}/${imageName}`;
    }
  });
}

/**
 * Nettoie un nom de danseur pour créer un nom de dossier valide
 * Ex: "Alvin Ailey dancers" → "AlvinAileyDancers"
 *
 * @param {String} name - Nom du danseur
 * @returns {String} Nom de dossier nettoyé
 */
function sanitizeFolderName(name) {
  // Nettoyer le nom : Supprimer les espaces, garder les tirets, mettre en PascalCase
  return name
    .split(" ")
    .filter((word) => word.length > 0)
    .map((word) => {
      // Garder les tirets internes
      if (word.includes("-")) {
        return word
          .split("-")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join("-");
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join("");
}

// ===============================================
// GESTION D'ERREUR D'IMAGE
// ===============================================

/**
 * Vérifie si une image existe et retourne un fallback si nécessaire
 *
 * @param {String} imagePath - Chemin de l'image
 * @returns {Promise<String>} Chemin de l'image ou fallback
 */
async function checkImageExists(imagePath) {
  // Si c'est déjà le fallback ou un data URI, le retourner
  if (imagePath === CONFIG.fallbackImage || imagePath.startsWith("data:")) {
    return imagePath;
  }

  try {
    const response = await fetch(imagePath, { method: "HEAD" });
    if (response.ok) {
      return imagePath;
    }
  } catch (error) {
    console.warn(`⚠️ Image non trouvée: ${imagePath}`);
  }

  return CONFIG.fallbackImage;
}

// ===============================================
// EXPORTS POUR AUTRES MODULES
// ===============================================

// Exposer les données globalement pour les autres scripts
window.DANCERS_DATA = {
  loadDancersData,
  get allDancers() {
    return allDancers;
  },
  get rawData() {
    return dancersData;
  },
  get defaultContent() {
    return defaultContent;
  },
  checkImageExists,
  CONFIG,
};

// ===============================================
// CHARGEMENT AUTOMATIQUE AU DÉMARRAGE
// ===============================================

// Charger automatiquement les données au chargement de la page
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 Initialisation du Data Loader...");
  // Note: Le chargement sera déclenché par dancers.js
});
