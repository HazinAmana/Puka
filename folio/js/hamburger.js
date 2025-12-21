/**
 * GESTIONNAIRE DU MENU HAMBURGER
 * JavaScript minimal pour une expérience optimale
 * Approche simple et fiable avec classes CSS
 */

// Récupération des éléments DOM
const hamburgerBtn = document.getElementById("hamburger-btn");
const mobileNav = document.getElementById("mobile-nav");
const navOverlay = document.getElementById("nav-overlay");
const mobileNavLinks = mobileNav.querySelectorAll("a");

// Variable pour suivre l'état du menu
let isMenuOpen = false;
// Référence pour le bloqueur de touch move (permet d'autoriser le scroll dans le menu tout en bloquant le scroll de la page)
let _touchMoveBlocker = null;

/**
 * Fonction pour ouvrir le menu
 */
function openMenu() {
  isMenuOpen = true;
  hamburgerBtn.setAttribute("aria-expanded", "true");
  hamburgerBtn.setAttribute("aria-label", "Fermer le menu de navigation");

  // Ajouter les classes pour ouvrir le menu
  mobileNav.classList.add("menu-open");
  navOverlay.classList.add("menu-open");

  // Empêcher le scroll du body quand le menu est ouvert
  document.body.style.overflow = "hidden";

  // Bloquer le touchmove global sauf si la cible est à l'intérieur du menu mobile
  // Cela permet le défilement natif du menu sur Android/Samsung tout en empêchant la page parent de défiler
  _touchMoveBlocker = function (e) {
    if (!mobileNav.contains(e.target)) {
      e.preventDefault();
    }
  };
  document.addEventListener("touchmove", _touchMoveBlocker, { passive: false });

  // --- MODIFICATION : GESTION DE L'ACTIF ET DU FOCUS ---

  // 1. Récupérer l'URL actuelle complète
  const currentUrl = window.location.href;
  let indexToFocus = 0; // Par défaut, on focus le 1er lien si aucune correspondance

  mobileNavLinks.forEach((link, index) => {
    // On retire la classe active de tous les liens par sécurité
    link.classList.remove("active");
    link.removeAttribute("aria-current");

    // On compare l'URL du lien (link.href est absolu) avec l'URL courante
    // MODIFICATION: Utilisation de pathname pour ignorer les hash et query params
    // et vérification que ce n'est pas un toggle de sous-menu
    const isDropdownToggle = link.nextElementSibling && link.nextElementSibling.classList.contains('submenu');

    // On nettoie les chemins pour la comparaison (enlever le slash de fin si présent)
    const currentPath = window.location.pathname.replace(/\/$/, "") || "/index.html";
    const linkPath = new URL(link.href).pathname.replace(/\/$/, "") || "/index.html";

    // Cas spécial pour la racine/index
    const isHome = (currentPath === "/index.html" || currentPath === "/") && (linkPath === "/index.html" || linkPath === "/");

    if (!isDropdownToggle && (linkPath === currentPath || isHome)) {
      link.classList.add("active");
      link.setAttribute("aria-current", "page"); // Bonnes pratiques d'accessibilité
      indexToFocus = index;
    }
  });

  // 2. Focus sur le lien correspondant à la page active (ou le premier par défaut)
  setTimeout(() => {
    mobileNavLinks[indexToFocus].focus();
  }, 100);
}

/**
 * Fonction pour fermer le menu
 */
function closeMenu() {
  isMenuOpen = false;
  hamburgerBtn.setAttribute("aria-expanded", "false");
  hamburgerBtn.setAttribute("aria-label", "Ouvrir le menu de navigation");

  // Retirer les classes pour fermer le menu
  mobileNav.classList.remove("menu-open");
  navOverlay.classList.remove("menu-open");

  // Rétablir le scroll du body
  document.body.style.overflow = "";

  // Supprimer le bloqueur de touchmove si présent
  if (_touchMoveBlocker) {
    document.removeEventListener("touchmove", _touchMoveBlocker, { passive: false });
    _touchMoveBlocker = null;
  }
}

/**
 * Toggle du menu au clic sur le bouton hamburger
 */
hamburgerBtn.addEventListener("click", (e) => {
  e.stopPropagation();

  if (isMenuOpen) {
    closeMenu();
  } else {
    openMenu();
  }
});

/**
 * Fermeture du menu au clic sur l'overlay
 */
navOverlay.addEventListener("click", closeMenu);

/**
 * Fermeture du menu au clic sur un lien
 */
mobileNavLinks.forEach((link) => {
  link.addEventListener("click", closeMenu);
});

/**
 * Gestion du clavier pour l'accessibilité
 */
document.addEventListener("keydown", (e) => {
  // Fermer avec Échap
  if (e.key === "Escape" && isMenuOpen) {
    closeMenu();
    hamburgerBtn.focus(); // Retourner le focus au bouton
  }

  // Navigation au clavier dans le menu
  if (
    isMenuOpen &&
    (e.key === "Tab" || e.key === "ArrowDown" || e.key === "ArrowUp")
  ) {
    e.preventDefault();

    const currentFocus = document.activeElement;
    const currentIndex = Array.from(mobileNavLinks).indexOf(currentFocus);

    let nextIndex;
    if (e.key === "ArrowDown" || (e.key === "Tab" && !e.shiftKey)) {
      nextIndex = (currentIndex + 1) % mobileNavLinks.length;
    } else {
      nextIndex =
        currentIndex <= 0 ? mobileNavLinks.length - 1 : currentIndex - 1;
    }

    mobileNavLinks[nextIndex].focus();
  }
});

/**
 * Fermeture automatique sur redimensionnement vers desktop
 * Pour éviter que le menu reste ouvert lors du passage en mode desktop
 */
window.addEventListener("resize", () => {
  if (window.innerWidth > 768 && isMenuOpen) {
    closeMenu();
  }
});

/**
 * Fermeture du menu si clic en dehors (sécurité supplémentaire)
 */
document.addEventListener("click", (e) => {
  if (
    isMenuOpen &&
    !mobileNav.contains(e.target) &&
    !hamburgerBtn.contains(e.target)
  ) {
    closeMenu();
  }
});

/**
 * Amélioration de la performance avec la détection de support
 */
if (
  "CSS" in window &&
  "supports" in window.CSS &&
  !CSS.supports("backdrop-filter", "blur(10px)")
) {
  // Vérifier le support du backdrop-filter et ajouter une classe fallback pour les navigateurs sans support
  document.documentElement.classList.add("no-backdrop-filter");
}
