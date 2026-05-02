'use strict';

/* ══════════════════════════════════════════
   CONFIGURATION OPENAGENDA
   ══════════════════════════════════════════ */
const OA_KEY        = "832ecfba688a4dda9e6beb28922ee893";
const OA_AGENDA_UID = "24882772";
const OA_BASE       = "https://api.openagenda.com/v2";

/* ══════════════════════════════════════════
   LOADER
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
   TOAST
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
   MENU BURGER
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
   FILTRES
   ══════════════════════════════════════════ */
function initFilters() {
  const filterBtns = document.querySelectorAll('.filter-tag');
  if (!filterBtns.length) return;
  filterBtns.forEach(btn => {
    btn.addEventListener('click', function () {
      filterBtns.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
      this.classList.add('active');
      this.setAttribute('aria-pressed', 'true');
      const filter = this.dataset.filter;
      document.querySelectorAll('#events-grid .event-card').forEach(card => {
        const match = filter === 'all' || card.dataset.category === filter;
        card.style.display = match ? '' : 'none';
        card.setAttribute('aria-hidden', String(!match));
      });
    });
  });
}

/* ══════════════════════════════════════════
   RECHERCHE
   ══════════════════════════════════════════ */
function initSearch() {
  const searchInput = document.getElementById('search-input');
  const searchBtn   = document.getElementById('search-btn');
  if (!searchInput) return;
  function doSearch() {
    const q = searchInput.value.toLowerCase().trim();
    document.querySelectorAll('#events-grid .event-card').forEach(card => {
      const match = !q || card.textContent.toLowerCase().includes(q);
      card.style.display = match ? '' : 'none';
      card.setAttribute('aria-hidden', String(!match));
    });
    if (q) showToast(`Résultats pour « ${searchInput.value} »`, 'info');
  }
  searchBtn?.addEventListener('click', doSearch);
  searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });
}

/* ══════════════════════════════════════════
   COMPTEURS
   ══════════════════════════════════════════ */
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

/* ══════════════════════════════════════════
   ANIMATIONS SCROLL
   ══════════════════════════════════════════ */
function initScrollAnimations() {
  if (!('IntersectionObserver' in window)) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (!entry.isIntersecting) return;
      setTimeout(() => entry.target.classList.add('visible'), i * 80);
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.animate-in').forEach(el => obs.observe(el));
}

/* ══════════════════════════════════════════
   MODAL VIDÉO
   ══════════════════════════════════════════ */
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

/* ══════════════════════════════════════════
   PAGINATION
   ══════════════════════════════════════════ */
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

/* ══════════════════════════════════════════
   NEWSLETTER
   ══════════════════════════════════════════ */
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

/* ══════════════════════════════════════════
   UTILITAIRES ANTI-XSS
   ══════════════════════════════════════════ */
