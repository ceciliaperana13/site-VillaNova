/* ============================================================
   VilleNova — agenda.js
   Les agendas OpenAgenda utilisés ne retournent pas "timings"
   mais "dateRange.fr" en français (ex: "Mardi 5 mai, 21h30").
   Ce fichier parse ces chaînes pour placer les pastilles.
   ============================================================ */
'use strict';

/* ── CONFIG ───────────────────────────────────────────────── */
const OA_KEY          = "832ecfba688a4dda9e6beb28922ee893";
const OA_AGENDA_UID   = "24882772";
const OA_THEATRE_UID  = "65855330";
const OA_FESTIVAL_UID = "46290899";
const OA_SPORT_UID    = "94552197";
const OA_BASE         = "https://api.openagenda.com/v2";

/* ── ÉTAT ─────────────────────────────────────────────────── */
let EVENTS = [];
const state = {
  currentDate:  new Date(),
  view:         'calendar',
  activeFilter: 'all',
  searchQuery:  '',
};

/* ── LIBELLÉS ─────────────────────────────────────────────── */
const MOIS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

const MOIS_MAP = {
  'janvier':0,'février':1,'fevrier':1,'mars':2,'avril':3,'mai':4,
  'juin':5,'juillet':6,'août':7,'aout':7,'septembre':8,
  'octobre':9,'novembre':10,'décembre':11,'decembre':11,
};

const CAT_META = {
  festival: { emoji:'🎉', label:'Festival',    color:'#D17B49' },
  concert:  { emoji:'🎵', label:'Concert',     color:'#8B5E3C' },
  expo:     { emoji:'🖼', label:'Exposition',  color:'#C2A27C' },
  theatre:  { emoji:'🎭', label:'Théâtre',     color:'#6B8C6E' },
  gastro:   { emoji:'🍽', label:'Gastronomie', color:'#B05D5D' },
  sport:    { emoji:'⚽', label:'Sport',       color:'#4A789C' },
  autre:    { emoji:'📌', label:'Autre',       color:'#7A7A9D' },
};

/* ══════════════════════════════════════════════════════════
   PARSER DE DATE FRANÇAISE
   Gère :
   - "Mardi 5 mai, 21h30"            → 5 mai année courante
   - "5 mai 2026"                    → 5 mai 2026
   - "Du 11 au 26 juillet 2026"      → [11 juillet, 26 juillet]
   - "11 AU 26 JUILLET 2026"         → [11 juillet, 26 juillet]
   - "Vendredi 22 mai, 20h30"        → 22 mai
══════════════════════════════════════════════════════════ */

const MOIS_PATTERN = Object.keys(MOIS_MAP).join('|');
const RE_SINGLE = new RegExp(
  `(\\d{1,2})\\s+(${MOIS_PATTERN})(?:\\s+(\\d{4}))?`, 'i'
);
const RE_RANGE = new RegExp(
  `(\\d{1,2})\\s+(?:au|AU)\\s+(\\d{1,2})\\s+(${MOIS_PATTERN})(?:\\s+(\\d{4}))?`, 'i'
);
const RE_RANGE2 = new RegExp(
  `(\\d{1,2})\\s+(${MOIS_PATTERN})(?:\\s+(\\d{4}))?\\s+(?:au|AU)\\s+(\\d{1,2})\\s+(${MOIS_PATTERN})(?:\\s+(\\d{4}))?`, 'i'
);

