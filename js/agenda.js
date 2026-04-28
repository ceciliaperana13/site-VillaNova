/* ============================================================
   VilleNova — agenda.js
   Gestion complète de l'agenda : données, calendrier,
   liste, filtres, recherche, panneau de détail, loader.
   ============================================================ */

'use strict';

/* ── 1. DONNÉES ÉVÉNEMENTS ────────────────────────────────── */

const EVENTS = [
  {
    id: 1,
    titre: 'Festival Marseille Jazz des Cinq Continents',
    date: '2025-05-03',
    dateFin: '2025-05-10',
    heure: '19h00',
    lieu: 'Jardins du Palais Longchamp',
    categorie: 'festival',
    prix: 'Gratuit – 45 €',
    description:
      'Le rendez-vous incontournable du jazz méditerranéen. Artistes internationaux, scènes en plein air et ateliers pour tous les publics.',
    image: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=600&q=80',
    lien: '#',
    tags: ['jazz', 'plein air', 'international'],
  },
  {
    id: 2,
    titre: 'Exposition Cézanne & La Méditerranée',
    date: '2025-05-08',
    dateFin: '2025-06-30',
    heure: '10h00 – 18h00',
    lieu: 'Musée des Beaux-Arts',
    categorie: 'expo',
    prix: '12 € / 8 € réduit',
    description:
      'Une plongée dans l\'univers lumineux de Cézanne. Plus de 80 œuvres autour de la lumière et des paysages du Sud.',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80',
    lien: '#',
    tags: ['peinture', 'impressionnisme', 'patrimoine'],
  },
  {
    id: 3,
    titre: 'Concert Ibrahim Maalouf',
    date: '2025-05-15',
    dateFin: null,
    heure: '20h30',
    lieu: 'Le Silo',
    categorie: 'concert',
    prix: '35 € – 55 €',
    description:
      'Le trompettiste franco-libanais de renommée mondiale revient à Marseille pour une soirée fusion entre jazz, musiques arabes et électro.',
    image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=600&q=80',
    lien: '#',
    tags: ['jazz', 'world music', 'trompette'],
  },
  {
    id: 4,
    titre: 'Marché Nocturne des Créateurs',
    date: '2025-05-17',
    dateFin: null,
    heure: '18h00 – 23h00',
    lieu: 'Cours Julien',
    categorie: 'gastro',
    prix: 'Entrée libre',
    description:
      'Une soirée festive au cœur du quartier créatif. Artisans locaux, food trucks et animations musicales toute la nuit.',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80',
    lien: '#',
    tags: ['artisanat', 'food', 'nuit'],
  },
  {
    id: 5,
    titre: 'Marseille vs Lyon — Ligue 1',
    date: '2025-05-21',
    dateFin: null,
    heure: '21h00',
    lieu: 'Stade Vélodrome',
    categorie: 'sport',
    prix: '20 € – 120 €',
    description:
      'Le choc des titans ! Le classique OM-OL dans une ambiance électrique au Vélodrome pour la 36e journée de Ligue 1.',
    image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=600&q=80',
    lien: '#',
    tags: ['football', 'ligue 1', 'OM'],
  },
  {
    id: 6,
    titre: 'La Mouette de Tchekhov',
    date: '2025-05-24',
    dateFin: '2025-05-31',
    heure: '20h00',
    lieu: 'Théâtre du Gymnase',
    categorie: 'theatre',
    prix: '18 € / 12 € réduit',
    description:
      'Mise en scène contemporaine du chef-d\'œuvre de Tchekhov par la compagnie Zéphyr. Une relecture lumineuse et décalée.',
    image: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=600&q=80',
    lien: '#',
    tags: ['théâtre classique', 'Tchekhov', 'mise en scène'],
  },
  {
    id: 7,
    titre: 'Fête de la Musique — Place de la Préfecture',
    date: '2025-06-21',
    dateFin: null,
    heure: '17h00 – 01h00',
    lieu: 'Place de la Préfecture',
    categorie: 'concert',
    prix: 'Gratuit',
    description:
      'La grande fête nationale de la musique investit le centre-ville. Scènes gratuites, artistes locaux et atmosphère festive.',
    image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&q=80',
    lien: '#',
    tags: ['gratuit', 'outdoor', 'fête nationale'],
  },
];

