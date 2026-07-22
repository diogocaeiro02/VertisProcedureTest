/**
 * Manual de Procedimentos Vertis
 *
 * A aplicação é totalmente estática. Os nomes dos ficheiros CSV
 * disponíveis no repositório são definidos em procedimentos/index.js.
 */

const REQUIRED_COLUMNS = [
  "titulo",
  "categoria",
  "passo_numero",
  "passo_descricao"
];

const state = {
  procedures: [],
  errors: [],
  selectedCategory: ""
};

const elements = {
  menuButton: document.getElementById("menuButton"),
  sidebar: document.getElementById("sidebar"),
  sidebarOverlay: document.getElementById("sidebarOverlay"),
  loadStatus: document.getElementById("loadStatus"),

  categoryNavigation: document.getElementById("categoryNavigation"),
  procedureNavigation: document.getElementById("procedureNavigation"),
  categoryCount: document.getElementById("categoryCount"),
  sidebarProcedureCount: document.getElementById("sidebarProcedureCount"),

  procedureCount: document.getElementById("procedureCount"),
  stepCount: document.getElementById("stepCount"),
  overviewCategoryCount: document.getElementById("overviewCategoryCount"),

  searchInput: document.getElementById("searchInput"),
  categoryFilter: document.getElementById("categoryFilter"),
  sortSelect: document.getElementById("sortSelect"),
  clearFiltersButton: document.getElementById("clearFiltersButton"),
  resultsSummary: document.getElementById("resultsSummary"),
  messageBox: document.getElementById("messageBox"),
  manualContent: document.getElementById("manualContent"),

  expandAllButton: document.getElementById("expandAllButton"),
  collapseAllButton: document.getElementById("collapseAllButton"),
  backToTopButton: document.getElementById("backToTopButton")
};


/**
 * Evita que conteúdo proveniente dos CSV seja interpretado como HTML.
 */
function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}


/**
 * Normaliza valores lidos do CSV.
 */
function normalize(value) {
  return String(value ?? "").trim();
}


/**
 * Normaliza nomes de colunas.
 */
function normalizeKey(value) {
  return normalize(value).toLowerCase();
}


/**
 * Cria identificadores seguros para URLs e elementos HTML.
 */
function slug(value) {
  return normalize(value || "procedimento")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}


/**
 * Interpreta o campo "ativo".
 */
function isActive(value) {
  return !["0", "false", "não", "nao", "inativo"].includes(
    normalize(value || "1").toLowerCase()
  );
}


/**
 * Converte um CSV para uma lista de objetos.
 *
 * Suporta:
 * - separador por ponto e vírgula ou vírgula;
 * - texto entre aspas;
 * - aspas duplicadas;
 * - quebras de linha dentro de campos entre aspas;
 * - UTF-8 com BOM.
 */
function parseCsv(text) {
  const cleanText = text.replace(/^\uFEFF/, "");
  const firstLine = cleanText.split(/\r?\n/, 1)[0] || "";

  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  const delimiter = semicolonCount >= commaCount ? ";" : ",";

  const matrix = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < cleanText.length; index += 1) {
    const character = cleanText[index];
    const nextCharacter = cleanText[index + 1];

    if (character === '"') {
      if (quoted && nextCharacter === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === delimiter && !quoted) {
      row.push(cell);
      cell = "";
    } else if (
      (character === "\n" || character === "\r") &&
      !quoted
    ) {
      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }

      row.push(cell);

      if (row.some(value => normalize(value) !== "")) {
        matrix.push(row);
      }

      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }

  row.push(cell);

  if (row.some(value => normalize(value) !== "")) {
    matrix.push(row);
  }

  if (!matrix.length) {
    return [];
  }

  const headers = matrix[0].map(normalizeKey);

  return matrix.slice(1).map(values => {
    const item = {};

    headers.forEach((header, index) => {
      item[header] = normalize(values[index] ?? "");
    });

    return item;
  });
}


/**
 * Converte as linhas de um CSV num procedimento.
 */
