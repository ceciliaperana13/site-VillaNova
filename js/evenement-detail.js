'use strict';

/* ══════════════════════════════════════════
   CONFIG OPENAGENDA
   ══════════════════════════════════════════ */
const OA_KEY          = "832ecfba688a4dda9e6beb28922ee893";
const OA_AGENDA_UID   = "24882772";   // Agenda principal (même que main.js)
const OA_THEATRE_UID  = "65855330";
const OA_FESTIVAL_UID = "46290899";
const OA_SPORT_UID    = "94552197";
const OA_BASE         = "https://api.openagenda.com/v2";

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=1400&q=80';

/* ══════════════════════════════════════════
   UTILITAIRES
   ══════════════════════════════════════════ */
const _xssEl = document.createElement('div');
function escapeHtml(str) {
  _xssEl.textContent = String(str ?? '');
  return _xssEl.innerHTML;
}

/** Extrait un texte depuis un champ OA (string | { fr, en } | …) */
function getText(field) {
  if (!field) return '';
  if (typeof field === 'string') return field;
  return field.fr || field.en || Object.values(field)[0] || '';
}

/** Extrait l'URL image (3 formats OA) + onerror fallback */
function extractImage(ev) {
  if (!ev.image) return FALLBACK_IMG;
  if (ev.image.base && ev.image.filename) return ev.image.base + ev.image.filename;
  if (ev.image.variants?.length) {
    const v = ev.image.variants.find(v => v.type === 'full') || ev.image.variants[0];
    return ev.image.base + v.filename;
  }
  if (ev.image.url) return ev.image.url;
  return FALLBACK_IMG;
}

