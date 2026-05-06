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
    this.items         = {};
    this.promoApplied  = false;
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

      cards.forEach((card) => {
        const match = filter === 'all' || card.dataset.category === filter;
        card.style.display = match ? '' : 'none';
        card.setAttribute('aria-hidden', String(!match));
        if (match) {
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
      'popular':    () => Math.random() - .5,
    }[sel.value] ?? (() => 0);

    cards.sort(compare);

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
      const eventId = this.dataset.event;
      const price   = parseFloat(this.dataset.price);
      const name    = this.dataset.name;
      const isMinus = this.classList.contains('qty-minus');
      const output  = document.querySelector(`.qty-val[data-event="${eventId}"]`);
      const row     = this.closest('.tarif-row');

      if (!output) return;

      let qty = parseInt(output.textContent, 10) || 0;
      qty = isMinus ? Math.max(0, qty - 1) : Math.min(10, qty + 1);

      output.textContent = qty;
      output.classList.add('changed');
      output.addEventListener('animationend', () => output.classList.remove('changed'), { once: true });

      if (qty > 0) {
        row.classList.add('has-qty');
      } else {
        row.classList.remove('has-qty');
      }

      const minusBtn = row.querySelector('.qty-minus');
      if (minusBtn) minusBtn.disabled = qty === 0;

      cart.setItem(eventId, name, price, qty);
      renderCart();
      updateCartBadge();

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
  const itemsEl    = document.getElementById('cart-items');
  const footerEl   = document.getElementById('cart-footer');
  const emptyEl    = document.getElementById('cart-empty');
  const subtotalEl = document.getElementById('cart-subtotal');
  const feesEl     = document.getElementById('cart-fees');
  const totalEl    = document.getElementById('cart-total');

  const isEmpty = cart.count === 0;

  if (emptyEl)  emptyEl.style.display = isEmpty ? 'flex' : 'none';
  if (footerEl) footerEl.hidden = isEmpty;

  if (!itemsEl) return;

  itemsEl.querySelectorAll('.cart-item').forEach(el => el.remove());

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
    el.querySelector('.cart-item-remove').addEventListener('click', () => removeCartItem(id));
    itemsEl.appendChild(el);
  });

  const fmt = (n) => n.toFixed(2).replace('.', ',') + ' €';
  if (subtotalEl) subtotalEl.textContent = fmt(cart.total);
  if (feesEl)     feesEl.textContent     = fmt(cart.fees);
  if (totalEl)    totalEl.textContent    = fmt(cart.grandTotal);
}

function removeCartItem(id) {
  const item = cart.items[id];
  if (!item) return;

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
    void badge.offsetWidth;
    badge.classList.add('bump');
  }
}

/* ══════════════════════════════════════════
   9. PANNEAU PANIER (DRAWER)
   ══════════════════════════════════════════ */
function initCartDrawer() {
  const toggle   = document.getElementById('cart-toggle');
  const drawer   = document.getElementById('cart-drawer');
  const overlay  = document.getElementById('cart-overlay');
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
    'VILLENOVA':    5,
    'CULTURE2025': 15,
  };

  promoBtn.addEventListener('click', () => {
    const code     = promoInput.value.trim().toUpperCase();
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
    promoInput.value    = `${code} (−${discount} €)`;
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

    btn.textContent = 'Traitement…';
    btn.disabled    = true;

    setTimeout(() => {
      showConfirmModal();
      cart.clear();
      renderCart();
      updateCartBadge();

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

  if (details) {
    const lines = Object.values(cart.items).map(i =>
      `<div>🎟 <strong>${escapeHtml(i.name)}</strong> × ${i.qty} — ${(i.price * i.qty).toFixed(2)} €</div>`
    ).join('');
    details.innerHTML = lines || '<p>Récapitulatif envoyé par e-mail.</p>';
  }

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
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
    if (window.matchMedia('(hover: hover)').matches) {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x    = (e.clientX - rect.left) / rect.width  - .5;
        const y    = (e.clientY - rect.top)  / rect.height - .5;
        card.style.transform  = `translateY(-5px) rotateX(${-y * 4}deg) rotateY(${x * 4}deg)`;
        card.style.transition = 'transform .1s ease';
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform  = '';
        card.style.transition = 'transform .35s ease, box-shadow .35s ease, border-color .35s ease';
      });
    }
  });
}

/* ══════════════════════════════════════════
   OPENAGENDA — CONFIG
   ══════════════════════════════════════════ */