/* ── 2. ÉTAT GLOBAL ───────────────────────────────────────── */

const state = {
  currentDate: new Date(2025, 4, 1), // Mai 2025
  view: 'calendar',                  // 'calendar' | 'list'
  activeFilter: 'all',
  searchQuery: '',
  selectedEventId: null,
};

/* ── 3. UTILITAIRES ───────────────────────────────────────── */

const MOIS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

const JOURS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

const CAT_META = {
  festival: { emoji: '🎉', label: 'Festival',      color: '#D17B49' },
  concert:  { emoji: '🎵', label: 'Concert',       color: '#8B5E3C' },
  expo:     { emoji: '🖼', label: 'Exposition',    color: '#C2A27C' },
  theatre:  { emoji: '🎭', label: 'Théâtre',       color: '#6B8C6E' },
  gastro:   { emoji: '🍽', label: 'Gastronomie',   color: '#B05D5D' },
  sport:    { emoji: '⚽', label: 'Sport',         color: '#4A789C' },
};

/**
 * Parse une date ISO YYYY-MM-DD en objet Date local (sans décalage UTC).
 */
function parseDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Formate une date en "3 mai 2025".
 */
function formatDateFR(dateStr) {
  const d = parseDate(dateStr);
  return `${d.getDate()} ${MOIS_FR[d.getMonth()].toLowerCase()} ${d.getFullYear()}`;
}

/**
 * Retourne les événements correspondant au filtre et à la recherche actifs.
 */
function getFilteredEvents() {
  const q = state.searchQuery.toLowerCase().trim();
  return EVENTS.filter((ev) => {
    const catOk = state.activeFilter === 'all' || ev.categorie === state.activeFilter;
    if (!catOk) return false;
    if (!q) return true;
    return (
      ev.titre.toLowerCase().includes(q) ||
      ev.lieu.toLowerCase().includes(q) ||
      (ev.tags || []).some((t) => t.toLowerCase().includes(q))
    );
  });
}

/**
 * Retourne les événements présents sur un jour donné.
 */
function getEventsOnDay(year, month, day) {
  const target = new Date(year, month, day);
  return EVENTS.filter((ev) => {
    const start = parseDate(ev.date);
    const end = ev.dateFin ? parseDate(ev.dateFin) : start;
    return target >= start && target <= end;
  });
}

/* ── 4. RENDU CALENDRIER ──────────────────────────────────── */