function rowsToProcedure(rows, filename) {
  const cleanRows = rows.filter(row =>
    Object.values(row).some(Boolean)
  );

  if (!cleanRows.length) {
    throw new Error("O ficheiro está vazio.");
  }

  const missingColumns = REQUIRED_COLUMNS.filter(
    column => !(column in cleanRows[0])
  );

  if (missingColumns.length) {
    throw new Error(
      `Faltam as colunas: ${missingColumns.join(", ")}.`
    );
  }

  const activeRows = cleanRows.filter(row => isActive(row.ativo));

  if (!activeRows.length) {
    return null;
  }

  const firstRow = activeRows[0];

  if (!firstRow.titulo) {
    throw new Error("O título não está preenchido.");
  }

  if (!firstRow.categoria) {
    throw new Error("A categoria não está preenchida.");
  }

  const steps = activeRows
    .map((row, index) => {
      if (!row.passo_descricao) {
        throw new Error(
          `O passo ${index + 1} não tem descrição.`
        );
      }

      return {
        number: Number(row.passo_numero) || index + 1,
        title: row.passo_titulo || "",
        description: row.passo_descricao,
        deadline: row.prazo || "",
        documents: row.documentos || "",
        notes: row.observacoes || "",
        image: row.passo_imagem || "",
        imageAlt: row.passo_imagem_alt || "",
        imageCaption: row.passo_imagem_legenda || ""
      };
    })
    .sort((left, right) => left.number - right.number);

  return {
    id: firstRow.id || slug(firstRow.titulo),
    title: firstRow.titulo,
    category: firstRow.categoria,
    order: Number(firstRow.ordem) || 10,
    owner: firstRow.responsavel || "Não definido",
    objective: firstRow.objetivo || "Não indicado",
    version: firstRow.versao || "1.0",
    reviewDate: firstRow.ultima_revisao || "",
    filename,
    steps
  };
}


/**
 * Indica se a navegação está no modo móvel.
 */
function isMobileSidebar() {
  return window.innerWidth <= 900;
}


/**
 * Fecha o menu lateral apenas no modo móvel.
 *
 * No computador, os cliques na navegação não devem alterar o estado
 * recolhido ou expandido escolhido através do botão de menu.
 */
function closeSidebar() {
  if (!isMobileSidebar()) {
    return;
  }

  elements.sidebar.classList.remove("open");
  elements.sidebarOverlay.hidden = true;
  elements.menuButton.setAttribute("aria-expanded", "false");
  document.body.classList.remove("sidebar-open");
}


/**
 * Abre ou fecha o menu lateral.
 *
 * Em computador, o menu recolhe a barra lateral e liberta toda a largura
 * para o conteúdo. Em telemóvel e tablet, funciona como painel sobreposto.
 */
function toggleSidebar() {
  if (!isMobileSidebar()) {
    const willCollapse = !document.body.classList.contains(
      "sidebar-collapsed"
    );

    document.body.classList.toggle(
      "sidebar-collapsed",
      willCollapse
    );

    elements.sidebarOverlay.hidden = true;
    elements.menuButton.setAttribute(
      "aria-expanded",
      String(!willCollapse)
    );

    return;
  }

  const willOpen = !elements.sidebar.classList.contains("open");

  elements.sidebar.classList.toggle("open", willOpen);
  elements.sidebarOverlay.hidden = !willOpen;
  elements.menuButton.setAttribute(
    "aria-expanded",
    String(willOpen)
  );
  document.body.classList.toggle("sidebar-open", willOpen);
}


/**
 * Ajusta o estado da navegação quando a largura do ecrã muda.
 */
function syncSidebarWithViewport() {
  elements.sidebar.classList.remove("open");
  elements.sidebarOverlay.hidden = true;
  document.body.classList.remove("sidebar-open");

  if (isMobileSidebar()) {
    document.body.classList.remove("sidebar-collapsed");
    elements.menuButton.setAttribute("aria-expanded", "false");
  } else {
    elements.menuButton.setAttribute(
      "aria-expanded",
      String(
        !document.body.classList.contains("sidebar-collapsed")
      )
    );
  }
}


/**
 * Obtém as categorias únicas.
 */
function getCategories(procedures = state.procedures) {
  return [...new Set(
    procedures
      .map(procedure => procedure.category)
      .filter(Boolean)
  )].sort((left, right) => left.localeCompare(right, "pt"));
}


