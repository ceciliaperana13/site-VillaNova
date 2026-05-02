'use strict';

/* ══════════════════════════════════════════
   CONFIG OPENAGENDA
   ══════════════════════════════════════════ */
const OA_KEY        = "832ecfba688a4dda9e6beb28922ee893";
const OA_AGENDA_UID = "24882772";
const OA_BASE       = "https://api.openagenda.com/v2";

/* ══════════════════════════════════════════
   RÉCUPÉRER L’ID DANS L’URL
   ══════════════════════════════════════════ */
const params   = new URLSearchParams(window.location.search);
const eventId  = params.get("id");

if (!eventId) {
    document.getElementById("event-detail").innerHTML =
        "<p>❌ Aucun événement sélectionné.</p>";
    throw new Error("Aucun ID fourni dans l’URL.");
}

/* ══════════════════════════════════════════
   FETCH D’UN ÉVÉNEMENT
   ══════════════════════════════════════════ */
async function fetchEventDetail() {
    const url = `${OA_BASE}/agendas/${OA_AGENDA_UID}/events/${eventId}?key=${OA_KEY}&lang=fr`;

    console.log("[VilleNova] 📡 Fetch détail :", url);

    const res = await fetch(url);
    if (!res.ok) {
        document.getElementById("event-detail").innerHTML =
            "<p>❌ Impossible de charger cet événement.</p>";
        throw new Error("Erreur API détail : " + res.status);
    }

    const data = await res.json();
    return data.event;
}

/* ══════════════════════════════════════════
   OUTILS DE FORMATAGE
   ══════════════════════════════════════════ */
function getText(field) {
    if (!field) return "";
    if (typeof field === "string") return field;
    return field.fr || field.en || Object.values(field)[0] || "";
}

function getImage(ev) {
    if (!ev.image) return "/assets/img/placeholder.webp";
    if (ev.image.base && ev.image.filename) return ev.image.base + ev.image.filename;
    return ev.image.url || ev.image.src || "/assets/img/placeholder.webp";
}

function getDateFr(ev) {
    if (ev.dateRange?.fr) return ev.dateRange.fr;
    const begin = ev.firstTiming?.begin;
    if (!begin) return "Date non précisée";
    const d = new Date(begin);
    return d.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function getLieu(ev) {
    const loc = ev.location || {};
    return `${loc.name || ""} — ${loc.address || ""} ${loc.city || ""}`;
}

function getPrix(ev) {
    if (ev.free === 1) return "Gratuit 🎟";
    return getText(ev.conditions) || "Voir détails";
}

/* ══════════════════════════════════════════
   AFFICHAGE DES DONNÉES
   ══════════════════════════════════════════ */
function displayEvent(ev) {
    document.getElementById("detail-title").textContent = getText(ev.title);
    document.getElementById("detail-desc").textContent  = getText(ev.description);
    document.getElementById("detail-img").src           = getImage(ev);
    document.getElementById("detail-date").textContent  = getDateFr(ev);
    document.getElementById("detail-place").textContent = getLieu(ev);
    document.getElementById("detail-price").textContent = getPrix(ev);
}

/* ══════════════════════════════════════════
   CHARGEMENT
   ══════════════════════════════════════════ */
async function init() {
    try {
        const ev = await fetchEventDetail();
        displayEvent(ev);
    } catch (err) {
        console.error(err);
    }
}

init();

/* ══════════════════════════════════════════
   BOUTON RETOUR
   ══════════════════════════════════════════ */
document.getElementById("btn-back").addEventListener("click", () => {
    window.location.href = "/index.html";
});