function renderCalendar() {
  const year = state.currentDate.getFullYear();
  const month = state.currentDate.getMonth();

  // Mise à jour du titre
  document.getElementById('month-title').textContent =
    `${MOIS_FR[month]} ${year}`;

  const body = document.getElementById('cal-body');
  body.innerHTML = '';

  const firstDay = new Date(year, month, 1);
  // Lundi = 0 en ISO, dimanche = 6
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  // Cellules vides avant le 1er
  for (let i = 0; i < startOffset; i++) {
    const empty = document.createElement('div');
    empty.className = 'cal-cell cal-cell--empty';
    empty.setAttribute('role', 'gridcell');
    empty.setAttribute('aria-label', '');
    body.appendChild(empty);
  }

  const filtered = getFilteredEvents();
  const filteredIds = new Set(filtered.map((e) => e.id));

  for (let d = 1; d <= daysInMonth; d++) {
    const cell = document.createElement('div');
    cell.className = 'cal-cell';
    cell.setAttribute('role', 'gridcell');

    const dayEvents = getEventsOnDay(year, month, d).filter((e) => filteredIds.has(e.id));
    const isToday =
      today.getDate() === d &&
      today.getMonth() === month &&
      today.getFullYear() === year;

    if (isToday) cell.classList.add('cal-cell--today');
    if (dayEvents.length) cell.classList.add('cal-cell--has-events');

    const label = `${d} ${MOIS_FR[month]} ${year}${dayEvents.length ? `, ${dayEvents.length} événement(s)` : ''}`;
    cell.setAttribute('aria-label', label);

    // Numéro du jour
    const num = document.createElement('span');
    num.className = 'cal-day-num';
    num.textContent = d;
    cell.appendChild(num);

    // Points d'événements (max 3 affichés)
    if (dayEvents.length) {
      const dots = document.createElement('div');
      dots.className = 'cal-dots';
      dayEvents.slice(0, 3).forEach((ev) => {
        const dot = document.createElement('span');
        dot.className = 'cal-dot';
        dot.dataset.cat = ev.categorie;
        dot.setAttribute('title', ev.titre);
        dots.appendChild(dot);
      });
      if (dayEvents.length > 3) {
        const more = document.createElement('span');
        more.className = 'cal-dot-more';
        more.textContent = `+${dayEvents.length - 3}`;
        dots.appendChild(more);
      }
      cell.appendChild(dots);

      cell.style.cursor = 'pointer';
      cell.setAttribute('tabindex', '0');
      cell.addEventListener('click', () => openDayPanel(year, month, d, dayEvents));
      cell.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openDayPanel(year, month, d, dayEvents);
        }
      });
    }

    body.appendChild(cell);
  }

  // Mise à jour du résumé
  updateResultsSummary(filtered);
}

/* ── 5. RENDU LISTE ───────────────────────────────────────── */

function renderList() {
  const container = document.getElementById('list-container');
  const filtered = getFilteredEvents();
  container.innerHTML = '';

  if (!filtered.length) {
    container.innerHTML = `
      <div class="list-empty">
        <span style="font-size:2.5rem">🔍</span>
        <p>Aucun événement trouvé pour cette sélection.</p>
        <button onclick="resetFilters()" class="btn-reset">Réinitialiser les filtres</button>
      </div>`;
    updateResultsSummary(filtered);
    return;
  }

  // Grouper par mois
  const groups = {};
  filtered.forEach((ev) => {
    const d = parseDate(ev.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!groups[key]) groups[key] = { label: `${MOIS_FR[d.getMonth()]} ${d.getFullYear()}`, events: [] };
    groups[key].events.push(ev);
  });

  Object.values(groups).forEach((group) => {
    const section = document.createElement('div');
    section.className = 'list-group';

    const heading = document.createElement('h3');
    heading.className = 'list-group-heading';
    heading.textContent = group.label;
    section.appendChild(heading);

    group.events.forEach((ev) => {
      section.appendChild(buildEventCard(ev));
    });

    container.appendChild(section);
  });

  updateResultsSummary(filtered);
}

/**
 * Construit une carte d'événement pour la vue liste.
 */
