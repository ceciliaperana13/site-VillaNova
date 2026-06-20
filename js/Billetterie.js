'use strict';

/*OPENAGENDA — CONFIG*/
const OA_KEY          = "832ecfba688a4dda9e6beb28922ee893";
const OA_AGENDA_UID   = "2119473";
const OA_AGENDA_SLUG  = "musees-de-marseille";
const OA_THEATRE_UID  = "65855330";
const OA_FESTIVAL_UID = "46290899";
const OA_SPORT_UID    = "94552197";
const OA_BASE         = "https://api.openagenda.com/v2";

const FEATURED_EVENT_UID  = "27089585";
const FEATURED_EVENT_SLUG = "sequence-douverture-saison-mediterranee-3972861";

/*1. ÉTAT GLOBAL DU PANIER */
const cart = {
  items: {},
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
    return sub > 0 ? parseFloat((sub * 0.015 + 0.5).toFixed(2)) : 0;
  },
  get grandTotal() {
    return Math.max(0, this.total + this.fees - this.promoDiscount);
  },

  setItem(id, name, price, qty) {
    if (qty <= 0) { delete this.items[id]; }
    else { this.items[id] = { name, price, qty }; }
  },
  clear() {
    this.items         = {};
    this.promoApplied  = false;
    this.promoDiscount = 0;
  },
};

/*2. LOADER*/
window.addEventListener('load', () => {
  const loader = document.getElementById('page-loader');
  if (!loader) return;
  setTimeout(() => {
    loader.classList.add('hidden');
    loader.addEventListener('transitionend', () => loader.remove(), { once: true });
  }, 700);
});

/*3. NAVIGATION BURGER*/
function initNav() {
  const burger   = document.getElementById('nav-burger');
  const navLinks = document.querySelector('.nav-links');
  if (!burger || !navLinks) return;

  burger.addEventListener('click', () => {
    const isOpen = burger.getAttribute('aria-expanded') === 'true';
    burger.setAttribute('aria-expanded', String(!isOpen));
    navLinks.classList.toggle('open', !isOpen);
  });

  navLinks.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => {
      burger.setAttribute('aria-expanded', 'false');
      navLinks.classList.remove('open');
    })
  );

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

