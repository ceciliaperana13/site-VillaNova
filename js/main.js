/* =========================================
   VilleNova — JavaScript Global (main.js)
   ========================================= */

'use strict';

/* ---- LOADER ---- */
window.addEventListener('load', () => {
  const loader = document.getElementById('page-loader');
  if (loader) {
    setTimeout(() => loader.classList.add('hidden'), 300);
  }
});

/* ---- NAVIGATION MOBILE ---- */
function initNav() {
  const burger = document.querySelector('.nav-burger');
  const navLinks = document.querySelector('.nav-links');
  if (!burger || !navLinks) return;

  burger.addEventListener('click', () => {
    const expanded = burger.getAttribute('aria-expanded') === 'true';
    burger.setAttribute('aria-expanded', String(!expanded));
    navLinks.classList.toggle('open', !expanded);
    navLinks.setAttribute('aria-hidden', String(expanded));
  });

  document.addEventListener('click', (e) => {
    if (!burger.contains(e.target) && !navLinks.contains(e.target)) {
      burger.setAttribute('aria-expanded', 'false');
      navLinks.classList.remove('open');
      navLinks.setAttribute('aria-hidden', 'true');
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      burger.setAttribute('aria-expanded', 'false');
      navLinks.classList.remove('open');
      navLinks.setAttribute('aria-hidden', 'true');
      burger.focus();
    }
  });
}

/* ---- FILTRES ÉVÉNEMENTS ---- */
function initFilters() {
  const filterTags = document.querySelectorAll('.filter-tag');
  const cards = document.querySelectorAll('.event-card[data-category]');
  if (!filterTags.length) return;

  filterTags.forEach(tag => {
    tag.addEventListener('click', () => {
      filterTags.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-pressed', 'false');
      });
      tag.classList.add('active');
      tag.setAttribute('aria-pressed', 'true');

      const cat = tag.dataset.filter;

      cards.forEach(card => {
        if (cat === 'all' || card.dataset.category === cat) {
          card.style.display = '';
          requestAnimationFrame(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          });
        } else {
          card.style.opacity = '0';
          card.style.transform = 'translateY(8px)';
          setTimeout(() => { card.style.display = 'none'; }, 280);
        }
      });
    });
  });
}

/* ---- BARRE DE RECHERCHE ---- */
function initSearch() {
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');
  if (!searchInput) return;

  let debounceTimer;

  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const q = searchInput.value.trim().toLowerCase();
      filterCardsBySearch(q);
    }, 280);
  });

  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      const q = searchInput.value.trim().toLowerCase();
      filterCardsBySearch(q);
    });
  }

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const q = searchInput.value.trim().toLowerCase();
      filterCardsBySearch(q);
    }
  });
}

function filterCardsBySearch(query) {
  const cards = document.querySelectorAll('.event-card');
  cards.forEach(card => {
    const title = card.querySelector('.card-title')?.textContent.toLowerCase() || '';
    const desc  = card.querySelector('.card-desc')?.textContent.toLowerCase() || '';
    const match = !query || title.includes(query) || desc.includes(query);
    card.style.display = match ? '' : 'none';
  });
}

/* ---- ANIMATIONS SCROLL ---- */
function initScrollAnimations() {
  if (!('IntersectionObserver' in window)) return;
  const targets = document.querySelectorAll('.animate-in');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  targets.forEach(t => observer.observe(t));
}