const OA_KEY          = "832ecfba688a4dda9e6beb28922ee893";
const OA_AGENDA_UID   = "24882772";
const OA_THEATRE_UID  = "65855330";
const OA_FESTIVAL_UID = "46290899";
const OA_SPORT_UID    = "94552197";
const OA_BASE         = "https://api.openagenda.com/v2";

/* ── FETCH ─────────────────────────────────────────────── */
async function oaBilletFetch(uid, params = {}) {
  const url = `${OA_BASE}/agendas/${uid}/events?` +
    new URLSearchParams({ key: OA_KEY, lang: 'fr', ...params });
  try {
    const res  = await fetch(url);
    const data = await res.json();
    console.log(`[Billetterie] agenda ${uid} → ${(data.events || []).length} events`);
    return data.events || [];
  } catch (e) {
    console.error('[Billetterie] fetch error:', e);
    return [];
  }
}

/* ── EXTRACTION IMAGE (identique à main.js / agenda.js) ── */
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

/* ── EXTRACTION TARIF ──────────────────────────────────── */
/**
 * Retourne { label: string, price: number } depuis un event OA.
 * - Si ev.free → gratuit
 * - Si ev.registration[].price existe → premier tarif trouvé
 * - Si ev.conditions.fr contient un chiffre → on le parse
 * - Sinon → "Voir détails" / 0
 */
function extractTarif(ev) {
  /* Gratuit */
  if (ev.free) return { label: 'Gratuit', price: 0 };

  /* Tarifs dans registration */
  if (Array.isArray(ev.registration) && ev.registration.length) {
    for (const reg of ev.registration) {
      if (typeof reg.price === 'number') {
        return {
          label: reg.label?.fr || `${reg.price.toFixed(2)} €`,
          price: reg.price,
        };
      }
    }
  }

  /* Conditions textuelles (ex: "Entrée : 8 €") */
  const conditions = ev.conditions?.fr || '';
  const match = conditions.match(/(\d+(?:[.,]\d{1,2})?)\s*€/);
  if (match) {
    const price = parseFloat(match[1].replace(',', '.'));
    return { label: `${price.toFixed(2)} €`, price };
  }

  /* Fallback */
  return { label: 'Voir détails', price: 0 };
}

/* ── INJECTION DANS UNE BILLET-CARD ────────────────────── */
/**
 * Injecte image, titre, date, lieu et tarif dans une carte billetterie
 * identifiée par son préfixe (bev1, bev2…).
 *
 * La carte HTML doit contenir :
 *   <img  id="bev1-img">
 *   <h3   id="bev1-title">
 *   <span id="bev1-date">
 *   <span id="bev1-place">
 *   <!-- zone tarifs -->
 *   <div id="bev1-tarifs">
 *     <!-- générée dynamiquement -->
 *   </div>
 */
function fillBilletCard(prefix, ev) {
  const $ = (id) => document.getElementById(`${prefix}-${id}`);

  /* ── Titre ── */
  const titre = ev.title?.fr || 'Événement';
  const titleEl = $('title');
  if (titleEl) titleEl.textContent = titre;

  /* ── Date & lieu ── */
  const date  = ev.dateRange?.fr || '';
  const lieu  = ev.location?.name || '';
  const dateEl  = $('date');
  const placeEl = $('place');
  if (dateEl)  dateEl.textContent  = date  ? `📅 ${date}`  : '';
  if (placeEl) placeEl.textContent = lieu  ? `📍 ${lieu}`  : '';

  /* ── Image ── */
  const imgSrc  = extractImage(ev);
  const fallback = 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=600&q=80';
  const imgEl   = $('img');
  if (imgEl) {
    imgEl.src    = imgSrc;
    imgEl.alt    = titre;
    imgEl.onerror = () => { imgEl.src = fallback; imgEl.onerror = null; };
  }

  /* ── Tarifs ── */
  const tarifsEl = $('tarifs');
  if (!tarifsEl) return;

  const eventId = String(ev.uid || prefix);
  tarifsEl.innerHTML = '';

  /* Plusieurs tarifs registration ? */
  const registrations = Array.isArray(ev.registration) && ev.registration.length
    ? ev.registration.filter(r => typeof r.price === 'number')
    : [];

  if (registrations.length > 1) {
    /* On génère une ligne par tarif */
    registrations.forEach((reg, i) => {
      const rowId    = `${eventId}-t${i}`;
      const rowLabel = reg.label?.fr || `Tarif ${i + 1}`;
      const rowPrice = reg.price;
      tarifsEl.appendChild(buildTarifRow(rowId, rowLabel, rowPrice));
    });
  } else {
    /* Un seul tarif (ou gratuit / fallback) */
    const { label, price } = extractTarif(ev);
    tarifsEl.appendChild(buildTarifRow(eventId, `${titre} — ${label}`, price));
  }

  /* Réinitialiser les listeners quantité sur les nouveaux boutons */
  tarifsEl.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      const eid   = this.dataset.event;
      const price = parseFloat(this.dataset.price);
      const name  = this.dataset.name;
      const isMinus = this.classList.contains('qty-minus');
      const output  = tarifsEl.querySelector(`.qty-val[data-event="${eid}"]`);
      const row     = this.closest('.tarif-row');
      if (!output) return;

      let qty = parseInt(output.textContent, 10) || 0;
      qty = isMinus ? Math.max(0, qty - 1) : Math.min(10, qty + 1);

      output.textContent = qty;
      output.classList.add('changed');
      output.addEventListener('animationend', () => output.classList.remove('changed'), { once: true });

      row.classList.toggle('has-qty', qty > 0);
      const minusBtn = row.querySelector('.qty-minus');
      if (minusBtn) minusBtn.disabled = qty === 0;

      cart.setItem(eid, name, price, qty);
      renderCart();
      updateCartBadge();

      if (!isMinus && qty > 0) showToast(`✓ ${name} ajouté au panier`, 'success', 2000);
    });
  });

  /* Désactiver les boutons minus des nouvelles lignes */
  tarifsEl.querySelectorAll('.qty-minus').forEach(btn => { btn.disabled = true; });
}