/*4. FILTRES PAR CATÉGORIE */
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

      cards.forEach(card => {
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

/*5. TRI */
function initSort() {
  const sel  = document.getElementById('sort-select');
  const grid = document.getElementById('events-grid');
  if (!sel || !grid) return;

  sel.addEventListener('change', () => {
    const cards    = [...grid.querySelectorAll('.billet-card:not([style*="display: none"])')];
    const getPrice = c => parseFloat(c.querySelector('.tarif-prix')?.textContent.replace(/[^\d.]/g, '') || 0);

    const compare = {
      'date':       () => 0,
      'price-asc':  (a, b) => getPrice(a) - getPrice(b),
      'price-desc': (a, b) => getPrice(b) - getPrice(a),
      'popular':    () => Math.random() - .5,
    }[sel.value] ?? (() => 0);

    cards.sort(compare).forEach((card, i) => {
      card.classList.remove('visible');
      card.style.setProperty('--delay', `${i * 55}ms`);
      grid.appendChild(card);
      setTimeout(() => card.classList.add('visible'), 20 + i * 55);
    });
  });
}

/*Attache les listeners +/- sur tous les .qty-btn présents dans un conteneur*/
function attachQtyListeners(container = document) {
  container.querySelectorAll('.qty-btn').forEach(btn => {
    // Éviter les doublons
    if (btn.dataset.listenerAttached) return;
    btn.dataset.listenerAttached = 'true';

    btn.addEventListener('click', function () {
      const eid     = this.dataset.event;
      const price   = parseFloat(this.dataset.price) || 0;
      const name    = this.dataset.name;
      const isMinus = this.classList.contains('qty-minus');
      const row     = this.closest('.tarif-row');
      const output  = row?.querySelector(`.qty-val[data-event="${eid}"]`);
      if (!output) return;

      let qty = parseInt(output.textContent, 10) || 0;
      qty = isMinus ? Math.max(0, qty - 1) : Math.min(10, qty + 1);

      // Mise à jour affichage compteur
      output.textContent = qty;
      output.classList.add('changed');
      output.addEventListener('animationend', () => output.classList.remove('changed'), { once: true });

      // Style ligne active
      row.classList.toggle('has-qty', qty > 0);
      const minusBtn = row.querySelector('.qty-minus');
      if (minusBtn) minusBtn.disabled = qty === 0;

      // Mise à jour panier
      cart.setItem(eid, name, price, qty);
      renderCart();
      updateCartBadge();
      animateCartTotal();

      // Toast ajout
      if (!isMinus && qty > 0) {
        showToast(`✓ ${name} ajouté au panier`, 'success', 2000);
      }
    });
  });

  // Désactiver tous les minus à 0
  container.querySelectorAll('.qty-minus').forEach(btn => {
    const row    = btn.closest('.tarif-row');
    const output = row?.querySelector('.qty-val');
    if (output && parseInt(output.textContent, 10) === 0) btn.disabled = true;
  });
}

/*7. RENDU PANIER — avec animations */
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

  // Supprimer les anciens items
  itemsEl.querySelectorAll('.cart-item').forEach(el => el.remove());

  Object.entries(cart.items).forEach(([id, item]) => {
    const el = document.createElement('div');
    el.className = 'cart-item';
    el.setAttribute('role', 'listitem');
    el.style.animation = 'cartItemIn .25s ease';
    el.innerHTML = `
      <div class="cart-item-info">
        <p class="cart-item-name">${escapeHtml(item.name)}</p>
        <p class="cart-item-sub">${item.qty} × ${item.price > 0 ? item.price.toFixed(2) + ' €' : 'Gratuit'}</p>
      </div>
      <span class="cart-item-price">${item.price > 0 ? (item.price * item.qty).toFixed(2) + ' €' : 'Gratuit'}</span>
      <button class="cart-item-remove" data-id="${id}" aria-label="Supprimer ${escapeHtml(item.name)}">✕</button>
    `;
    el.querySelector('.cart-item-remove').addEventListener('click', () => removeCartItem(id));
    itemsEl.appendChild(el);
  });

  const fmt = n => n.toFixed(2).replace('.', ',') + ' €';
  if (subtotalEl) subtotalEl.textContent = fmt(cart.total);
  if (feesEl)     feesEl.textContent     = cart.fees > 0 ? fmt(cart.fees) : 'Incluses';
  if (totalEl)    totalEl.textContent    = fmt(cart.grandTotal);
}

function removeCartItem(id) {
  // Remettre compteur à 0 dans la carte
  document.querySelectorAll(`.qty-val[data-event="${id}"]`).forEach(output => {
    output.textContent = '0';
    const row = output.closest('.tarif-row');
    if (row) {
      row.classList.remove('has-qty');
      const minusBtn = row.querySelector('.qty-minus');
      if (minusBtn) minusBtn.disabled = true;
    }
  });

  cart.setItem(id, '', 0, 0);
  renderCart();
  updateCartBadge();
  animateCartTotal();
  showToast('Billet retiré du panier', 'info', 2000);
}

/*8. ANIMATION TOTAL PANIER (mini flottant) */
function animateCartTotal() {
  // Mini bulle flottante au-dessus du bouton panier
  const toggle = document.getElementById('cart-toggle');
  if (!toggle) return;

  // Supprimer l'ancienne bulle si elle existe
  document.querySelector('.cart-total-bubble')?.remove();

  if (cart.grandTotal > 0) {
    const bubble = document.createElement('div');
    bubble.className = 'cart-total-bubble';
    bubble.textContent = cart.grandTotal.toFixed(2).replace('.', ',') + ' €';
    bubble.style.cssText = `
      position: fixed;
      top: 60px;
      right: 20px;
      background: var(--terracotta, #D17B49);
      color: #fff;
      font-weight: 700;
      font-size: .9rem;
      padding: .35rem .8rem;
      border-radius: 50px;
      box-shadow: 0 4px 16px rgba(0,0,0,.18);
      z-index: 9999;
      animation: bubbleIn .3s cubic-bezier(.34,1.56,.64,1) forwards;
      pointer-events: none;
    `;
    document.body.appendChild(bubble);

    // Auto-disparaît après 2s
    setTimeout(() => {
      bubble.style.animation = 'bubbleOut .25s ease forwards';
      bubble.addEventListener('animationend', () => bubble.remove(), { once: true });
    }, 2000);
  }

  // Bump sur le bouton panier
  toggle.classList.remove('bump');
  void toggle.offsetWidth;
  toggle.classList.add('bump');
}

/*9. BADGE PANIER HEADER*/
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

  // Affiche le total dans le header si > 0
  const headerTotal = document.getElementById('cart-header-total');
  if (headerTotal) {
    headerTotal.textContent = cart.grandTotal > 0
      ? cart.grandTotal.toFixed(2).replace('.', ',') + ' €'
      : '';
    headerTotal.style.display = cart.grandTotal > 0 ? 'inline' : 'none';
  }
}

