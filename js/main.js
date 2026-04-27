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

  // Fermer sur clic extérieur
  document.addEventListener('click', (e) => {
    if (!burger.contains(e.target) && !navLinks.contains(e.target)) {
      burger.setAttribute('aria-expanded', 'false');
      navLinks.classList.remove('open');
      navLinks.setAttribute('aria-hidden', 'true');
    }
  });

  // Fermer sur Escape
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
      // Mettre à jour l'état actif
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

      // Annonce pour lecteurs d'écran
      announceToScreenReader(`Filtre : ${tag.textContent}. ${countVisible(cards)} événements affichés.`);
    });
  });
}

function countVisible(cards) {
  return Array.from(cards).filter(c => c.style.display !== 'none').length;
}

/* ---- BARRE DE RECHERCHE ASYNCHRONE ---- */
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
  let count = 0;
  cards.forEach(card => {
    const title = card.querySelector('.card-title')?.textContent.toLowerCase() || '';
    const desc  = card.querySelector('.card-desc')?.textContent.toLowerCase() || '';
    const match = !query || title.includes(query) || desc.includes(query);
    card.style.display = match ? '' : 'none';
    if (match) count++;
  });
  announceToScreenReader(`${count} événement(s) trouvé(s) pour « ${query} »`);
}

/* ---- INTERSECTION OBSERVER (animations scroll) ---- */
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
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'polite');
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

/* ---- ACCESSIBILITÉ : annonce écran ---- */
function announceToScreenReader(msg) {
  let live = document.getElementById('sr-announce');
  if (!live) {
    live = document.createElement('div');
    live.id = 'sr-announce';
    live.setAttribute('aria-live', 'polite');
    live.setAttribute('aria-atomic', 'true');
    Object.assign(live.style, {
      position: 'absolute', width: '1px', height: '1px',
      overflow: 'hidden', clip: 'rect(0 0 0 0)',
      whiteSpace: 'nowrap'
    });
    document.body.appendChild(live);
  }
  live.textContent = '';
  requestAnimationFrame(() => { live.textContent = msg; });
}

/* ---- COMPTEUR ANIMÉ (stats) ---- */
function animateCounter(el, target, duration = 1600) {
  const start = performance.now();
  const update = (time) => {
    const progress = Math.min((time - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(ease * target).toLocaleString('fr-FR');
    if (progress < 1) requestAnimationFrame(update);
    else el.textContent = target.toLocaleString('fr-FR');
  };
  requestAnimationFrame(update);
}

function initCounters() {
  if (!('IntersectionObserver' in window)) return;
  const counters = document.querySelectorAll('[data-count]');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target, parseInt(entry.target.dataset.count));
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  counters.forEach(c => observer.observe(c));
}

/* ---- MODAL VIDÉO ---- */
function initVideoModal() {
  const triggers = document.querySelectorAll('[data-video-trigger]');
  const modal = document.getElementById('video-modal');
  const videoEl = modal?.querySelector('video');
  const closeBtn = modal?.querySelector('.video-modal-close');
  if (!modal) return;

  triggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      if (videoEl) videoEl.play().catch(() => {});
      closeBtn?.focus();
    });
  });

  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    if (videoEl) { videoEl.pause(); videoEl.currentTime = 0; }
    triggers[0]?.focus();
  }

  closeBtn?.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('open')) closeModal(); });
}

/* ---- STICKY HEADER SHADOW ---- */
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

/* ---- INIT ---- */
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initFilters();
  initSearch();
  initScrollAnimations();
  initCounters();
  initVideoModal();
  initStickyHeader();
});