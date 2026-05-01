

'use strict';

/* ══════════════════════════════════════════
   0. CONFIGURATION API
   ══════════════════════════════════════════ */
const API_CONFIG = {
  baseURL:    'https://api.villenova.fr/v1',   // ← adapter à votre endpoint
  timeout:    8000,                            // ms avant abandon
  retryMax:   2,                               // tentatives en cas d'erreur réseau
  retryDelay: 1200,                            // ms entre chaque tentative
  headers: {
    'Content-Type': 'application/json',
    'Accept':       'application/json',
    // 'Authorization': `Bearer ${TOKEN}`,     // ← décommenter si auth requise
  },
};

/* Cache simple en mémoire (évite les re-fetch inutiles) */
const _cache = new Map();

/**
 * Requête AJAX universelle avec retry automatique, timeout et cache.
 * @param {string} endpoint   — chemin relatif, ex. '/events'
 * @param {object} [options]  — fetch options étendues (method, body, cache…)
 * @returns {Promise<any>}    — données JSON désérialisées
 */
async function apiFetch(endpoint, options = {}) {
  const { useCache = true, cacheTTL = 60_000, ...fetchOptions } = options;
  const url       = `${API_CONFIG.baseURL}${endpoint}`;
  const cacheKey  = url + JSON.stringify(fetchOptions.body ?? '');

  /* ── Lecture cache ── */
  if (useCache && fetchOptions.method !== 'POST') {
    const cached = _cache.get(cacheKey);
    if (cached && Date.now() - cached.ts < cacheTTL) {
      return cached.data;
    }
  }

  let lastError;

  for (let attempt = 0; attempt <= API_CONFIG.retryMax; attempt++) {
    const controller = new AbortController();
    const timer      = setTimeout(() => controller.abort(), API_CONFIG.timeout);

    try {
      const res = await fetch(url, {
        headers: API_CONFIG.headers,
        signal:  controller.signal,
        ...fetchOptions,
      });

      clearTimeout(timer);

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new ApiError(res.status, body || res.statusText, url);
      }

      const data = await res.json();

      /* ── Écriture cache ── */
      if (useCache && fetchOptions.method !== 'POST') {
        _cache.set(cacheKey, { data, ts: Date.now() });
      }

      return data;

    } catch (err) {
      clearTimeout(timer);
      lastError = err;

      if (err instanceof ApiError) throw err;          // Erreur HTTP → pas de retry
      if (attempt < API_CONFIG.retryMax) {
        await sleep(API_CONFIG.retryDelay * (attempt + 1));
      }
    }
  }

  throw lastError;
}

class ApiError extends Error {
  constructor(status, message, url) {
    super(message);
    this.name   = 'ApiError';
    this.status = status;
    this.url    = url;
  }
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/* ══════════════════════════════════════════
   1. LOADER
   ══════════════════════════════════════════ */
window.addEventListener('load', () => {
  const loader = document.getElementById('page-loader');
  if (!loader) return;
  setTimeout(() => {
    loader.classList.add('hidden');
    loader.addEventListener('transitionend', () => loader.remove(), { once: true });
  }, 600);
});

/* ══════════════════════════════════════════
   2. TOAST
   ══════════════════════════════════════════ */
function showToast(message, type = 'info', duration = 3500) {
  const container = document.querySelector('.toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.setAttribute('role', 'alert');
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastOut .3s ease forwards';
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, duration);
}

/* ══════════════════════════════════════════
   3. MENU BURGER
   ══════════════════════════════════════════ */
function initNav() {
  const burger   = document.querySelector('.nav-burger');
  const navLinks = document.querySelector('.nav-links');
  if (!burger || !navLinks) return;

  burger.addEventListener('click', () => {
    const isOpen = burger.getAttribute('aria-expanded') === 'true';
    burger.setAttribute('aria-expanded', String(!isOpen));
    navLinks.classList.toggle('open', !isOpen);
  });

  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      burger.setAttribute('aria-expanded', 'false');
      navLinks.classList.remove('open');
    });
  });

  document.addEventListener('click', (e) => {
    if (!burger.contains(e.target) && !navLinks.contains(e.target)) {
      burger.setAttribute('aria-expanded', 'false');
      navLinks.classList.remove('open');
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      burger.setAttribute('aria-expanded', 'false');
      navLinks.classList.remove('open');
      burger.focus();
    }
  });
}