/**
 * Determina se um procedimento corresponde aos filtros atuais.
 */
function matchesFilters(procedure) {
  const query = elements.searchInput.value
    .trim()
    .toLocaleLowerCase("pt");

  const selectedCategory = elements.categoryFilter.value;

  if (
    selectedCategory &&
    procedure.category !== selectedCategory
  ) {
    return false;
  }

  if (!query) {
    return true;
  }

  const searchableContent = [
    procedure.id,
    procedure.title,
    procedure.category,
    procedure.owner,
    procedure.objective,
    procedure.version,
    procedure.reviewDate,
    ...procedure.steps.flatMap(step => [
      step.title,
      step.description,
      step.deadline,
      step.documents,
      step.notes,
      step.imageAlt,
      step.imageCaption
    ])
  ]
    .join(" ")
    .toLocaleLowerCase("pt");

  return searchableContent.includes(query);
}


/**
 * Ordena os procedimentos segundo a preferência atual.
 */
function sortProcedures(procedures) {
  const mode = elements.sortSelect.value;

  return [...procedures].sort((left, right) => {
    if (mode === "title") {
      return left.title.localeCompare(right.title, "pt");
    }

    if (mode === "review") {
      return (
        String(right.reviewDate).localeCompare(
          String(left.reviewDate)
        ) ||
        left.title.localeCompare(right.title, "pt")
      );
    }

    return (
      left.category.localeCompare(right.category, "pt") ||
      left.order - right.order ||
      left.title.localeCompare(right.title, "pt")
    );
  });
}


/**
 * Aceita apenas caminhos relativos seguros para imagens do repositório.
 */
function getSafeImagePath(value) {
  const path = normalize(value);

  if (
    !path ||
    path.startsWith("/") ||
    path.startsWith("\\") ||
    path.includes("..") ||
    /^[a-z]+:/i.test(path)
  ) {
    return "";
  }

  return path;
}


/**
 * Apresenta a imagem associada ao passo, quando definida no CSV.
 */
function renderStepImage(step) {
  const imagePath = getSafeImagePath(step.image);

  if (!imagePath) {
    return "";
  }

  const alternativeText =
    step.imageAlt ||
    step.imageCaption ||
    step.title ||
    "Imagem do procedimento";

  return `
    <figure class="step-image">
      <a href="${escapeHtml(imagePath)}"
         target="_blank"
         rel="noopener noreferrer"
         aria-label="Abrir imagem em tamanho original">
        <img src="${escapeHtml(imagePath)}"
             alt="${escapeHtml(alternativeText)}"
             loading="lazy"
             decoding="async">
      </a>

      ${step.imageCaption ? `
        <figcaption>
          ${escapeHtml(step.imageCaption)}
        </figcaption>
      ` : ""}
    </figure>
  `;
}


/**
 * Gera o bloco de informação adicional de um passo.
 */
function renderStepControls(step) {
  const rows = [
    ["Prazo", step.deadline],
    ["Documentos", step.documents],
    ["Observações", step.notes]
  ].filter(([, value]) => value);

  if (!rows.length) {
    return `
      <div class="step-controls">
        <div class="step-control-row">
          <strong>Controlo</strong>
          <span>Sem requisitos adicionais.</span>
        </div>
      </div>
    `;
  }

  return `
    <div class="step-controls">
      ${rows.map(([label, value]) => `
        <div class="step-control-row">
          <strong>${escapeHtml(label)}</strong>
          <span>${escapeHtml(value)}</span>
        </div>
      `).join("")}
    </div>
  `;
}


/**
 * Gera o HTML de um procedimento.
 */
