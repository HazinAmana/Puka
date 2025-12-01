/* ===============================================
  CAROUSEL THUMBNAILS - Premier carrousel (vignettes)
  ===============================================

  Gère le carrousel de vignettes avec:
  - Layout Grid (Colonnes par groupe)
  - Scroll horizontal
  - Pagination basée sur le viewport
  - Gestion spéciale du groupe "Default" (Placeholder + Image)

  DÉPENDANCES :
  - data-loader.js (doit être chargé avant)

  EXPORTS :
  - initThumbnailCarousel() : Initialisation
  - renderThumbnails() : Rendu des vignettes
*/

// ===============================================
// ÉLÉMENTS DOM
// ===============================================

let carouselContainer, carouselGrid, pageIndicator;
let thumbnailCarousel;

// ===============================================
// VARIABLES D'ÉTAT
// ===============================================

let currentPage = 1;
let totalPages = 1;

// ===============================================
// INITIALISATION
// ===============================================

/**
 * Initialise le carrousel de vignettes
 * Crée les éléments DOM et configure les event listeners
 */
function initThumbnailCarousel() {
  console.log("🎨 Initialisation du carrousel de vignettes...");

  // Récupérer les éléments DOM
  thumbnailCarousel = document.getElementById("thumbnailCarousel");
  console.log("  - thumbnailCarousel:", thumbnailCarousel);

  carouselContainer = document.getElementById("carouselContainer");
  console.log("  - carouselContainer:", carouselContainer);

  carouselGrid = document.getElementById("carouselGrid");
  console.log("  - carouselGrid:", carouselGrid);

  // thumbNavPrev = document.getElementById("thumbNavPrev");
  // console.log("  - thumbNavPrev:", thumbNavPrev);

  // thumbNavNext = document.getElementById("thumbNavNext");
  // console.log("  - thumbNavNext:", thumbNavNext);

  pageIndicator = document.getElementById("pageIndicator");
  console.log("  - pageIndicator:", pageIndicator);

  if (!carouselGrid) {
    console.error("❌ Élément #carouselGrid non trouvé");
    return;
  }

  // Event listeners pour la navigation
  // console.log("  - Appel de setupNavigationListeners()...");
  // setupNavigationListeners();

  // Event listeners pour le scroll (mise à jour pagination)
  console.log("  - Appel de setupScrollListener()...");
  setupScrollListener();

  // Event listener pour le resize (recalcul pagination)
  window.addEventListener("resize", () => {
    updatePaginationCalculations();
  });

  console.log("✅ Carrousel de vignettes initialisé");
}

// ===============================================
// RENDU DES VIGNETTES EN GROUPES (GRID)
// ===============================================

/**
 * Génère et affiche toutes les vignettes depuis les données
 * Organise par groupes (Default | ENSEMBLE | WOMEN | MEN) en colonnes
 *
 * @param {Array} dancers - Tableau de danseurs depuis data-loader
 */
function renderThumbnails(dancers) {
  console.log(`🎨 Rendu de ${dancers.length} vignettes en grille...`);

  if (!carouselGrid) {
    console.error(
      "❌ Impossible de rendre les vignettes : #carouselGrid non initialisé"
    );
    carouselGrid = document.getElementById("carouselGrid");
    if (!carouselGrid) return;
  }

  if (!dancers || dancers.length === 0) {
    console.warn("⚠️ Aucune donnée de danseur à afficher");
    return;
  }

  try {
    // Vider la grille existante
    carouselGrid.innerHTML = "";

    // Grouper les danseurs par groupe
    const groupedDancers = {
      Default: [],
      Women: [],
      Men: [],
      Ensemble: [],
    };

    dancers.forEach((dancer) => {
      const groupName = dancer.groupe;
      if (groupedDancers[groupName]) {
        groupedDancers[groupName].push(dancer);
      }
    });

    const groupNames = Object.keys(groupedDancers).filter(
      (key) => groupedDancers[key].length > 0
    );

    // Pour chaque groupe, créer une colonne
    groupNames.forEach((groupName) => {
      const dancersInGroup = groupedDancers[groupName];

      // Créer la colonne du groupe
      const groupColumn = document.createElement("div");
      groupColumn.className = "thumbnail-group-column";
      groupColumn.dataset.group = groupName;

      // GESTION SPÉCIALE: Groupe "Default"
      if (groupName === "Default") {
        // Row 1: Placeholder "Accueil"
        const placeholderItem = document.createElement("div");
        placeholderItem.className = "thumbnail-item placeholder-item";
        placeholderItem.innerHTML = `
          <div class="placeholder-content">
            <span class="placeholder-text">Accueil</span>
          </div>
        `;
        placeholderItem.style.cursor = "pointer";
        placeholderItem.style.display = "flex";
        placeholderItem.style.alignItems = "center";
        placeholderItem.style.justifyContent = "center";
        placeholderItem.style.backgroundColor = "transparent";
        // Ajout du comportement : clic = même effet que la vignette du dessous
        if (dancersInGroup.length > 0) {
          placeholderItem.addEventListener("click", () =>
            handleThumbnailClick(dancersInGroup[0])
          );
        }

        groupColumn.appendChild(placeholderItem);

        // Row 2: L'image réelle (cliquable)
        if (dancersInGroup.length > 0) {
          const thumbnail = createThumbnailElement(dancersInGroup[0], 0);
          groupColumn.appendChild(thumbnail);
        }
      }
      // GESTION NORMALE: Autres groupes
      else {
        dancersInGroup.forEach((dancer, index) => {
          const thumbnail = createThumbnailElement(dancer, index);
          groupColumn.appendChild(thumbnail);
        });
      }

      // Ajouter la colonne à la grille
      carouselGrid.appendChild(groupColumn);
    });

    // Calculer la pagination initiale
    setTimeout(() => {
      updatePaginationCalculations();
    }, 100);

    console.log(`✅ Grille générée avec ${groupNames.length} groupes`);
  } catch (error) {
    console.error("❌ Erreur lors du rendu des vignettes:", error);
  }
}