/*10. PANNEAU PANIER (DRAWER) */
function initCartDrawer() {
  const toggle   = document.getElementById('cart-toggle');
  const drawer   = document.getElementById('cart-drawer');
  const overlay  = document.getElementById('cart-overlay');
  const closeBtn = document.getElementById('cart-close');
  if (!toggle || !drawer) return;

  const open = () => {
    renderCart(); // toujours à jour à l'ouverture
    drawer.classList.add('open');
    overlay?.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    closeBtn?.focus();
  };

  const close = () => {
    drawer.classList.remove('open');
    overlay?.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    toggle.focus();
  };

  toggle.addEventListener('click', () => drawer.classList.contains('open') ? close() : open());
  closeBtn?.addEventListener('click', close);
  overlay?.addEventListener('click', close);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) close();
  });
}

/*11. CODE PROMO */
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
    updateCartBadge();
    showToast(`Code « ${code} » appliqué ! −${discount} €`, 'success', 3000);
  });
}

/*12. PAIEMENT — avec animation "traitement" */
function initCheckout() {
  const btn = document.getElementById('btn-checkout');
  if (!btn) return;

  btn.addEventListener('click', () => {
    if (cart.count === 0) {
      showToast('Votre panier est vide.', 'error', 2000);
      // Secousse sur le bouton
      btn.classList.add('shake');
      btn.addEventListener('animationend', () => btn.classList.remove('shake'), { once: true });
      return;
    }

    // Animation chargement
    const originalHTML = btn.innerHTML;
    btn.innerHTML = `
      <span class="btn-spinner"></span>
      Traitement en cours…
    `;
    btn.disabled = true;
    btn.style.opacity = '.8';

    // Étapes visuelles
    setTimeout(() => {
      btn.innerHTML = `<span class="btn-spinner"></span> Sécurisation du paiement…`;
    }, 600);

    setTimeout(() => {
      btn.innerHTML = `<span class="btn-spinner"></span> Confirmation…`;
    }, 1200);

    setTimeout(() => {
      // Succès
      btn.innerHTML = `✓ Paiement accepté !`;
      btn.style.background = '#2a7d4f';
      btn.style.opacity = '1';

      showConfirmModal();

      // Réinitialisation panier
      setTimeout(() => {
        cart.clear();
        renderCart();
        updateCartBadge();

        document.getElementById('cart-drawer')?.classList.remove('open');
        document.getElementById('cart-overlay')?.classList.remove('open');
        document.body.style.overflow = '';

        // Remettre tous les compteurs à 0
        document.querySelectorAll('.qty-val').forEach(el => { el.textContent = '0'; });
        document.querySelectorAll('.tarif-row').forEach(row => {
          row.classList.remove('has-qty');
          row.querySelectorAll('.qty-minus').forEach(b => { b.disabled = true; });
        });

        setTimeout(() => {
          btn.innerHTML = originalHTML;
          btn.style.background = '';
          btn.style.opacity = '1';
          btn.disabled = false;
        }, 800);
      }, 600);
    }, 1800);
  });
}

