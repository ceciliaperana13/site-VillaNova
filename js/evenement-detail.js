'use strict';

/* CONFIG OPENAGENDA */
const OA_KEY         = "832ecfba688a4dda9e6beb28922ee893";
const OA_AGENDA_UID  = "2119473";
const OA_AGENDA_SLUG = "musees-de-marseille";  // Public slug for links
const OA_BASE        = "https://api.openagenda.com/v2";

// Default event when no ?id= in the URL
const DEFAULT_EVENT_UID  = "27089585";
const DEFAULT_EVENT_SLUG = "sequence-douverture-saison-mediterranee-3972861";

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=1400&q=80';

/* UTILITIES */
const _xssEl = document.createElement('div');
function escapeHtml(str) {
  _xssEl.textContent = String(str ?? '');
  return _xssEl.innerHTML;
}

/** Extracts text from an OA field (string | { fr, en } | …) */
function getText(field) {
  if (!field) return '';
  if (typeof field === 'string') return field;
  return field.fr || field.en || Object.values(field)[0] || '';
}

/** Extracts the image URL (3 OA formats) + optimisation + fallback */
function extractImage(ev) {
  if (!ev.image) return FALLBACK_IMG;

  let url = null;

  if (ev.image.base && ev.image.filename) {
    url = ev.image.base + ev.image.filename;
  } else if (ev.image.variants?.length) {
    const v = ev.image.variants.find(v => v.type === 'full') || ev.image.variants[0];
    url = ev.image.base + v.filename;
  } else if (ev.image.url) {
    url = ev.image.url;
  }

  if (!url) return FALLBACK_IMG;
  return url + "?w=1200&auto=compress";
}