// ===============================================
// CRÉATION D'UNE VIGNETTE
// ===============================================

/**
 * Crée un élément DOM pour une vignette
 *
 * @param {Object} dancer - Données du danseur
 * @param {Number} index - Index dans le tableau
 * @returns {HTMLElement} Élément div.thumbnail-item
 */
function createThumbnailElement(dancer, index) {
  const item = document.createElement("div");
  item.className = "thumbnail-item";
  item.dataset.dancerId = dancer.id;
  item.dataset.clickable = dancer.clickable;
  item.dataset.index = index;

  const img = document.createElement("img");
  img.src = dancer.thumbnailImage;
  img.alt = dancer.nom;
  img.loading = "lazy";

  img.onerror = () => {
    img.src = window.DANCERS_DATA.CONFIG.fallbackImage;
  };

  const overlay = document.createElement("div");
  overlay.className = "thumbnail-overlay";
  overlay.textContent = dancer.nom;

  item.appendChild(img);
  item.appendChild(overlay);

  if (dancer.clickable) {
    item.style.cursor = "pointer";
    item.addEventListener("click", () => handleThumbnailClick(dancer));
  } else {
    item.style.cursor = "default";
    item.style.opacity = "0.9";
  }

  return item;
}

// ===============================================
// SCROLL & PAGINATION
// ===============================================

/**
 * Configure l'écouteur de scroll pour mettre à jour la pagination
 */
function setupScrollListener() {
  if (!carouselContainer) return;

  carouselContainer.addEventListener("scroll", () => {
    requestAnimationFrame(updateCurrentPage);
  });
}

/**
 * Recalcule le nombre total de pages en fonction de la largeur visible
 */
function updatePaginationCalculations() {
  if (!carouselContainer) {
    carouselContainer = document.getElementById("carouselContainer");
  }

  if (!carouselContainer || !carouselGrid) return;

  const containerWidth = carouselContainer.clientWidth;
  const totalScrollWidth = carouselContainer.scrollWidth;

  if (totalScrollWidth <= containerWidth || containerWidth === 0) {
    totalPages = 1;
  } else {
    totalPages = Math.ceil(totalScrollWidth / containerWidth);
  }

  updateCurrentPage();
}

/**
 * Met à jour la page courante basée sur la position de scroll
 */
function updateCurrentPage() {
  const {scrollLeft} = carouselContainer;
  const containerWidth = carouselContainer.clientWidth;

  const pageIndex = Math.round(scrollLeft / containerWidth);
  currentPage = pageIndex + 1;

  currentPage = Math.max(1, Math.min(currentPage, totalPages));

  updatePageIndicator();
  updateNavigationState();
}

/**
 * Met à jour l'affichage de l'indicateur de page (X/Y)
 */
function updatePageIndicator() {
  if (pageIndicator) {
    pageIndicator.textContent = `${currentPage}/${totalPages}`;
  }
}

// ===============================================
// NAVIGATION (FLÈCHES)
// ===============================================

/**
 * Configure les event listeners pour la navigation
 */
