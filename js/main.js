'use strict';

/* ─── BASE PATH (GitHub Pages) ────────────────────────────────────────────────
   Détecte automatiquement le sous-dossier du dépôt.
   En local  : BASE_PATH = ""
   Sur GitHub Pages (site-VillaNova) : BASE_PATH = "/site-VillaNova"
────────────────────────────────────────────────────────────────────────────── */
const BASE_PATH = (() => {
  const path = window.location.pathname; // ex: /site-VillaNova/index.html
  const match = path.match(/^(\/[^/]+)\//);
  // Si on est à la racine (localhost ou domaine propre) on renvoie ""
  if (!match || match[1] === '') return '';
  // Si le segment ressemble à un fichier (localhost/index.html) on renvoie ""
  if (match[1].includes('.')) return '';
  return match[1]; // "/site-VillaNova"
})();

const EVENT_DETAIL = `${BASE_PATH}/html/evenement-detail.html`;

/* LOADER */
document.addEventListener('DOMContentLoaded', () => {
  const loader = document.getElementById('page-loader');
  if (!loader) return;
  requestAnimationFrame(() => loader.classList.add('hidden'));
});

/* MOBILE NAVIGATION */
function initNav() {
  const burger   = document.querySelector('.nav-burger');
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

/* EVENT FILTERS */
function initFilters() {
  const filterTags = document.querySelectorAll('.filter-tag');
  if (!filterTags.length) return;

  filterTags.forEach(tag => {
    tag.addEventListener('click', () => {
      filterTags.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-pressed', 'false');
      });
      tag.classList.add('active');
      tag.setAttribute('aria-pressed', 'true');
      applyFilter(tag.dataset.filter);
    });
  });
}

function applyFilter(cat) {
  const cards = document.querySelectorAll('.event-card[data-category]');
  cards.forEach(card => {
    const match = cat === 'all' || card.dataset.category === cat;
    if (match) {
      card.style.display = '';
      requestAnimationFrame(() => {
        card.style.opacity   = '1';
        card.style.transform = 'translateY(0)';
      });
    } else {
      card.style.opacity   = '0';
      card.style.transform = 'translateY(8px)';
      setTimeout(() => { card.style.display = 'none'; }, 280);
    }
  });
}

/* SEARCH BAR */
function initSearch() {
  const searchInput = document.getElementById('search-input');
  const searchBtn   = document.getElementById('search-btn');
  if (!searchInput) return;

  let debounceTimer;
  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => filterCardsBySearch(searchInput.value.trim().toLowerCase()), 280);
  });
  searchBtn?.addEventListener('click',   () => filterCardsBySearch(searchInput.value.trim().toLowerCase()));
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') filterCardsBySearch(searchInput.value.trim().toLowerCase());
  });
}

function filterCardsBySearch(query) {
  document.querySelectorAll('.event-card').forEach(card => {
    const title = card.querySelector('.card-title')?.textContent.toLowerCase() || '';
    const desc  = card.querySelector('.card-desc')?.textContent.toLowerCase()  || '';
    const date  = card.querySelector('[id$="-date"]')?.textContent.toLowerCase() || '';
    const place = card.querySelector('[id$="-place"]')?.textContent.toLowerCase() || '';
    const match = !query
      || title.includes(query)
      || desc.includes(query)
      || date.includes(query)
      || place.includes(query);
    card.style.display = match ? '' : 'none';
  });
}