/** Human-readable date */
function getDate(ev) {
  if (ev.dateRange?.fr) return ev.dateRange.fr;
  const begin = ev.firstTiming?.begin;
  if (!begin) return 'Date non précisée';
  return new Date(begin).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

/** Start time */
function getHeure(ev) {
  const begin = ev.firstTiming?.begin;
  if (!begin) return '';
  return new Date(begin).toLocaleTimeString('fr-FR', {
    hour: '2-digit', minute: '2-digit',
  });
}

/** End time */
function getHeureFin(ev) {
  const end = ev.firstTiming?.end || ev.lastTiming?.end;
  if (!end) return '';
  return new Date(end).toLocaleTimeString('fr-FR', {
    hour: '2-digit', minute: '2-digit',
  });
}

/** Price */
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

/** Full conditions */
function getConditions(ev) {
  if (ev.free === 1 || ev.free === true) return 'Gratuit dans la limite des places disponibles';
  return getText(ev.conditions) || '—';
}

/** Booking link if available */
function getLienResa(ev) {
  if (Array.isArray(ev.registration) && ev.registration.length) {
    const withLink = ev.registration.find(r => r.url);
    if (withLink) return withLink.url;
  }
  return null;
}

/** Full location */
function getLieu(ev) {
  const loc = ev.location || {};
  return [loc.name, loc.city].filter(Boolean).join(', ') || 'Non précisé';
}

/** Photo credits */
function getCredits(ev) {
  return ev.imageCredits || ev.image?.credits || '';
}

/** Tags from keywords + guessed category */
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

/* FETCH — by ID (from URL ?id=) */
async function fetchById(id) {
  const url = `${OA_BASE}/agendas/${OA_AGENDA_UID}/events/${id}?key=${OA_KEY}&lang=fr`;
  console.log('[VilleNova] Fetch by ID:', url);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API ${res.status}`);
  const data = await res.json();
  return data.event || null;
}

async function fetchAutoEvent() {
  console.log('[VilleNova] Fetch default event uid:', DEFAULT_EVENT_UID);
  try {
    const ev = await fetchById(DEFAULT_EVENT_UID);
    if (ev) return ev;
  } catch (e) {
    console.warn('[VilleNova] fetchById failed, falling back to list…', e);
  }

  // Fallback: search in the list by slug
  console.log('[VilleNova] Fallback: searching by slug in list…');
  const url = `${OA_BASE}/agendas/${OA_AGENDA_UID}/events?` +
    new URLSearchParams({
      key: OA_KEY,
      lang: 'fr',
      'relative[0]': 'current',
      'relative[1]': 'upcoming',
      limit: 20,
    });
  const res  = await fetch(url);
  const data = await res.json();
  const events = data.events || [];

  // Try exact slug match first, then uid, then first result
  return (
    events.find(e => e.slug === DEFAULT_EVENT_SLUG) ||
    events.find(e => String(e.uid) === String(DEFAULT_EVENT_UID)) ||
    events[0] ||
    null
  );
}

/* DOM INJECTION */
function displayEvent(ev) {
  const titre = getText(ev.title) || 'Événement';

  // Short description (subtitle / summary)
  const desc =
    getText(ev.description) ||
    getText(ev.summary) ||
    'Aucune description disponible.';

  // Long description (full body)
  const longDesc =
    getText(ev.longDescription) ||
    ev.bodytext ||
    ev.html ||
    '';

  const date       = getDate(ev);
  const heure      = getHeure(ev);
  const heureFin   = getHeureFin(ev);
  const lieu       = getLieu(ev);
  const lieuNom    = ev.location?.name   || 'Lieu non précisé';
  const lieuAdr    = [ev.location?.address, ev.location?.city].filter(Boolean).join(', ');
  const prix       = getPrix(ev);
  const conditions = getConditions(ev);
  const lienResa   = getLienResa(ev);
  const imgSrc     = extractImage(ev);
  const credits    = getCredits(ev);
  const tags       = getTags(ev);
  const slug       = ev.slug || DEFAULT_EVENT_SLUG;
  const kw         = (ev.keywords?.fr || []).slice(0, 2).join(' · ') || 'Musique · Concert';

  // Public OpenAgenda link
  const lienOA = `https://openagenda.com/${OA_AGENDA_SLUG}/events/${slug}`;

  console.log('[VilleNova] Event received:', ev);

  /* ── Page meta ── */
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

  /* ── Photo credits ── */
  const creditsEl = document.getElementById('detail-img-credits');
  if (creditsEl && credits) creditsEl.textContent = credits;

  /* ── Gallery photo ── */
  const mediaImg = document.getElementById('media-img-1');
  if (mediaImg) {
    mediaImg.src = imgSrc;
    mediaImg.alt = titre;
    mediaImg.onerror = () => { mediaImg.src = FALLBACK_IMG; mediaImg.onerror = null; };
  }

  /* ── Breadcrumb ── */
  const bc = document.getElementById('detail-breadcrumb');
  if (bc) bc.textContent = `${ev.free ? 'Gratuit' : 'Payant'} · Marseille`;

  /* ── Title ── */
  const titleEl = document.getElementById('detail-title');
  if (titleEl) titleEl.textContent = titre;

  /* ── Short description (e.g. "Saison Méditerranée 2026") ── */
  const descEl = document.getElementById('detail-desc');
  if (descEl) {
    descEl.textContent = desc;
    descEl.style.fontStyle = desc.length < 40 ? 'italic' : '';
  }

  /* ── Long description ── */
  const longDescEl = document.getElementById('detail-long-desc');
  if (longDescEl) {
    if (longDesc) {
      longDescEl.textContent = longDesc;
      longDescEl.hidden = false;
    } else {
      longDescEl.hidden = true;
    }
  }

  /* ── Tags ── */
  const tagsEl = document.getElementById('detail-tags');
  if (tagsEl) {
    tagsEl.innerHTML = tags.map(t =>
      `<span class="detail-tag">${escapeHtml(t)}</span>`
    ).join('');
  }

  /* ── Access text ── */
  const accesEl = document.getElementById('detail-acces');
  if (accesEl) {
    accesEl.textContent = lieuAdr
      ? `L'événement se tient au ${lieuNom}, ${lieuAdr}.`
      : `L'événement se tient au ${lieuNom}.`;
  }

  /* ── Venue map ── */
  const lieuNomEl = document.getElementById('detail-lieu-nom');
  if (lieuNomEl) lieuNomEl.textContent = lieuNom;

  const lieuAdrEl = document.getElementById('detail-lieu-adresse');
  if (lieuAdrEl) lieuAdrEl.textContent = lieuAdr;

  /* ── Sidebar ── */
  setText('sidebar-prix',        prix);
  setText('sidebar-prix-detail', conditions);
  setText('sidebar-date',        date);
  setText('sidebar-heure',       heure && heureFin ? `${heure} – ${heureFin}` : heure || 'Voir programme');
  setText('sidebar-lieu',        lieu);
  setText('sidebar-conditions',  conditions);
  setText('sidebar-cat',         kw);

  /* ── Official OA link button ── */
  const btnOA = document.getElementById('btn-oa-link');
  if (btnOA) {
    btnOA.href = lienOA;
    btnOA.setAttribute('aria-label', `Voir la page officielle de ${titre} sur OpenAgenda`);
  }

  /* ── Booking button ── */
  const btnResa = document.getElementById('btn-reservation');
  if (btnResa) {
    btnResa.setAttribute('aria-label', `Réserver ma place pour ${titre}`);
    if (lienResa) {
      btnResa.href = lienResa;
      btnResa.target = '_blank';
      btnResa.rel = 'noopener noreferrer';
    }
  }

  /* ── Favourites button ── */
  const btnFav = document.getElementById('btn-favoris');
  if (btnFav) {
    btnFav.setAttribute('aria-label', `Ajouter "${titre}" à mes favoris`);
  }

  console.log(`[VilleNova] ✅ Displayed: "${titre}" | ${date} ${heure}–${heureFin} | ${lieu} | ${prix}`);
  console.log(`[VilleNova] 🔗 OA link: ${lienOA}`);
}

/** Shortcut to inject textContent */
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

/* ERROR STATE */
function displayError() {
  setText('detail-title', 'Événement introuvable');
  setText('detail-desc',  'Impossible de charger cet événement. Vérifiez votre connexion ou revenez plus tard.');
  const imgEl = document.getElementById('detail-img');
  if (imgEl) imgEl.src = FALLBACK_IMG;
}

/* TOAST */
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

/* BUTTONS */
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

/* NAV BURGER */
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

/* LOADER */
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

/* ENTRY POINT */
async function init() {
  initLoader();
  initNav();
  initBtnFavoris();
  initBtnShare();

  const urlParams = new URLSearchParams(window.location.search);
  const eventId   = urlParams.get('id');

  try {
    let ev = null;

    if (eventId) {
      // Normal mode: link clicked from a card (?id=XXXX)
      ev = await fetchById(eventId);
    } else {
      // Standalone mode: load the Sofiane Saidi concert (uid 27089585)
      ev = await fetchAutoEvent();
    }

    if (!ev) throw new Error('Aucun événement disponible');
    displayEvent(ev);

  } catch (err) {
    console.error('[VilleNova] Error:', err);
    displayError();
    showToast('Impossible de charger l\'événement.', 'error');
  }
}

document.addEventListener('DOMContentLoaded', init);