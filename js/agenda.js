/* ============================================================
   VilleNova — agenda.js
   Logique complète de la page Agenda
   ============================================================ */

'use strict';

/* ============================================================
   1. DONNÉES DES ÉVÉNEMENTS
   ============================================================ */
const EVENTS = [
  {
    id: 1,
    titre: 'Jazz des Calanques',
    categorie: 'concert',
    emoji: '🎵',
    dateDebut: new Date(2025, 4, 3),   // 3 mai
    dateFin:   new Date(2025, 4, 3),
    heure: '20h30',
    lieu: 'Palais du Pharo',
    adresse: '58 Bd Charles Livon, Marseille 7e',
    prix: 24,
    gratuit: false,
    description: 'Une soirée jazz intimiste face à la mer avec le quartet Dimitri Papadopoulos. Un voyage musical entre Méditerranée et Nouvelle-Orléans pour une expérience unique sous les étoiles.',
    tags: ['Jazz', 'Live', 'Mer'],
    accessibilite: ['♿', '👂', '🅿'],
    image: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&q=80',
  },
  {
    id: 2,
    titre: 'Marseille Street Food Festival',
    categorie: 'gastro',
    emoji: '🍽',
    dateDebut: new Date(2025, 4, 9),   // 9 mai
    dateFin:   new Date(2025, 4, 11),
    heure: '11h–22h',
    lieu: 'Cours Julien',
    adresse: 'Cours Julien, Marseille 6e',
    prix: 0,
    gratuit: true,
    description: 'Trois jours de gastronomie de rue réunissant plus de 40 food trucks venus de toute la Méditerranée. Saveurs siciliennes, libanaises, provençales et bien plus encore.',
    tags: ['Street food', 'Méditerranée', 'Famille'],
    accessibilite: ['♿', '🚲'],
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80',
  },
  {
    id: 3,
    titre: 'Exposition : Lumières du Sud',
    categorie: 'expo',
    emoji: '🖼',
    dateDebut: new Date(2025, 4, 10),  // 10 mai
    dateFin:   new Date(2025, 5, 28),  // 28 juin
    heure: '10h–19h (fermé lundi)',
    lieu: 'MuCEM',
    adresse: '7 Promenade Robert Laffont, Marseille 2e',
    prix: 11,
    gratuit: false,
    description: 'Une traversée photographique de la lumière méditerranéenne à travers les œuvres de 18 artistes contemporains issus de 12 pays riverains de la Méditerranée.',
    tags: ['Photo', 'Contemporain', 'Méditerranée'],
    accessibilite: ['♿', '👁', '👂'],
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=80',
  },
  {
    id: 4,
    titre: 'Festival de la Bonne Mère',
    categorie: 'festival',
    emoji: '🎉',
    dateDebut: new Date(2025, 4, 16),  // 16 mai
    dateFin:   new Date(2025, 4, 18),
    heure: 'Dès 16h',
    lieu: 'Vieux-Port',
    adresse: 'Quai des Belges, Marseille 1er',
    prix: 0,
    gratuit: true,
    description: 'Le grand festival populaire du Vieux-Port : scènes musicales, expositions artisanales, animations familiales et feu d'artifice le samedi soir. L'événement phare du printemps marseillais.',
    tags: ['Gratuit', 'Famille', 'Feux d'artifice'],
    accessibilite: ['♿', '🚲', '🅿'],
    image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80',
  },
  {
    id: 5,
    titre: 'Don Giovanni – Opéra de Marseille',
    categorie: 'theatre',
    emoji: '🎭',
    dateDebut: new Date(2025, 4, 21),  // 21 mai
    dateFin:   new Date(2025, 4, 21),
    heure: '19h30',
    lieu: 'Opéra de Marseille',
    adresse: '2 Rue Molière, Marseille 1er',
    prix: 55,
    gratuit: false,
    description: 'Le chef-d'œuvre de Mozart dans une mise en scène audacieuse signée Clara Vidal. L'Orchestre Philharmonique de Marseille sous la baguette du maestro Ivan Kozlov.',
    tags: ['Opéra', 'Mozart', 'Classique'],
    accessibilite: ['♿', '👂', '👁'],
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
  },
  {
    id: 6,
    titre: 'Semi-Marathon des Calanques',
    categorie: 'sport',
    emoji: '⚽',
    dateDebut: new Date(2025, 4, 25),  // 25 mai
    dateFin:   new Date(2025, 4, 25),
    heure: '8h00',
    lieu: 'Départ Parc Borély',
    adresse: 'Avenue du Parc Borély, Marseille 8e',
    prix: 35,
    gratuit: false,
    description: 'Le plus beau semi-marathon de France ! Un parcours spectaculaire longeant les calanques, de Borély jusqu'à Cassis, avec des panoramas à couper le souffle.',
    tags: ['Running', 'Nature', 'Calanques'],
    accessibilite: ['🅿'],
    image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80',
  },
  {
    id: 7,
    titre: 'Nuits Électroniques du Fort',
    categorie: 'concert',
    emoji: '🎵',
    dateDebut: new Date(2025, 4, 30),  // 30 mai
    dateFin:   new Date(2025, 4, 31),
    heure: '22h–6h',
    lieu: 'Fort Saint-Jean',
    adresse: 'Fort Saint-Jean, Marseille 2e',
    prix: 28,
    gratuit: false,
    description: 'Deux nuits de musique électronique dans les espaces historiques du Fort Saint-Jean. Line-up international avec 12 DJs et artistes live dans un cadre exceptionnel face à la mer.',
    tags: ['Électro', 'Nuit', 'Fort Saint-Jean'],
    accessibilite: ['♿'],
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80',
  },
  {
    id: 8,
    titre: 'Marché des Créateurs',
    categorie: 'expo',
    emoji: '🖼',
    dateDebut: new Date(2025, 5, 7),   // 7 juin
    dateFin:   new Date(2025, 5, 8),
    heure: '10h–19h',
    lieu: 'Friche la Belle de Mai',
    adresse: '41 Rue Jobin, Marseille 3e',
    prix: 0,
    gratuit: true,
    description: 'Plus de 80 artistes et artisans locaux exposent leurs créations : bijoux, céramique, illustration, photographie et textiles. Un rendez-vous incontournable de la scène créative marseillaise.',
    tags: ['Artisanat', 'Art', 'Local'],
    accessibilite: ['♿', '🚲'],
    image: 'https://images.unsplash.com/photo-1531835551805-16d864c8d311?w=800&q=80',
  },
  {
    id: 9,
    titre: 'Fête de la Musique',
    categorie: 'festival',
    emoji: '🎉',
    dateDebut: new Date(2025, 5, 21),  // 21 juin
    dateFin:   new Date(2025, 5, 21),
    heure: 'Dès 18h',
    lieu: 'Partout à Marseille',
    adresse: 'Cours Julien, Vieux-Port, La Plaine…',
    prix: 0,
    gratuit: true,
    description: 'Des centaines de scènes dans toute la ville pour la plus grande fête musicale de l'année. Rock, jazz, hip-hop, musiques du monde : Marseille vibre jusqu'à l'aube.',
    tags: ['Gratuit', 'Tous styles', 'Plein air'],
    accessibilite: ['♿', '🚲'],
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80',
  },
  {
    id: 10,
    titre: 'Les Rencontres du Cinéma',
    categorie: 'theatre',
    emoji: '🎭',
    dateDebut: new Date(2025, 5, 12),  // 12 juin
    dateFin:   new Date(2025, 5, 15),
    heure: 'Variable',
    lieu: 'Cinémas Variétés & Prado',
    adresse: 'Plusieurs salles, Marseille',
    prix: 8,
    gratuit: false,
    description: 'Quatre jours de cinéma méditerranéen avec projections, rencontres avec les réalisateurs, ateliers et débats. Focus sur le cinéma maghrébin et les nouvelles voix du bassin méditerranéen.',
    tags: ['Cinéma', 'Méditerranée', 'Débats'],
    accessibilite: ['♿', '👁', '👂'],
    image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80',
  },
];

/* ============================================================
   2. ÉTAT DE L'APPLICATION
   ============================================================ */
const state = {
  moisCourant: new Date().getMonth(),
  anneeCourante: new Date().getFullYear(),
  vue: 'calendar',           // 'calendar' | 'list'
  filtre: 'all',
  recherche: '',
  evenementOuvert: null,
};

/* ============================================================
   3. UTILITAIRES
   ============================================================ */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

const MOIS_FR = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre'
];
const MOIS_COURT = [
  'Jan','Fév','Mar','Avr','Mai','Jui',
  'Juil','Aoû','Sep','Oct','Nov','Déc'
];