function buildEventCard(ev) {
  const meta = CAT_META[ev.categorie] || {};
  const card = document.createElement('article');
  card.className = 'event-card';
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', `${ev.titre}, le ${formatDateFR(ev.date)} à ${ev.lieu}`);

  const dateRange = ev.dateFin
    ? `${formatDateFR(ev.date)} → ${formatDateFR(ev.dateFin)}`
    : formatDateFR(ev.date);

  card.innerHTML = `
    <div class="event-card-img" style="background-image:url('${ev.image}');" role="img" aria-label="${ev.titre}"></div>
    <div class="event-card-body">
      <div class="event-card-meta">
        <span class="event-badge" data-cat="${ev.categorie}">${meta.emoji || ''} ${meta.label || ev.categorie}</span>
        <span class="event-card-price">${ev.prix}</span>
      </div>
      <h4 class="event-card-title">${ev.titre}</h4>
      <p class="event-card-info">
        <span class="event-card-date">📅 ${dateRange}</span>
        <span class="event-card-time">🕐 ${ev.heure}</span>
        <span class="event-card-lieu">📍 ${ev.lieu}</span>
      </p>
      <p class="event-card-desc">${ev.description}</p>
      <div class="event-card-tags">
        ${(ev.tags || []).map((t) => `<span class="tag">${t}</span>`).join('')}
      </div>
    </div>
    <div class="event-card-actions">
      <button class="btn-detail" aria-label="Voir les détails de ${ev.titre}">Détails →</button>
    </div>
  `;

  card.querySelector('.btn-detail').addEventListener('click', () => openEventPanel(ev));
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') openEventPanel(ev);
  });

  return card;
}

/* ── 6. PANNEAU DE DÉTAIL ─────────────────────────────────── */

function openEventPanel(ev) {
  const meta = CAT_META[ev.categorie] || {};
  const panel = document.getElementById('event-panel');
  const overlay = document.getElementById('panel-overlay');
  const content = document.getElementById('panel-content');

  const dateRange = ev.dateFin
    ? `Du ${formatDateFR(ev.date)} au ${formatDateFR(ev.dateFin)}`
    : `Le ${formatDateFR(ev.date)}`;

  content.innerHTML = `
    <div class="panel-img-wrap">
      <img src="${ev.image}" alt="${ev.titre}" loading="lazy" />
      <span class="panel-badge" data-cat="${ev.categorie}">${meta.emoji || ''} ${meta.label || ev.categorie}</span>
    </div>
    <div class="panel-body">
      <h3 class="panel-title">${ev.titre}</h3>
      <ul class="panel-meta-list">
        <li><span class="panel-icon">📅</span> <span>${dateRange}</span></li>
        <li><span class="panel-icon">🕐</span> <span>${ev.heure}</span></li>
        <li><span class="panel-icon">📍</span> <span>${ev.lieu}</span></li>
        <li><span class="panel-icon">💶</span> <span>${ev.prix}</span></li>
      </ul>
      <p class="panel-desc">${ev.description}</p>
      <div class="panel-tags">
        ${(ev.tags || []).map((t) => `<span class="tag">${t}</span>`).join('')}
      </div>
      <a href="${ev.lien}" class="btn-cta panel-cta" target="_blank" rel="noopener noreferrer">
        Réserver / Plus d'infos →
      </a>
    </div>
  `;

  panel.setAttribute('aria-hidden', 'false');
  overlay.setAttribute('aria-hidden', 'false');
  panel.classList.add('is-open');
  overlay.classList.add('is-visible');

  // Focus trap : focus sur le bouton fermer
  const closeBtn = document.getElementById('panel-close');
  closeBtn.focus();

  document.body.style.overflow = 'hidden';
  state.selectedEventId = ev.id;
}

/**
 * Ouvre le panneau avec la liste des événements d'un jour (si plusieurs).
 */
function openDayPanel(year, month, day, events) {
  if (events.length === 1) {
    openEventPanel(events[0]);
    return;
  }

  const panel = document.getElementById('event-panel');
  const overlay = document.getElementById('panel-overlay');
  const content = document.getElementById('panel-content');

  const dayLabel = `${day} ${MOIS_FR[month]} ${year}`;

  content.innerHTML = `
    <div class="panel-body">
      <h3 class="panel-title">Événements du ${dayLabel}</h3>
      <ul class="panel-day-list">
        ${events
          .map((ev) => {
            const meta = CAT_META[ev.categorie] || {};
            return `<li>
              <button class="panel-day-item" data-id="${ev.id}" aria-label="Voir ${ev.titre}">
                <span class="panel-day-badge" data-cat="${ev.categorie}">${meta.emoji || ''}</span>
                <span class="panel-day-info">
                  <strong>${ev.titre}</strong>
                  <small>${ev.heure} · ${ev.lieu}</small>
                </span>
                <span class="panel-day-arrow">→</span>
              </button>
            </li>`;
          })
          .join('')}
      </ul>
    </div>
  `;

  // Événements sur les boutons de la liste
  content.querySelectorAll('.panel-day-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      const ev = EVENTS.find((e) => e.id === Number(btn.dataset.id));
      if (ev) openEventPanel(ev);
    });
  });

  panel.setAttribute('aria-hidden', 'false');
  overlay.setAttribute('aria-hidden', 'false');
  panel.classList.add('is-open');
  overlay.classList.add('is-visible');
  document.getElementById('panel-close').focus();
  document.body.style.overflow = 'hidden';
}

