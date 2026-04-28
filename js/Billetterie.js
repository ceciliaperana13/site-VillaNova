/* =========================================
   VilleNova — billetterie.js
   ========================================= */

'use strict';

/* ══════════════════════════════════════════
   1. ÉTAT GLOBAL DU PANIER
   ══════════════════════════════════════════ */
const cart = {
  items: {},          // { eventId: { name, price, qty } }
  promoApplied: false,
  promoDiscount: 0,

  get total() {
    return Object.values(this.items).reduce((sum, i) => sum + i.price * i.qty, 0);
  },

  get count() {
    return Object.values(this.items).reduce((sum, i) => sum + i.qty, 0);
  },

  get fees() {
    const sub = this.total;
    return sub > 0 ? parseFloat((sub * 0.015 + 0.5).toFixed(2)) : 0;  // 1.5% + 0.50€
  },

  get grandTotal() {
    return Math.max(0, this.total + this.fees - this.promoDiscount);
  },

  setItem(id, name, price, qty) {
    if (qty <= 0) {
      delete this.items[id];
    } else {
      this.items[id] = { name, price, qty };
    }
  },

  clear() {
    this.items        = {};
    this.promoApplied = false;
    this.promoDiscount = 0;
  },
};

/* ══════════════════════════════════════════
   2. LOADER
   ══════════════════════════════════════════ */
window.addEventListener('load', () => {
  const loader = document.getElementById('page-loader');
  if (!loader) return;
  setTimeout(() => {
    loader.classList.add('hidden');
    loader.addEventListener('transitionend', () => loader.remove(), { once: true });
  }, 700);
});

/* ══════════════════════════════════════════
   3. NAVIGATION BURGER
   ══════════════════════════════════════════ */
function initNav() {
  const burger   = document.getElementById('nav-burger');
  const navLinks = document.querySelector('.nav-links');
  if (!burger || !navLinks) return;

  burger.addEventListener('click', () => {
    const isOpen = burger.getAttribute('aria-expanded') === 'true';
    burger.setAttribute('aria-expanded', String(!isOpen));
    navLinks.classList.toggle('open', !isOpen);
  });

  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
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
    }
  });
}

/* ══════════════════════════════════════════
   4. FILTRES PAR CATÉGORIE
   ══════════════════════════════════════════ */
function initFilters() {
  const chips = document.querySelectorAll('.filter-chip');
  const count = document.getElementById('results-count');
  if (!chips.length) return;

  chips.forEach(chip => {
    chip.addEventListener('click', function () {
      chips.forEach(c => { c.classList.remove('active'); c.setAttribute('aria-pressed', 'false'); });
      this.classList.add('active');
      this.setAttribute('aria-pressed', 'true');

      const filter = this.dataset.filter;
      const cards  = document.querySelectorAll('#events-grid .billet-card');
      let visible  = 0;

      cards.forEach((card, i) => {
        const match = filter === 'all' || card.dataset.category === filter;
        card.style.display = match ? '' : 'none';
        card.setAttribute('aria-hidden', String(!match));
        if (match) {
          /* Ré-animer les cartes filtrées avec décalage */
          card.classList.remove('visible');
          card.style.setProperty('--delay', `${visible * 60}ms`);
          setTimeout(() => card.classList.add('visible'), 20 + visible * 60);
          visible++;
        }
      });

      if (count) count.textContent = `${visible} événement${visible > 1 ? 's' : ''}`;
    });
  });
}

/* ══════════════════════════════════════════
   5. TRI
   ══════════════════════════════════════════ */
function initSort() {
  const sel  = document.getElementById('sort-select');
  const grid = document.getElementById('events-grid');
  if (!sel || !grid) return;

  sel.addEventListener('change', () => {
    const cards = [...grid.querySelectorAll('.billet-card:not([style*="display: none"])')];

    const getPrice = (card) => {
      const first = card.querySelector('.tarif-prix');
      return first ? parseFloat(first.textContent.replace(/[^\d.]/g, '')) || 0 : 0;
    };

    const compare = {
      'date':       () => 0,
      'price-asc':  (a, b) => getPrice(a) - getPrice(b),
      'price-desc': (a, b) => getPrice(b) - getPrice(a),
      'popular':    () => Math.random() - .5,   // démo
    }[sel.value] ?? (() => 0);

    cards.sort(compare);

    /* Réinsertion avec animation */
    cards.forEach((card, i) => {
      card.classList.remove('visible');
      card.style.setProperty('--delay', `${i * 55}ms`);
      grid.appendChild(card);
      setTimeout(() => card.classList.add('visible'), 20 + i * 55);
    });
  });
}

