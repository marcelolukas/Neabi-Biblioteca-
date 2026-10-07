const storageKey = 'biblioteca-neabi:leituras-salvas';
const catalogItems = [...document.querySelectorAll('.catalog-item')];
const filterButtons = [...document.querySelectorAll('.filter-button')];
const saveButtons = [...document.querySelectorAll('.save-button')];
const searchInput = document.querySelector('#catalog-search');
const resultCount = document.querySelector('#result-count');
const emptyState = document.querySelector('#empty-state');
const clearFiltersButton = document.querySelector('#clear-filters');
const savedCount = document.querySelector('.saved-count');
const menuToggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navegacao-principal');
const dialog = document.querySelector('#reading-dialog');
const toast = document.querySelector('#toast');

let activeFilter = 'todos';
let toastTimer;
let savedItems = loadSavedItems();

function loadSavedItems() {
  try {
    return new Set(JSON.parse(localStorage.getItem(storageKey) || '[]'));
  } catch {
    return new Set();
  }
}

function persistSavedItems() {
  try {
    localStorage.setItem(storageKey, JSON.stringify([...savedItems]));
  } catch {
    showToast('Não foi possível salvar a lista neste navegador.');
  }
}

function normalizeText(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('is-visible');
  toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 2400);
}

function updateSavedInterface() {
  savedCount.textContent = savedItems.size;
  savedCount.setAttribute(
    'aria-label',
    savedItems.size === 1 ? 'uma produção salva' : `${savedItems.size} produções salvas`,
  );

  saveButtons.forEach((button) => {
    const isSaved = savedItems.has(button.dataset.save);
    button.setAttribute('aria-pressed', String(isSaved));
    button.querySelector('span').textContent = isSaved ? '◆' : '◇';
    button.querySelector('b').textContent = isSaved
      ? 'Guardado na minha lista'
      : 'Guardar na minha lista';
  });
}

function applyCatalogFilters() {
  const query = normalizeText(searchInput.value);
  let visibleItems = 0;

  catalogItems.forEach((item) => {
    const matchesText = !query || normalizeText(item.textContent).includes(query);
    const matchesCategory = activeFilter === 'todos'
      || (activeFilter === 'salvos'
        ? savedItems.has(item.dataset.id)
        : item.dataset.categories.split(' ').includes(activeFilter));
    const isVisible = matchesText && matchesCategory;

    item.hidden = !isVisible;
    if (isVisible) visibleItems += 1;
  });

  resultCount.textContent = visibleItems === 1
    ? '1 produção encontrada'
    : `${visibleItems} produções encontradas`;
  emptyState.hidden = visibleItems !== 0;
  clearFiltersButton.hidden = activeFilter === 'todos' && !searchInput.value;
}

function selectFilter(filter) {
  activeFilter = filter;
  filterButtons.forEach((button) => {
    const isActive = button.dataset.filter === filter;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
  applyCatalogFilters();
}

function clearCatalogFilters() {
  searchInput.value = '';
  selectFilter('todos');
  searchInput.focus();
}

function openReading(item) {
  dialog.querySelector('#dialog-theme').textContent = item.querySelector('.item-theme').textContent;
  dialog.querySelector('#dialog-title').textContent = item.querySelector('h3').textContent;
  dialog.querySelector('#dialog-author').textContent = item.querySelector('.item-author').textContent;
  dialog.querySelector('#dialog-intro').textContent = item.querySelector('.item-summary').textContent;
  dialog.showModal();
}

function closeMenu() {
  document.body.classList.remove('menu-open');
  menuToggle.setAttribute('aria-expanded', 'false');
}

async function connectParentSiteLinks() {
  try {
    const response = await fetch('/api/config', { headers: { Accept: 'application/json' } });
    if (!response.ok) return;

    const { siteMaeUrl } = await response.json();
    if (!siteMaeUrl) return;

    const baseUrl = siteMaeUrl.endsWith('/') ? siteMaeUrl : `${siteMaeUrl}/`;
    document.querySelectorAll('.parent-link').forEach((link) => {
      link.href = new URL(link.dataset.sitePath, baseUrl).toString();
    });
  } catch {
    // O link do repositório permanece como alternativa quando não há URL publicada.
  }
}

searchInput.addEventListener('input', applyCatalogFilters);
filterButtons.forEach((button) => {
  button.addEventListener('click', () => selectFilter(button.dataset.filter));
});

saveButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const id = button.dataset.save;
    const wasSaved = savedItems.has(id);
    if (wasSaved) savedItems.delete(id);
    else savedItems.add(id);

    persistSavedItems();
    updateSavedInterface();
    applyCatalogFilters();
    showToast(wasSaved ? 'Produção removida da sua lista.' : 'Produção guardada na sua lista.');
  });
});

document.querySelectorAll('[data-clear]').forEach((button) => {
  button.addEventListener('click', clearCatalogFilters);
});
clearFiltersButton.addEventListener('click', clearCatalogFilters);

document.querySelectorAll('.read-link').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    openReading(link.closest('.catalog-item'));
  });
});

document.querySelector('.featured-reading').addEventListener('click', () => {
  openReading(catalogItems[0]);
});

dialog.querySelectorAll('.dialog-close, .dialog-action').forEach((button) => {
  button.addEventListener('click', () => dialog.close());
});
dialog.addEventListener('click', (event) => {
  const bounds = dialog.getBoundingClientRect();
  const outside = event.clientX < bounds.left || event.clientX > bounds.right
    || event.clientY < bounds.top || event.clientY > bounds.bottom;
  if (outside) dialog.close();
});

menuToggle.addEventListener('click', () => {
  const isOpen = document.body.classList.toggle('menu-open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
});
navigation.addEventListener('click', (event) => {
  if (event.target.closest('a')) closeMenu();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && document.body.classList.contains('menu-open')) closeMenu();
});

document.querySelector('#current-year').textContent = new Date().getFullYear();
updateSavedInterface();
applyCatalogFilters();
connectParentSiteLinks();
window.requestAnimationFrame(() => document.body.classList.add('is-ready'));