/* ══════════════════════════════════════════
   4. FILTRES PAR CATÉGORIE
   ══════════════════════════════════════════ */
function initFilters() {
  const filterBtns = document.querySelectorAll('.filter-tag');
  if (!filterBtns.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', function () {
      filterBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });

      this.classList.add('active');
      this.setAttribute('aria-pressed', 'true');

      const filter = this.dataset.filter;
      const cards  = document.querySelectorAll('#events-grid .event-card');

      cards.forEach(card => {
        const match = filter === 'all' || card.dataset.category === filter;
        card.style.display = match ? '' : 'none';
        card.setAttribute('aria-hidden', String(!match));
      });
    });
  });
}

/* ══════════════════════════════════════════
   5. RECHERCHE
   ══════════════════════════════════════════ */
function initSearch() {
  const searchInput = document.getElementById('search-input');
  const searchBtn   = document.getElementById('search-btn');
  if (!searchInput) return;

  function doSearch() {
    const q     = searchInput.value.toLowerCase().trim();
    const cards = document.querySelectorAll('#events-grid .event-card');

    cards.forEach(card => {
      const text  = card.textContent.toLowerCase();
      const match = !q || text.includes(q);
      card.style.display = match ? '' : 'none';
      card.setAttribute('aria-hidden', String(!match));
    });

    if (q) showToast(`Résultats pour « ${searchInput.value} »`, 'info');
  }

  searchBtn?.addEventListener('click', doSearch);
  searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });
}

/* ══════════════════════════════════════════
   6. COMPTEURS ANIMÉS — section stats
   ══════════════════════════════════════════ */
function animateCount(el, target, duration = 1400) {
  const start = performance.now();
  const update = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased    = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target).toLocaleString('fr-FR');
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

function initCounters() {
  if (!('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const target = parseInt(entry.target.dataset.count, 10);
      if (!isNaN(target)) animateCount(entry.target, target);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('[data-count]').forEach(el => observer.observe(el));
}

/* ══════════════════════════════════════════
   7. ANIMATIONS AU SCROLL (animate-in)
   ══════════════════════════════════════════ */
function initScrollAnimations() {
  if (!('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (!entry.isIntersecting) return;
      setTimeout(() => entry.target.classList.add('visible'), i * 80);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.animate-in').forEach(el => observer.observe(el));
}

/* ══════════════════════════════════════════
   8. MODAL VIDÉO
   ══════════════════════════════════════════ */
function initVideoModal() {
  const modal    = document.getElementById('video-modal');
  const trigger  = document.querySelector('[data-video-trigger]');
  const closeBtn = document.querySelector('.video-modal-close');
  if (!modal) return;

  function openModal() {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    closeBtn?.focus();
  }

  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    const vid = modal.querySelector('video');
    if (vid) vid.pause();
    trigger?.focus();
  }

  trigger?.addEventListener('click', openModal);
  trigger?.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(); }
  });
  closeBtn?.addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });
}

/* ══════════════════════════════════════════
   9. PAGINATION AVEC CHARGEMENT API
   ══════════════════════════════════════════ */
function initPagination() {
  document.querySelectorAll('.page-btn').forEach(btn => {
    const label = btn.textContent.trim();

    if (label === '←' || label === '→') {
      btn.addEventListener('click', () => showToast('Navigation entre les pages', 'info'));
      return;
    }

    btn.addEventListener('click', async function () {
      document.querySelectorAll('.page-btn').forEach(b => {
        b.classList.remove('active');
        b.removeAttribute('aria-current');
      });
      this.classList.add('active');
      this.setAttribute('aria-current', 'page');

      const page = parseInt(this.textContent, 10);
      await loadEvents({ page });

      const section = document.getElementById('evenements');
      if (section) window.scrollTo({ top: section.offsetTop - 80, behavior: 'smooth' });
    });
  });
}

/* ══════════════════════════════════════════
   10. NEWSLETTER
   ══════════════════════════════════════════ */