/* ══════════════════════════════════════════
   6. CONTRÔLES QUANTITÉ
   ══════════════════════════════════════════ */
function initQtyControls() {
  document.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      const eventId  = this.dataset.event;
      const price    = parseFloat(this.dataset.price);
      const name     = this.dataset.name;
      const isMinus  = this.classList.contains('qty-minus');
      const output   = document.querySelector(`.qty-val[data-event="${eventId}"]`);
      const row      = this.closest('.tarif-row');

      if (!output) return;

      let qty = parseInt(output.textContent, 10) || 0;
      qty = isMinus ? Math.max(0, qty - 1) : Math.min(10, qty + 1);

      /* Mise à jour DOM */
      output.textContent = qty;
      output.classList.add('changed');
      output.addEventListener('animationend', () => output.classList.remove('changed'), { once: true });

      /* Highlight de la ligne */
      if (qty > 0) {
        row.classList.add('has-qty');
      } else {
        row.classList.remove('has-qty');
      }

      /* Désactiver le bouton minus si qty = 0 */
      const minusBtn = row.querySelector('.qty-minus');
      if (minusBtn) minusBtn.disabled = qty === 0;

      /* Mise à jour du panier */
      cart.setItem(eventId, name, price, qty);
      renderCart();
      updateCartBadge();

      /* Toast si ajout */
      if (!isMinus && qty > 0) {
        showToast(`✓ ${name} ajouté au panier`, 'success', 2000);
      }
    });
  });
}

/* ══════════════════════════════════════════
   7. RENDU PANIER
   ══════════════════════════════════════════ */
function renderCart() {
  const itemsEl   = document.getElementById('cart-items');
  const footerEl  = document.getElementById('cart-footer');
  const emptyEl   = document.getElementById('cart-empty');
  const subtotalEl = document.getElementById('cart-subtotal');
  const feesEl    = document.getElementById('cart-fees');
  const totalEl   = document.getElementById('cart-total');

  const isEmpty = cart.count === 0;

  /* Afficher / masquer états */
  if (emptyEl) emptyEl.style.display = isEmpty ? 'flex' : 'none';
  if (footerEl) footerEl.hidden = isEmpty;

  if (!itemsEl) return;

  /* Supprimer les items précédents (pas l'empty state) */
  itemsEl.querySelectorAll('.cart-item').forEach(el => el.remove());

  /* Réinjecter les items */
  Object.entries(cart.items).forEach(([id, item]) => {
    const el = document.createElement('div');
    el.className = 'cart-item';
    el.setAttribute('role', 'listitem');
    el.innerHTML = `
      <div class="cart-item-info">
        <p class="cart-item-name">${escapeHtml(item.name)}</p>
        <p class="cart-item-sub">${item.qty} × ${item.price.toFixed(2)} €</p>
      </div>
      <span class="cart-item-price">${(item.price * item.qty).toFixed(2)} €</span>
      <button class="cart-item-remove" data-id="${id}" aria-label="Supprimer ${escapeHtml(item.name)}">✕</button>
    `;

    el.querySelector('.cart-item-remove').addEventListener('click', () => {
      removeCartItem(id);
    });

    itemsEl.appendChild(el);
  });

  /* Totaux */
  const fmt = (n) => n.toFixed(2).replace('.', ',') + ' €';
  if (subtotalEl) subtotalEl.textContent = fmt(cart.total);
  if (feesEl)     feesEl.textContent     = fmt(cart.fees);
  if (totalEl)    totalEl.textContent    = fmt(cart.grandTotal);
}