const _xssEl = document.createElement('div');
function escapeHtml(str) { _xssEl.textContent = String(str ?? ''); return _xssEl.innerHTML; }
function escapeAttr(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* ══════════════════════════════════════════
   EXTRACTEURS — calés sur la vraie réponse API
   Structure confirmée :
   {
     image: { base: "https://cdn.openagenda.com/main/", filename: "xxx.jpg", variants: [...] }
     title: { fr: "..." }
     description: { fr: "..." }
     firstTiming: { begin: "2026-05-02T16:00:00+02:00", end: "..." }
     location: { name: "Le 3C", address: "23 Boulevard Carnot  13100 Aix-en-Provence", city: "Aix-en-Provence" }
     keywords: {}   ← souvent vide dans cet agenda
     dateRange: { fr: "Samedi 2 mai, 16h00" }
   }
   ══════════════════════════════════════════ */

/**
 * Lit un champ texte multilingue (fr en priorité).
 */
function getText(field) {
  if (!field) return '';
  if (typeof field === 'string') return field;
  return field.fr || field.en || Object.values(field).find(v => typeof v === 'string') || '';
}

/**
 * Construit l'URL de l'image depuis la vraie structure OpenAgenda.
 * → base + filename   ex: "https://cdn.openagenda.com/main/beceba...jpg"
 * Essaie aussi les variants (full > thumb) si le fichier de base manque.
 */
function getImage(ev) {
  const img = ev.image;
  if (!img) return '';

  // Cas 1 : structure confirmée { base, filename }
  if (img.base && img.filename) {
    return img.base + img.filename;
  }

  // Cas 2 : variant "full" (800×400)
  if (img.base && Array.isArray(img.variants)) {
    const full  = img.variants.find(v => v.type === 'full');
    const thumb = img.variants.find(v => v.type === 'thumbnail');
    const v = full || thumb;
    if (v?.filename) return img.base + v.filename;
  }

  // Cas 3 : champs directs (autres versions de l'API)
  return img['1000x625'] || img['800x500'] || img.src || img.url || '';
}

/**
 * Date lisible en français — utilise dateRange.fr si disponible,
 * sinon formate firstTiming.begin.
 */
function getDateFr(ev) {
  // dateRange.fr = "Samedi 2 mai, 16h00" → déjà formaté par OpenAgenda
  if (ev.dateRange?.fr) return ev.dateRange.fr;

  const begin = ev.firstTiming?.begin || ev.timings?.[0]?.begin || null;
  if (!begin) return 'Date non précisée';

  const d = new Date(begin);
  if (isNaN(d)) return 'Date non précisée';

  const date  = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const heure = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return `${date} · ${heure}`;
}

/**
 * Lieu complet : nom + adresse + ville.
 * location: { name, address, city }
 */
function getLieu(ev) {
  const loc = ev.location || {};
  const nom     = loc.name    || '';
  const adresse = loc.address || '';   // "23 Boulevard Carnot  13100 Aix-en-Provence"
  const ville   = loc.city    || '';

  // Si l'adresse contient déjà le CP + ville, on n'ajoute pas la ville en double
  const adresseContientVille = adresse.toLowerCase().includes(ville.toLowerCase());
  const ligneAdresse = adresseContientVille ? adresse : [adresse, ville].filter(Boolean).join(', ');

  return { nom, adresse: ligneAdresse, ville };
}

/**
 * Tarif : gratuit, conditions textuelles, ou "Voir détails".
 */
function getPrix(ev) {
  if (ev.free === 1 || ev.free === true) return 'Gratuit 🎟';
  const cond = getText(ev.conditions) || getText(ev.priceDetail) || '';
  if (cond) return cond;
  if (Array.isArray(ev.registration) && ev.registration.length) {
    const p = ev.registration[0]?.price;
    if (p) return `${p} €`;
  }
  return 'Voir détails';
}

/**
 * Catégorie : premier keyword, ou "Événement".
 * keywords peut être {} (vide) dans cet agenda.
 */
function getCategorie(ev) {
  const kws = ev.keywords;
  if (!kws) return 'Événement';
  const list = kws.fr || kws.en || (Array.isArray(kws) ? kws : Object.values(kws).flat());
  return (Array.isArray(list) && list[0]) ? list[0] : 'Concert';
}

/* ══════════════════════════════════════════
   FETCH OPENAGENDA (CORRIGÉ)
   ══════════════════════════════════════════ */
async function fetchOAEvents(limit = 6) {
  // On crée les paramètres SANS le filtre 'from' pour tester
  const params = new URLSearchParams({ key: OA_KEY, limit: limit, lang: 'fr' });

  const url = `${OA_BASE}/agendas/${OA_AGENDA_UID}/events?${params}`;
  console.log('[VilleNova] 📡 Fetch :', url);

  const res = await fetch(url);
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`OpenAgenda ${res.status} — ${txt.slice(0, 200)}`);
  }

  const data = await res.json();
  
  // LOG CRUCIAL : regarde dans ta console F12 ce qu'il y a ici
  console.log('[VilleNova] Données reçues :', data);

  if (!Array.isArray(data.events) || data.events.length === 0) {
    throw new Error('Aucun événement retourné par l\'API.');
  }
  return data.events;
}

/* ══════════════════════════════════════════
   REMPLISSAGE D'UNE CARTE HTML
   IDs attendus : {prefix}-img, -title, -desc,
                  -date, -place, -prix, -badge, -link
   ══════════════════════════════════════════ */