function renderProcedure(procedure, openByDefault = false) {
  const procedureId = `procedure-${slug(
    procedure.id || procedure.title
  )}`;

  const steps = procedure.steps.map(step => `
    <div class="step-item">
      <div class="step-number">${step.number}</div>

      <div class="step-main">
        ${step.title ? `
          <strong>${escapeHtml(step.title)}</strong>
        ` : ""}

        <p>${escapeHtml(step.description)}</p>

        ${renderStepImage(step)}
      </div>

      ${renderStepControls(step)}
    </div>
  `).join("");

  return `
    <details id="${procedureId}"
             class="procedure-card"
             ${openByDefault ? "open" : ""}>
      <summary class="procedure-summary">
        <div class="procedure-summary-main">
          <div class="procedure-title-row">
            <h3>${escapeHtml(procedure.title)}</h3>
            <span class="status-badge">Ativo</span>
          </div>

          <p>${escapeHtml(procedure.objective)}</p>
        </div>

        <div class="procedure-summary-meta">
          <span class="summary-chip">
            ${escapeHtml(procedure.category)}
          </span>

          <span class="summary-chip">
            ${procedure.steps.length} passo(s)
          </span>

          <span class="summary-chip">
            Rev. ${escapeHtml(procedure.version)}
          </span>
        </div>

        <span class="summary-chevron" aria-hidden="true">⌄</span>
      </summary>

      <div class="procedure-body">
        <div class="procedure-toolbar">
          <span class="procedure-reference">
            ${escapeHtml(procedure.id)}
            ·
            ${escapeHtml(procedure.filename)}
          </span>

          <div class="procedure-tools">
            <button class="procedure-action-button"
                    type="button"
                    data-print-procedure="${procedureId}">
              <span aria-hidden="true">▣</span>
              Imprimir procedimento
            </button>

            <button class="procedure-action-button procedure-action-secondary"
                    type="button"
                    data-copy-link="${procedureId}">
              <span aria-hidden="true">↗</span>
              Copiar ligação
            </button>
          </div>
        </div>

        <div class="procedure-metadata">
          <div class="meta-box">
            <strong>Categoria</strong>
            ${escapeHtml(procedure.category)}
          </div>

          <div class="meta-box">
            <strong>Responsável</strong>
            ${escapeHtml(procedure.owner)}
          </div>

          <div class="meta-box">
            <strong>Versão / revisão</strong>
            ${escapeHtml(procedure.version)}
            ${procedure.reviewDate
              ? ` · ${escapeHtml(procedure.reviewDate)}`
              : ""}
          </div>

          <div class="meta-box meta-wide">
            <strong>Objetivo</strong>
            ${escapeHtml(procedure.objective)}
          </div>
        </div>

        <div class="steps-heading">
          Passos do procedimento
        </div>

        <div class="steps-list">
          ${steps}
        </div>
      </div>
    </details>
  `;
}


/**
 * Atualiza a lista de categorias do filtro.
 */
function renderCategoryFilter() {
  const categories = getCategories();
  const selectedValue = elements.categoryFilter.value;

  elements.categoryFilter.innerHTML = `
    <option value="">Todas as categorias</option>
    ${categories.map(category => `
      <option value="${escapeHtml(category)}">
        ${escapeHtml(category)}
      </option>
    `).join("")}
  `;

  if (categories.includes(selectedValue)) {
    elements.categoryFilter.value = selectedValue;
  }
}


/**
 * Atualiza a navegação lateral por categorias.
 */
function renderCategoryNavigation() {
  const categories = getCategories();

  elements.categoryCount.textContent = categories.length;

  elements.categoryNavigation.innerHTML = `
    <a class="secondary-link ${state.selectedCategory === "" ? "active" : ""}"
       href="#procedimentos"
       data-category="">
      Todos
    </a>

    ${categories.map(category => `
      <a class="secondary-link ${
        state.selectedCategory === category ? "active" : ""
      }"
         href="#procedimentos"
         data-category="${escapeHtml(category)}">
        ${escapeHtml(category)}
      </a>
    `).join("")}
  `;
}


/**
 * Atualiza a lista lateral de procedimentos visíveis.
 */
function renderProcedureNavigation(procedures) {
  elements.sidebarProcedureCount.textContent = procedures.length;

  if (!procedures.length) {
    elements.procedureNavigation.innerHTML = `
      <div class="sidebar-placeholder">
        Nenhum procedimento encontrado.
      </div>
    `;
    return;
  }

  elements.procedureNavigation.innerHTML = procedures.map(procedure => `
    <a class="procedure-link"
       href="#procedure-${slug(procedure.id || procedure.title)}">
      <span>${escapeHtml(procedure.title)}</span>
    </a>
  `).join("");
}


