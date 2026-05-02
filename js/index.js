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
   RECHERCHE + FILTRES (COMBINÉS)
   ══════════════════════════════════════════ */
function applySearchAndFilters() {
  const q = document.getElementById('search-input')?.value?.toLowerCase().trim() || "";
  const activeFilter = document.querySelector('.filter-tag.active')?.dataset.filter || "all";

  document.querySelectorAll('#events-grid .event-card').forEach(card => {
    const textMatch = !q || card.textContent.toLowerCase().includes(q);
    const filterMatch = activeFilter === "all" || card.dataset.category === activeFilter;

    const visible = textMatch && filterMatch;

    card.style.display = visible ? "" : "none";
    card.setAttribute("aria-hidden", String(!visible));
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
      filterBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });

      this.classList.add('active');
      this.setAttribute('aria-pressed', 'true');

      applySearchAndFilters();
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
    applySearchAndFilters();
    if (searchInput.value.trim()) {
      showToast(`Résultats pour « ${searchInput.value} »`, 'info');
    }
  }

  searchBtn?.addEventListener('click', doSearch);
  searchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') doSearch();
  });
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

  const openModal = () => {
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
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openModal();
    }
  });

  closeBtn?.addEventListener('click', closeModal);

  modal.addEventListener('click', e => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });
}

/* ══════════════════════════════════════════
   PAGINATION
   ══════════════════════════════════════════ */
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

/* ══════════════════════════════════════════
   NEWSLETTER
   ══════════════════════════════════════════ */
function handleNewsletter(e) {
  e.preventDefault();

  const email = document.getElementById('newsletter-email')?.value?.trim();
  const btn   = e.target.querySelector('[type="submit"]');

  if (!email) {
    showToast('Veuillez entrer un email valide.', 'error');
    return;
  }

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

function escapeHtml(str) {
  _xssEl.textContent = String(str ?? '');
  return _xssEl.innerHTML;
}

function escapeAttr(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/* ══════════════════════════════════════════
   INIT GLOBAL
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
