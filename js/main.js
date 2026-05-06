/* =========================================
   VilleNova — JavaScript Global (main.js)
   ========================================= */

'use strict';

/* ---- LOADER ---- */
document.addEventListener('DOMContentLoaded', () => {
  const loader = document.getElementById('page-loader');
  if (!loader) return;
  requestAnimationFrame(() => loader.classList.add('hidden'));
});

/* ---- NAVIGATION MOBILE ---- */
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

/* ---- FILTRES ÉVÉNEMENTS ---- */
function initFilters() {
  const filterTags = document.querySelectorAll('.filter-tag');
  const cards      = document.querySelectorAll('.event-card[data-category]');
  if (!filterTags.length) return;

  filterTags.forEach(tag => {
    tag.addEventListener('click', () => {
      filterTags.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-pressed', 'false'); });
      tag.classList.add('active');
      tag.setAttribute('aria-pressed', 'true');

      const cat = tag.dataset.filter;
      cards.forEach(card => {
        if (cat === 'all' || card.dataset.category === cat) {
          card.style.display = '';
          requestAnimationFrame(() => { card.style.opacity = '1'; card.style.transform = 'translateY(0)'; });
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
  const searchBtn   = document.getElementById('search-btn');
  if (!searchInput) return;

  let debounceTimer;
  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => filterCardsBySearch(searchInput.value.trim().toLowerCase()), 280);
  });
  searchBtn?.addEventListener('click', () => filterCardsBySearch(searchInput.value.trim().toLowerCase()));
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') filterCardsBySearch(searchInput.value.trim().toLowerCase());
  });
}

function filterCardsBySearch(query) {
  document.querySelectorAll('.event-card').forEach(card => {
    const title = card.querySelector('.card-title')?.textContent.toLowerCase() || '';
    const desc  = card.querySelector('.card-desc')?.textContent.toLowerCase()  || '';
    card.style.display = (!query || title.includes(query) || desc.includes(query)) ? '' : 'none';
  });
}

/* ---- ANIMATIONS SCROLL ---- */
function initScrollAnimations() {
  if (!('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.animate-in').forEach(t => observer.observe(t));
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
const OA_KEY          = "832ecfba688a4dda9e6beb28922ee893";
const OA_AGENDA_UID   = "2119473";    //  (agenda principal)
const OA_THEATRE_UID  = "65855330";
const OA_FESTIVAL_UID = "46290899";
const OA_SPORT_UID    = "94552197";
const OA_BASE         = "https://api.openagenda.com/v2";

// ✅ Event vedette : Concert d'ouverture Sofiane Saidi invite Camelia Jordana
const FEATURED_EVENT_UID = "27089585";

/* ============================================================
   EXTRACTION IMAGE
   ============================================================ */
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

/* ============================================================
   FETCH HELPERS
   ============================================================ */
async function oaFetch(uid, params = {}) {
  const url = `${OA_BASE}/agendas/${uid}/events?` +
    new URLSearchParams({ key: OA_KEY, lang: 'fr', ...params });
  try {
    const res  = await fetch(url);
    const data = await res.json();
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

/* ============================================================
   REMPLIR UNE CARTE (ev1–ev6)
   ============================================================ */
function fillCard(prefix, ev) {
  const $ = (id) => document.getElementById(`${prefix}-${id}`);

  const titre = ev.title?.fr || ev.title?.en || 'Événement';

  let desc =
    ev.description?.fr    ||
    ev.longDescription?.fr ||
    ev.summary?.fr         ||
    ev.body?.fr            ||
    'Un événement à ne pas manquer !';
  if (!desc || desc.trim().length < 5) desc = 'Un événement à ne pas manquer !';
  const shortDesc = desc.length > 150 ? desc.substring(0, 150) + '…' : desc;

  const date   = ev.dateRange?.fr || '';
  const lieu   = ev.location?.name || '';
  const prix   = ev.free ? 'Gratuit' : 'Voir détails';
  const imgSrc = extractImage(ev);
  const fallback = 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=600&q=80';

  const imgEl = $('img');
  if (imgEl) {
    imgEl.src = imgSrc;
    imgEl.alt = titre;
    imgEl.onerror = () => { imgEl.src = fallback; imgEl.onerror = null; };
  }

  const titleEl = $('title');   if (titleEl)  titleEl.textContent  = titre;
  const descEl  = $('desc');    if (descEl)   descEl.textContent   = shortDesc;
  const dateEl  = $('date');    if (dateEl)   dateEl.textContent   = '📅 ' + date;
  const placeEl = $('place');   if (placeEl)  placeEl.textContent  = '📍 ' + lieu;
  const prixEl  = $('prix');    if (prixEl)   prixEl.textContent   = prix;

  const linkEl = $('link');
  if (linkEl) {
    linkEl.href = `/html/evenement-detail.html?id=${encodeURIComponent(ev.uid || ev.slug)}`;
  }

  if (prefix === 'ev5') { const b = document.getElementById('ev5-badge'); if (b) b.textContent = 'Festival'; }
  if (prefix === 'ev6') { const b = document.getElementById('ev6-badge'); if (b) b.textContent = 'Sport'; }
}

/* ============================================================
   REMPLIR LA CARD VEDETTE (event-featured)
   Cible : Concert Sofiane Saidi uid 27089585
   ============================================================ */
function fillFeaturedCard(ev) {
  const fallback = 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&q=80';
  const titre    = ev.title?.fr || ev.title?.en || 'Événement';

  let desc =
    ev.description?.fr    ||
    ev.longDescription?.fr ||
    ev.summary?.fr         ||
    'Un événement à ne pas manquer !';
  if (!desc || desc.trim().length < 5) desc = 'Un événement à ne pas manquer !';
  const shortDesc = desc.length > 220 ? desc.substring(0, 220) + '…' : desc;

  const date   = ev.dateRange?.fr || '';
  const lieu   = ev.location?.name || '';
  const prix   = ev.free ? 'Gratuit' : 'Voir détails';
  const imgSrc = extractImage(ev);

  // Image
  const imgEl = document.getElementById('ev-feat-img');
  if (imgEl) {
    imgEl.src = imgSrc;
    imgEl.alt = titre;
    imgEl.onerror = () => { imgEl.src = fallback; imgEl.onerror = null; };
  }

  // Badge catégorie
  const badgeEl = document.getElementById('ev-feat-badge');
  if (badgeEl) {
    const t = titre.toLowerCase();
    badgeEl.textContent =
      /concert|musique/.test(t) ? '🎵 Concert' :
      /festival/.test(t)        ? '🎉 Festival' :
      /expo|musée/.test(t)      ? '🖼 Exposition' :
      /théâtre|spectacle/.test(t) ? '🎭 Théâtre' : 'Événement';
  }

  // Données
  const titleEl = document.getElementById('ev-feat-title');
  if (titleEl) titleEl.textContent = titre;

  const descEl = document.getElementById('ev-feat-desc');
  if (descEl) descEl.textContent = shortDesc;

  const dateEl = document.getElementById('ev-feat-date');
  if (dateEl) dateEl.textContent = '📅 ' + date;

  const placeEl = document.getElementById('ev-feat-place');
  if (placeEl) placeEl.textContent = '📍 ' + lieu;

  // Tags
  const tagsEl = document.getElementById('ev-feat-tags');
  if (tagsEl) {
    const tags = [];
    if (ev.free) tags.push('✨ Gratuit');
    const tl = titre.toLowerCase();
    if (/concert|musique|jazz/.test(tl)) tags.push('🎵 Musique');
    if (/festival/.test(tl))             tags.push('🎉 Festival');
    if (/expo|musée/.test(tl))           tags.push('🖼 Exposition');
    (ev.keywords?.fr || []).slice(0, 2).forEach(k => tags.push(k));
    tagsEl.innerHTML = [...new Set(tags)]
      .map(t => `<span class="detail-tag">${t}</span>`)
      .join('');
  }

  // Lien → page detail avec l'ID
  const linkEl = document.getElementById('ev-feat-link');
  if (linkEl) {
    linkEl.href = `/html/evenement-detail.html?id=${encodeURIComponent(ev.uid || ev.slug)}`;
    linkEl.setAttribute('aria-label', `Voir l'événement : ${titre}`);
  }

  // data-category sur l'article pour les filtres
  const article = linkEl?.closest('.event-card');
  if (article) {
    const tl = titre.toLowerCase();
    article.dataset.category =
      /concert|musique/.test(tl) ? 'concert' :
      /festival/.test(tl)        ? 'festival' :
      /expo|musée/.test(tl)      ? 'expo' :
      /théâtre|spectacle/.test(tl) ? 'theatre' : 'concert';
  }

  console.log(`[VilleNova] ✅ Card vedette : "${titre}" | ${date} | ${lieu} | ${prix}`);
}

/* ============================================================
   CHARGER TOUTES LES CARTES
   ============================================================ */
async function loadOpenAgendaCards() {
  const [featuredEv, eventsMain, eventsTheatre, eventsFestival, eventsSport] = await Promise.all([
    // ✅ Event vedette : Concert Sofiane Saidi (uid 27089585) depuis agenda musées
    oaFetchOne(OA_AGENDA_UID, FEATURED_EVENT_UID),
    // Cartes 1–2 : agenda musées
    oaFetch(OA_AGENDA_UID,   { limit: 2, 'relative[0]': 'current', 'relative[1]': 'upcoming' }),
    // Cartes 3–4 : théâtre
    oaFetch(OA_THEATRE_UID,  { limit: 2 }),
    // Carte 5 : festival
    oaFetch(OA_FESTIVAL_UID, { limit: 1 }),
    // Carte 6 : sport
    oaFetch(OA_SPORT_UID,    { limit: 1, 'relative[0]': 'current', 'relative[1]': 'upcoming' }),
  ]);

  // Card vedette
  if (featuredEv) {
    fillFeaturedCard(featuredEv);
  } else {
    console.warn('[VilleNova] Event vedette introuvable, fallback sur premier event musées');
    const fallbackEv = eventsMain[0];
    if (fallbackEv) fillFeaturedCard(fallbackEv);
  }

  // Cartes 1–6 (on exclut l'event vedette des cartes normales)
  const filteredMain = eventsMain.filter(e => String(e.uid) !== String(FEATURED_EVENT_UID));

  if (filteredMain[0])    fillCard('ev1', filteredMain[0]);
  if (filteredMain[1])    fillCard('ev2', filteredMain[1]);
  if (eventsTheatre[0])   fillCard('ev3', eventsTheatre[0]);
  if (eventsTheatre[1])   fillCard('ev4', eventsTheatre[1]);
  if (eventsFestival[0])  fillCard('ev5', eventsFestival[0]);
  if (eventsSport[0])     fillCard('ev6', eventsSport[0]);
}

/* ============================================================
   COMPTEURS ANIMÉS
   ============================================================ */
function animateCount(el, target, duration = 1400) {
  const start = performance.now();
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

/* ---- MODAL VIDÉO ---- */
function initVideoModal() {
  const modal    = document.getElementById('video-modal');
  const trigger  = document.querySelector('[data-video-trigger]');
  const closeBtn = document.querySelector('.video-modal-close');
  if (!modal) return;

  const openModal  = () => { modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false'); closeBtn?.focus(); };
  const closeModal = () => { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); modal.querySelector('video')?.pause(); trigger?.focus(); };

  trigger?.addEventListener('click', openModal);
  trigger?.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(); } });
  closeBtn?.addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && modal.classList.contains('open')) closeModal(); });
}

/* ---- PAGINATION ---- */
function initPagination() {
  document.querySelectorAll('.page-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      if (['←', '→'].includes(this.textContent.trim())) return;
      document.querySelectorAll('.page-btn').forEach(b => { b.classList.remove('active'); b.removeAttribute('aria-current'); });
      this.classList.add('active');
      this.setAttribute('aria-current', 'page');
      const section = document.getElementById('evenements');
      if (section) window.scrollTo({ top: section.offsetTop - 80, behavior: 'smooth' });
    });
  });
}

/* ---- NEWSLETTER ---- */
function handleNewsletter(e) {
  e.preventDefault();
  const email = document.getElementById('newsletter-email')?.value?.trim();
  const btn   = e.target.querySelector('[type="submit"]');
  if (!email) { showToast('Veuillez entrer un email valide.', 'error'); return; }

  const orig = btn.textContent;
  btn.textContent = 'Envoi…';
  btn.disabled = true;

  setTimeout(() => {
    showToast(`Inscription confirmée pour ${email} ! 🎉`, 'success');
    e.target.reset();
    btn.textContent = orig;
    btn.disabled = false;
  }, 800);
}

/* ---- UTILITAIRES ANTI-XSS ---- */
const _xssEl = document.createElement('div');
function escapeHtml(str) { _xssEl.textContent = String(str ?? ''); return _xssEl.innerHTML; }
function escapeAttr(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* ============================================================
   INIT
   ============================================================ */
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