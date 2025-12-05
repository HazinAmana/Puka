// SEARCH
const searchInput = document.getElementById("search-input");
const clearSearchBtn = document.getElementById("clear-search");
let searchTerm = "";

searchInput.addEventListener("input", () => {
  searchTerm = normalize(searchInput.value);
  console.log("Recherche :", searchTerm);
  clearSearchBtn.style.display = searchTerm ? "inline-block" : "none";
  currentPage = 1;
  render();
});

clearSearchBtn.addEventListener("click", () => {
  searchInput.value = "";
  searchTerm = "";
  clearSearchBtn.style.display = "none";
  currentPage = 1;
  render();
});

searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    searchInput.value = "";
    searchTerm = "";
    clearSearchBtn.style.display = "none";
    currentPage = 1;
    render();
  }
});

function getFiltered() {
  return data.filter((p) => {
    const matchCategory =
      normalize(currentCategory) === "all" ||
      normalize(p.category) === normalize(currentCategory);

    const matchSearch = [p.name, p.category, p.location, p.date]
      .map(normalize)
      .some((val) => val.includes(searchTerm));
    return matchCategory && matchSearch;
  });
}

// Constantes & état
const DATA_URL = "./assets/Liste_Projets.json";
let data = [];
let rowsPerPage = 10;
let currentPage = 1;
let currentCategory = "all";
let currentSort = { key: null, dir: "asc" };

// Éléments DOM
const tableBody = document.getElementById("table-body");
const pagination = document.getElementById("pagination");
const statusEl = document.getElementById("status");
const rowsSelect = document.getElementById("rows-select");
const filtersWrap = document.getElementById("filters");

// Utils
const normalize = (s) =>
  (s ?? "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

function sortData(arr) {
  if (!currentSort.key) return arr;
  return arr.slice().sort((x, y) => {
    const res = compare(
      normalize(x[currentSort.key]),
      normalize(y[currentSort.key])
    );
    return currentSort.dir === "asc" ? res : -res;
  });
}

function paginate(arr) {
  const start = (currentPage - 1) * rowsPerPage;
  return arr.slice(start, start + rowsPerPage);
}

function clampCurrentPage(totalItems) {
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));
  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;
}

function formatStatus(total, page, per) {
  const totalPages = Math.max(1, Math.ceil(total / per));
  const start = total === 0 ? 0 : (page - 1) * per + 1;
  const end = Math.min(total, page * per);
  return `${total} résultat${
    total > 1 ? "s" : ""
  } — ${start}–${end} | Page ${page}/${totalPages}`;
}

// Rendu
function render() {
  const filtered = getFiltered();
  clampCurrentPage(filtered.length);
  const sorted = sortData(filtered);
  const pageData = paginate(sorted);

  // Corps de table remplacé par le bloc ci-dessous, tant que les pages html ne sont pas créées
  // tableBody.innerHTML = pageData
  //   .map(
  //     (p) => `
  //       <tr>
  //         <td>${p.name}</td>
  //         <td>${p.category}</td>
  //         <td>${p.location}</td>
  //         <td>${p.date}</td>
  //         <td><a href="${p.url}">Voir</a></td>
  //       </tr>
  //     `
  //   )
  //   .join("");

  // Corps de table
  tableBody.innerHTML = pageData
    .map(
      (p) => `
        <tr>
          <td>${p.name}</td>
          <td>${p.category}</td>
          <td>${p.location}</td>
          <td>${p.date}</td>
          <td><a href="shopping-mall.html">Voir</a></td>
        </tr>
      `
    )
    .join("");

  // En-têtes tri visuel
  document.querySelectorAll("th[data-sort]").forEach((th) => {
    th.classList.remove("sort-asc", "sort-desc");
    if (th.dataset.sort === currentSort.key) {
      th.classList.add(currentSort.dir === "asc" ? "sort-asc" : "sort-desc");
    }
  });

  renderPagination(filtered.length);
  statusEl.textContent = formatStatus(
    filtered.length,
    currentPage,
    rowsPerPage
  );
}

function renderFilters() {
  const cats = Array.from(new Set(data.map((d) => d.category))).sort((a, b) =>
    normalize(a).localeCompare(normalize(b))
  );

  const buttons = [
    { label: "Tout", value: "all" },
    ...cats.map((c) => ({ label: c, value: c })),
  ];

  filtersWrap.innerHTML = buttons
    .map(
      (b) => `
        <button class="tag ${
          b.value === currentCategory ? "active" : ""
        }" data-category="${b.value}">
          ${b.label}
        </button>
      `
    )
    .join("");

  filtersWrap.querySelectorAll(".tag").forEach((btn) => {
    btn.addEventListener("click", () => {
      filtersWrap
        .querySelectorAll(".tag")
        .forEach((bb) => bb.classList.remove("active"));
      btn.classList.add("active");
      currentCategory = btn.dataset.category;
      currentPage = 1;
      render();
    });
  });
}

function renderPagination(total) {
  const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));
  pagination.innerHTML = "";

  const makeBtn = (label, disabled, onClick, extraClass = "") => {
    const b = document.createElement("button");
    b.textContent = label;
    b.className = `page-btn ${extraClass}`.trim();
    if (disabled) b.disabled = true;
    b.onclick = onClick;
    return b;
  };

  // Chevrons Gauche
  pagination.appendChild(
    makeBtn("⏮", currentPage === 1, () => {
      currentPage = 1;
      render();
    })
  );
  pagination.appendChild(
    makeBtn("◀", currentPage === 1, () => {
      currentPage -= 1;
      render();
    })
  );

  // Numéros (fenêtre autour de la page courante)
  const span = 2;
  const start = Math.max(1, currentPage - span);
  const end = Math.min(totalPages, currentPage + span);
  for (let i = start; i <= end; i++) {
    const btn = makeBtn(
      String(i),
      i === currentPage,
      () => {
        currentPage = i;
        render();
      },
      "page-num"
    );
    if (i === currentPage) btn.classList.add("active");
    pagination.appendChild(btn);
  }
  // Chevrons Droite
  pagination.appendChild(
    makeBtn("▶", currentPage === totalPages, () => {
      currentPage += 1;
      render();
    })
  );
  pagination.appendChild(
    makeBtn("⏭", currentPage === totalPages, () => {
      currentPage = totalPages;
      render();
    })
  );
}

// Écoutes
document.querySelectorAll("th[data-sort]").forEach((th) => {
  th.addEventListener("click", () => {
    const key = th.dataset.sort;
    if (currentSort.key === key)
      currentSort.dir = currentSort.dir === "asc" ? "desc" : "asc";
    else {
      currentSort.key = key;
      currentSort.dir = "asc";
    }
    render();
  });
});

rowsSelect.addEventListener("change", (e) => {
  rowsPerPage = parseInt(e.target.value, 10);
  currentPage = 1;
  render();
});

// Chargement données
fetch(DATA_URL)
  .then((r) => r.json())
  .then((json) => {
    data = json.map((x) => ({
      name: x.name,
      category: x.category,
      location: x.location,
      date: x.date,
      url: x.url,
    }));
    renderFilters();
    render();
  })
  .catch((err) => {
    console.error("Erreur chargement JSON", err);
    tableBody.innerHTML = `<tr><td colspan="5">Erreur de chargement des données.</td></tr>`;
  });