/** Date lisible depuis dateRange.fr ou firstTiming */
function getDate(ev) {
  if (ev.dateRange?.fr) return ev.dateRange.fr;
  const begin = ev.firstTiming?.begin;
  if (!begin) return 'Date non précisée';
  return new Date(begin).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

/** Heure depuis firstTiming.begin */
function getHeure(ev) {
  const begin = ev.firstTiming?.begin;
  if (!begin) return '';
  return new Date(begin).toLocaleTimeString('fr-FR', {
    hour: '2-digit', minute: '2-digit',
  });
}

/** Tarif : gratuit → prix → conditions → fallback */
function getPrix(ev) {
  if (ev.free === 1 || ev.free === true) return 'Gratuit';
  if (Array.isArray(ev.registration) && ev.registration.length) {
    const first = ev.registration.find(r => typeof r.price === 'number');
    if (first) return `${first.price.toFixed(2)} €`;
  }
  const cond = getText(ev.conditions);
  if (cond) {
    const m = cond.match(/(\d+(?:[.,]\d{1,2})?)\s*€/);
    if (m) return `${parseFloat(m[1].replace(',', '.')).toFixed(2)} €`;
    return cond.slice(0, 60);
  }
  return 'Voir détails';
}

/** Conditions textuelles complètes pour la sidebar */
function getConditions(ev) {
  if (ev.free === 1 || ev.free === true) return 'Entrée libre';
  return getText(ev.conditions) || '—';
}

/** Lieu complet */
function getLieu(ev) {
  const loc = ev.location || {};
  return [loc.name, loc.city].filter(Boolean).join(', ') || 'Non précisé';
}

/** Tags depuis keywords + catégorie devinée */
function getTags(ev) {
  const keywords = ev.keywords?.fr || [];
  const tags = [];
  if (ev.free) tags.push('✨ Gratuit');
  const titre = getText(ev.title).toLowerCase();
  if (/festival/.test(titre))                    tags.push('🎉 Festival');
  if (/concert|jazz|rock|musique/.test(titre))   tags.push('🎵 Musique');
  if (/expo|musée|galerie/.test(titre))           tags.push('🖼 Exposition');
  if (/théâtre|theatre|spectacle/.test(titre))   tags.push('🎭 Théâtre');
  if (/sport|foot|rugby|match/.test(titre))      tags.push('⚽ Sport');
  return [...new Set([...tags, ...keywords.slice(0, 3)])];
}

/* ══════════════════════════════════════════
   FETCH — par ID (depuis URL ?id=)
   ══════════════════════════════════════════ */
async function fetchById(id) {
  /* Essai sur l'agenda principal */
  const url = `${OA_BASE}/agendas/${OA_AGENDA_UID}/events/${id}?key=${OA_KEY}&lang=fr`;
  console.log('[VilleNova] Fetch par ID :', url);
  const res  = await fetch(url);
  if (!res.ok) throw new Error(`API ${res.status}`);
  const data = await res.json();
  return data.event || null;
}

/* ══════════════════════════════════════════
   FETCH — auto (pas d'ID dans l'URL)
   Récupère le 1er event dispo parmi les 4 agendas
   (même logique que les cartes 2–6 de main.js)
   ══════════════════════════════════════════ */
async function fetchAutoEvent() {
  console.log('[VilleNova] Pas d\'ID — fetch auto depuis les 4 agendas…');

  const [evMain, evTheatre, evFestival, evSport] = await Promise.all([
    oaFetch(OA_AGENDA_UID,   { limit: 2 }),
    oaFetch(OA_THEATRE_UID,  { limit: 1 }),
    oaFetch(OA_FESTIVAL_UID, { limit: 1 }),
    oaFetch(OA_SPORT_UID,    { limit: 1, 'relative[0]': 'current', 'relative[1]': 'upcoming' }),
  ]);

  /* On prend le premier event non-nul dans l'ordre des cartes 2 à 6 */
  const candidates = [evMain[1], evTheatre[0], evFestival[0], evSport[0], evMain[0]];
  return candidates.find(Boolean) || null;
}

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

/* ══════════════════════════════════════════
   INJECTION DANS LE DOM
   ══════════════════════════════════════════ */
function displayEvent(ev) {
  const titre     = getText(ev.title) || 'Événement';
  const desc      = getText(ev.description) || getText(ev.summary) || 'Aucune description disponible.';
  const longDesc  = getText(ev.longDescription) || '';
  const date      = getDate(ev);
  const heure     = getHeure(ev);
  const lieu      = getLieu(ev);
  const lieuNom   = ev.location?.name || 'Lieu non précisé';
  const lieuAdr   = [ev.location?.address, ev.location?.city].filter(Boolean).join(', ');
  const prix      = getPrix(ev);
  const conditions = getConditions(ev);
  const imgSrc    = extractImage(ev);
  const tags      = getTags(ev);
  const slug      = ev.slug || ev.uid;
  const lienOA    = `https://openagenda.com/agendas/${OA_AGENDA_UID}/events/${slug}`;
  const kw        = (ev.keywords?.fr || []).slice(0, 2).join(' · ') || '—';

  /* ── Méta page ── */
  document.title = `${titre} | VilleNova`;
  const metaDesc = document.getElementById('page-desc');
  if (metaDesc) metaDesc.content = desc.slice(0, 160);

  /* ── Hero image ── */
  const imgEl = document.getElementById('detail-img');
  if (imgEl) {
    imgEl.src = imgSrc;
    imgEl.alt = titre;
    imgEl.onerror = () => { imgEl.src = FALLBACK_IMG; imgEl.onerror = null; };
  }

  /* ── Photo galerie (même image) ── */
  const mediaImg = document.getElementById('media-img-1');
  if (mediaImg) {
    mediaImg.src = imgSrc;
    mediaImg.alt = titre;
    mediaImg.onerror = () => { mediaImg.src = FALLBACK_IMG; mediaImg.onerror = null; };
  }

  /* ── Breadcrumb ── */
  const bc = document.getElementById('detail-breadcrumb');
  if (bc) bc.textContent = `${ev.free ? 'Gratuit' : 'Payant'} · Marseille`;

  /* ── Titre ── */
  const titleEl = document.getElementById('detail-title');
  if (titleEl) titleEl.textContent = titre;

  /* ── Description ── */
  const descEl = document.getElementById('detail-desc');
  if (descEl) descEl.textContent = desc;

  const longDescEl = document.getElementById('detail-long-desc');
  if (longDescEl && longDesc && longDesc !== desc) {
    longDescEl.textContent = longDesc;
  }

  /* ── Tags ── */
  const tagsEl = document.getElementById('detail-tags');
  if (tagsEl) {
    tagsEl.innerHTML = tags.map(t =>
      `<span class="detail-tag">${escapeHtml(t)}</span>`
    ).join('');
  }

  /* ── Accès texte ── */
  const accesEl = document.getElementById('detail-acces');
  if (accesEl) {
    accesEl.textContent = lieuAdr
      ? `L'événement se tient au ${lieuNom}, ${lieuAdr}.`
      : `L'événement se tient au ${lieuNom}.`;
  }

  /* ── Carte lieu ── */
  const lieuNomEl = document.getElementById('detail-lieu-nom');
  if (lieuNomEl) lieuNomEl.textContent = lieuNom;

  const lieuAdrEl = document.getElementById('detail-lieu-adresse');
  if (lieuAdrEl) lieuAdrEl.textContent = lieuAdr;

  /* ── Sidebar ── */
  setText('sidebar-prix',       prix);
  setText('sidebar-prix-detail', ev.free ? 'Entrée libre sans réservation' : '');
  setText('sidebar-date',       date);
  setText('sidebar-heure',      heure || 'Voir programme');
  setText('sidebar-lieu',       lieu);
  setText('sidebar-conditions', conditions);
  setText('sidebar-cat',        kw);

  /* ── Bouton lien officiel OA ── */
  const btnOA = document.getElementById('btn-oa-link');
  if (btnOA) {
    btnOA.href = lienOA;
    btnOA.setAttribute('aria-label', `Voir la page officielle de ${titre} sur OpenAgenda`);
  }

  /* ── Bouton réservation — aria-label dynamique ── */
  const btnResa = document.getElementById('btn-reservation');
  if (btnResa) {
    btnResa.setAttribute('aria-label', `Réserver ma place pour ${titre}`);
  }

  /* ── Bouton favoris — aria-label dynamique ── */
  const btnFav = document.getElementById('btn-favoris');
  if (btnFav) {
    btnFav.setAttribute('aria-label', `Ajouter "${titre}" à mes favoris`);
  }

  console.log(`[VilleNova] Événement affiché : "${titre}" | ${date} | ${lieu} | ${prix}`);
}

/** Raccourci injection textContent */
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

/* ══════════════════════════════════════════
   ÉTAT D'ERREUR
   ══════════════════════════════════════════ */
function displayError() {
  setText('detail-title', 'Événement introuvable');
  setText('detail-desc',  'Impossible de charger cet événement. Vérifiez votre connexion ou revenez plus tard.');
  const imgEl = document.getElementById('detail-img');
  if (imgEl) imgEl.src = FALLBACK_IMG;
}

/* ══════════════════════════════════════════
   TOAST
   ══════════════════════════════════════════ */
function showToast(message, type = 'info') {
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `<span>${icons[type] ?? 'ℹ'}</span> ${escapeHtml(message)}`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3400);
}