const LABELS_CAT = {
  festival: 'Festival',
  concert:  'Concert',
  expo:     'Exposition',
  theatre:  'Théâtre / Ciné',
  gastro:   'Gastronomie',
  sport:    'Sport',
};

function formaterPrix(evt) {
  if (evt.gratuit) return '<span class="free">Gratuit</span>';
  return `<strong>${evt.prix} €</strong>`;
}

function formaterPrixTexte(evt) {
  if (evt.gratuit) return 'Gratuit';
  return `${evt.prix} €`;
}

function formaterDuree(evt) {
  const d = evt.dateDebut, f = evt.dateFin;
  if (d.toDateString() === f.toDateString()) return '';
  const diff = Math.round((f - d) / 86400000);
  return `${diff + 1} jours`;
}

function dateInRange(date, debut, fin) {
  const d = new Date(date); d.setHours(0,0,0,0);
  const s = new Date(debut); s.setHours(0,0,0,0);
  const e = new Date(fin);   e.setHours(0,0,0,0);
  return d >= s && d <= e;
}

function sanitize(str) {
  const el = document.createElement('div');
  el.textContent = str;
  return el.innerHTML;
}

/* ============================================================
   4. FILTRAGE
   ============================================================ */
function evenementsFiltres() {
  const rech = state.recherche.toLowerCase().trim();
  return EVENTS.filter(evt => {
    // filtre catégorie
    if (state.filtre !== 'all' && evt.categorie !== state.filtre) return false;
    // filtre mois/année : au moins un jour dans le mois courant
    const moisDebut = evt.dateDebut.getMonth() === state.moisCourant && evt.dateDebut.getFullYear() === state.anneeCourante;
    const moisFin   = evt.dateFin.getMonth()   === state.moisCourant && evt.dateFin.getFullYear()   === state.anneeCourante;
    const chevauche = evt.dateDebut <= new Date(state.anneeCourante, state.moisCourant + 1, 0) &&
                      evt.dateFin   >= new Date(state.anneeCourante, state.moisCourant, 1);
    if (!chevauche) return false;
    // filtre recherche
    if (rech) {
      const haystack = [evt.titre, evt.lieu, evt.description, ...evt.tags]
        .join(' ').toLowerCase();
      if (!haystack.includes(rech)) return false;
    }
    return true;
  });
}