/*13. MODAL CONFIRMATION */
function showConfirmModal() {
  const modal   = document.getElementById('confirm-modal');
  const details = document.getElementById('confirm-details');
  const close   = document.getElementById('confirm-close');
  if (!modal) return;

  if (details) {
    const total = cart.grandTotal.toFixed(2).replace('.', ',');
    const lines = Object.values(cart.items).map(i =>
      `<div class="confirm-line">
        🎟 <strong>${escapeHtml(i.name)}</strong>
        <span>× ${i.qty}</span>
        <span>${i.price > 0 ? (i.price * i.qty).toFixed(2) + ' €' : 'Gratuit'}</span>
      </div>`
    ).join('');

    details.innerHTML = `
      ${lines || '<p>Récapitulatif envoyé par e-mail.</p>'}
      ${cart.fees > 0 ? `<div class="confirm-line confirm-fees"><span>Frais de service</span><span>${cart.fees.toFixed(2)} €</span></div>` : ''}
      ${cart.promoDiscount > 0 ? `<div class="confirm-line confirm-promo"><span>Réduction promo</span><span>−${cart.promoDiscount.toFixed(2)} €</span></div>` : ''}
      <div class="confirm-total">
        <strong>Total payé</strong>
        <strong>${total} €</strong>
      </div>
      <p class="confirm-email">📧 Un e-mail de confirmation vous sera envoyé.</p>
    `;
  }

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  launchConfetti();
  close?.focus();

  const closeModal = () => {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  };

  close?.addEventListener('click', closeModal, { once: true });
  document.addEventListener('keydown', function handler(e) {
    if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', handler); }
  });
}

function launchConfetti() {
  const container = document.getElementById('confirm-confetti');
  if (!container) return;
  container.innerHTML = '';
  const colors = ['#D17B49', '#8B5E3C', '#C2A27C', '#E6D3B3', '#FAF9F7', '#2a7d4f'];
  for (let i = 0; i < 60; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    const size = 6 + Math.floor(Math.random() * 8);
    piece.style.cssText = `
      left: ${Math.random() * 100}%;
      top: -20px;
      width: ${size}px;
      height: ${size * 1.6}px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      animation-duration: ${1.5 + Math.random() * 1.5}s;
      animation-delay: ${Math.random() * 1.2}s;
      border-radius: ${Math.random() > .5 ? '50%' : '2px'};
    `;
    container.appendChild(piece);
  }
}

/* 14. ANIMATIONS AU SCROLL*/
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

/*15. TOAST */
function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container') || document.querySelector('.toast-container');
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

/*16. MICRO-INTERACTIONS CARTES*/
function initCardInteractions() {
  document.querySelectorAll('.billet-card').forEach(card => {
    if (!window.matchMedia('(hover: hover)').matches) return;
    if (card.dataset.tiltAttached) return;
    card.dataset.tiltAttached = 'true';

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x    = (e.clientX - rect.left) / rect.width  - .5;
      const y    = (e.clientY - rect.top)  / rect.height - .5;
      card.style.transform  = `translateY(-5px) rotateX(${-y * 4}deg) rotateY(${x * 4}deg)`;
      card.style.transition = 'transform .1s ease';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform  = '';
      card.style.transition = 'transform .35s ease, box-shadow .35s ease';
    });
  });
}

/*ANIMATIONS CSS INJECTÉES EN JS */
function injectAnimationStyles() {
  if (document.getElementById('vn-anim-styles')) return;
  const style = document.createElement('style');
  style.id = 'vn-anim-styles';
  style.textContent = `
    @keyframes bubbleIn {
      from { opacity:0; transform: scale(.6) translateY(-8px); }
      to   { opacity:1; transform: scale(1)  translateY(0); }
    }
    @keyframes bubbleOut {
      from { opacity:1; transform: scale(1) translateY(0); }
      to   { opacity:0; transform: scale(.7) translateY(-6px); }
    }
    @keyframes cartItemIn {
      from { opacity:0; transform: translateX(20px); }
      to   { opacity:1; transform: translateX(0); }
    }
    @keyframes shake {
      0%,100% { transform: translateX(0); }
      20%     { transform: translateX(-8px); }
      40%     { transform: translateX(8px); }
      60%     { transform: translateX(-5px); }
      80%     { transform: translateX(5px); }
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .shake { animation: shake .4s ease; }
    .btn-spinner {
      display: inline-block;
      width: 16px; height: 16px;
      border: 2px solid rgba(255,255,255,.4);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin .7s linear infinite;
      vertical-align: middle;
      margin-right: .4rem;
    }
    .qty-val.changed {
      animation: none;
    }
    .confirm-line {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      padding: .4rem 0;
      border-bottom: 1px solid rgba(0,0,0,.06);
      font-size: .95rem;
    }
    .confirm-fees  { color: var(--gris-fonce, #666); font-size: .88rem; }
    .confirm-promo { color: #2a7d4f; font-size: .88rem; }
    .confirm-total {
      display: flex;
      justify-content: space-between;
      margin-top: .8rem;
      padding-top: .8rem;
      border-top: 2px solid var(--brun-chaud, #8B5E3C);
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--brun-chaud, #8B5E3C);
    }
    .confirm-email {
      margin-top: .8rem;
      font-size: .85rem;
      color: var(--gris-fonce, #666);
      text-align: center;
    }
    .tarif-desc {
      display: block;
      font-size: .8rem;
      color: var(--gris-fonce, #888);
      margin-top: .15rem;
      font-style: italic;
    }
    #btn-checkout { transition: background .3s ease, opacity .3s ease; }
    .cart-item { animation: cartItemIn .25s ease; }
  `;
  document.head.appendChild(style);
}

