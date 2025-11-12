// Variables globales
let projects = [];
let map;
let markerClusterGroup;
let activeTag = "All";
let searchQuery = "";
let allTags = [];

// Couleurs par tag
const tagColors = {
  all: "hsla(51, 65%, 40%, 1.00)",
  featured: "hsla(50, 85%, 40%, 1.00)",
  architecture: "hsla(340, 82%, 40%, 1.00)",
  art: "hsla(122, 39%, 40%, 1.00)",
  design: "hsla(262, 52%, 40%, 1.00)",
  divertissement: "hsla(54, 100%, 40%, 1.00)",
  éducation: "hsla(207, 90%, 40%, 1.00)",
  gastronomie: "hsla(200, 18%, 40%, 1.00)",
  mode: "hsla(291, 64%, 40%, 1.00)",
  santé: "hsla(88, 50%, 40%, 1.00)",
  sciences: "hsla(187, 100%, 40%, 1.00)",
  sport: "hsla(16, 25%, 40%, 1.00)",
  technologie: "hsla(36, 100%, 40%, 1.00)",
  transports: "hsla(231, 48%, 40%, 1.00)",
  voyage: "hsla(66, 70%, 40%, 1.00)",
  default: "hsla(215, 16%, 40%, 1.00)",
};

// Fonction pour calculer la luminosité relative d'une couleur
function getRelativeLuminance(hex) {
  const rgb = parseInt(hex.slice(1), 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;

  const rsRGB = r / 255;
  const gsRGB = g / 255;
  const bsRGB = b / 255;

  const rLinear =
    rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const gLinear =
    gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const bLinear =
    bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

// Déterminer si le texte doit être blanc ou noir
function getContrastColor(bgColor) {
  const luminance = getRelativeLuminance(bgColor);
  return luminance > 0.5 ? "#000000" : "#ffffff";
}

// Fonction pour normaliser les chaînes (enlever les diacritiques)
function normalizeString(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

// Charger les projets depuis le fichier JSON
async function loadProjects() {
  try {
    const response = await fetch("./assets/Liste_Projets.json");
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    projects = await response.json();

    // Initialiser l'application une fois les projets chargés
    initializeApp();
  } catch (error) {
    console.error("Erreur lors du chargement des projets:", error);
    // Afficher un message d'erreur à l'utilisateur
    document.querySelector(".container").innerHTML = `
      <h1>Projects Map</h1>
      <p class="subtitle" style="color: #ef4444;">
        ⚠️ Erreur lors du chargement des projets.<br>
        <strong>Détails:</strong> ${error.message}<br><br>
        <strong>Vérifications:</strong><br>
        • Le fichier "assets/ListeProjets.json" existe<br>
        • Le fichier JSON est valide<br>
        • Vous utilisez un serveur local (Live Server, etc.)<br>
      </p>
    `;
  }
}

// Fonction d'initialisation de l'application
function initializeApp() {
  generateTags();
  createTags();
  initMap();
  setupEventListeners();
}

// Générer tous les tags uniques à partir des projets
function generateTags() {
  const uniqueTags = [
    ...new Set(
      projects
        .flatMap((project) => project.tags || [])
        .map((tag) => tag.toLowerCase())
    ),
  ].sort((a, b) => normalizeString(a).localeCompare(normalizeString(b)));

  allTags = ["All", "Featured", ...uniqueTags];
}

// Initialiser la carte
function initMap() {
  map = L.map("map").setView([46.603354, 1.888334], 6);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
    maxZoom: 18,
  }).addTo(map);

  // Créer le groupe de clusters avec options personnalisées
  markerClusterGroup = L.markerClusterGroup({
    showCoverageOnHover: false,
    zoomToBoundsOnClick: false,
    spiderfyOnMaxZoom: true,
    removeOutsideVisibleBounds: true,
    animate: true,
    animateAddingMarkers: true,
    spiderfyDistanceMultiplier: 1.5,

    iconCreateFunction: function (cluster) {
      const count = cluster.getChildCount();
      let size = "small";
      if (count > 5) size = "medium";
      if (count > 10) size = "large";

      return L.divIcon({
        html: `<div>${count}</div>`,
        className: `marker-cluster marker-cluster-${size}`,
        iconSize: L.point(40, 40),
      });
    },
  });

  markerClusterGroup.on("clusterclick", function (e) {
    e.layer.spiderfy();
  });

  map.addLayer(markerClusterGroup);

  // Positionner le modal par-dessus la carte
  const mapContainer = document.querySelector(".map-container");
  const modal = document.getElementById("projectModal");
  mapContainer.appendChild(modal);

  updateMarkers();
}

// Créer un marqueur personnalisé
function createCustomMarker(project) {
  const mainTag = project.featured
    ? "featured"
    : project.tags && project.tags[0]
    ? project.tags[0].toLowerCase()
    : "default";
  const color = tagColors[mainTag] || tagColors.default;
  const letter = project.featured
    ? "★"
    : mainTag.charAt(0).toUpperCase() || "?";

  const icon = L.divIcon({
    className: "custom-marker-wrapper",
    html: `<div class="custom-marker" style="background-color: ${color};">${letter}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });

  return L.marker(project.coords, { icon }).on("click", () =>
    showProject(project)
  );
}

// Mettre à jour les marqueurs
function updateMarkers() {
  markerClusterGroup.clearLayers();

  const filteredProjects = projects.filter((project) => {
    const matchesTag =
      activeTag === "All" ||
      (activeTag === "Featured" && project.featured) ||
      (project.tags &&
        project.tags.some(
          (tag) => normalizeString(tag) === normalizeString(activeTag)
        ));

    const normalizedSearch = normalizeString(searchQuery);
    const matchesSearch =
      searchQuery === "" ||
      normalizeString(project.name || "").includes(normalizedSearch) ||
      normalizeString(project.description || "").includes(normalizedSearch) ||
      normalizeString(project.location || "").includes(normalizedSearch);

    return matchesTag && matchesSearch;
  });

  filteredProjects.forEach((project) => {
    const marker = createCustomMarker(project);
    markerClusterGroup.addLayer(marker);
  });

  updateProjectCount(filteredProjects.length);
}

// Mettre à jour le compteur de projets
function updateProjectCount(filtered) {
  const total = projects.length;
  document.getElementById("projectCount").textContent = `${filtered} project${
    filtered !== 1 ? "s" : ""
  } of ${total}`;
}

// Afficher un projet
function showProject(project) {
  document.getElementById("projectImage").src = project.image || "";
  document.getElementById("projectImage").alt = project.name || "Project";
  document.getElementById("projectTitle").textContent =
    project.name || "Sans titre";
  document.getElementById("projectDescription").textContent =
    project.description || "";
  document.getElementById("projectLocation").textContent = `${
    project.location || "Non spécifié"
  }`;
  document.getElementById("projectDate").textContent = `${
    project.date || "Date non spécifiée"
  }`;
  // document.getElementById("projectLink").href =
  //   project.link || `#project-${project.id}`;
    document.getElementById("projectLink").href =
      project.url || `#project-${project.id}`;

  document.getElementById("projectModal").classList.add("active");
}

// Créer les tags
function createTags() {
  const container = document.getElementById("tagsContainer");
  container.innerHTML = "";

  allTags.forEach((tag) => {
    const tagEl = document.createElement("button");
    tagEl.className = "tag";
    const displayText = tag.charAt(0).toUpperCase() + tag.slice(1);
    tagEl.textContent = displayText;

    // Obtenir la couleur du tag (normaliser pour la recherche)
    const normalizedTag = normalizeString(tag);
    const bgColor =
      tagColors[normalizedTag] ||
      tagColors[tag.toLowerCase()] ||
      tagColors.default;
    const textColor = getContrastColor(bgColor);

    // Appliquer les couleurs
    tagEl.style.backgroundColor = bgColor;
    tagEl.style.color = textColor;

    if (tag === "All") tagEl.classList.add("active");

    tagEl.addEventListener("click", () => {
      document
        .querySelectorAll(".tag")
        .forEach((t) => t.classList.remove("active"));
      tagEl.classList.add("active");
      activeTag = tag;
      updateMarkers();
    });

    container.appendChild(tagEl);
  });
}

// Configurer les écouteurs d'événements
function setupEventListeners() {
  const searchInput = document.getElementById("searchInput");
  const clearBtn = document.getElementById("clearBtn");
  const projectModal = document.getElementById("projectModal");
  const closeModal = document.getElementById("closeModal");

  searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value;
    clearBtn.classList.toggle("visible", searchQuery.length > 0);
    updateMarkers();
  });

  clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    searchQuery = "";
    clearBtn.classList.remove("visible");
    updateMarkers();
  });

  projectModal.addEventListener("click", (e) => {
    if (e.target.id === "projectModal") {
      projectModal.classList.remove("active");
    }
  });

  closeModal.addEventListener("click", () => {
    projectModal.classList.remove("active");
  });
}

// Charger les projets au démarrage
loadProjects();