/* ============================================================
   5. RENDU CALENDRIER
   ============================================================ */
function renderCalendrier() {
  const calBody = $('#cal-body');
  if (!calBody) return;
  calBody.innerHTML = '';

  const annee = state.anneeCourante;
  const mois  = state.moisCourant;
  const premier = new Date(annee, mois, 1);
  const dernier = new Date(annee, mois + 1, 0);

  // Lundi=1 → on veut que la semaine commence le lundi
  let debutSemaine = premier.getDay(); // 0=dim,1=lun...
  debutSemaine = debutSemaine === 0 ? 6 : debutSemaine - 1;

  const evts = evenementsFiltres();

  // Cellules vides avant le 1er
  for (let i = 0; i < debutSemaine; i++) {
    const vide = document.createElement('div');
    vide.className = 'cal-day cal-empty';
    vide.setAttribute('aria-hidden', 'true');
    calBody.appendChild(vide);
  }

  const today = new Date();
  today.setHours(0,0,0,0);

  for (let jour = 1; jour <= dernier.getDate(); jour++) {
    const dateCell = new Date(annee, mois, jour);
    const cell = document.createElement('div');
    cell.className = 'cal-day';
    cell.setAttribute('role', 'gridcell');
    cell.setAttribute('data-date', dateCell.toISOString().slice(0,10));

    if (dateCell.toDateString() === today.toDateString()) {
      cell.classList.add('cal-today');
    }

    // Numéro du jour
    const numEl = document.createElement('div');
    numEl.className = 'cal-day-num';
    numEl.textContent = jour;
    cell.appendChild(numEl);

    // Événements du jour
    const evtsDuJour = evts.filter(e => dateInRange(dateCell, e.dateDebut, e.dateFin));
    const MAX_VIS = 2;

    evtsDuJour.slice(0, MAX_VIS).forEach(evt => {
      const chip = document.createElement('div');
      chip.className = `cal-event cat-${evt.categorie}`;
      chip.textContent = evt.titre;
      chip.setAttribute('role', 'button');
      chip.setAttribute('tabindex', '0');
      chip.setAttribute('aria-label', `${evt.titre} – ${evt.heure}`);
      chip.addEventListener('click', (e) => { e.stopPropagation(); ouvrirPanel(evt.id); });
      chip.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ouvrirPanel(evt.id); }
      });
      cell.appendChild(chip);
    });

    if (evtsDuJour.length > MAX_VIS) {
      const more = document.createElement('div');
      more.className = 'cal-more';
      more.textContent = `+${evtsDuJour.length - MAX_VIS} autre${evtsDuJour.length - MAX_VIS > 1 ? 's' : ''}`;
      more.setAttribute('role', 'button');
      more.setAttribute('tabindex', '0');
      more.setAttribute('aria-label', `${evtsDuJour.length - MAX_VIS} autre(s) événement(s) ce jour`);
      more.addEventListener('click', (e) => { e.stopPropagation(); basculerVueListe(); });
      more.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); basculerVueListe(); }
      });
      cell.appendChild(more);
    }

    if (evtsDuJour.length > 0) {
      cell.classList.add('has-events');
      cell.setAttribute('aria-label', `${jour} ${MOIS_FR[mois]} – ${evtsDuJour.length} événement(s)`);
    } else {
      cell.setAttribute('aria-label', `${jour} ${MOIS_FR[mois]}`);
    }

    calBody.appendChild(cell);
  }

  // Cellules vides après le dernier
  const total = debutSemaine + dernier.getDate();
  const restant = total % 7 === 0 ? 0 : 7 - (total % 7);
  for (let i = 0; i < restant; i++) {
    const vide = document.createElement('div');
    vide.className = 'cal-day cal-empty';
    vide.setAttribute('aria-hidden', 'true');
    calBody.appendChild(vide);
  }
}