/**
 * Atualiza os indicadores gerais.
 */
function renderOverview() {
  const categories = getCategories();

  elements.procedureCount.textContent = state.procedures.length;
  elements.stepCount.textContent = state.procedures.reduce(
    (total, procedure) => total + procedure.steps.length,
    0
  );
  elements.overviewCategoryCount.textContent = categories.length;
}


/**
 * Apresenta os erros encontrados nos CSV.
 */
function renderErrors() {
  if (!state.errors.length) {
    elements.messageBox.hidden = true;
    elements.messageBox.innerHTML = "";
    return;
  }

  elements.messageBox.hidden = false;
  elements.messageBox.innerHTML = `
    <strong>
      Alguns ficheiros não foram incluídos no manual.
    </strong>

    <ul>
      ${state.errors.map(error => `
        <li>${escapeHtml(error)}</li>
      `).join("")}
    </ul>
  `;
}


/**
 * Atualiza a área principal do manual.
 */
function renderManual() {
  const filtered = sortProcedures(
    state.procedures.filter(matchesFilters)
  );

  const total = state.procedures.length;

  elements.resultsSummary.textContent = filtered.length === total
    ? `${total} procedimento(s)`
    : `${filtered.length} de ${total} procedimento(s)`;

  renderProcedureNavigation(filtered);

  if (!filtered.length) {
    elements.manualContent.innerHTML = `
      <div class="empty-state">
        <strong>Nenhum procedimento encontrado.</strong>
        <span>
          Altere a pesquisa ou limpe os filtros.
        </span>
      </div>
    `;
    return;
  }

  const grouped = filtered.reduce((groups, procedure) => {
    groups[procedure.category] ??= [];
    groups[procedure.category].push(procedure);
    return groups;
  }, {});

  elements.manualContent.innerHTML = Object.entries(grouped)
    .sort(([left], [right]) => left.localeCompare(right, "pt"))
    .map(([category, procedures]) => {
      const renderedProcedures = procedures
        .map(procedure => renderProcedure(procedure))
        .join("");

      return `
        <section id="category-${slug(category)}"
                 class="category-group">
          <h2 class="category-heading">
            ${escapeHtml(category)}
            <span>${procedures.length}</span>
          </h2>

          <div class="procedure-list">
            ${renderedProcedures}
          </div>
        </section>
      `;
    })
    .join("");

  openHashTarget();
}


/**
 * Atualiza todas as áreas dependentes do estado.
 */
function renderAll() {
  renderCategoryFilter();
  renderCategoryNavigation();
  renderOverview();
  renderErrors();
  renderManual();

  elements.loadStatus.textContent = state.procedures.length
    ? `${state.procedures.length} procedimento(s)`
    : "Sem procedimentos";
}


/**
 * Abre e destaca o procedimento indicado no URL.
 */
function openHashTarget() {
  const hash = window.location.hash;

  if (!hash || !hash.startsWith("#procedure-")) {
    return;
  }

  const target = document.querySelector(hash);

  if (target instanceof HTMLDetailsElement) {
    target.open = true;

    requestAnimationFrame(() => {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });
  }
}


/**
 * Carrega todos os ficheiros definidos em procedimentos/index.js.
 *
 * Nota:
 * Os navegadores bloqueiam pedidos fetch() quando o HTML é aberto
 * diretamente através de file://. Em produção, no GitHub Pages ou
 * no Vercel, os ficheiros são servidos por HTTPS e carregam normalmente.
 */