async function handleNewsletter(e) {
  e.preventDefault();
  const emailInput = document.getElementById('newsletter-email');
  const email      = emailInput.value;
  const btn        = e.target.querySelector('[type="submit"]');

  /* État chargement */
  const originalText = btn.textContent;
  btn.textContent    = 'Envoi…';
  btn.disabled       = true;

  try {
    await apiFetch('/newsletter/subscribe', {
      method:   'POST',
      useCache: false,
      body:     JSON.stringify({ email }),
    });
    showToast(`Inscription confirmée pour ${email} ! 🎉`, 'success');
    e.target.reset();
  } catch (err) {
    const msg = err instanceof ApiError && err.status === 409
      ? 'Cette adresse est déjà inscrite.'
      : 'Erreur lors de l\'inscription. Réessayez.';
    showToast(msg, 'error');
  } finally {
    btn.textContent = originalText;
    btn.disabled    = false;
  }
}

/* ══════════════════════════════════════════
   A. ANIMATIONS API — chargement des configs
   ══════════════════════════════════════════ */

/**
 * Squelette de chargement (skeleton screen) affiché pendant le fetch.
 * @param {HTMLElement} grid  — conteneur cible
 * @param {number}      count — nombre de cartes squelette
 */
function showSkeletons(grid, count = 6) {
  grid.innerHTML = Array.from({ length: count }, () => `
    <article class="event-card skeleton" aria-hidden="true">
      <div class="skeleton-img"></div>
      <div class="skeleton-line wide"></div>
      <div class="skeleton-line medium"></div>
      <div class="skeleton-line short"></div>
    </article>
  `).join('');
}

/**
 * Vide le contenu et affiche un état "vide" ou "erreur".
 * @param {HTMLElement} grid
 * @param {string}      type  — 'empty' | 'error'
 */
function showGridState(grid, type) {
  const config = {
    empty: { icon: '🗓️', title: 'Aucun événement', text: 'Revenez bientôt !' },
    error: { icon: '⚠️', title: 'Erreur de chargement', text: 'Impossible de récupérer les événements. Réessayez.' },
  }[type] ?? {};

  grid.innerHTML = `
    <div class="grid-state ${type}" role="${type === 'error' ? 'alert' : 'status'}">
      <span class="grid-state-icon">${config.icon}</span>
      <strong>${config.title}</strong>
      <p>${config.text}</p>
      ${type === 'error' ? '<button class="btn btn-outline" id="retry-btn">Réessayer</button>' : ''}
    </div>
  `;

  if (type === 'error') {
    grid.querySelector('#retry-btn')?.addEventListener('click', () => loadEvents());
  }
}

/**
 * Construit une carte événement depuis les données API.
 * @param {object} event — payload normalisé depuis l'API
 * @returns {string}     — HTML de la carte
 */
function buildEventCard(event) {
  const date = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(event.date));

  const badge = event.isFree
    ? '<span class="badge badge-free">Gratuit</span>'
    : (event.price ? `<span class="badge badge-paid">${event.price} €</span>` : '');

  return `
    <article
      class="event-card animate-in"
      data-category="${escapeAttr(event.category)}"
      data-id="${escapeAttr(String(event.id))}"
      tabindex="0"
    >
      <div class="card-img-wrap">
        <img
          src="${escapeAttr(event.imageUrl)}"
          alt="${escapeAttr(event.title)}"
          loading="lazy"
          width="400" height="240"
          onerror="this.src='/assets/img/placeholder.webp'"
        />
        ${badge}
      </div>
      <div class="card-body">
        <p class="card-date">${date}</p>
        <h3 class="card-title">${escapeHtml(event.title)}</h3>
        <p class="card-location">📍 ${escapeHtml(event.location)}</p>
        <a
          href="/event/${encodeURIComponent(event.slug)}"
          class="btn btn-sm btn-primary"
          aria-label="Voir les détails : ${escapeAttr(event.title)}"
        >Voir les détails</a>
      </div>
    </article>
  `;
}