/* ============================================================
   6. RENDU LISTE
   ============================================================ */
function renderListe() {
  const container = $('#list-container');
  if (!container) return;
  container.innerHTML = '';

  const evts = evenementsFiltres();

  if (evts.length === 0) {
    container.innerHTML = `
      <div class="no-results" role="status">
        <span class="no-results-icon">🔍</span>
        <h3>Aucun événement trouvé</h3>
        <p>Essayez de modifier vos filtres ou votre recherche.</p>
      </div>`;
    return;
  }

  // Grouper par mois
  const groupes = {};
  evts.forEach(evt => {
    const key = `${evt.dateDebut.getFullYear()}-${String(evt.dateDebut.getMonth()).padStart(2,'0')}`;
    if (!groupes[key]) groupes[key] = { mois: evt.dateDebut.getMonth(), annee: evt.dateDebut.getFullYear(), evts: [] };
    groupes[key].evts.push(evt);
  });

  Object.values(groupes)
    .sort((a, b) => a.annee - b.annee || a.mois - b.mois)
    .forEach(groupe => {
      const section = document.createElement('div');
      section.className = 'list-month-group';

      const titre = document.createElement('h3');
      titre.className = 'list-month-title';
      titre.textContent = `${MOIS_FR[groupe.mois]} ${groupe.annee}`;
      section.appendChild(titre);

      const liste = document.createElement('div');
      liste.className = 'list-events';

      groupe.evts.forEach(evt => {
        const card = creerCarteListeEl(evt);
        liste.appendChild(card);
      });

      section.appendChild(liste);
      container.appendChild(section);
    });
}