function removeCartItem(id) {
  const item = cart.items[id];
  if (!item) return;

  /* Réinitialiser le compteur dans la carte */
  const output = document.querySelector(`.qty-val[data-event="${id}"]`);
  if (output) {
    output.textContent = '0';
    const row = output.closest('.tarif-row');
    if (row) {
      row.classList.remove('has-qty');
      const minusBtn = row.querySelector('.qty-minus');
      if (minusBtn) minusBtn.disabled = true;
    }
  }

  cart.setItem(id, '', 0, 0);
  renderCart();
  updateCartBadge();
  showToast('Billet retiré du panier', 'info', 2000);
}

/* ══════════════════════════════════════════
   8. BADGE PANIER HEADER
   ══════════════════════════════════════════ */
function updateCartBadge() {
  const badge = document.getElementById('cart-count');
  if (!badge) return;
  const prev = parseInt(badge.textContent, 10);
  badge.textContent = cart.count;
  if (cart.count !== prev) {
    badge.classList.remove('bump');
    void badge.offsetWidth;   // reflow pour reset animation
    badge.classList.add('bump');
  }
}

/* ══════════════════════════════════════════
   9. PANNEAU PANIER (DRAWER)
   ══════════════════════════════════════════ */
function initCartDrawer() {
  const toggle  = document.getElementById('cart-toggle');
  const drawer  = document.getElementById('cart-drawer');
  const overlay = document.getElementById('cart-overlay');
  const closeBtn = document.getElementById('cart-close');

  if (!toggle || !drawer) return;

  function open() {
    drawer.classList.add('open');
    overlay?.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    closeBtn?.focus();
  }

  function close() {
    drawer.classList.remove('open');
    overlay?.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    toggle.focus();
  }

  toggle.addEventListener('click', () => {
    drawer.classList.contains('open') ? close() : open();
  });

  closeBtn?.addEventListener('click', close);
  overlay?.addEventListener('click', close);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) close();
  });
}

/* ══════════════════════════════════════════
   10. CODE PROMO
   ══════════════════════════════════════════ */
function initPromo() {
  const promoBtn   = document.getElementById('promo-btn');
  const promoInput = document.getElementById('promo-input');
  if (!promoBtn || !promoInput) return;

  const CODES = {
    'MARSEILLE10': 10,
    'VILLENOVA':   5,
    'CULTURE2025': 15,
  };

  promoBtn.addEventListener('click', () => {
    const code    = promoInput.value.trim().toUpperCase();
    const discount = CODES[code];

    if (!discount) {
      promoInput.style.borderColor = '#be123c';
      showToast('Code promo invalide.', 'error', 2500);
      return;
    }

    if (cart.promoApplied) {
      showToast('Un code promo est déjà appliqué.', 'info', 2000);
      return;
    }

    cart.promoDiscount = discount;
    cart.promoApplied  = true;
    promoInput.style.borderColor = '#2a7d4f';
    promoInput.value = `${code} (−${discount} €)`;
    promoInput.disabled = true;
    promoBtn.disabled   = true;
    renderCart();
    showToast(`Code « ${code} » appliqué ! −${discount} €`, 'success', 3000);
  });
}

/* ══════════════════════════════════════════
   11. PAIEMENT / CONFIRMATION
   ══════════════════════════════════════════ */
function initCheckout() {
  const btn = document.getElementById('btn-checkout');
  if (!btn) return;

  btn.addEventListener('click', () => {
    if (cart.count === 0) {
      showToast('Votre panier est vide.', 'error', 2000);
      return;
    }

    /* Simuler une requête de paiement */
    btn.textContent = 'Traitement…';
    btn.disabled    = true;

    setTimeout(() => {
      showConfirmModal();
      cart.clear();
      renderCart();
      updateCartBadge();

      /* Fermer le drawer */
      document.getElementById('cart-drawer')?.classList.remove('open');
      document.getElementById('cart-overlay')?.classList.remove('open');
      document.body.style.overflow = '';

      btn.innerHTML = `Payer maintenant
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
          <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
        </svg>`;
      btn.disabled = false;
    }, 1800);
  });
}

