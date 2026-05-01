'use strict';

/* ══════════════════════════════════════════
   0. CONFIGURATION OPENAGENDA
   ══════════════════════════════════════════ */
const OA_KEY       = "832ecfba688a4dda9e6beb28922ee893";
const OA_AGENDA_UID = "24882772";
const OA_BASE      = "https://api.openagenda.com/v2";

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
   6. COMPTEURS ANIMÉS
   ══════════════════════════════════════════ */
function animateCount(el, target, duration = 1400) {
  const start  = performance.now();
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
   9. PAGINATION (statique)
   ══════════════════════════════════════════ */
function initPagination() {
  document.querySelectorAll('.page-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      const label = this.textContent.trim();
      if (label === '←' || label === '→') return;

      document.querySelectorAll('.page-btn').forEach(b => {
        b.classList.remove('active');
        b.removeAttribute('aria-current');
      });
      this.classList.add('active');
      this.setAttribute('aria-current', 'page');

      const section = document.getElementById('evenements');
      if (section) window.scrollTo({ top: section.offsetTop - 80, behavior: 'smooth' });
    });
  });
}

/* ══════════════════════════════════════════
   10. NEWSLETTER (sans API VilleNova)
   ══════════════════════════════════════════ */
function handleNewsletter(e) {
  e.preventDefault();
  const emailInput = document.getElementById('newsletter-email');
  const email      = emailInput?.value?.trim();
  const btn        = e.target.querySelector('[type="submit"]');

  if (!email) {
    showToast('Veuillez entrer une adresse email valide.', 'error');
    return;
  }

  const originalText = btn.textContent;
  btn.textContent    = 'Envoi…';
  btn.disabled       = true;

  /* Simuler une inscription (à remplacer par votre propre endpoint si disponible) */
  setTimeout(() => {
    showToast(`Inscription confirmée pour ${email} ! 🎉`, 'success');
    e.target.reset();
    btn.textContent = originalText;
    btn.disabled    = false;
  }, 800);
}

/* ══════════════════════════════════════════
   A. UTILITAIRES UI GRILLE
   ══════════════════════════════════════════ */

/** Affiche des cartes squelette pendant un chargement. */
function showSkeletons(grid, count = 3) {
  grid.innerHTML = Array.from({ length: count }, () => `
    <article class="event-card skeleton" aria-hidden="true">
      <div class="skeleton-img"></div>
      <div class="skeleton-line wide"></div>
      <div class="skeleton-line medium"></div>
      <div class="skeleton-line short"></div>
    </article>
  `).join('');
}

/** Affiche un état vide ou erreur dans la grille. */
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
    grid.querySelector('#retry-btn')?.addEventListener('click', () => loadOpenAgendaCards());
  }
}

/* Helpers anti-XSS */
const _el = document.createElement('div');
function escapeHtml(str) {
  _el.textContent = String(str ?? '');
  return _el.innerHTML;
}
function escapeAttr(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* ══════════════════════════════════════════
   B. OPENAGENDA — UTILITAIRES
   ══════════════════════════════════════════ */

/**
 * Formate une date ISO en "lundi 5 mai, 19h00".
 */
function formatDateFr(value) {
  if (!value) return 'Date non précisée';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'Date non précisée';

  const datePart = d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day:     'numeric',
    month:   'long',
  });
  const timePart = d.toLocaleTimeString('fr-FR', {
    hour:   '2-digit',
    minute: '2-digit',
  });
  return `${datePart}, ${timePart}`;
}

/**
 * Retourne la date de début du premier timing d'un événement OpenAgenda.
 */
function getFirstTimingDate(ev) {
  const t = ev?.timings?.[0];
  return t?.begin || t?.beginDate || t?.date || null;
}

/**
 * Retourne la date de fin du dernier timing (pour les événements multi-jours).
 */
function getLastTimingDate(ev) {
  const timings = ev?.timings;
  if (!timings?.length) return null;
  const t = timings[timings.length - 1];
  return t?.end || t?.endDate || null;
}

/**
 * Construit un label de prix depuis les conditions OpenAgenda.
 * Retourne "Gratuit", "X €" ou "Voir détails".
 */
function getPrix(ev) {
  if (ev.free === 1 || ev.free === true) return 'Gratuit';
  const cond = ev.conditions?.fr || ev.conditions?.en || '';
  return cond || 'Voir détails';
}

/**
 * Extrait le premier mot-clé significatif comme catégorie.
 */
function getCategory(ev) {
  const kws = ev.keywords?.fr || ev.keywords || [];
  return Array.isArray(kws) ? (kws[0] || 'Événement') : 'Événement';
}

/**
 * Choisit la meilleure URL d'image disponible dans un événement OpenAgenda.
 */
function getImage(ev) {
  return (
    ev.image?.['1000x625'] ||
    ev.image?.['800x500']  ||
    ev.image?.['400x250']  ||
    ev.image?.base         ||
    ev.image?.src          ||
    ev.thumbnail           ||
    ''
  );
}

/* ══════════════════════════════════════════
   C. OPENAGENDA — FETCH CENTRAL
   ══════════════════════════════════════════ */