function closePanel() {
  const panel = document.getElementById('event-panel');
  const overlay = document.getElementById('panel-overlay');

  panel.classList.remove('is-open');
  overlay.classList.remove('is-visible');
  panel.setAttribute('aria-hidden', 'true');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  state.selectedEventId = null;
}

/* ── 7. FILTRES & RECHERCHE ───────────────────────────────── */

function setFilter(filter) {
  state.activeFilter = filter;

  document.querySelectorAll('.filter-tag').forEach((btn) => {
    const active = btn.dataset.filter === filter;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', String(active));
  });

  refresh();
}

function resetFilters() {
  state.activeFilter = 'all';
  state.searchQuery = '';
  document.getElementById('agenda-search').value = '';
  document.querySelectorAll('.filter-tag').forEach((btn) => {
    const active = btn.dataset.filter === 'all';
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', String(active));
  });
  refresh();
}

function updateResultsSummary(filtered) {
  const countEl = document.getElementById('results-count');
  const periodEl = document.getElementById('results-period');

  const n = filtered.length;
  countEl.textContent = `${n} événement${n > 1 ? 's' : ''}`;

  const year = state.currentDate.getFullYear();
  const month = state.currentDate.getMonth();
  periodEl.textContent = `en ${MOIS_FR[month]} ${year}`;
}

/* ── 8. NAVIGATION MENSUELLE ──────────────────────────────── */

function changeMonth(delta) {
  const d = state.currentDate;
  state.currentDate = new Date(d.getFullYear(), d.getMonth() + delta, 1);
  refresh();
}

/* ── 9. BASCULEMENT DE VUE ────────────────────────────────── */

function setView(view) {
  state.view = view;

  const calSection = document.getElementById('view-calendar');
  const listSection = document.getElementById('view-list');
  const btnCal = document.getElementById('btn-calendar');
  const btnList = document.getElementById('btn-list');

  if (view === 'calendar') {
    calSection.classList.remove('hidden');
    listSection.classList.add('hidden');
    btnCal.classList.add('active');
    btnList.classList.remove('active');
    btnCal.setAttribute('aria-pressed', 'true');
    btnList.setAttribute('aria-pressed', 'false');
    renderCalendar();
  } else {
    calSection.classList.add('hidden');
    listSection.classList.remove('hidden');
    btnCal.classList.remove('active');
    btnList.classList.add('active');
    btnCal.setAttribute('aria-pressed', 'false');
    btnList.setAttribute('aria-pressed', 'true');
    renderList();
  }
}

/* ── 10. RAFRAÎCHISSEMENT GLOBAL ──────────────────────────── */

function refresh() {
  if (state.view === 'calendar') {
    renderCalendar();
  } else {
    renderList();
  }
}

/* ── 11. TOAST ────────────────────────────────────────────── */

