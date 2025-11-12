/* ===== LIGHTBOX JAVASCRIPT ===== */

/**
 * Lightbox Enhanced - Charge automatiquement les images depuis un dossier
 * Pour chaque page, modifiez uniquement l'attribut data-lightbox-folder
 */

class LightboxEnhanced {
  constructor() {
    this.images = [];
    this.currentIndex = 0;
    this.isTransitioning = false;
    this.imageExtensions = ["jpg", "jpeg", "png", "gif", "webp", "svg"];

    this.init();
  }

  init() {
    // Récupérer les éléments du DOM
    this.gallery = document.querySelector(".gallery");
    this.lightbox = document.getElementById("lightbox");
    this.lightboxContent = document.getElementById("lightboxContent");
    this.lightboxImage = document.getElementById("lightboxImage");
    this.lightboxTitle = document.getElementById("lightboxTitle");
    this.lightboxCounter = document.getElementById("lightboxCounter");
    this.closeBtn = document.getElementById("closeBtn");
    this.prevBtn = document.getElementById("prevBtn");
    this.nextBtn = document.getElementById("nextBtn");
    this.prevArea = document.getElementById("prevArea");
    this.nextArea = document.getElementById("nextArea");
    this.centerArea = document.getElementById("centerArea");

    // Charger les images depuis le dossier spécifié
    const imageFolder = this.gallery.getAttribute("data-lightbox-folder");
    if (imageFolder) {
      this.loadImagesFromFolder(imageFolder);
    } else {
      console.error("Lightbox: Attribut data-lightbox-folder manquant");
    }

    // Initialiser les événements
    this.initEvents();
  }

  async loadImagesFromFolder(folderPath) {
    try {
      // Normaliser le chemin du dossier
      const normalizedPath = folderPath.endsWith("/")
        ? folderPath
        : folderPath + "/";

      // Scanner les images du dossier via une requête au serveur
      const response = await fetch(normalizedPath);
      const text = await response.text();

      // Parser le HTML pour extraire les liens vers les images
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, "text/html");
      const links = doc.querySelectorAll("a");

      this.images = [];
      links.forEach((link) => {
        let href = link.getAttribute("href");
        if (href && this.isImageFile(href)) {
          // Nettoyer le href (enlever ./ et ../)
          href = href.replace(/^\.\//, "");

          // Construire le chemin complet de l'image
          let imagePath;
          if (
            href.startsWith("http://") ||
            href.startsWith("https://") ||
            href.startsWith("/")
          ) {
            // URL absolue
            imagePath = href;
          } else {
            // URL relative - combiner avec le chemin du dossier
            imagePath = normalizedPath + href;
          }

          const filename = this.getFilenameWithoutExtension(href);
          this.images.push({
            src: imagePath,
            title: filename,
          });

          console.log("Image trouvée:", imagePath); // Debug
        }
      });

      if (this.images.length > 0) {
        console.log("Total images chargées:", this.images.length); // Debug
        this.createGallery();
      } else {
        console.warn(
          "Lightbox: Aucune image trouvée dans le dossier " + folderPath
        );
        this.showMessage("Aucune image trouvée dans ce dossier");
      }
    } catch (error) {
      console.error("Lightbox: Erreur lors du chargement des images", error);
      this.showMessage(
        "Erreur lors du chargement des images. Assurez-vous d'utiliser un serveur web."
      );
    }
  }

  createGallery() {
    // Générer le HTML de la galerie
    this.gallery.innerHTML = this.images
      .map(
        (img, index) => `
                    <div class="gallery-item" data-index="${index}">
                        <img src="${img.src}" alt="${img.title}" loading="lazy">
                    </div>
                `
      )
      .join("");

    // Ajouter les événements de clic
    document.querySelectorAll(".gallery-item").forEach((item) => {
      item.addEventListener("click", () => {
        this.open(parseInt(item.dataset.index));
      });
    });
  }

  showMessage(message) {
    this.gallery.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #999;">
                        ${message}
                    </div>
                `;
  }

  isImageFile(filename) {
    const ext = filename.split(".").pop().toLowerCase();
    return this.imageExtensions.includes(ext);
  }

  getFilenameWithoutExtension(path) {
    const filename = path.split("/").pop();
    return filename.replace(/\.[^/.]+$/, "").replace(/-|_/g, " ");
  }

  open(index) {
    this.currentIndex = index;
    this.updateLightbox();
    this.lightbox.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  close() {
    this.lightbox.classList.remove("active");
    document.body.style.overflow = "";
  }

  updateLightbox() {
    if (this.isTransitioning || this.images.length === 0) return;

    this.isTransitioning = true;
    const img = this.images[this.currentIndex];

    // Créer une nouvelle image pour précharger
    const newImage = new Image();

    newImage.onload = () => {
      // Animation de fondu sortant
      this.lightboxImage.style.opacity = "0";

      setTimeout(() => {
        // Changer l'image
        this.lightboxImage.src = img.src;
        this.lightboxImage.alt = img.title;
        this.lightboxTitle.textContent = img.title;
        this.lightboxCounter.textContent = `${this.currentIndex + 1} / ${
          this.images.length
        }`;

        // Animation de fondu entrant
        setTimeout(() => {
          this.lightboxImage.style.opacity = "1";
          setTimeout(() => {
            this.isTransitioning = false;
          }, 300);
        }, 50);
      }, 200);
    };

    // Précharger l'image
    newImage.src = img.src;
  }

  showNext() {
    if (this.isTransitioning) return;
    this.currentIndex = (this.currentIndex + 1) % this.images.length;
    this.updateLightbox();
  }

  showPrev() {
    if (this.isTransitioning) return;
    this.currentIndex =
      (this.currentIndex - 1 + this.images.length) % this.images.length;
    this.updateLightbox();
  }

  initEvents() {
    // Bouton fermer
    this.closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.close();
    });

    // Boutons de navigation
    this.nextBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.showNext();
    });

    this.prevBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.showPrev();
    });

    // Zones de navigation étendues
    this.prevArea.addEventListener("click", (e) => {
      e.stopPropagation();
      this.showPrev();
    });

    this.nextArea.addEventListener("click", (e) => {
      e.stopPropagation();
      this.showNext();
    });

    // Zone centrale pour fermer
    this.centerArea.addEventListener("click", (e) => {
      e.stopPropagation();
      this.close();
    });

    // Fermer en cliquant sur l'overlay (au cas où)
    this.lightbox.addEventListener("click", (e) => {
      if (e.target === this.lightbox) {
        this.close();
      }
    });

    // Empêcher la fermeture lors du clic sur le contenu
    this.lightboxContent.addEventListener("click", (e) => {
      e.stopPropagation();
    });

    // Empêcher la fermeture lors du clic sur les boutons
    this.closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
    });

    this.prevBtn.addEventListener("click", (e) => {
      e.stopPropagation();
    });

    this.nextBtn.addEventListener("click", (e) => {
      e.stopPropagation();
    });

    // Navigation au clavier
    document.addEventListener("keydown", (e) => {
      if (!this.lightbox.classList.contains("active")) return;

      switch (e.key) {
        case "Escape":
          this.close();
          break;
        case "ArrowRight":
          this.showNext();
          break;
        case "ArrowLeft":
          this.showPrev();
          break;
      }
    });
  }
}

// Initialisation automatique au chargement du DOM
document.addEventListener("DOMContentLoaded", () => {
  window.lightbox = new LightboxEnhanced();
});