function creerCarteListeEl(evt) {
  const card = document.createElement('article');
  card.className = 'list-event-card';
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', `${evt.titre} – ${evt.lieu} – ${formaterPrixTexte(evt)}`);

  const duree = formaterDuree(evt);

  card.innerHTML = `
    <div class="list-card-date">
      <div class="list-date-day">${evt.dateDebut.getDate()}</div>
      <div class="list-date-month">${MOIS_COURT[evt.dateDebut.getMonth()]}</div>
      ${duree ? `<div class="list-date-range">${duree}</div>` : ''}
    </div>
    <div class="list-card-body">
      <div class="list-card-category cat-text-${evt.categorie}">${evt.emoji} ${LABELS_CAT[evt.categorie]}</div>
      <div class="list-card-title">${sanitize(evt.titre)}</div>
      <div class="list-card-meta">
        <span>🕐 ${evt.heure}</span>
        <span aria-hidden="true">·</span>
        <span>📍 ${sanitize(evt.lieu)}</span>
      </div>
      <div class="list-card-desc">${sanitize(evt.description)}</div>
      <div class="list-card-tags">
        ${evt.tags.map(t => `<span class="tag">${sanitize(t)}</span>`).join('')}
      </div>
    </div>
    <div class="list-card-action">
      <div class="list-card-price">${formaterPrix(evt)}<span style="font-size:.7rem;color:var(--gris-fonce);">${evt.gratuit ? '' : 'par pers.'}</span></div>
      <div class="list-card-a11y" aria-label="Accessibilité">${evt.accessibilite.map(a => `<span title="Accessibilité">${a}</span>`).join('')}</div>
      <button class="btn btn-sm btn-primary" style="font-size:.78rem;padding:.4rem .9rem;" aria-label="Voir les détails de ${sanitize(evt.titre)}">Voir →</button>
    </div>`;

  card.addEventListener('click', () => ouvrirPanel(evt.id));
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ouvrirPanel(evt.id); }
  });

  return card;
}

/* ============================================================
   7. PANNEAU DÉTAIL
   ============================================================ */
function ouvrirPanel(id) {
  const evt = EVENTS.find(e => e.id === id);
  if (!evt) return;
  state.evenementOuvert = id;

  const panel   = $('#event-panel');
  const overlay = $('#panel-overlay');
  const content = $('#panel-content');
  if (!panel || !overlay || !content) return;

  const dateFmt = evt.dateDebut.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const dateFin = evt.dateFin.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const memeJour = evt.dateDebut.toDateString() === evt.dateFin.toDateString();

  content.innerHTML = `
    <img class="panel-img" src="${sanitize(evt.image)}" alt="Illustration – ${sanitize(evt.titre)}" loading="lazy" onerror="this.style.display='none'">
    <span class="panel-category cat-text-${evt.categorie}">${evt.emoji} ${LABELS_CAT[evt.categorie]}</span>
    <h2 class="panel-title">${sanitize(evt.titre)}</h2>
    <div class="panel-info-list">
      <div class="panel-info-row">
        <span class="icon">📅</span>
        <span>${dateFmt}${memeJour ? '' : ` → ${dateFin}`}</span>
      </div>
      <div class="panel-info-row">
        <span class="icon">🕐</span>
        <span>${sanitize(evt.heure)}</span>
      </div>
      <div class="panel-info-row">
        <span class="icon">📍</span>
        <span>
          <strong>${sanitize(evt.lieu)}</strong><br>
          <a href="https://maps.google.com/?q=${encodeURIComponent(evt.adresse)}" target="_blank" rel="noopener noreferrer" style="color:var(--terracotta);font-size:.82rem;">${sanitize(evt.adresse)}</a>
        </span>
      </div>
    </div>
    <p class="panel-desc">${sanitize(evt.description)}</p>
    <div class="panel-tags">
      ${evt.tags.map(t => `<span class="tag">${sanitize(t)}</span>`).join('')}
    </div>
    <div class="panel-price-block">
      <div>
        <div class="panel-price-label">Tarif</div>
        <div class="panel-price-value ${evt.gratuit ? 'free' : ''}">${formaterPrixTexte(evt)}</div>
      </div>
      ${!evt.gratuit ? `<a href="billetterie.html" class="btn btn-primary" aria-label="Acheter des billets pour ${sanitize(evt.titre)}">🎟 Réserver</a>` : '<span style="color:#2a7d4f;font-size:.85rem;">✔ Entrée libre</span>'}
    </div>
    ${evt.accessibilite.length ? `
    <div class="panel-a11y" aria-label="Accessibilité">
      ${evt.accessibilite.map(a => `<span class="panel-a11y-tag">${a} Accessible</span>`).join('')}
    </div>` : ''}
    <div style="display:flex;gap:.6rem;flex-wrap:wrap;">
      <button class="btn btn-secondary" onclick="partagerEvenement(${evt.id})" style="font-size:.82rem;flex:1;">↗ Partager</button>
      <button class="btn btn-secondary" onclick="ajouterCalendrier(${evt.id})" style="font-size:.82rem;flex:1;">📅 Ajouter</button>
    </div>`;

  panel.classList.add('open');
  panel.setAttribute('aria-hidden', 'false');
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';

  // Focus sur le bouton fermer
  requestAnimationFrame(() => {
    const btnFermer = $('#panel-close');
    btnFermer?.focus();
  });

  // Trap focus dans le panneau
  panel._trapHandler = trapFocus(panel);
}