function toDateStr(day, monthStr, yearStr) {
  const month = MOIS_MAP[monthStr.toLowerCase()];
  if (month === undefined || !day) return null;
  const year = yearStr ? parseInt(yearStr) : new Date().getFullYear();
  const d = new Date(year, month, parseInt(day));
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

/**
 * Parse une chaîne dateRange.fr et retourne { debut, fin, heure }.
 * debut/fin sont "YYYY-MM-DD", heure est "21h30" ou "".
 */
function parseFrenchDateRange(str) {
  if (!str) return { debut: null, fin: null, heure: '' };

  // Heure : "21h30" ou "21h00"
  const heureMatch = str.match(/(\d{1,2}h\d{2})/i);
  const heure = heureMatch ? heureMatch[1].toLowerCase() : '';

  // Plage avec même mois : "11 au 26 juillet 2026" ou "11 AU 26 JUILLET 2026"
  const rangeMatch = str.match(RE_RANGE);
  if (rangeMatch) {
    const debut = toDateStr(rangeMatch[1], rangeMatch[3], rangeMatch[4]);
    const fin   = toDateStr(rangeMatch[2], rangeMatch[3], rangeMatch[4]);
    return { debut, fin, heure };
  }

  // Plage avec mois différents : "1 mai au 30 juin 2026"
  const range2Match = str.match(RE_RANGE2);
  if (range2Match) {
    const debut = toDateStr(range2Match[1], range2Match[2], range2Match[3]);
    const fin   = toDateStr(range2Match[4], range2Match[5], range2Match[6]);
    return { debut, fin, heure };
  }

  // Date unique : "Mardi 5 mai, 21h30" ou "5 mai 2026"
  const singleMatch = str.match(RE_SINGLE);
  if (singleMatch) {
    const debut = toDateStr(singleMatch[1], singleMatch[2], singleMatch[3]);
    return { debut, fin: null, heure };
  }

  return { debut: null, fin: null, heure };
}

/* ══════════════════════════════════════════════════════════
   FETCH — identiques à main.js
══════════════════════════════════════════════════════════ */

async function oaFetch(uid, params) {
  const url = `${OA_BASE}/agendas/${uid}/events?` +
    new URLSearchParams({ key: OA_KEY, lang: 'fr', ...params });
  try {
    const res  = await fetch(url);
    const data = await res.json();
    console.log(`[Agenda] ${uid} → ${(data.events||[]).length} events`);
    return data.events || [];
  } catch(e) {
    console.error('[Agenda] Fetch error:', e);
    return [];
  }
}

/* ══════════════════════════════════════════════════════════
   MAPPING
══════════════════════════════════════════════════════════ */

function extractImage(ev) {
  const fallback = 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=600&q=80';
  if (!ev.image) return fallback;
  if (ev.image.base && ev.image.filename) return ev.image.base + ev.image.filename;
  if (ev.image.variants?.length) {
    const v = ev.image.variants.find(v => v.type==='full') || ev.image.variants[0];
    return ev.image.base + v.filename;
  }
  return fallback;
}

function guessCat(source, ev) {
  if (source==='theatre')  return 'theatre';
  if (source==='festival') return 'festival';
  if (source==='sport')    return 'sport';
  const t = (ev.title?.fr||'').toLowerCase();
  if (/concert|jazz|rock|musique|boeuf|blues/.test(t)) return 'concert';
  if (/expo|musée|galerie|exposition/.test(t))          return 'expo';
  if (/marché|gastro|food|cuisine/.test(t))             return 'gastro';
  if (/théâtre|theatre|comédie|spectacle/.test(t))      return 'theatre';
  if (/festival/.test(t))                               return 'festival';
  if (/sport|foot|rugby|match|natation|lutte/.test(t))  return 'sport';
  return 'autre';
}

function mapEvent(ev, source) {
  /* ★ On parse dateRange.fr car timings est vide pour ces agendas ★ */
  const dateRangeFr = ev.dateRange?.fr || '';
  const { debut, fin, heure } = parseFrenchDateRange(dateRangeFr);

  const desc = ev.description?.fr || ev.longDescription?.fr || ev.summary?.fr
    || 'Un événement à ne pas manquer !';

  console.log(`[Agenda] "${ev.title?.fr}" | dateRange="${dateRangeFr}" → debut=${debut} fin=${fin}`);

  return {
    id:          ev.uid,
    titre:       ev.title?.fr || 'Événement',
    date:        debut,
    dateFin:     fin && fin !== debut ? fin : null,
    heure,
    lieu:        ev.location?.name || '',
    categorie:   guessCat(source, ev),
    prix:        ev.free ? 'Gratuit' : 'Voir détails',
    description: desc.length > 400 ? desc.slice(0, 400) + '…' : desc,
    image:       extractImage(ev),
    lien:        `https://openagenda.com/agendas/${OA_AGENDA_UID}/events/${ev.slug || ev.uid}`,
    tags:        (ev.keywords?.fr || []).slice(0, 5),
    dateRangeFr, // conservé pour affichage brut si besoin
  };
}

/* ══════════════════════════════════════════════════════════
   CHARGEMENT — mêmes 6 events que main.js
══════════════════════════════════════════════════════════ */

async function loadSixEvents() {
  const title = document.getElementById('month-title');
  if (title) title.style.opacity = '0.4';

  const [evMain, evTheatre, evFestival, evSport] = await Promise.all([
    oaFetch(OA_AGENDA_UID,   { limit: 2 }),
    oaFetch(OA_THEATRE_UID,  { limit: 2 }),
    oaFetch(OA_FESTIVAL_UID, { limit: 5 }),
    oaFetch(OA_SPORT_UID,    { limit: 2, 'relative[0]':'current','relative[1]':'upcoming' }),
  ]);

  const raw = [
    evMain[0]     ? mapEvent(evMain[0],     'general')  : null,
    evMain[1]     ? mapEvent(evMain[1],     'general')  : null,
    evTheatre[0]  ? mapEvent(evTheatre[0],  'theatre')  : null,
    evTheatre[1]  ? mapEvent(evTheatre[1],  'theatre')  : null,
    evFestival[0] ? mapEvent(evFestival[0], 'festival') : null,
    evSport[0]    ? mapEvent(evSport[0],    'sport')    : null,
  ].filter(Boolean);

  const seen = new Set();
  EVENTS = raw.filter(ev => {
    if (seen.has(ev.id)) return false;
    seen.add(ev.id); return true;
  });

  console.log(`[Agenda] ${EVENTS.length} events chargés :`,
    EVENTS.map(e => `${e.titre} → ${e.date}`));

  /* Navigation auto vers le mois du 1er event avec date */
  const dates = EVENTS.map(e => parseDate(e.date)).filter(Boolean).sort((a,b)=>a-b);
  if (dates.length) {
    state.currentDate = new Date(dates[0].getFullYear(), dates[0].getMonth(), 1);
    console.log('[Agenda] → Navigation vers', MOIS_FR[dates[0].getMonth()], dates[0].getFullYear());
  } else {
    console.warn('[Agenda] Aucune date parsée — vérifier le format de dateRange.fr');
    // Afficher quand même les events sans date dans le mois courant
    EVENTS.forEach(ev => { if (!ev.date) console.log('  Sans date :', ev.titre, '|', ev.dateRangeFr); });
  }

  if (title) title.style.opacity = '';
  refresh();
}

/* ══════════════════════════════════════════════════════════
   UTILITAIRES DATES
══════════════════════════════════════════════════════════ */

function parseDate(str) {
  if (!str) return null;
  try {
    const [y,m,d] = str.split('-').map(Number);
    return new Date(y, m-1, d);
  } catch(e) { return null; }
}

function formatDateFR(str) {
  const d = parseDate(str);
  if (!d) return '';
  return `${d.getDate()} ${MOIS_FR[d.getMonth()].toLowerCase()} ${d.getFullYear()}`;
}

function eventsOnDay(year, month, day) {
  const target = new Date(year, month, day);
  return EVENTS.filter(ev => {
    const start = parseDate(ev.date);
    if (!start) return false;
    const end = ev.dateFin ? parseDate(ev.dateFin) : start;
    return target >= start && target <= end;
  });
}

function getFiltered() {
  const q = state.searchQuery.toLowerCase().trim();
  return EVENTS.filter(ev => {
    if (state.activeFilter !== 'all' && ev.categorie !== state.activeFilter) return false;
    if (!q) return true;
    return ev.titre.toLowerCase().includes(q)
        || ev.lieu.toLowerCase().includes(q)
        || (ev.tags||[]).some(t => t.toLowerCase().includes(q));
  });
}

function getFilteredInMonth() {
  const y=state.currentDate.getFullYear(), m=state.currentDate.getMonth();
  const ms=new Date(y,m,1), me=new Date(y,m+1,0);
  return getFiltered().filter(ev => {
    const s=parseDate(ev.date); if(!s) return false;
    const e=ev.dateFin?parseDate(ev.dateFin):s;
    return s<=me && e>=ms;
  });
}

/* ══════════════════════════════════════════════════════════
   CALENDRIER
══════════════════════════════════════════════════════════ */

function renderCalendar() {
  const year=state.currentDate.getFullYear(), month=state.currentDate.getMonth();
  document.getElementById('month-title').textContent = `${MOIS_FR[month]} ${year}`;

  const body=document.getElementById('cal-body');
  body.innerHTML='';

  const offset=(new Date(year,month,1).getDay()+6)%7;
  const days=new Date(year,month+1,0).getDate();
  const today=new Date();
  const fIds=new Set(getFiltered().map(e=>e.id));

  for(let i=0;i<offset;i++){
    const e=document.createElement('div');
    e.className='cal-cell cal-cell--empty';
    e.setAttribute('role','gridcell');
    body.appendChild(e);
  }

  for(let d=1;d<=days;d++){
    const cell=document.createElement('div');
    cell.className='cal-cell';
    cell.setAttribute('role','gridcell');

    const dayEvs=eventsOnDay(year,month,d).filter(e=>fIds.has(e.id));
    const isToday=today.getDate()===d&&today.getMonth()===month&&today.getFullYear()===year;

    if(isToday)       cell.classList.add('cal-cell--today');
    if(dayEvs.length) cell.classList.add('cal-cell--has-events');

    const num=document.createElement('span');
    num.className='cal-day-num';
    num.textContent=d;
    cell.appendChild(num);

    if(dayEvs.length){
      const wrap=document.createElement('div');
      wrap.className='cal-dots';

      dayEvs.slice(0,3).forEach(ev=>{
        const meta=CAT_META[ev.categorie]||CAT_META.autre;
        const dot=document.createElement('span');
        dot.className='cal-dot';
        dot.setAttribute('data-cat',ev.categorie);
        dot.style.background=meta.color;
        dot.title=`${meta.emoji} ${ev.titre}`;
        wrap.appendChild(dot);
      });

      if(dayEvs.length>3){
        const more=document.createElement('span');
        more.className='cal-dot-more';
        more.textContent=`+${dayEvs.length-3}`;
        wrap.appendChild(more);
      }

      cell.appendChild(wrap);
      cell.style.cursor='pointer';
      cell.setAttribute('tabindex','0');
      cell.setAttribute('aria-label',`${d} ${MOIS_FR[month]} ${year}, ${dayEvs.length} événement(s)`);
      cell.addEventListener('click',()=>openDayPanel(year,month,d,dayEvs));
      cell.addEventListener('keydown',e=>{
        if(e.key==='Enter'||e.key===' '){e.preventDefault();openDayPanel(year,month,d,dayEvs);}
      });
    }

    body.appendChild(cell);
  }

  updateSummary(getFilteredInMonth());
}

/* ══════════════════════════════════════════════════════════
   LISTE
══════════════════════════════════════════════════════════ */

function renderList(){
  const container=document.getElementById('list-container');
  container.innerHTML='';
  const shown=getFilteredInMonth();

  if(!shown.length){
    container.innerHTML=`
      <div class="list-empty">
        <span style="font-size:2.5rem">🔍</span>
        <p>Aucun événement ce mois-ci.</p>
        <button onclick="resetFilters()" class="btn-reset">Réinitialiser</button>
      </div>`;
    updateSummary(shown); return;
  }

  shown.sort((a,b)=>(a.date||'').localeCompare(b.date||''))
       .forEach(ev=>container.appendChild(buildCard(ev)));
  updateSummary(shown);
}

function buildCard(ev){
  const meta=CAT_META[ev.categorie]||CAT_META.autre;
  const card=document.createElement('article');
  card.className='event-card';
  card.setAttribute('tabindex','0');

  /* Affichage date : préfère le dateRange.fr original s'il est lisible */
  const dateDisplay = ev.dateRangeFr || (ev.date ? formatDateFR(ev.date) : '');
  const dateRange = ev.dateFin
    ? `${formatDateFR(ev.date)} → ${formatDateFR(ev.dateFin)}`
    : (ev.date ? formatDateFR(ev.date) : dateDisplay);

  card.innerHTML=`
    <div class="event-card-img" style="background-image:url('${ev.image}')"></div>
    <div class="event-card-body">
      <div class="event-card-meta">
        <span class="event-badge" data-cat="${ev.categorie}" style="background:${meta.color}">${meta.emoji} ${meta.label}</span>
        <span class="event-card-price">${ev.prix}</span>
      </div>
      <h4 class="event-card-title">${ev.titre}</h4>
      <p class="event-card-info">
        <span>📅 ${dateRange}</span>
        ${ev.heure?`<span>🕐 ${ev.heure}</span>`:''}
        ${ev.lieu ?`<span>📍 ${ev.lieu}</span>` :''}
      </p>
      <p class="event-card-desc">${ev.description}</p>
      <div class="event-card-tags">${(ev.tags||[]).map(t=>`<span class="tag">${t}</span>`).join('')}</div>
    </div>
    <div class="event-card-actions">
      <button class="btn-detail">Détails →</button>
    </div>`;

  card.querySelector('.btn-detail').addEventListener('click',()=>openEventPanel(ev));
  card.addEventListener('keydown',e=>{if(e.key==='Enter')openEventPanel(ev);});
  return card;
}

/* ══════════════════════════════════════════════════════════
   PANNEAUX
══════════════════════════════════════════════════════════ */

function openEventPanel(ev){
  const meta=CAT_META[ev.categorie]||CAT_META.autre;
  const panel=document.getElementById('event-panel');
  const overlay=document.getElementById('panel-overlay');
  const content=document.getElementById('panel-content');

  const dateDisplay = ev.dateRangeFr || (ev.dateFin
    ? `Du ${formatDateFR(ev.date)} au ${formatDateFR(ev.dateFin)}`
    : `Le ${formatDateFR(ev.date)}`);

  content.innerHTML=`
    <div class="panel-img-wrap">
      <img src="${ev.image}" alt="${ev.titre}" loading="lazy"/>
      <span class="panel-badge" data-cat="${ev.categorie}" style="background:${meta.color}">${meta.emoji} ${meta.label}</span>
    </div>
    <div class="panel-body">
      <h3 class="panel-title">${ev.titre}</h3>
      <ul class="panel-meta-list">
        <li><span class="panel-icon">📅</span><span>${dateDisplay}</span></li>
        ${ev.heure?`<li><span class="panel-icon">🕐</span><span>${ev.heure}</span></li>`:''}
        ${ev.lieu ?`<li><span class="panel-icon">📍</span><span>${ev.lieu}</span></li>` :''}
        <li><span class="panel-icon">💶</span><span>${ev.prix}</span></li>
      </ul>
      <p class="panel-desc">${ev.description}</p>
      <div class="panel-tags">${(ev.tags||[]).map(t=>`<span class="tag">${t}</span>`).join('')}</div>
      <a href="${ev.lien}" class="btn-cta panel-cta" target="_blank" rel="noopener noreferrer">Réserver / Plus d'infos →</a>
    </div>`;

  panel.classList.add('is-open'); overlay.classList.add('is-visible');
  panel.setAttribute('aria-hidden','false'); overlay.setAttribute('aria-hidden','false');
  document.getElementById('panel-close')?.focus();
  document.body.style.overflow='hidden';
}

function openDayPanel(year,month,day,events){
  if(events.length===1){openEventPanel(events[0]);return;}

  const panel=document.getElementById('event-panel');
  const overlay=document.getElementById('panel-overlay');
  const content=document.getElementById('panel-content');

  content.innerHTML=`
    <div class="panel-body">
      <h3 class="panel-title">Événements du ${day} ${MOIS_FR[month]} ${year}</h3>
      <ul class="panel-day-list">
        ${events.map(ev=>{
          const m=CAT_META[ev.categorie]||CAT_META.autre;
          return `<li>
            <button class="panel-day-item" data-id="${ev.id}">
              <span class="panel-day-badge" style="background:${m.color};display:inline-flex;align-items:center;justify-content:center;width:2rem;height:2rem;border-radius:50%;color:#fff">${m.emoji}</span>
              <span class="panel-day-info">
                <strong>${ev.titre}</strong>
                <small>${ev.heure?ev.heure+' · ':''}${ev.lieu}</small>
              </span>
              <span class="panel-day-arrow">→</span>
            </button>
          </li>`;
        }).join('')}
      </ul>
    </div>`;

  content.querySelectorAll('.panel-day-item').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const ev=EVENTS.find(e=>String(e.id)===String(btn.dataset.id));
      if(ev) openEventPanel(ev);
    });
  });

  panel.classList.add('is-open'); overlay.classList.add('is-visible');
  panel.setAttribute('aria-hidden','false'); overlay.setAttribute('aria-hidden','false');
  document.getElementById('panel-close')?.focus();
  document.body.style.overflow='hidden';
}