/*OPENAGENDA — FETCH HELPERS */
async function oaBilletFetch(uid, params = {}) {
  const url = `${OA_BASE}/agendas/${uid}/events?` +
    new URLSearchParams({ key: OA_KEY, lang: 'fr', ...params });
  try {
    const res  = await fetch(url);
    const data = await res.json();
    return data.events || [];
  } catch (e) {
    console.error('[Billetterie] fetch error:', e);
    return [];
  }
}

async function oaBilletFetchOne(uid, eventId) {
  const url = `${OA_BASE}/agendas/${uid}/events/${eventId}?key=${OA_KEY}&lang=fr`;
  try {
    const res  = await fetch(url);
    const data = await res.json();
    return data.event || null;
  } catch (e) {
    console.error('[Billetterie] fetchOne error:', e);
    return null;
  }
}

/*OPENAGENDA — EXTRACTION*/
function extractImage(ev) {
  const fallback = 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=600&q=80';
  if (!ev.image) return fallback;
  if (ev.image.base && ev.image.filename) return ev.image.base + ev.image.filename + '?w=800&auto=compress';
  if (ev.image.variants?.length) {
    const v = ev.image.variants.find(v => v.type === 'full') || ev.image.variants[0];
    return ev.image.base + v.filename + '?w=800&auto=compress';
  }
  return fallback;
}

function getText(field) {
  if (!field) return '';
  if (typeof field === 'string') return field;
  return field.fr || field.en || Object.values(field)[0] || '';
}

function getHeures(ev) {
  const begin = ev.firstTiming?.begin;
  const end   = ev.firstTiming?.end || ev.lastTiming?.end;
  const fmt   = d => new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return begin
    ? (end ? `${fmt(begin)} – ${fmt(end)}` : fmt(begin))
    : 'Voir programme';
}

/*Extrait TOUS les tarifs réels depuis un event OA*/
function extractAllTarifs(ev) {
  // Gratuit
  if (ev.free === 1 || ev.free === true) {
    return [{
      id:    `${ev.uid}-gratuit`,
      label: 'Entrée gratuite',
      price: 0,
      desc:  getText(ev.conditions) || 'Gratuit dans la limite des places disponibles',
    }];
  }

  const tarifs = [];

  // Tarifs dans registration[]
  if (Array.isArray(ev.registration) && ev.registration.length) {
    ev.registration.forEach((reg, i) => {
      if (typeof reg.price === 'number') {
        tarifs.push({
          id:    `${ev.uid}-reg-${i}`,
          label: getText(reg.label) || (i === 0 ? 'Tarif plein' : i === 1 ? 'Tarif réduit' : `Tarif ${i + 1}`),
          price: reg.price,
          desc:  getText(reg.description) || '',
          url:   reg.url || null,
        });
      }
    });
  }
  if (tarifs.length) return tarifs;

  // Parse conditions textuelles
  const cond = getText(ev.conditions);
  if (cond) {
    const matches = [...cond.matchAll(/(\d+(?:[.,]\d{1,2})?)\s*€/g)];
    if (matches.length) {
      return matches.map((m, i) => ({
        id:    `${ev.uid}-cond-${i}`,
        label: i === 0 ? 'Tarif plein' : i === 1 ? 'Tarif réduit' : `Tarif ${i + 1}`,
        price: parseFloat(m[1].replace(',', '.')),
        desc:  cond.slice(0, 80),
      }));
    }
    return [{ id: `${ev.uid}-cond`, label: cond.slice(0, 60), price: 0, desc: cond }];
  }

  // Fallback
  return [{ id: `${ev.uid}-default`, label: 'Billet standard', price: 0, desc: 'Voir les conditions sur place' }];
}