/* ══════════════════════════════════════════
   12. MODAL CONFIRMATION + CONFETTIS
   ══════════════════════════════════════════ */
function showConfirmModal() {
  const modal   = document.getElementById('confirm-modal');
  const details = document.getElementById('confirm-details');
  const close   = document.getElementById('confirm-close');
  if (!modal) return;

  /* Détails du récapitulatif */
  if (details) {
    const lines = Object.values(cart.items).map(i =>
      `<div>🎟 <strong>${escapeHtml(i.name)}</strong> × ${i.qty} — ${(i.price * i.qty).toFixed(2)} €</div>`
    ).join('');
    details.innerHTML = lines || '<p>Récapitulatif envoyé par e-mail.</p>';
  }

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');

  /* Confettis */
  launchConfetti();

  close?.focus();

  close?.addEventListener('click', () => {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }, { once: true });

  document.addEventListener('keydown', function handler(e) {
    if (e.key === 'Escape') {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
      document.removeEventListener('keydown', handler);
    }
  });
}

function launchConfetti() {
  const container = document.getElementById('confirm-confetti');
  if (!container) return;
  container.innerHTML = '';

  const colors = ['#D17B49', '#8B5E3C', '#C2A27C', '#E6D3B3', '#FAF9F7', '#F4EDE4'];

  for (let i = 0; i < 40; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';

    const color = colors[Math.floor(Math.random() * colors.length)];
    const left  = Math.random() * 100;
    const delay = Math.random() * 1.2;
    const dur   = 1.5 + Math.random() * 1.5;
    const size  = 6 + Math.floor(Math.random() * 8);

    piece.style.cssText = `
      left: ${left}%;
      top: -20px;
      width: ${size}px;
      height: ${size * 1.6}px;
      background: ${color};
      animation-duration: ${dur}s;
      animation-delay: ${delay}s;
    `;
    container.appendChild(piece);
  }
}

/* ══════════════════════════════════════════
   13. ANIMATIONS AU SCROLL
   ══════════════════════════════════════════ */
function initScrollAnimations() {
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.animate-in').forEach(el => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.animate-in').forEach(el => observer.observe(el));
}

/* ══════════════════════════════════════════
   14. TOAST
   ══════════════════════════════════════════ */
function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
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
   15. UTILITAIRE XSS
   ══════════════════════════════════════════ */
const _escEl = document.createElement('div');
function escapeHtml(str) {
  _escEl.textContent = String(str ?? '');
  return _escEl.innerHTML;
}

/* ══════════════════════════════════════════
   16. MICRO-INTERACTIONS CARTES
   ══════════════════════════════════════════ */
function initCardInteractions() {
  document.querySelectorAll('.billet-card').forEach(card => {
    /* Effet tilt léger au survol souris (desktop only) */
    if (window.matchMedia('(hover: hover)').matches) {
      card.addEventListener('mousemove', (e) => {
        const rect   = card.getBoundingClientRect();
        const x      = (e.clientX - rect.left) / rect.width  - .5;
        const y      = (e.clientY - rect.top)  / rect.height - .5;
        card.style.transform = `translateY(-5px) rotateX(${-y * 4}deg) rotateY(${x * 4}deg)`;
        card.style.transition = 'transform .1s ease';
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        card.style.transition = 'transform .35s ease, box-shadow .35s ease, border-color .35s ease';
      });
    }
  });
}

/* ══════════════════════════════════════════
   17. ENTRÉE CLAVIER SUR LES CARTES
   ══════════════════════════════════════════ */
function initKeyboardSupport() {
  /* Les boutons + et - sont déjà focusables, rien à ajouter */
}

/* ══════════════════════════════════════════
   18. POINT D'ENTRÉE
   ══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initFilters();
  initSort();
  initQtyControls();
  initCartDrawer();
  initPromo();
  initCheckout();
  initScrollAnimations();
  initCardInteractions();
  initKeyboardSupport();

  /* Désactiver tous les boutons minus au chargement (qty = 0) */
  document.querySelectorAll('.qty-minus').forEach(btn => { btn.disabled = true; });
});