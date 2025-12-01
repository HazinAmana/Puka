/* ===============================================
  TEXT BLOCK - Bloc de texte avec scrollbar
  ===============================================

  Gère l'affichage et la mise à jour du bloc de texte à gauche
  du grand carrousel (desktop) ou en dessous (mobile).

  DÉPENDANCES :
  - data-loader.js

  EXPORTS :
  - initTextBlock() : Initialisation
  - updateText() : Mettre à jour le contenu

  💡 MODIFIABLE : Formatage du contenu, styles.
*/

// ===============================================
// ÉLÉMENTS DOM
// ===============================================

let textBlock, textContent;


// ===============================================
// INITIALISATION
// ===============================================

/**
 * Initialise le bloc de texte
 */
function initTextBlock() {
  console.log('📝 Initialisation du bloc de texte...');

  // Récupérer les éléments DOM
  textBlock = document.getElementById('textBlock');
  textContent = document.getElementById('textContent');

  if (!textBlock || !textContent) {
    console.error('❌ Éléments du bloc de texte non trouvés');
    return;
  }

  // Event listener pour la mise à jour du texte
  document.addEventListener('updateText', (event) => {
    updateText(event.detail.nom, event.detail.description);
  });

  // // Initialiser la scrollbar manuellement
  // const scrollWrapper = document.querySelector('.text-block-scroll-wrapper');
  // if (scrollWrapper && typeof window.initCurvedScrollbar === 'function') {
  //   console.log('📜 Initialisation manuelle de la scrollbar ...');
  //   window.initCurvedScrollbar(scrollWrapper);
  // }

  console.log('✅ Bloc de texte initialisé');
}


// ===============================================
// MISE À JOUR DU CONTENU
// ===============================================

/**
 * Met à jour le contenu du bloc de texte
 *
 * @param {String} nom - Nom du danseur
 * @param {String} description - Description HTML du danseur
 */
function updateText(nom, description) {
  console.log(`📝 Mise à jour du texte pour: ${nom}`);

  if (!textContent) return;

  // Construire le HTML
  let html = '';

  // Titre (h3)
  if (nom) {
    html += `<h3>${escapeHtml(nom)}</h3>`;
  }

  // Description (peut contenir du HTML)
  if (description && description.trim() !== '') {
    html += `<div class="text-block-description">${description}</div>`;
  } else {
    html += `<div class="text-block-empty"><p>Aucune description disponible pour ce danseur.</p></div>`;
  }

  // Mettre à jour le contenu
  textContent.innerHTML = html;

  // Scroller en haut du contenu
  // textContent.scrollTop = 0;

}


/**
 * Réinitialise le bloc de texte à l'état initial (vide)
 */
function resetTextBlock() {
  if (!textContent) return;

  textContent.innerHTML = `
  <div class="text-block-empty">
  <p>Sélectionnez un danseur pour afficher sa description</p>
  </div>
  `;
}


// ===============================================
// UTILITAIRES
// ===============================================

/**
 * Échappe les caractères HTML pour éviter les injections XSS
 *
 * @param {String} text - Texte à échapper
 * @returns {String} Texte échappé
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}


/**
 * Formate une description depuis le JSON
 * La description peut être un tableau ou une chaîne
 *
 * @param {String|Array} description - Description brute
 * @returns {String} Description formatée en HTML
 */
function formatDescription(description) {
  if (!description) return '';

  if (Array.isArray(description)) {
    return description.join('');
  }

  return description;
}


// ===============================================
// EXPORTS
// ===============================================

window.TEXT_BLOCK = {
  init: initTextBlock,
  update: updateText,
  reset: resetTextBlock
};