/*CONSTRUIRE UNE LIGNE TARIF */
function buildTarifRow(tarif) {
  const row = document.createElement('div');
  row.className = 'tarif-row';

  const priceDisplay = tarif.price > 0
    ? `<span class="tarif-prix">${tarif.price.toFixed(2)} €</span>`
    : `<span class="tarif-prix tarif-gratuit">Gratuit</span>`;

  const descHtml = tarif.desc
    ? `<span class="tarif-desc">${escapeHtml(tarif.desc)}</span>`
    : '';

  row.innerHTML = `
    <div class="tarif-info">
      <span class="tarif-label">${escapeHtml(tarif.label)}</span>
      ${descHtml}
      ${priceDisplay}
    </div>
    <div class="tarif-qty" role="group" aria-label="Quantité pour ${escapeHtml(tarif.label)}">
      <button class="qty-btn qty-minus"
              data-event="${escapeHtml(tarif.id)}"
              data-price="${tarif.price}"
              data-name="${escapeHtml(tarif.label)}"
              aria-label="Retirer un billet"
              disabled>−</button>
      <span class="qty-val" data-event="${escapeHtml(tarif.id)}" aria-live="polite">0</span>
      <button class="qty-btn qty-plus"
              data-event="${escapeHtml(tarif.id)}"
              data-price="${tarif.price}"
              data-name="${escapeHtml(tarif.label)}"
              aria-label="Ajouter un billet">+</button>
    </div>
  `;

  return row;
}

/*INJECTER UN EVENT DANS UNE BILLET-CARD */
function fillBilletCard(prefix, ev) {
  const $ = id => document.getElementById(`${prefix}-${id}`);
  const fallback = 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=600&q=80';

  const titre  = getText(ev.title) || 'Événement';
  const desc   = getText(ev.description) || getText(ev.summary) || 'Un événement à ne pas manquer.';
  const lDesc  = getText(ev.longDescription) || ev.bodytext || ev.html || '';
  const date   = ev.dateRange?.fr || '';
  const heures = getHeures(ev);
  const loc    = ev.location || {};
  const lieu   = loc.name || 'Lieu non précisé';
  const adr    = [loc.address, loc.city].filter(Boolean).join(', ');
  const tarifs = extractAllTarifs(ev);
  const imgSrc = extractImage(ev);
  const credits= ev.imageCredits || '';
  const slug   = ev.slug || ev.uid;
  const lienOA = `https://openagenda.com/${OA_AGENDA_SLUG}/events/${slug}`;
  const lienDt = `/html/evenement-detail.html?id=${encodeURIComponent(ev.uid || slug)}`;

  // Catégorie
  const tl = titre.toLowerCase();
  const cat =
    /concert|musique|jazz/.test(tl) ? 'concert' :
    /festival/.test(tl)             ? 'festival' :
    /expo|musée|galerie/.test(tl)   ? 'expo'     :
    /théâtre|spectacle/.test(tl)    ? 'theatre'  :
    /sport|foot|rugby/.test(tl)     ? 'sport'    : 'culture';

  // data-category sur l'article
  const article = document.getElementById(prefix);
  if (article) article.dataset.category = cat;

  // Badge
  const badgeEl = $('badge');
  if (badgeEl) badgeEl.textContent = {
    concert: '🎵 Concert', festival: '🎉 Festival', expo: '🖼 Exposition',
    theatre: '🎭 Théâtre', sport: '⚽ Sport', culture: '🎭 Culture',
  }[cat];

  // Image
  const imgEl = $('img');
  if (imgEl) {
    imgEl.src = imgSrc; imgEl.alt = titre;
    imgEl.onerror = () => { imgEl.src = fallback; imgEl.onerror = null; };
  }

  // Crédits
  const creditsEl = $('credits');
  if (creditsEl) { creditsEl.textContent = credits; creditsEl.hidden = !credits; }

  // Textes
  const setText = (id, val) => { const el = $(id); if (el) el.textContent = val; };
  setText('title',   titre);
  setText('date',    date   ? `📅 ${date}`   : '');
  setText('heure',   heures ? `🕐 ${heures}` : '');
  setText('place',   lieu   ? `📍 ${lieu}`   : '');

  const lieuDetEl = $('lieu-detail');
  if (lieuDetEl) { lieuDetEl.textContent = adr; lieuDetEl.hidden = !adr; }

  const descEl = $('desc');
  if (descEl) {
    descEl.textContent = desc.length > 180 ? desc.slice(0, 180) + '…' : desc;
    descEl.style.fontStyle = desc.length < 30 ? 'italic' : '';
  }

  const lDescEl = $('long-desc');
  if (lDescEl) { lDescEl.textContent = lDesc; lDescEl.hidden = !lDesc; }

  const condEl = $('conditions');
  if (condEl) condEl.textContent = ev.free
    ? 'Gratuit dans la limite des places disponibles'
    : getText(ev.conditions) || '—';

  // Liens
  const linkDetEl = $('link-detail');
  if (linkDetEl) { linkDetEl.href = lienDt; linkDetEl.setAttribute('aria-label', `Détail : ${titre}`); }

  const linkOAEl = $('link-oa');
  if (linkOAEl) { linkOAEl.href = lienOA; linkOAEl.setAttribute('aria-label', `Voir ${titre} sur OpenAgenda`); }

  // Lien réservation si dispo dans registration
  if (Array.isArray(ev.registration)) {
    const withLink = ev.registration.find(r => r.url);
    if (withLink) {
      const resaEl = $('link-resa');
      if (resaEl) { resaEl.href = withLink.url; resaEl.hidden = false; resaEl.target = '_blank'; resaEl.rel = 'noopener noreferrer'; }
    }
  }

  // TARIFS 
  const tarifsEl = $('tarifs');
  if (tarifsEl) {
    tarifsEl.innerHTML = '';
    tarifs.forEach(t => tarifsEl.appendChild(buildTarifRow(t)));
    // Attacher les listeners quantité sur ce bloc
    attachQtyListeners(tarifsEl);
  }

  console.log(`[Billetterie] ✅ "${titre}" | ${date} | ${lieu} | ${tarifs.length} tarif(s)`);
}