function fermerPanel() {
  const panel   = $('#event-panel');
  const overlay = $('#panel-overlay');
  if (!panel || !overlay) return;

  panel.classList.remove('open');
  panel.setAttribute('aria-hidden', 'true');
  overlay.classList.remove('active');
  document.body.style.overflow = '';
  state.evenementOuvert = null;

  if (panel._trapHandler) {
    panel.removeEventListener('keydown', panel._trapHandler);
    panel._trapHandler = null;
  }
}

function trapFocus(el) {
  const focusables = 'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])';
  const handler = (e) => {
    if (e.key !== 'Tab') return;
    const els = [...el.querySelectorAll(focusables)].filter(f => f.offsetParent !== null);
    if (!els.length) return;
    const first = els[0], last = els[els.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  };
  el.addEventListener('keydown', handler);
  return handler;
}

/* Fonctions exposées globalement pour les boutons inline */
window.partagerEvenement = function(id) {
  const evt = EVENTS.find(e => e.id === id);
  if (!evt) return;
  if (navigator.share) {
    navigator.share({ title: evt.titre, text: evt.description, url: window.location.href })
      .catch(() => {});
  } else {
    navigator.clipboard?.writeText(window.location.href)
      .then(() => showToast('Lien copié dans le presse-papier !'))
      .catch(() => showToast('Partagez cette page depuis votre navigateur.'));
  }
};

window.ajouterCalendrier = function(id) {
  const evt = EVENTS.find(e => e.id === id);
  if (!evt) return;

  const fmt = (d) => d.toISOString().replace(/[-:]/g,'').slice(0,15) + 'Z';
  const start = fmt(evt.dateDebut);
  const end   = fmt(new Date(evt.dateFin.getTime() + 86400000));
  const url = `https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(evt.titre)}&dates=${start}/${end}&details=${encodeURIComponent(evt.description)}&location=${encodeURIComponent(evt.adresse)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
};

/* ============================================================
   8. EN-TÊTE MOIS & RÉSUMÉ
   ============================================================ */
function mettreAJourTitreMois() {
  const el = $('#month-title');
  if (el) el.textContent = `${MOIS_FR[state.moisCourant]} ${state.anneeCourante}`;
}

function mettreAJourResume() {
  const evts = evenementsFiltres();
  const countEl = $('#results-count');
  const periodEl = $('#results-period');
  if (countEl) countEl.textContent = `${evts.length} événement${evts.length > 1 ? 's' : ''}`;
  if (periodEl) periodEl.textContent = `en ${MOIS_FR[state.moisCourant]} ${state.anneeCourante}`;
}

/* ============================================================
   9. TOAST NOTIFICATIONS
   ============================================================ */
function showToast(msg, duree = 3000) {
  const container = $('.toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  toast.setAttribute('role', 'alert');
  toast.style.cssText = `
    background: var(--brun-chaud);
    color: var(--blanc-casse);
    padding: .75rem 1.2rem;
    border-radius: var(--radius-pill);
    box-shadow: var(--shadow-hover);
    font-size: .88rem;
    font-weight: 500;
    animation: fadeUp .3s ease both;
    margin-top: .5rem;
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity .3s';
    setTimeout(() => toast.remove(), 300);
  }, duree);
}

/* ============================================================
   10. RENDU COMPLET
   ============================================================ */