function closePanel(){
  document.getElementById('event-panel')?.classList.remove('is-open');
  document.getElementById('panel-overlay')?.classList.remove('is-visible');
  document.getElementById('event-panel')?.setAttribute('aria-hidden','true');
  document.getElementById('panel-overlay')?.setAttribute('aria-hidden','true');
  document.body.style.overflow='';
}

/* ══════════════════════════════════════════════════════════
   FILTRES, NAVIGATION, VUE
══════════════════════════════════════════════════════════ */

function setFilter(f){
  state.activeFilter=f;
  document.querySelectorAll('.filter-tag').forEach(btn=>{
    const on=btn.dataset.filter===f;
    btn.classList.toggle('active',on);
    btn.setAttribute('aria-pressed',String(on));
  });
  refresh();
}

function resetFilters(){
  state.activeFilter='all'; state.searchQuery='';
  const input=document.getElementById('agenda-search');
  if(input) input.value='';
  document.querySelectorAll('.filter-tag').forEach(btn=>{
    const on=btn.dataset.filter==='all';
    btn.classList.toggle('active',on); btn.setAttribute('aria-pressed',String(on));
  });
  refresh();
}

function updateSummary(list){
  const n=list.length;
  const countEl=document.getElementById('results-count');
  const periodEl=document.getElementById('results-period');
  if(countEl)  countEl.textContent=`${n} événement${n>1?'s':''}`;
  if(periodEl) periodEl.textContent=
    `en ${MOIS_FR[state.currentDate.getMonth()]} ${state.currentDate.getFullYear()}`;
}