/*CHARGEMENT DES CARTES OA
   bev1  = Concert Sofiane Saidi (vedette, fetchOne)
   bev2–3 = Autres musées
   bev4  = Festival
   bev5  = Sport */
async function loadOABilletCards() {
  console.log('[Billetterie] Chargement des events…');

  const [featuredEv, evMain, evTheatre, evFestival, evSport] = await Promise.all([
    oaBilletFetchOne(OA_AGENDA_UID, FEATURED_EVENT_UID),
    oaBilletFetch(OA_AGENDA_UID, { limit: 4, 'relative[0]': 'current', 'relative[1]': 'upcoming' }),
    oaBilletFetch(OA_THEATRE_UID,  { limit: 1 }),
    oaBilletFetch(OA_FESTIVAL_UID, { limit: 1 }),
    oaBilletFetch(OA_SPORT_UID,    { limit: 1, 'relative[0]': 'current', 'relative[1]': 'upcoming' }),
  ]);

  // bev1 : vedette
  if (featuredEv) {
    fillBilletCard('bev1', featuredEv);
  } else if (evMain[0]) {
    fillBilletCard('bev1', evMain[0]);
  }

  // bev2–3 : autres musées (sans le vedette)
  const autres = evMain.filter(e => String(e.uid) !== String(FEATURED_EVENT_UID));
  if (autres[0]) fillBilletCard('bev2', autres[0]);
  if (autres[1]) fillBilletCard('bev3', autres[1]);

  // bev4 : festival
  if (evFestival[0]) fillBilletCard('bev4', evFestival[0]);

  // bev5 : sport
  if (evSport[0])    fillBilletCard('bev5', evSport[0]);

  // Micro-interactions 3D
  initCardInteractions();

  console.log('[Billetterie]  Toutes les cartes chargées.');
}

/*UTILITAIRE XSS */
const _escEl = document.createElement('div');
function escapeHtml(str) {
  _escEl.textContent = String(str ?? '');
  return _escEl.innerHTML;
}

/*POINT D'ENTRÉ */
document.addEventListener('DOMContentLoaded', () => {
  injectAnimationStyles(); 

  initNav();
  initFilters();
  initSort();
  initCartDrawer();
  initPromo();
  initCheckout();
  initScrollAnimations();

  // Listeners quantité sur les cartes statiques existantes
  attachQtyListeners(document);

  // Charger les vrais events OA
  loadOABilletCards();

  // Rendu initial panier vide
  renderCart();
});