/**
 * Récupère N événements à venir depuis OpenAgenda.
 * @param {number} limit — nombre max d'événements voulus
 * @returns {Promise<object[]>} — tableau d'événements bruts
 */
async function fetchOAEvents(limit = 6) {
  const params = new URLSearchParams({
    key:          OA_KEY,
    'relative[]': 'upcoming',
    limit,
    sort:         'timings.asc',
    lang:         'fr',
  });

  const url = `${OA_BASE}/agendas/${OA_AGENDA_UID}/events?${params}`;
  const res  = await fetch(url);

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`OpenAgenda HTTP ${res.status} — ${txt.slice(0, 200)}`);
  }

  const data = await res.json();

  if (!Array.isArray(data.events) || !data.events.length) {
    throw new Error('Aucun événement retourné par OpenAgenda.');
  }

  return data.events;
}

/* ══════════════════════════════════════════
   D. OPENAGENDA — CARTE 1  (ciblage par IDs)
   Remplit les éléments #ev1-* avec le 1er événement
   ══════════════════════════════════════════ */

/**
 * Injecte les données d'un événement dans un bloc de carte (ev1, ev2, ev3…).
 * @param {string} prefix — "ev1" | "ev2" | "ev3"
 * @param {object} ev     — événement brut OpenAgenda
 */
function fillCardBlock(prefix, ev) {
  const get = (id) => document.getElementById(`${prefix}-${id}`);

  const title    = ev.title?.fr    || ev.title    || 'Événement';
  const desc     = ev.description?.fr || ev.description || '';
  const image    = getImage(ev);
  const place    = ev.location?.name || ev.location?.address?.name || 'Lieu non précisé';
  const category = getCategory(ev);
  const prix     = getPrix(ev);

  const dateBegin = getFirstTimingDate(ev);
  const dateEnd   = getLastTimingDate(ev);
  const dateText  = dateBegin ? formatDateFr(dateBegin) : 'Date non précisée';

  /* Période : multi-jours ou simple date */
  let periodText = dateText;
  if (dateEnd && dateBegin) {
    const dBegin = new Date(dateBegin);
    const dEnd   = new Date(dateEnd);
    if (dEnd.toDateString() !== dBegin.toDateString()) {
      periodText = `Du ${formatDateFr(dateBegin)} au ${formatDateFr(dateEnd)}`;
    }
  }

  /* ── Image ── */
  const imgEl = get('img');
  if (imgEl) {
    imgEl.src   = image || '/assets/img/placeholder.webp';
    imgEl.alt   = escapeAttr(title);
    imgEl.onerror = () => { imgEl.src = '/assets/img/placeholder.webp'; };
  }

  /* ── Textes ── */
  const titleEl = get('title');
  if (titleEl) titleEl.textContent = title;

  const descEl = get('desc');
  if (descEl) descEl.textContent = desc;

  const dateEl = get('date');
  if (dateEl) dateEl.textContent = '📅 ' + periodText;

  const placeEl = get('place');
  if (placeEl) placeEl.textContent = '📍 ' + place;

  const prixEl = get('prix');
  if (prixEl) prixEl.textContent = '💶 ' + prix;

  const categoryEl = get('category');
  if (categoryEl) categoryEl.textContent = category;

  const badgeEl = get('badge');
  if (badgeEl) {
    badgeEl.textContent = category;
    badgeEl.className   = `badge badge-category badge--${category.toLowerCase().replace(/\s+/g, '-')}`;
  }

  /* ── Lien vers la page détail ── */
  const linkEl = get('link');
  if (linkEl) {
    linkEl.href = `/html/evenement-detail.html?id=${ev.uid}`;
    linkEl.setAttribute('aria-label', `Voir les détails : ${title}`);
  }

  /* ── Lien externe OpenAgenda (si disponible) ── */
  const externalLinkEl = get('external');
  if (externalLinkEl) {
    const oaLink = (ev.links || []).find(l => l.link)?.link;
    if (oaLink) {
      externalLinkEl.href    = oaLink;
      externalLinkEl.target  = '_blank';
      externalLinkEl.rel     = 'noopener noreferrer';
    } else {
      externalLinkEl.style.display = 'none';
    }
  }

  /* ── Animation ── */
  const cardEl = get('card') || document.getElementById(`card-${prefix}`);
  if (cardEl) {
    cardEl.classList.add('animate-in');
    setTimeout(() => cardEl.classList.add('visible'), 100);
  }
}

/* ══════════════════════════════════════════
   E. OPENAGENDA — GRILLE COMPLÈTE
   Charge N événements dans #events-grid
   (chaque carte est construite dynamiquement)
   ══════════════════════════════════════════ */

/**
 * Construit le HTML d'une carte événement pour la grille.
 */