// ── Lien détail ──
const linkEl = $('link');
if (linkEl) {
    const eventId = ev.uid || ev.slug;   // ← ID OpenAgenda
    linkEl.href = `/html/evenement-detail.html?id=${encodeURIComponent(eventId)}`;
    linkEl.setAttribute('aria-label', `Voir les détails : ${titre}`);
}
  const titre  = getText(ev.title)       || 'Événement';
  const desc   = getText(ev.description) || 'Aucune description disponible.';
  const image  = getImage(ev);
  const date   = getDateFr(ev);
  const lieu   = getLieu(ev);
  const prix   = getPrix(ev);
  const categ  = getCategorie(ev);

  // ── Image ──
  const imgEl = $('img');
  if (imgEl) {
    imgEl.src     = image || '/assets/img/placeholder.webp';
    imgEl.alt     = escapeAttr(titre);
    imgEl.onerror = () => { imgEl.src = '/assets/img/placeholder.webp'; };
  }

  // ── Badge catégorie ──
  const badgeEl = $('badge');
  if (badgeEl) badgeEl.textContent = categ;

  // ── Titre ──
  const titleEl = $('title');
  if (titleEl) titleEl.textContent = titre;

  // ── Description (max 150 caractères) ──
  const descEl = $('desc');
  if (descEl) {
    descEl.textContent = desc.length > 150 ? desc.substring(0, 150) + '…' : desc;
  }

  // ── Date ──
  const dateEl = $('date');
  if (dateEl) dateEl.textContent = `📅 ${date}`;

  // ── Lieu : nom sur une ligne, adresse dessous ──
  const placeEl = $('place');
  if (placeEl) {
    placeEl.textContent = `📍 ${lieu.nom ? lieu.nom + ' — ' : ''}${lieu.adresse}`;
  }

  // ── Tarif ──
  const prixEl = $('prix');
  if (prixEl) prixEl.textContent = `💶 ${prix}`;

  // ── Lien détail ──
  const linkEl = $('link');
  if (linkEl) {
    linkEl.href = `/html/evenement-detail.html?id=${encodeURIComponent(ev.uid || ev.slug || '')}`;
    linkEl.setAttribute('aria-label', `Voir les détails : ${titre}`);
  }

  // ── Animation apparition ──
  const cardEl = document.querySelector(`[aria-labelledby="${prefix}-title"]`);
  if (cardEl) {
    cardEl.classList.add('animate-in');
    requestAnimationFrame(() => requestAnimationFrame(() => cardEl.classList.add('visible')));
  }

  console.log(`[VilleNova] ✅ Carte ${prefix} remplie — ${titre}`);


/* ══════════════════════════════════════════
   CHARGEMENT DE TOUTES LES CARTES evN
   ══════════════════════════════════════════ */
async function loadOpenAgendaCards() {
  // Détecter tous les blocs ev1-*, ev2-*… présents dans le DOM
  const prefixes = [];
  for (let i = 1; i <= 9; i++) {
    if (document.querySelector(`[id^="ev${i}-"]`)) prefixes.push(`ev${i}`);
  }

  if (!prefixes.length) {
    console.info('[VilleNova] Aucune carte ev1-* trouvée dans le DOM.');
    return;
  }

  console.log(`[VilleNova] 🃏 Cartes à remplir : ${prefixes.join(', ')}`);

  // Passer les titres en "Chargement…"
  prefixes.forEach(p => {
    const t = document.getElementById(`${p}-title`);
    if (t) t.textContent = 'Chargement…';
    const d = document.getElementById(`${p}-date`);
    if (d) d.textContent = '📅 …';
  });

  try {
    const events = await fetchOAEvents(prefixes.length);

    prefixes.forEach((prefix, i) => {
      const ev = events[i];
      if (ev) {
        fillCard(prefix, ev);
      } else {
        const t = document.getElementById(`${prefix}-title`);
        if (t) t.textContent = 'Aucun événement disponible';
        console.warn(`[VilleNova] Pas d'événement pour ${prefix}`);
      }
    });

  } catch (err) {
    console.error('[VilleNova] ❌ Erreur :', err.message);
    prefixes.forEach(p => {
      const t = document.getElementById(`${p}-title`);
      if (t) t.textContent = 'Erreur de chargement';
      const d = document.getElementById(`${p}-date`);
      if (d) d.textContent = '⚠️ Voir console F12';
    });
    showToast('Impossible de charger les événements.', 'error');
  }
}

/* ══════════════════════════════════════════
   POINT D'ENTRÉE
   ══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {
  initNav();
  initFilters();
  initSearch();
  initScrollAnimations();
  initVideoModal();
  initPagination();
  initCounters();

  const form = document.getElementById('newsletter-form');
  if (form) form.addEventListener('submit', handleNewsletter);

  // Remplir les cartes ev1, ev2, ev3… avec OpenAgenda
  await loadOpenAgendaCards();
});

/* ══════════════════════════════════════════
   EXPORT
   ══════════════════════════════════════════ */
if (typeof module !== 'undefined') {
  module.exports = { fetchOAEvents, fillCard, loadOpenAgendaCards };
}