/* =========================================
   VilleNova — index.js
   Script de la page d'accueil (index.html)
   ========================================= */

'use strict';

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

  // Ferme le menu au clic sur un lien
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      burger.setAttribute('aria-expanded', 'false');
      navLinks.classList.remove('open');
    });
  });

  // Ferme au clic hors du menu
  document.addEventListener('click', (e) => {
    if (!burger.contains(e.target) && !navLinks.contains(e.target)) {
      burger.setAttribute('aria-expanded', 'false');
      navLinks.classList.remove('open');
    }
  });

  // Ferme à la touche Escape
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
      // Réinitialiser tous les états
      filterBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });

      // Activer le bouton cliqué
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
    const eased    = 1 - Math.pow(1 - progress, 3); // ease-out cubic
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
  const modal   = document.getElementById('video-modal');
  const trigger = document.querySelector('[data-video-trigger]');
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
   9. PAGINATION
   ══════════════════════════════════════════ */
function initPagination() {
  document.querySelectorAll('.page-btn').forEach(btn => {
    const label = btn.textContent.trim();

    if (label === '←' || label === '→') {
      btn.addEventListener('click', () => showToast('Navigation entre les pages', 'info'));
      return;
    }

    btn.addEventListener('click', function () {
      document.querySelectorAll('.page-btn').forEach(b => {
        b.classList.remove('active');
        b.removeAttribute('aria-current');
      });
      this.classList.add('active');
      this.setAttribute('aria-current', 'page');
      showToast(`Page ${this.textContent} chargée`, 'success');

      const section = document.getElementById('evenements');
      if (section) window.scrollTo({ top: section.offsetTop - 80, behavior: 'smooth' });
    });
  });
}

/* ══════════════════════════════════════════
   10. NEWSLETTER
   ══════════════════════════════════════════ */
function handleNewsletter(e) {
  e.preventDefault();
  const email = document.getElementById('newsletter-email').value;
  showToast(`Inscription confirmée pour ${email} ! 🎉`, 'success');
  e.target.reset();
}

/* ══════════════════════════════════════════
   11. POINT D'ENTRÉE
   ══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initFilters();
  initSearch();
  initCounters();
  initScrollAnimations();
  initVideoModal();
  initPagination();
});

/* ══════════════════════════════════════════
   INIT NEWSLETTER (lié au formulaire HTML
   via id="newsletter-form", pas d'event listener global)
   ══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('newsletter-form');
  if (form) {
    form.addEventListener('submit', handleNewsletter);
  }
});