/* ---- TOAST ---- */
function showToast(message, type = 'info') {
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  const container = document.querySelector('.toast-container') || createToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type]}</span> ${message}`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3400);
}

function createToastContainer() {
  const c = document.createElement('div');
  c.className = 'toast-container';
  document.body.appendChild(c);
  return c;
}

/* ---- STICKY HEADER ---- */
function initStickyHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  const observer = new IntersectionObserver(
    ([entry]) => header.classList.toggle('scrolled', !entry.isIntersecting),
    { rootMargin: '-1px 0px 0px 0px', threshold: 0 }
  );
  const sentinel = document.createElement('div');
  sentinel.style.height = '1px';
  document.body.prepend(sentinel);
  observer.observe(sentinel);
}

/* ============================================================
   OPENAGENDA — CONFIG
   ============================================================ */
const OA_KEY        = "832ecfba688a4dda9e6beb28922ee893";
const OA_AGENDA_UID = "24882772";   // Agenda principal
const OA_THEATRE_UID = "65855330";  // Théâtre
const OA_FESTIVAL_UID = "46290899"; // NOUVEL AGENDA ev5
const OA_BASE       = "https://api.openagenda.com/v2";

/* ---- FETCH API 1 ---- */
async function fetchOAEvents(limit = 2) {
  const params = new URLSearchParams({
    key: OA_KEY,
    limit: limit,
    lang: 'fr'
  });

  const url = `${OA_BASE}/agendas/${OA_AGENDA_UID}/events?${params}`;
  console.log("[VilleNova] Fetch Agenda 1 :", url);

  const res = await fetch(url);
  const data = await res.json();

  return data.events || [];
}

/* ---- FETCH API 2 (THÉÂTRE) ---- */
async function fetchOAEventsTheatre(limit = 2) {
  const params = new URLSearchParams({
    key: OA_KEY,
    lang: 'fr',
    limit: limit
  });

  const url = `${OA_BASE}/agendas/${OA_THEATRE_UID}/events?${params}`;
  console.log("[VilleNova] Fetch Théâtre :", url);

  const res = await fetch(url);
  const data = await res.json();

  return data.events || [];
}

/* ---- FETCH API 3 (FESTIVAL — PREND TOUT) ---- */
async function fetchOAEventsFestival(limit = 5) {
  const params = new URLSearchParams({
    key: OA_KEY,
    lang: 'fr',
    limit: limit
  });

  const url = `${OA_BASE}/agendas/${OA_FESTIVAL_UID}/events?${params}`;
  console.log("[VilleNova] Fetch Festival :", url);

  const res = await fetch(url);
  const data = await res.json();

  return data.events || [];
}

/* ---- REMPLIR UNE CARTE ---- */
function fillCard(prefix, ev) {
  const $ = (id) => document.getElementById(`${prefix}-${id}`);

  const titre = ev.title?.fr || "Événement";

  let desc =
    ev.description?.fr ||
    ev.longDescription?.fr ||
    ev.summary?.fr ||
    ev.body?.fr ||
    "";

  if (!desc || desc.trim().length < 5) {
    desc = "Un événement à ne pas manquer !";
  }

  const shortDesc = desc.length > 150 ? desc.substring(0, 150) + "…" : desc;

  const date  = ev.dateRange?.fr || "";
  const lieu  = ev.location?.name || "";
  const prix  = ev.free ? "Gratuit 🎟" : "Voir détails";

  const img   = ev.image?.base && ev.image?.filename
                ? ev.image.base + ev.image.filename
                : "/assets/img/placeholder.webp";

  const imgEl = $('img');
  if (imgEl) imgEl.src = img;

  const titleEl = $('title');
  if (titleEl) titleEl.textContent = titre;

  const descEl = $('desc');
  if (descEl) descEl.textContent = shortDesc;

  const dateEl = $('date');
  if (dateEl) dateEl.textContent = "📅 " + date;

  const placeEl = $('place');
  if (placeEl) placeEl.textContent = "📍 " + lieu;

  const prixEl = $('prix');
  if (prixEl) prixEl.textContent = prix;

  const linkEl = $('link');
  if (linkEl) {
    const eventId = ev.uid || ev.slug;
    linkEl.href = `/html/evenement-detail.html?id=${encodeURIComponent(eventId)}`;
  }

  if (prefix === "ev5") {
    const badge = document.getElementById("ev5-badge");
    if (badge) badge.textContent = "Festival";
  }
}

/* ---- CHARGER LES 5 CARTES ---- */
async function loadOpenAgendaCards() {

  const eventsMain = await fetchOAEvents(2);
  if (eventsMain[0]) fillCard("ev1", eventsMain[0]);
  if (eventsMain[1]) fillCard("ev2", eventsMain[1]);

  const eventsTheatre = await fetchOAEventsTheatre(2);
  if (eventsTheatre[0]) fillCard("ev3", eventsTheatre[0]);
  if (eventsTheatre[1]) fillCard("ev4", eventsTheatre[1]);

  /* ---- ev5 : PREND LE PREMIER ÉVÉNEMENT ---- */
  const eventsFestival = await fetchOAEventsFestival(5);
  if (eventsFestival[0]) fillCard("ev5", eventsFestival[0]);
}

/* ---- INIT ---- */
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initFilters();
  initSearch();
  initScrollAnimations();
  initStickyHeader();

  loadOpenAgendaCards();
});