function changeMonth(delta){
  const d=state.currentDate;
  state.currentDate=new Date(d.getFullYear(),d.getMonth()+delta,1);
  refresh();
}

function setView(view){
  state.view=view;
  document.getElementById('view-calendar')?.classList.toggle('hidden',view!=='calendar');
  document.getElementById('view-list')?.classList.toggle('hidden',view==='calendar');
  document.getElementById('btn-calendar')?.classList.toggle('active',view==='calendar');
  document.getElementById('btn-list')?.classList.toggle('active',view!=='calendar');
  document.getElementById('btn-calendar')?.setAttribute('aria-pressed',String(view==='calendar'));
  document.getElementById('btn-list')?.setAttribute('aria-pressed',String(view!=='calendar'));
  refresh();
}

function refresh(){
  state.view==='calendar'?renderCalendar():renderList();
}

/* ══════════════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════════════ */

async function init(){
  window.addEventListener('load',()=>{
    setTimeout(()=>{
      const l=document.getElementById('page-loader');
      if(l){l.classList.add('loader--hidden');l.addEventListener('transitionend',()=>l.remove(),{once:true});}
    },400);
  });

  renderCalendar();
  await loadSixEvents();

  document.getElementById('prev-month')?.addEventListener('click',()=>changeMonth(-1));
  document.getElementById('next-month')?.addEventListener('click',()=>changeMonth(1));
  document.getElementById('btn-calendar')?.addEventListener('click',()=>setView('calendar'));
  document.getElementById('btn-list')?.addEventListener('click',()=>setView('list'));

  document.querySelectorAll('.filter-tag').forEach(btn=>
    btn.addEventListener('click',()=>setFilter(btn.dataset.filter))
  );

  const input=document.getElementById('agenda-search');
  let deb;
  input?.addEventListener('input',()=>{
    clearTimeout(deb);
    deb=setTimeout(()=>{state.searchQuery=input.value;refresh();},280);
  });
  document.getElementById('agenda-search-btn')?.addEventListener('click',()=>{
    state.searchQuery=input?.value||'';refresh();
  });
  input?.addEventListener('keydown',e=>{
    if(e.key==='Enter'){state.searchQuery=input.value;refresh();}
  });

  document.getElementById('panel-close')?.addEventListener('click',closePanel);
  document.getElementById('panel-overlay')?.addEventListener('click',closePanel);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closePanel();});

  const panel=document.getElementById('event-panel');
  panel?.addEventListener('keydown',e=>{
    if(e.key!=='Tab') return;
    const els=[...panel.querySelectorAll('button,[href],[tabindex]:not([tabindex="-1"])')].filter(el=>!el.disabled);
    if(!els.length) return;
    const[first,last]=[els[0],els[els.length-1]];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  });

  const burger=document.querySelector('.nav-burger');
  const navLinks=document.getElementById('nav-links');
  if(burger&&navLinks){
    burger.addEventListener('click',()=>{
      const exp=burger.getAttribute('aria-expanded')==='true';
      burger.setAttribute('aria-expanded',String(!exp));
      navLinks.classList.toggle('is-open',!exp);
    });
  }

  const header=document.querySelector('.site-header');
  if(header){
    const s=document.createElement('div');s.style.height='1px';document.body.prepend(s);
    new IntersectionObserver(([e])=>header.classList.toggle('is-scrolled',!e.isIntersecting),{threshold:0}).observe(s);
  }

  if('IntersectionObserver' in window){
    const obs=new IntersectionObserver(entries=>{
      entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-revealed');obs.unobserve(e.target);}});
    },{threshold:0.08});
    document.querySelectorAll('.agenda-section,.agenda-controls').forEach(el=>obs.observe(el));
  }
}

document.readyState==='loading'
  ?document.addEventListener('DOMContentLoaded',init)
  :init();