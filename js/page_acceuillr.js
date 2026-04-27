/* detail.js — logique page détail événement */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

  // Chargement asynchrone simulé des données de l'événement
  fetchEventData('jazz-vieux-port-2025');

  // Gestion de la sidebar sticky sur mobile
  initSidebarBehavior();
});

/**
 * Simule un appel asynchrone à l'API événement.
 * En production, remplacer par fetch('/api/events/:id')
 */
async function fetchEventData(slug) {
  try {
    // Simulation d'un délai réseau
    await simulateDelay(400);

    const data = getMockEventData(slug);
    if (data) {
      updateEventUI(data);
    }
  } catch (err) {
    console.error('Erreur chargement événement :', err);
    showToast('Impossible de charger les données de l\'événement.', 'error');
  }
}

function getMockEventData(slug) {
  const events = {
    'jazz-vieux-port-2025': {
      views: 4218,
      favorites: 312,
      registered: 1540,
      capacity: 5000,
      spotsLeft: 3460,
    }
  };
  return events[slug] || null;
}

function updateEventUI(data) {
  // Mise à jour du compteur de places
  const reserveBtn = document.querySelector('.reserve-btn');
  if (reserveBtn && data.spotsLeft !== undefined) {
    reserveBtn.setAttribute(
      'aria-label',
      `Réserver ma place — ${data.spotsLeft.toLocaleString('fr-FR')} places encore disponibles`
    );
  }

  // Injection d'un indicateur d'affluence
  const infoCardBody = document.querySelector('.info-card-body');
  if (infoCardBody) {
    const attendance = document.createElement('div');
    attendance.className = 'info-row';
    attendance.setAttribute('aria-label', `${data.registered.toLocaleString('fr-FR')} participants inscrits sur ${data.capacity.toLocaleString('fr-FR')} places`);

    const pct = Math.round((data.registered / data.capacity) * 100);
    attendance.innerHTML = `
      <span class="info-icon" aria-hidden="true">👥</span>
      <div style="flex:1;">
        <span class="info-label">Participation</span>
        <div style="font-size:.85rem;color:var(--gris-fonce);">
          ${data.registered.toLocaleString('fr-FR')} / ${data.capacity.toLocaleString('fr-FR')} inscrits
        </div>
        <div style="margin-top:.4rem;background:var(--sable-moyen);border-radius:50px;height:6px;overflow:hidden;" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="${pct}% de remplissage">
          <div style="height:100%;width:${pct}%;background:var(--terracotta);border-radius:50px;transition:width 1s ease;"></div>
        </div>
      </div>
    `;

    // Insérer avant le bouton de réservation
    const reserveBtn = infoCardBody.querySelector('.reserve-btn');
    if (reserveBtn) infoCardBody.insertBefore(attendance, reserveBtn);
  }
}

function initSidebarBehavior() {
  const sidebar = document.querySelector('.detail-sidebar');
  if (!sidebar || window.innerWidth < 1025) return;

  // Observer pour désactiver sticky en bas de page
  const footer = document.querySelector('.site-footer');
  if (!footer) return;

  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      sidebar.style.position = 'static';
    } else {
      sidebar.style.position = 'sticky';
      sidebar.style.top = '90px';
    }
  });
  observer.observe(footer);
}

function simulateDelay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}