/* SCROLL ANIMATIONS */
function initScrollAnimations() {
  if (!('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.animate-in').forEach(t => observer.observe(t));
}

/* TOAST */
function showToast(message, type = 'info') {
  const icons     = { success: '✓', error: '✕', info: 'ℹ' };
  const container = document.querySelector('.toast-container') || createToastContainer();
  const toast     = document.createElement('div');
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

/* STICKY HEADER */
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

/* OPENAGENDA — CONFIG */
const OA_KEY          = "832ecfba688a4dda9e6beb28922ee893";
const OA_AGENDA_UID   = "2119473";
const OA_THEATRE_UID  = "65855330";
const OA_FESTIVAL_UID = "46290899";
const OA_SPORT_UID    = "94552197";
const OA_BASE         = "https://api.openagenda.com/v2";

const FEATURED_EVENT_UID = "27089585";

/* CATEGORY LABELS */
const CAT_LABELS = {
  concert:  '🎵 Concert',
  expo:     '🖼 Exposition',
  festival: '🎉 Festival',
  theatre:  '🎭 Théâtre',
  gastro:   '🍽 Gastronomie',
  sport:    '⚽ Sport',
  autre:    '📌 Autre',
};

/* CATEGORY DETECTION */
function guessCat(ev) {
  const titre    = (ev.title?.fr    || ev.title?.en    || '').toLowerCase();
  const keywords = (ev.keywords?.fr || ev.keywords?.en || []).join(' ').toLowerCase();
  const type     = (ev.type?.fr     || ev.type?.en     || '').toLowerCase();
  const lieu     = (ev.location?.name || '').toLowerCase();
  const desc     = (
    ev.longDescription?.fr ||
    ev.description?.fr     ||
    ev.summary?.fr         || ''
  ).toLowerCase().slice(0, 300);

  const all = `${titre} ${keywords} ${type} ${lieu} ${desc}`;

  if (/concert|jazz|rock|blues|musique|boeuf|live|chanson|chant|électro|electro|dj|rap|hip.?hop|clubbing/.test(all))
    return 'concert';
  if (/expo|exposition|musée|musee|galerie|photographie|photo|peinture|sculpture|art contemporain|beaux.arts|vernissage/.test(all))
    return 'expo';
  if (/festival/.test(all))
    return 'festival';
  if (/théâtre|theatre|comédie|spectacle|pièce|danse|cirque|opéra|opera|ballet/.test(all))
    return 'theatre';
  if (/gastro|food|cuisine|marché|dégustation|vin|bière|restaurant/.test(all))
    return 'gastro';
  if (/sport|foot|rugby|match|natation|lutte|tennis|basket|vélo|course|marathon/.test(all))
    return 'sport';

  return 'autre';
}

/* DESCRIPTION */
function getDesc(ev, maxLen = 150) {
  const raw =
    ev.longDescription?.fr ||
    ev.description?.fr     ||
    ev.summary?.fr         ||
    ev.body?.fr            || '';
  const clean = raw.trim();
  if (clean.length < 20) return 'Un événement à ne pas manquer !';
  return clean.length > maxLen ? clean.substring(0, maxLen) + '…' : clean;
}

/* IMAGE EXTRACTION */
function extractImage(ev) {
  const fallback = 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=600&q=80';
  if (!ev.image) return fallback;
  if (ev.image.base && ev.image.filename) return ev.image.base + ev.image.filename;
  if (ev.image.variants?.length) {
    const v = ev.image.variants.find(v => v.type === 'full') || ev.image.variants[0];
    return ev.image.base + v.filename;
  }
  return fallback;
}

/* FETCH HELPERS */
async function oaFetch(uid, params = {}) {
  const url = `${OA_BASE}/agendas/${uid}/events?` +
    new URLSearchParams({ key: OA_KEY, lang: 'fr', ...params });
  try {
    const res  = await fetch(url);
    const data = await res.json();
    console.log(`[VilleNova] oaFetch uid=${uid} → ${(data.events||[]).length} events`);
    return data.events || [];
  } catch (e) {
    console.error('[VilleNova] oaFetch error:', e);
    return [];
  }
}

async function oaFetchOne(uid, eventId) {
  const url = `${OA_BASE}/agendas/${uid}/events/${eventId}?key=${OA_KEY}&lang=fr`;
  try {
    const res  = await fetch(url);
    const data = await res.json();
    return data.event || null;
  } catch (e) {
    console.error('[VilleNova] oaFetchOne error:', e);
    return null;
  }
}

/* FILL A CARD (ev1–ev6) */
function fillCard(prefix, ev) {
  const get = (id) => document.getElementById(`${prefix}-${id}`);

  const titre  = ev.title?.fr || ev.title?.en || 'Événement';
  const desc   = getDesc(ev, 150);
  const date   = ev.dateRange?.fr || '';
  const lieu   = ev.location?.name || '';
  const prix   = ev.free ? 'Gratuit' : 'Voir détails';
  const imgSrc = extractImage(ev);
  const cat    = guessCat(ev);
  const fallback = 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=600&q=80';

  const imgEl = get('img');
  if (imgEl) {
    imgEl.src = imgSrc;
    imgEl.alt = titre;
    imgEl.onerror = () => { imgEl.src = fallback; imgEl.onerror = null; };
  }

  const titleEl = get('title'); if (titleEl) titleEl.textContent = titre;
  const descEl  = get('desc');  if (descEl)  descEl.textContent  = desc;
  const dateEl  = get('date');  if (dateEl)  dateEl.textContent  = '📅 ' + date;
  const placeEl = get('place'); if (placeEl) placeEl.textContent = '📍 ' + lieu;
  const prixEl  = get('prix');  if (prixEl)  prixEl.textContent  = prix;

  /* ── LIEN CORRIGÉ ── */
  const linkEl = get('link');
  if (linkEl) {
    linkEl.href = `${EVENT_DETAIL}?id=${encodeURIComponent(ev.uid || ev.slug)}`;
  }

  const badgeEl = get('badge');
  if (badgeEl) badgeEl.textContent = CAT_LABELS[cat] || CAT_LABELS.autre;

  const article = (titleEl || imgEl)?.closest('.event-card');
  if (article) {
    article.dataset.category = cat;
    console.log(`[VilleNova] ${prefix} → "${titre}" | cat: ${cat}`);
  }
}

/* FILL THE FEATURED CARD */
function fillFeaturedCard(ev) {
  const fallback = 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&q=80';
  const titre  = ev.title?.fr || ev.title?.en || 'Événement';
  const desc   = getDesc(ev, 220);
  const date   = ev.dateRange?.fr || '';
  const lieu   = ev.location?.name || '';
  const cat    = guessCat(ev);
  const imgSrc = extractImage(ev);

  const imgEl = document.getElementById('ev-feat-img');
  if (imgEl) {
    imgEl.src = imgSrc;
    imgEl.alt = titre;
    imgEl.onerror = () => { imgEl.src = fallback; imgEl.onerror = null; };
  }

  const badgeEl = document.getElementById('ev-feat-badge');
  if (badgeEl) badgeEl.textContent = CAT_LABELS[cat] || CAT_LABELS.autre;

  const titleEl = document.getElementById('ev-feat-title');
  if (titleEl) titleEl.textContent = titre;

  const descEl = document.getElementById('ev-feat-desc');
  if (descEl) descEl.textContent = desc;

  const dateEl = document.getElementById('ev-feat-date');
  if (dateEl) dateEl.textContent = '📅 ' + date;

  const placeEl = document.getElementById('ev-feat-place');
  if (placeEl) placeEl.textContent = '📍 ' + lieu;

  const tagsEl = document.getElementById('ev-feat-tags');
  if (tagsEl) {
    const tags = [];
    if (ev.free) tags.push('✨ Gratuit');
    tags.push(CAT_LABELS[cat]);
    (ev.keywords?.fr || []).slice(0, 2).forEach(k => tags.push(k));
    tagsEl.innerHTML = [...new Set(tags)]
      .map(t => `<span class="detail-tag">${t}</span>`)
      .join('');
  }

  /* ── LIEN CORRIGÉ ── */
  const linkEl = document.getElementById('ev-feat-link');
  if (linkEl) {
    linkEl.href = `${EVENT_DETAIL}?id=${encodeURIComponent(ev.uid || ev.slug)}`;
    linkEl.setAttribute('aria-label', `Voir l'événement : ${titre}`);
  }

  const article = linkEl?.closest('.event-card');
  if (article) article.dataset.category = cat;

  console.log(`[VilleNova] ✅ Featured: "${titre}" | cat: ${cat}`);
}

/* LOAD ALL CARDS */
async function loadOpenAgendaCards() {
  const commonParams = {
    'relative[0]': 'current',
    'relative[1]': 'upcoming',
  };

  const [featuredEv, eventsMain, eventsTheatre, eventsFestival, eventsSport] = await Promise.all([
    oaFetchOne(OA_AGENDA_UID, FEATURED_EVENT_UID),
    oaFetch(OA_AGENDA_UID,   { limit: 10, ...commonParams }),
    oaFetch(OA_THEATRE_UID,  { limit: 3,  ...commonParams }),
    oaFetch(OA_FESTIVAL_UID, { limit: 2,  ...commonParams }),
    oaFetch(OA_SPORT_UID,    { limit: 2,  ...commonParams }),
  ]);

  console.log('[VilleNova] Results — Main:', eventsMain.length,
    '| Theatre:', eventsTheatre.length,
    '| Festival:', eventsFestival.length,
    '| Sport:', eventsSport.length);

  if (featuredEv) {
    fillFeaturedCard(featuredEv);
  } else {
    console.warn('[VilleNova] Featured event not found — falling back to first main event');
    if (eventsMain[0]) fillFeaturedCard(eventsMain[0]);
  }

  const filteredMain = eventsMain.filter(e => String(e.uid) !== String(FEATURED_EVENT_UID));

  const pool3 = eventsTheatre[0]  || filteredMain[2] || null;
  const pool4 = eventsTheatre[1]  || filteredMain[3] || null;
  const pool5 = eventsFestival[0] || filteredMain[4] || null;
  const pool6 = eventsSport[0]    || filteredMain[5] || null;

  if (filteredMain[0]) fillCard('ev1', filteredMain[0]);
  if (filteredMain[1]) fillCard('ev2', filteredMain[1]);
  if (pool3)           fillCard('ev3', pool3);
  if (pool4)           fillCard('ev4', pool4);
  if (pool5)           fillCard('ev5', pool5);
  if (pool6)           fillCard('ev6', pool6);

  /* ── CORRIGER aussi les liens statiques ev5 et ev6 dans le HTML ── */
  ['ev5-link', 'ev6-link'].forEach(id => {
    const el = document.getElementById(id);
    if (el && el.href.includes('/html/evenement-detail')) {
      // déjà mis à jour par fillCard, mais au cas où l'API n'a pas répondu :
      if (!el.href.includes(BASE_PATH)) {
        el.href = `${EVENT_DETAIL}`;
      }
    }
  });

  const activeFilter = document.querySelector('.filter-tag.active')?.dataset.filter || 'all';
  if (activeFilter !== 'all') applyFilter(activeFilter);
}

/* ANIMATED COUNTERS */
function animateCount(el, target, duration = 1400) {
  const start  = performance.now();
  const update = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    el.textContent = Math.round((1 - Math.pow(1 - progress, 3)) * target).toLocaleString('fr-FR');
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

function initCounters() {
  if (!('IntersectionObserver' in window)) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const t = parseInt(entry.target.dataset.count, 10);
      if (!isNaN(t)) animateCount(entry.target, t);
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('[data-count]').forEach(el => obs.observe(el));
}

/* VIDEO MODAL */
function initVideoModal() {
  const modal    = document.getElementById('video-modal');
  const trigger  = document.querySelector('[data-video-trigger]');
  const closeBtn = document.querySelector('.video-modal-close');
  if (!modal) return;

  const openModal  = () => {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    closeBtn?.focus();
  };
  const closeModal = () => {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    modal.querySelector('video')?.pause();
    trigger?.focus();
  };

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

/* PAGINATION */
function initPagination() {
  document.querySelectorAll('.page-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      if (['←', '→'].includes(this.textContent.trim())) return;
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

/* NEWSLETTER */
function handleNewsletter(e) {
  e.preventDefault();
  const email = document.getElementById('newsletter-email')?.value?.trim();
  const btn   = e.target.querySelector('[type="submit"]');
  if (!email) { showToast('Veuillez entrer un email valide.', 'error'); return; }

  const orig = btn.textContent;
  btn.textContent = 'Envoi…';
  btn.disabled    = true;

  setTimeout(() => {
    showToast(`Inscription confirmée pour ${email} ! 🎉`, 'success');
    e.target.reset();
    btn.textContent = orig;
    btn.disabled    = false;
  }, 800);
}

/* UTILITIES */
const _xssEl = document.createElement('div');
function escapeHtml(str) { _xssEl.textContent = String(str ?? ''); return _xssEl.innerHTML; }
function escapeAttr(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* INIT */
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initFilters();
  initSearch();
  initScrollAnimations();
  initStickyHeader();
  initCounters();
  initVideoModal();
  initPagination();

  document.getElementById('newsletter-form')?.addEventListener('submit', handleNewsletter);

  loadOpenAgendaCards();
});