function showToast(message, type = 'info') {
  const container = document.querySelector('.toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.setAttribute('role', 'alert');
  toast.textContent = message;

  container.appendChild(toast);

  // Animation d'entrée
  requestAnimationFrame(() => toast.classList.add('toast--visible'));

  setTimeout(() => {
    toast.classList.remove('toast--visible');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  }, 3500);
}

/* ── 12. LOADER DE PAGE ───────────────────────────────────── */

function hideLoader() {
  const loader = document.getElementById('page-loader');
  if (!loader) return;
  loader.classList.add('loader--hidden');
  loader.addEventListener('transitionend', () => loader.remove(), { once: true });
}

/* ── 13. MENU BURGER (MOBILE) ─────────────────────────────── */

function initBurgerMenu() {
  const burger = document.querySelector('.nav-burger');
  const navLinks = document.getElementById('nav-links');
  if (!burger || !navLinks) return;

  burger.addEventListener('click', () => {
    const expanded = burger.getAttribute('aria-expanded') === 'true';
    burger.setAttribute('aria-expanded', String(!expanded));
    navLinks.classList.toggle('is-open', !expanded);
    burger.classList.toggle('is-active', !expanded);
  });

  // Fermeture au clic sur un lien
  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      burger.setAttribute('aria-expanded', 'false');
      navLinks.classList.remove('is-open');
      burger.classList.remove('is-active');
    });
  });
}

/* ── 14. FOCUS TRAP POUR LE PANNEAU ───────────────────────── */

function initFocusTrap() {
  const panel = document.getElementById('event-panel');
  if (!panel) return;

  panel.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;

    const focusables = [
      ...panel.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ),
    ].filter((el) => !el.hasAttribute('disabled'));

    if (!focusables.length) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
}

/* ── 15. INITIALISATION ───────────────────────────────────── */

function init() {
  // Masquer le loader après chargement
  window.addEventListener('load', () => {
    setTimeout(hideLoader, 400);
  });

  // Calendrier initial
  renderCalendar();

  /* Navigation mensuelle */
  document.getElementById('prev-month')?.addEventListener('click', () => changeMonth(-1));
  document.getElementById('next-month')?.addEventListener('click', () => changeMonth(1));

  /* Basculement de vue */
  document.getElementById('btn-calendar')?.addEventListener('click', () => setView('calendar'));
  document.getElementById('btn-list')?.addEventListener('click', () => setView('list'));

  /* Filtres catégories */
  document.querySelectorAll('.filter-tag').forEach((btn) => {
    btn.addEventListener('click', () => setFilter(btn.dataset.filter));
  });

  /* Recherche */
  const searchInput = document.getElementById('agenda-search');
  const searchBtn = document.getElementById('agenda-search-btn');

  let searchDebounce;
  searchInput?.addEventListener('input', () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      state.searchQuery = searchInput.value;
      refresh();
    }, 280);
  });

  searchBtn?.addEventListener('click', () => {
    state.searchQuery = searchInput?.value || '';
    refresh();
  });

  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      state.searchQuery = searchInput.value;
      refresh();
    }
  });

  /* Fermeture du panneau */
  document.getElementById('panel-close')?.addEventListener('click', closePanel);
  document.getElementById('panel-overlay')?.addEventListener('click', closePanel);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePanel();
  });

  /* Focus trap */
  initFocusTrap();

  /* Menu burger */
  initBurgerMenu();

  /* Sticky header */
  const header = document.querySelector('.site-header');
  if (header) {
    const sentinel = document.createElement('div');
    sentinel.style.height = '1px';
    document.body.prepend(sentinel);

    const observer = new IntersectionObserver(
      ([entry]) => header.classList.toggle('is-scrolled', !entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(sentinel);
  }

  /* Animation d'apparition des sections au scroll */
  const animTarget = document.querySelectorAll('.agenda-section, .agenda-controls');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 }
    );
    animTarget.forEach((el) => revealObserver.observe(el));
  }
}

/* Lancement quand le DOM est prêt */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

/* ── 16. EXPORTS (si utilisé en module) ──────────────────── */
// export { EVENTS, state, refresh, openEventPanel, closePanel };