async function loadProcedures() {
  const files = Array.isArray(window.VERTIS_PROCEDURE_FILES)
    ? window.VERTIS_PROCEDURE_FILES
    : [];

  if (window.location.protocol === "file:") {
    state.procedures = [];
    state.errors = [
      "O manual foi aberto diretamente no computador. Os navegadores bloqueiam a leitura automática dos CSV neste modo.",
      "Publique o projeto no GitHub Pages ou no Vercel, ou utilize um servidor local de pré-visualização."
    ];

    renderAll();

    elements.loadStatus.textContent = "Pré-visualização local bloqueada";
    elements.manualContent.innerHTML = `
      <div class="local-preview-state">
        <div class="local-preview-icon" aria-hidden="true">!</div>

        <strong>Os CSV não podem ser lidos através de file://</strong>

        <p>
          O manual está correto, mas precisa de ser aberto através de
          um endereço HTTP ou HTTPS.
        </p>

        <div class="local-preview-options">
          <div>
            <strong>Publicação final</strong>
            <span>
              Coloque a pasta no GitHub Pages ou no Vercel.
            </span>
          </div>

          <div>
            <strong>Pré-visualização no computador</strong>
            <span>
              No VS Code, utilize a extensão Live Server e escolha
              “Open with Live Server”.
            </span>
          </div>
        </div>
      </div>
    `;

    return;
  }

  if (!files.length) {
    state.errors = [
      "A lista procedimentos/index.js não contém ficheiros."
    ];
    renderAll();
    return;
  }

  const results = await Promise.allSettled(
    files.map(async filename => {
      let response;

      try {
        response = await fetch(
          `./procedimentos/${encodeURIComponent(filename)}?v=2.5.0`,
          { cache: "no-store" }
        );
      } catch {
        throw new Error(
          `${filename}: não foi possível estabelecer ligação ao ficheiro.`
        );
      }

      if (!response.ok) {
        throw new Error(
          `${filename}: resposta HTTP ${response.status}.`
        );
      }

      const rows = parseCsv(await response.text());
      const procedure = rowsToProcedure(rows, filename);

      return procedure;
    })
  );

  state.procedures = [];
  state.errors = [];

  results.forEach((result, index) => {
    const filename = files[index];

    if (result.status === "rejected") {
      state.errors.push(
        result.reason instanceof Error
          ? result.reason.message
          : `${filename}: erro desconhecido.`
      );
      return;
    }

    if (result.value) {
      state.procedures.push(result.value);
    }
  });

  state.procedures.sort((left, right) =>
    left.category.localeCompare(right.category, "pt") ||
    left.order - right.order ||
    left.title.localeCompare(right.title, "pt")
  );

  renderAll();
}


/**
 * Imprime apenas o procedimento escolhido.
 *
 * O cartão é aberto temporariamente e todos os restantes elementos
 * são escondidos através das regras específicas de impressão.
 */
function printProcedure(procedureId) {
  const procedure = document.getElementById(procedureId);

  if (!(procedure instanceof HTMLDetailsElement)) {
    return;
  }

  const category = procedure.closest(".category-group");
  const wasOpen = procedure.open;

  procedure.open = true;
  procedure.classList.add("print-target");
  category?.classList.add("print-category");
  document.body.classList.add("printing-procedure");

  const cleanup = () => {
    document.body.classList.remove("printing-procedure");
    procedure.classList.remove("print-target");
    category?.classList.remove("print-category");

    if (!wasOpen) {
      procedure.open = false;
    }

    window.removeEventListener("afterprint", cleanup);
  };

  window.addEventListener("afterprint", cleanup);

  requestAnimationFrame(() => {
    window.print();
  });
}


/**
 * Copia uma ligação direta para um procedimento.
 */
async function copyProcedureLink(procedureId, button) {
  const url = new URL(window.location.href);
  url.hash = procedureId;

  try {
    await navigator.clipboard.writeText(url.toString());

    const originalText = button.textContent;
    button.textContent = "Ligação copiada";

    window.setTimeout(() => {
      button.textContent = originalText;
    }, 1800);
  } catch {
    window.location.hash = procedureId;
  }
}


/**
 * Expande ou recolhe todos os procedimentos visíveis.
 */
function setAllProceduresOpen(open) {
  document
    .querySelectorAll(".procedure-card")
    .forEach(card => {
      card.open = open;
    });
}


/**
 * Atualiza o botão principal ativo na barra lateral.
 */
function setPrimaryNavigationActive(sectionId) {
  document.querySelectorAll(".primary-link").forEach(link => {
    const targetId = link.getAttribute("href")?.replace("#", "");
    link.classList.toggle("active", targetId === sectionId);
  });
}


/**
 * Atualiza a navegação principal de acordo com a posição da página.
 */