/* Helpers XSS */
const _el = document.createElement('div');
function escapeHtml(str) {
  _el.textContent = String(str);
  return _el.innerHTML;
}
function escapeAttr(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Charge les événements depuis l'API et met à jour la grille.
 * Si l'API est indisponible, le contenu HTML statique existant est conservé.
 *
 * @param {object} [params]          — filtres optionnels
 * @param {number} [params.page=1]
 * @param {string} [params.category]
 * @param {string} [params.q]        — terme de recherche
 * @param {boolean} [params.force]   — forcer le rechargement même si contenu statique présent
 */
async function loadEvents(params = {}) {
  const grid = document.getElementById('events-grid');
  if (!grid) return;

  /* ── Vérification : y a-t-il déjà du contenu HTML statique ? ── */
  const hasStaticContent = grid.querySelectorAll('.event-card:not(.skeleton)').length > 0;

  /* Sans forçage ET avec contenu statique → ne pas toucher au DOM, API pas encore branchée */
  if (hasStaticContent && !params.force) {
    console.info('[VilleNova] Contenu statique détecté — chargement API ignoré. Définissez params.force=true pour remplacer.');
    return;
  }

  /* ── Sauvegarde du contenu existant (filet de sécurité) ── */
  const backup = grid.innerHTML;

  /* Construire la query string */
  const qs = new URLSearchParams({
    page:     params.page     ?? 1,
    per_page: params.perPage  ?? 9,
    ...(params.category && params.category !== 'all' ? { category: params.category } : {}),
    ...(params.q ? { q: params.q } : {}),
  }).toString();

  showSkeletons(grid);

  try {
    const { data: events, meta } = await apiFetch(`/events?${qs}`);

    if (!events?.length) {
      showGridState(grid, 'empty');
      return;
    }

    /* Injection HTML + ré-observation pour les animations scroll */
    grid.innerHTML = events.map(buildEventCard).join('');
    initScrollAnimations();
    updatePaginationMeta(meta);

  } catch (err) {
    console.warn('[VilleNova] loadEvents — API indisponible, restauration du contenu statique.', err.message);

    /* ── Restauration du contenu HTML de secours ── */
    grid.innerHTML = backup;
    initScrollAnimations();

    /* Toast discret uniquement sur les rechargements explicites (page > 1) */
    if (params.page > 1) {
      showToast('Impossible de charger la page suivante.', 'error');
    }
  }
}

/**
 * Met à jour les boutons de pagination avec les métadonnées renvoyées par l'API.
 * Structure attendue : { currentPage, totalPages, totalItems }
 */
function updatePaginationMeta(meta) {
  if (!meta) return;
  const info = document.querySelector('.pagination-info');
  if (info) {
    info.textContent = `Page ${meta.currentPage} / ${meta.totalPages} — ${meta.totalItems} événements`;
  }
}

/* ══════════════════════════════════════════
   B. ANIMATIONS CONFIG API
      Charge des paramètres d'animation définis
      côté serveur (durées, courbes, thèmes…)
   ══════════════════════════════════════════ */

/**
 * Applique les variables CSS d'animation fournies par l'API.
 * Payload attendu : { duration, easing, stagger, theme }
 *
 * Exemple de réponse :
 * {
 *   "duration": 600,
 *   "easing": "cubic-bezier(0.22, 1, 0.36, 1)",
 *   "stagger": 80,
 *   "theme": { "accentColor": "#e63946", "cardRadius": "12px" }
 * }
 */
async function loadAnimationConfig() {
  try {
    const config = await apiFetch('/animations/config', { cacheTTL: 300_000 /* 5 min */ });

    const root = document.documentElement;

    if (config.duration)    root.style.setProperty('--anim-duration',  `${config.duration}ms`);
    if (config.easing)      root.style.setProperty('--anim-easing',     config.easing);
    if (config.stagger)     root.style.setProperty('--anim-stagger',   `${config.stagger}ms`);

    if (config.theme) {
      Object.entries(config.theme).forEach(([key, val]) => {
        /* Convertit camelCase → --kebab-case */
        const prop = '--' + key.replace(/([A-Z])/g, m => `-${m.toLowerCase()}`);
        root.style.setProperty(prop, val);
      });
    }

    console.info('[VilleNova] Animation config applied:', config);
  } catch (err) {
    /* Non-bloquant : on garde les valeurs CSS par défaut */
    console.warn('[VilleNova] Animation config unavailable, using defaults.', err.message);
  }
}

/* ══════════════════════════════════════════
   C. STATS API — compteurs depuis le serveur
   ══════════════════════════════════════════ */

/**
 * Remplace les valeurs statiques [data-count] par celles de l'API,
 * puis déclenche l'animation habituelle.
 */
async function loadStatsFromAPI() {
  try {
    const stats = await apiFetch('/stats');
    /* Exemple : { events: 1240, participants: 45000, partners: 38 } */

    Object.entries(stats).forEach(([key, value]) => {
      const el = document.querySelector(`[data-stat="${key}"]`);
      if (el && typeof value === 'number') {
        el.dataset.count = value;          // mis à jour avant que l'observer ne déclenche
      }
    });

  } catch (err) {
    /* Non-bloquant : les valeurs data-count statiques du HTML restent intactes */
    console.info('[VilleNova] Stats API indisponible — valeurs statiques conservées.');
  }
}

/* ══════════════════════════════════════════
   11. POINT D'ENTRÉE
   ══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {

  /* ── Initialisations synchrones ── */
  initNav();
  initFilters();
  initSearch();
  initScrollAnimations();
  initVideoModal();
  initPagination();

  /* ── Appels API en parallèle (non-bloquants) ── */
  await Promise.allSettled([
    loadAnimationConfig(),   // Paramètres d'animation server-side
    loadStatsFromAPI(),      // Compteurs dynamiques
    loadEvents(),            // Grille d'événements
  ]);

  /* Compteurs démarrés après que les valeurs API sont injectées */
  initCounters();
});