function rendreAgenda() {
  mettreAJourTitreMois();
  mettreAJourResume();
  if (state.vue === 'calendar') {
    renderCalendrier();
  } else {
    renderListe();
  }
}

/* ============================================================
   11. BASCULER VUE
   ============================================================ */
function basculerVueListe() {
  state.vue = 'list';

  $('#view-calendar')?.classList.add('hidden');
  $('#view-list')?.classList.remove('hidden');

  $('#btn-calendar')?.classList.remove('active');
  $('#btn-calendar')?.setAttribute('aria-pressed', 'false');
  $('#btn-list')?.classList.add('active');
  $('#btn-list')?.setAttribute('aria-pressed', 'true');

  renderListe();
}

/* ============================================================
   12. INITIALISATION & ÉVÉNEMENTS DOM
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {

  /* ---- Initialisation état depuis la date du jour ---- */
  const now = new Date();
  state.moisCourant   = now.getMonth();
  state.anneeCourante = now.getFullYear();

  /* ---- Rendu initial ---- */
  rendreAgenda();

  /* ---- Navigation mois ---- */
  $('#prev-month')?.addEventListener('click', () => {
    if (state.moisCourant === 0) { state.moisCourant = 11; state.anneeCourante--; }
    else state.moisCourant--;
    rendreAgenda();
  });

  $('#next-month')?.addEventListener('click', () => {
    if (state.moisCourant === 11) { state.moisCourant = 0; state.anneeCourante++; }
    else state.moisCourant++;
    rendreAgenda();
  });

  /* ---- Toggle vue calendrier / liste ---- */
  $$('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const vue = btn.dataset.view;
      state.vue = vue;

      $$('.view-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.view === vue);
        b.setAttribute('aria-pressed', String(b.dataset.view === vue));
      });

      $('#view-calendar')?.classList.toggle('hidden', vue !== 'calendar');
      $('#view-list')?.classList.toggle('hidden', vue !== 'list');

      rendreAgenda();
    });
  });

  /* ---- Filtres catégorie ---- */
  $$('.filter-tag').forEach(btn => {
    btn.addEventListener('click', () => {
      state.filtre = btn.dataset.filter;

      $$('.filter-tag').forEach(b => {
        b.classList.toggle('active', b.dataset.filter === state.filtre);
        b.setAttribute('aria-pressed', String(b.dataset.filter === state.filtre));
      });

      rendreAgenda();
    });
  });

  /* ---- Recherche ---- */
  const searchInput = $('#agenda-search');
  const searchBtn   = $('#agenda-search-btn');

  let debounceTimer;
  searchInput?.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      state.recherche = searchInput.value;
      rendreAgenda();
    }, 280);
  });

  searchBtn?.addEventListener('click', () => {
    state.recherche = searchInput?.value ?? '';
    rendreAgenda();
  });

  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      clearTimeout(debounceTimer);
      state.recherche = searchInput.value;
      rendreAgenda();
    }
  });

  /* ---- Panneau : fermer ---- */
  $('#panel-close')?.addEventListener('click', fermerPanel);
  $('#panel-overlay')?.addEventListener('click', fermerPanel);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.evenementOuvert) fermerPanel();
  });

  /* ---- Navigation clavier dans le calendrier ---- */
  $('#cal-body')?.addEventListener('keydown', (e) => {
    if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) return;
    e.preventDefault();
    const cells = $$('.cal-day:not(.cal-empty)', $('#cal-body'));
    const focused = document.activeElement?.closest('.cal-day');
    if (!focused) { cells[0]?.focus(); return; }
    const idx = cells.indexOf(focused);
    const map = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    const next = cells[idx + map[e.key]];
    next?.focus();
  });

  /* ---- Mise en relief de la navbar ---- */
  const headerEl = document.querySelector('.site-header');
  if (headerEl) {
    window.addEventListener('scroll', () => {
      headerEl.classList.toggle('scrolled', window.scrollY > 10);
    }, { passive: true });
  }

  /* ---- Swipe mobile pour fermer le panneau ---- */
  let touchStartX = 0;
  const panel = $('#event-panel');
  panel?.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
  panel?.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (dx > 60) fermerPanel(); // swipe droite → fermer
  }, { passive: true });

});