function buildOAEventCard(ev, index = 0) {
  const title    = escapeHtml(ev.title?.fr || ev.title || 'Événement');
  const desc     = escapeHtml((ev.description?.fr || ev.description || '').substring(0, 120));
  const image    = escapeAttr(getImage(ev));
  const place    = escapeHtml(ev.location?.name || 'Lieu non précisé');
  const category = escapeHtml(getCategory(ev));
  const prix     = escapeHtml(getPrix(ev));
  const dateText = escapeHtml(formatDateFr(getFirstTimingDate(ev)));
  const slug     = encodeURIComponent(ev.uid || index);
  const isFree   = ev.free === 1 || ev.free === true;

  return `
    <article
      class="event-card animate-in"
      data-category="${escapeAttr(getCategory(ev).toLowerCase())}"
      data-id="${escapeAttr(String(ev.uid ?? index))}"
      tabindex="0"
      aria-label="${title}, ${dateText}"
    >
      <div class="card-img-wrap">
        <img
          src="${image || '/assets/img/placeholder.webp'}"
          alt="${escapeAttr(ev.title?.fr || '')}"
          loading="lazy"
          width="400" height="240"
          onerror="this.src='/assets/img/placeholder.webp'"
        />
        <span class="badge ${isFree ? 'badge-free' : 'badge-category'}">${isFree ? 'Gratuit' : category}</span>
      </div>
      <div class="card-body">
        <p class="card-date">📅 ${dateText}</p>
        <h3 class="card-title">${title}</h3>
        <p class="card-location">📍 ${place}</p>
        <p class="card-desc">${desc}${(ev.description?.fr || '').length > 120 ? '…' : ''}</p>
        <p class="card-price">💶 ${prix}</p>
        <a
          href="/html/evenement-detail.html?id=${slug}"
          class="btn btn-sm btn-primary"
          aria-label="Voir les détails : ${escapeAttr(ev.title?.fr || '')}"
        >Voir les détails →</a>
      </div>
    </article>
  `;
}

/**
 * Charge et affiche les événements OpenAgenda dans #events-grid.
 * Compatible avec le contenu HTML statique existant
 * (remplace uniquement si la grille est vide ou si force=true).
 */
async function loadOpenAgendaGrid(options = {}) {
  const grid  = document.getElementById('events-grid');
  if (!grid) return;

  const hasStatic = grid.querySelectorAll('.event-card:not(.skeleton)').length > 0;
  if (hasStatic && !options.force) {
    console.info('[VilleNova] Grille statique conservée. Passez force:true pour remplacer.');
    return;
  }

  showSkeletons(grid, options.limit ?? 6);

  try {
    const events = await fetchOAEvents(options.limit ?? 6);
    grid.innerHTML = events.map((ev, i) => buildOAEventCard(ev, i)).join('');
    initScrollAnimations();
  } catch (err) {
    console.error('[VilleNova] Grille OpenAgenda :', err.message);
    showGridState(grid, 'error');
  }
}

/* ══════════════════════════════════════════
   F. OPENAGENDA — CARTES NOMMÉES (ev1, ev2, ev3…)
   Remplit les blocs HTML ciblés par IDs #ev1-*, #ev2-*, etc.
   ══════════════════════════════════════════ */

/**
 * Point d'entrée principal pour toutes les cartes nommées de la page.
 * Détecte automatiquement combien de blocs ev1/ev2/ev3 existent dans le DOM,
 * puis injecte les données OpenAgenda dans chacun.
 */
async function loadOpenAgendaCards() {
  /* Trouver tous les préfixes présents dans le DOM (ev1, ev2, ev3…) */
  const prefixes = [];
  for (let i = 1; i <= 9; i++) {
    const prefix = `ev${i}`;
    /* Un bloc est "présent" s'il contient au moins un élément avec un id ev{n}-* */
    if (document.querySelector(`[id^="${prefix}-"]`)) {
      prefixes.push(prefix);
    }
  }

  if (!prefixes.length) return; // aucune carte nommée dans la page

  /* Afficher un état squelette par carte pendant le chargement */
  prefixes.forEach(prefix => {
    const imgEl = document.getElementById(`${prefix}-img`);
    if (imgEl) imgEl.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAEALAAAAAABAAEAAAICRAEAOw=='; // pixel transparent
  });

  try {
    const events = await fetchOAEvents(prefixes.length);

    prefixes.forEach((prefix, index) => {
      const ev = events[index];
      if (ev) {
        fillCardBlock(prefix, ev);
      } else {
        console.warn(`[VilleNova] Pas d'événement pour ${prefix}`);
      }
    });

  } catch (err) {
    console.error('[VilleNova] Erreur chargement des cartes :', err.message);
    showToast('Impossible de charger certains événements.', 'error');
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
  initCounters();

  /* ── Newsletter ── */
  const form = document.getElementById('newsletter-form');
  if (form) form.addEventListener('submit', handleNewsletter);

  /* ── OpenAgenda : cartes nommées ET grille en parallèle ── */
  await Promise.allSettled([
    loadOpenAgendaCards(),   // ev1-img, ev2-title, etc.
    loadOpenAgendaGrid(),    // #events-grid (seulement si vide)
  ]);
});

/* ══════════════════════════════════════════
   EXPORT (tests / modules ES)
   ══════════════════════════════════════════ */
if (typeof module !== 'undefined') {
  module.exports = {
    fetchOAEvents,
    fillCardBlock,
    buildOAEventCard,
    loadOpenAgendaCards,
    loadOpenAgendaGrid,
  };
}