/* ══════════════════════════════════════════
   NEWSLETTER
   ══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('newsletter-form');
  if (form) form.addEventListener('submit', handleNewsletter);
});

/* ══════════════════════════════════════════
   EXPORT (pour les tests unitaires / modules)
   ══════════════════════════════════════════ */
if (typeof module !== 'undefined') {
  module.exports = { apiFetch, loadEvents, buildEventCard, loadAnimationConfig };
}


/*api opengenda* carte 1*/
const API_KEY = "832ecfba688a4dda9e6beb28922ee893";
const AGENDA_UID = "24882772";

function formatDateFr(value) {
  if (!value) return "Date non précisée";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Date non précisée";

  const datePart = d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long"
  });

  const timePart = d.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit"
  });

  return `${datePart}, ${timePart}`;
}

function getFirstTimingDate(ev) {
  const t = ev?.timings?.[0];
  return t?.begin || t?.beginDate || t?.date || null;
}

async function loadEventCard1() {
  try {
    const url =
      `https://api.openagenda.com/v2/agendas/${AGENDA_UID}/events?` +
      new URLSearchParams({
        key: API_KEY,
        "relative[]": "upcoming",
        limit: 20
      });

    const res = await fetch(url);
    const data = await res.json();

    console.log("Réponse OpenAgenda:", data);

    const events = Array.isArray(data.events) ? data.events : [];
    if (!events.length) {
      console.warn("Aucun événement dans data.events");
      return;
    }

    const ev = events.find(e => e.image?.src && (e.timings?.length || e.begin)) || events[0];

    console.log("Événement choisi:", ev);
    console.log("Timings:", ev.timings);

    const title = ev.title?.fr || ev.title || "Événement";
    const desc = ev.description?.fr || ev.description || "";
    const image = ev.image?.src || "";
    const place = ev.location?.name || ev.location?.address?.name || "Lieu non précisé";
    const category = ev.keywords?.[0] || ev.keywords?.fr?.[0] || "Événement";

    const dateValue = getFirstTimingDate(ev);
    const dateText = dateValue ? formatDateFr(dateValue) : "Date non précisée";

    const imgEl = document.getElementById("ev1-img");
    if (imgEl) {
      if (image) imgEl.src = image;
      imgEl.alt = title;
    }

    const titleEl = document.getElementById("ev1-title");
    if (titleEl) titleEl.textContent = title;

    const descEl = document.getElementById("ev1-desc");
    if (descEl) descEl.textContent = desc;

    const dateEl = document.getElementById("ev1-date");
    if (dateEl) dateEl.textContent = "📅 " + dateText;

    const placeEl = document.getElementById("ev1-place");
    if (placeEl) placeEl.textContent = "📍 " + place;

    const categoryEl = document.getElementById("ev1-category");
    if (categoryEl) categoryEl.textContent = category;

    const badgeEl = document.getElementById("ev1-badge");
    if (badgeEl) badgeEl.textContent = category;

    const linkEl = document.getElementById("ev1-link");
    if (linkEl) linkEl.href = `/html/evenement-detail.html?id=${ev.uid}`;
  } catch (error) {
    console.error("Erreur OpenAgenda :", error);
  }
}

document.addEventListener("DOMContentLoaded", loadEventCard1);