/* ── CONSTRUIRE UNE LIGNE TARIF ─────────────────────────── */
function buildTarifRow(eventId, name, price) {
  const row = document.createElement('div');
  row.className = 'tarif-row';

  const priceDisplay = price > 0
    ? `<span class="tarif-prix">${price.toFixed(2)} €</span>`
    : `<span class="tarif-prix tarif-gratuit">Gratuit</span>`;

  row.innerHTML = `
    <div class="tarif-info">
      <span class="tarif-label">${escapeHtml(name)}</span>
      ${priceDisplay}
    </div>
    <div class="tarif-qty" role="group" aria-label="Quantité pour ${escapeHtml(name)}">
      <button class="qty-btn qty-minus"
              data-event="${escapeHtml(eventId)}"
              data-price="${price}"
              data-name="${escapeHtml(name)}"
              aria-label="Retirer un billet"
              disabled>−</button>
      <span class="qty-val" data-event="${escapeHtml(eventId)}" aria-live="polite">0</span>
      <button class="qty-btn qty-plus"
              data-event="${escapeHtml(eventId)}"
              data-price="${price}"
              data-name="${escapeHtml(name)}"
              aria-label="Ajouter un billet">+</button>
    </div>
  `;

  return row;
}

/* ── CHARGEMENT DES CARTES OA ───────────────────────────── */
async function loadOABilletCards() {
  const [evMain, evTheatre, evFestival, evSport] = await Promise.all([
    oaBilletFetch(OA_AGENDA_UID,   { limit: 2 }),
    oaBilletFetch(OA_THEATRE_UID,  { limit: 1 }),
    oaBilletFetch(OA_FESTIVAL_UID, { limit: 1 }),
    oaBilletFetch(OA_SPORT_UID,    { limit: 1, 'relative[0]': 'current', 'relative[1]': 'upcoming' }),
  ]);

  /* Slot bev1 → agenda principal event 1 */
  if (evMain[0])    fillBilletCard('bev1', evMain[0]);
  /* Slot bev2 → agenda principal event 2 */
  if (evMain[1])    fillBilletCard('bev2', evMain[1]);
  /* Slot bev3 → théâtre */
  if (evTheatre[0]) fillBilletCard('bev3', evTheatre[0]);
  /* Slot bev4 → festival */
  if (evFestival[0]) fillBilletCard('bev4', evFestival[0]);
  /* Slot bev5 → sport */
  if (evSport[0])   fillBilletCard('bev5', evSport[0]);

  console.log('[Billetterie] Cartes OA chargées.');
}

/* ══════════════════════════════════════════
   17. POINT D'ENTRÉE
   ══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initFilters();
  initSort();
  initQtyControls();          // contrôles sur les cartes statiques existantes
  initCartDrawer();
  initPromo();
  initCheckout();
  initScrollAnimations();
  initCardInteractions();

  /* Désactiver les boutons minus statiques au chargement (qty = 0) */
  document.querySelectorAll('.qty-minus').forEach(btn => { btn.disabled = true; });

  /* Charger les cartes OpenAgenda (images + tarifs) */
  loadOABilletCards();
});