/* ══════════════════════════════════════════
   BOUTONS
   ══════════════════════════════════════════ */
function initBtnFavoris() {
  const btn = document.getElementById('btn-favoris');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const isActive = btn.getAttribute('aria-pressed') === 'true';
    if (isActive) {
      btn.setAttribute('aria-pressed', 'false');
      btn.innerHTML = '♡ Ajouter aux favoris';
      btn.style.cssText = 'background:transparent;border:2px solid var(--terracotta);color:var(--terracotta);margin-top:.6rem;box-shadow:none;';
      showToast('Retiré de vos favoris', 'info');
    } else {
      btn.setAttribute('aria-pressed', 'true');
      btn.innerHTML = '♥ Dans vos favoris';
      btn.style.cssText = 'background:var(--terracotta);border:2px solid var(--terracotta);color:#fff;margin-top:.6rem;box-shadow:none;';
      showToast('Événement ajouté à vos favoris ❤️', 'success');
    }
  });
}

function initBtnShare() {
  const url   = window.location.href;
  const titre = document.title;

  document.getElementById('btn-share-fb')?.addEventListener('click', () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      '_blank', 'noopener,noreferrer,width=600,height=400'
    );
    showToast('Partage Facebook ouvert', 'info');
  });

  document.getElementById('btn-share-tw')?.addEventListener('click', () => {
    window.open(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(titre)}`,
      '_blank', 'noopener,noreferrer,width=600,height=400'
    );
    showToast('Partage X ouvert', 'info');
  });

  document.getElementById('btn-share-copy')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(url);
      showToast('Lien copié !', 'success');
    } catch {
      /* Fallback execCommand */
      const tmp = document.createElement('textarea');
      tmp.value = url;
      document.body.appendChild(tmp);
      tmp.select();
      document.execCommand('copy');
      tmp.remove();
      showToast('Lien copié !', 'success');
    }
  });
}

/* ══════════════════════════════════════════
   NAV BURGER
   ══════════════════════════════════════════ */
function initNav() {
  const burger   = document.getElementById('nav-burger');
  const navLinks = document.getElementById('nav-links');
  if (!burger || !navLinks) return;

  burger.addEventListener('click', () => {
    const isOpen = burger.getAttribute('aria-expanded') === 'true';
    burger.setAttribute('aria-expanded', String(!isOpen));
    navLinks.classList.toggle('open', !isOpen);
  });

  document.addEventListener('click', e => {
    if (!burger.contains(e.target) && !navLinks.contains(e.target)) {
      burger.setAttribute('aria-expanded', 'false');
      navLinks.classList.remove('open');
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      burger.setAttribute('aria-expanded', 'false');
      navLinks.classList.remove('open');
      burger.focus();
    }
  });
}

/* ══════════════════════════════════════════
   LOADER
   ══════════════════════════════════════════ */
function initLoader() {
  window.addEventListener('load', () => {
    const loader = document.getElementById('page-loader');
    if (!loader) return;
    setTimeout(() => {
      loader.classList.add('hidden');
      loader.addEventListener('transitionend', () => loader.remove(), { once: true });
    }, 400);
  });
}

/* ══════════════════════════════════════════
   POINT D'ENTRÉE
   ══════════════════════════════════════════ */
async function init() {
  initLoader();
  initNav();
  initBtnFavoris();
  initBtnShare();

  /* Lire l'ID dans l'URL (?id=XXXX) */
  const urlParams = new URLSearchParams(window.location.search);
  const eventId   = urlParams.get('id');

  try {
    let ev = null;

    if (eventId) {
      /* Mode normal : lien cliqué depuis une card (ev1–ev6) */
      ev = await fetchById(eventId);
    } else {
      /* Mode autonome : page ouverte directement sans ID
         → on charge automatiquement le 1er event dispo (card 2–6) */
      ev = await fetchAutoEvent();
    }

    if (!ev) throw new Error('Aucun événement disponible');
    displayEvent(ev);

  } catch (err) {
    console.error('[VilleNova] Erreur :', err);
    displayError();
    showToast('Impossible de charger l\'événement.', 'error');
  }
}

document.addEventListener('DOMContentLoaded', init);