// function setupNavigationListeners() {
//   try {
//     console.log("  📍 Début setupNavigationListeners");
//     console.log("  📍 thumbNavPrev:", thumbNavPrev);
//     console.log("  📍 thumbNavNext:", thumbNavNext);

//     if (!thumbNavPrev) {
//       console.error("❌ thumbNavPrev est null");
//       return;
//     }

//     if (!thumbNavNext) {
//       console.error("❌ thumbNavNext est null");
//       return;
//     }

//     console.log("  📍 Ajout des event listeners...");

//     // Navigation précédente
//     thumbNavPrev.addEventListener("click", (e) => {
//       e.preventDefault();
//       e.stopPropagation();
//       console.log("🔙 Clic navigation précédente");
//       scrollByPage(-1);
//     });
//     console.log("  📍 Listener ajouté sur thumbNavPrev");

//     // Navigation suivante
//     thumbNavNext.addEventListener("click", (e) => {
//       e.preventDefault();
//       e.stopPropagation();
//       console.log("▶️ Clic navigation suivante");
//       scrollByPage(1);
//     });
//     console.log("  📍 Listener ajouté sur thumbNavNext");

//     console.log("✅ Navigation listeners configurés");
//   } catch (error) {
//     console.error("❌ Erreur dans setupNavigationListeners:", error);
//     console.error("Stack:", error.stack);
//   }
// }

/**
 * Scrolle d'une page dans la direction donnée
//  * @param {Number} direction - -1 (gauche) ou 1 (droite)
//  */
// function scrollByPage(direction) {
//   if (!carouselContainer) {
//     console.error("❌ carouselContainer est null");
//     return;
//   }

//   const containerWidth = carouselContainer.clientWidth;
//   const scrollAmount = direction * containerWidth;

//   console.log("📏 Container width:", containerWidth);
//   console.log("📏 Current scrollLeft:", carouselContainer.scrollLeft);
//   console.log("📏 Scroll amount:", scrollAmount);
//   console.log("📏 ScrollWidth:", carouselContainer.scrollWidth);

//   carouselContainer.scrollBy({
//     left: scrollAmount,
//     behavior: "smooth",
//   });

//   setTimeout(() => {
//     console.log("📏 New scrollLeft:", carouselContainer.scrollLeft);
//   }, 500);
// }

/**
 * Met à jour l'état des boutons de navigation
 */
// function updateNavigationState() {
//   if (carouselContainer.scrollLeft <= 10) {
//     thumbNavPrev.classList.add("disabled");
//     thumbNavPrev.style.opacity = "0.3";
//   } else {
//     thumbNavPrev.classList.remove("disabled");
//     thumbNavPrev.style.opacity = "";
//   }

//   if (
//     carouselContainer.scrollLeft + carouselContainer.clientWidth >=
//     carouselContainer.scrollWidth - 10
//   ) {
//     thumbNavNext.classList.add("disabled");
//     thumbNavNext.style.opacity = "0.3";
//   } else {
//     thumbNavNext.classList.remove("disabled");
//     thumbNavNext.style.opacity = "";
//   }
// }

// ===============================================
// GESTION DU CLIC SUR VIGNETTE
// ===============================================

/**
 * Gère le clic sur une vignette
 * Déclenche l'affichage dans le grand carrousel
 *
 * @param {Object} dancer - Données du danseur cliqué
 */
function handleThumbnailClick(dancer) {
  console.log(`👆 Clic sur vignette: ${dancer.nom}`);

  markActiveThumbnail(dancer.id);

  const event = new CustomEvent("dancerSelected", {
    detail: dancer,
  });
  document.dispatchEvent(event);

  const textEvent = new CustomEvent("updateText", {
    detail: {
      nom: dancer.nom,
      description: dancer.description,
    },
  });
  document.dispatchEvent(textEvent);
}

/**
 * Marque visuellement la vignette active
 *
 * @param {String} dancerId - ID du danseur actif
 */
function markActiveThumbnail(dancerId) {
  document.querySelectorAll(".thumbnail-item.active").forEach((item) => {
    item.classList.remove("active");
  });

  const activeThumbnail = document.querySelector(
    `[data-dancer-id="${dancerId}"]`
  );
  if (activeThumbnail) {
    activeThumbnail.classList.add("active");
  }
}

// ===============================================
// EXPORTS
// ===============================================

window.THUMBNAIL_CAROUSEL = {
  init: initThumbnailCarousel,
  render: renderThumbnails,
  get currentPage() {
    return currentPage;
  },
  get totalPages() {
    return totalPages;
  },
};