function updatePrimaryNavigationFromScroll() {
  const proceduresSection = document.getElementById("procedimentos");

  if (!proceduresSection) {
    return;
  }

  const threshold = Number.parseInt(
    getComputedStyle(document.documentElement)
      .getPropertyValue("--topbar-height"),
    10
  ) + 90;

  setPrimaryNavigationActive(
    proceduresSection.getBoundingClientRect().top <= threshold
      ? "procedimentos"
      : "inicio"
  );
}


/**
 * Remove uma ligação direta antiga antes de aplicar filtros.
 *
 * Sem esta limpeza, um URL terminado em #procedure-... podia voltar
 * a abrir um procedimento depois de selecionar uma categoria.
 */
function clearProcedureHash() {
  if (!window.location.hash.startsWith("#procedure-")) {
    return;
  }

  const url = new URL(window.location.href);
  url.hash = "procedimentos";
  window.history.replaceState(null, "", url);
}


/* Eventos da interface */

elements.menuButton.addEventListener("click", toggleSidebar);
elements.sidebarOverlay.addEventListener("click", closeSidebar);

elements.searchInput.addEventListener("input", () => {
  clearProcedureHash();
  renderManual();
});

elements.categoryFilter.addEventListener("change", () => {
  state.selectedCategory = elements.categoryFilter.value;

  clearProcedureHash();
  setPrimaryNavigationActive("procedimentos");
  renderCategoryNavigation();
  renderManual();
});

elements.sortSelect.addEventListener("change", () => {
  clearProcedureHash();
  renderManual();
});

elements.clearFiltersButton.addEventListener("click", () => {
  elements.searchInput.value = "";
  elements.categoryFilter.value = "";
  elements.sortSelect.value = "order";
  state.selectedCategory = "";

  clearProcedureHash();
  setPrimaryNavigationActive("procedimentos");
  renderCategoryNavigation();
  renderManual();
  elements.searchInput.focus();
});

elements.categoryNavigation.addEventListener("click", event => {
  const link = event.target.closest("[data-category]");

  if (!link) {
    return;
  }

  event.preventDefault();

  const category = link.dataset.category || "";

  state.selectedCategory = category;
  elements.categoryFilter.value = category;

  clearProcedureHash();
  setPrimaryNavigationActive("procedimentos");
  renderCategoryNavigation();
  renderManual();

  document.getElementById("procedimentos").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

  closeSidebar();
});

elements.procedureNavigation.addEventListener("click", event => {
  const link = event.target.closest("a");

  if (!link) {
    return;
  }

  setPrimaryNavigationActive("procedimentos");
  closeSidebar();
});

elements.manualContent.addEventListener("click", event => {
  const printButton = event.target.closest("[data-print-procedure]");

  if (printButton) {
    event.preventDefault();
    event.stopPropagation();

    printProcedure(printButton.dataset.printProcedure);
    return;
  }

  const copyButton = event.target.closest("[data-copy-link]");

  if (copyButton) {
    event.preventDefault();
    event.stopPropagation();

    copyProcedureLink(copyButton.dataset.copyLink, copyButton);
  }
});

document.querySelectorAll(".primary-link").forEach(link => {
  link.addEventListener("click", () => {
    const sectionId = link.getAttribute("href")?.replace("#", "");

    if (sectionId) {
      setPrimaryNavigationActive(sectionId);
    }

    closeSidebar();
  });
});

elements.expandAllButton.addEventListener("click", () => {
  setAllProceduresOpen(true);
});

elements.collapseAllButton.addEventListener("click", () => {
  setAllProceduresOpen(false);
});

elements.backToTopButton.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
});

window.addEventListener("hashchange", openHashTarget);

let navigationFrameRequested = false;

window.addEventListener("scroll", () => {
  if (navigationFrameRequested) {
    return;
  }

  navigationFrameRequested = true;

  requestAnimationFrame(() => {
    updatePrimaryNavigationFromScroll();
    navigationFrameRequested = false;
  });
}, { passive: true });

window.addEventListener("resize", () => {
  syncSidebarWithViewport();
  updatePrimaryNavigationFromScroll();
});

syncSidebarWithViewport();
updatePrimaryNavigationFromScroll();
loadProcedures();
