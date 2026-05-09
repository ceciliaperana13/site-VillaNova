# 🏙️ VilleNova — Agenda Événementiel de Marseille

> Portail événementiel de référence pour Marseille et sa métropole.  
> Culture, concerts, expositions, festivals, théâtre, gastronomie, sport.

---

## 📋 Présentation

**VilleNova** est un site vitrine front-end événementiel dédié à la ville de Marseille.  
Il centralise les événements culturels en temps réel grâce à l'**API OpenAgenda**, et affiche images, descriptions, dates, lieux et tarifs dynamiquement.

Le projet est développé en **HTML5 / CSS3 / JavaScript vanilla** — sans framework, garantissant une compatibilité native avec tous les navigateurs modernes.

---

## 🗂️ Structure du projet

```
villenova/
│
├── sitemap.xml              → Référencement moteurs de recherche
├── robots.txt               → Instructions pour les robots d'indexation
├── README.md                → Ce fichier
│
├── html/
│   ├── index.html           → Page d'accueil
│   ├── evenement-detail.html → Détail d'un événement
│   ├── agenda.html          → Agenda calendrier / liste
│   ├── billetterie.html     → Billetterie avec panier
│   ├── carte.html           → Carte interactive
│   └── contact.html         → Formulaire de contact
│
├── js/
│   ├── main.js              → Script global (nav, filtres, API cards)
│   ├── agenda.js            → Calendrier + liste + parsing dates FR
│   ├── billetterie.js       → Panier, tarifs, paiement simulé
│   └── evenement-detail.js  → Détail événement dynamique
│
├── SCSS/
│   └── main.css             → Feuille de style compilée
│
└── assets/
    ├── images/              → Visuels statiques
    └── videos/              → Vidéos de présentation
```

---

## 🔌 API OpenAgenda

Le site consomme l'API publique **OpenAgenda v2** en temps réel.

### Agendas utilisés

| Agenda | UID | Contenu |
|---|---|---|
| Agenda principal Marseille | `2119473` | Concerts, expos, culture |
| Théâtre | `65855330` | Spectacles, pièces |
| Festival | `46290899` | Festivals culturels |
| Sport | `94552197` | Compétitions, matchs |

### Ce qui est chargé depuis l'API

- **Image** réelle de l'événement (3 formats gérés + fallback automatique)
- **Titre** de l'événement
- **Description** complète (`longDescription` en priorité)
- **Date** et horaires (parsing de `dateRange.fr` en français)
- **Lieu** et adresse
- **Tarif** (gratuit / prix réel / conditions)
- **Catégorie** détectée automatiquement (titre + lieu + description + mots-clés)

---

## 📄 Pages

### `index.html` — Accueil
- Hero section avec CTA
- Statistiques animées (compteurs)
- Grille de 7 cartes événements (1 vedette + 6 dynamiques via API)
- Filtres par catégorie : Concerts, Expositions, Festivals, Théâtre, Gastronomie, Sport
- Barre de recherche avec debounce 280ms
- Section vidéo + modal
- Newsletter

### `evenement-detail.html` — Détail événement
- Chargement dynamique depuis l'URL (`?id=UID`)
- Si pas d'ID : chargement automatique du premier événement disponible
- Hero image plein écran
- Description courte + longue description
- Galerie 3 photos
- Carte du lieu
- Sidebar : tarif, dates, horaires, lieu, conditions
- Boutons : réservation, favoris, partage (Facebook, X, copier lien)
- Section accessibilité (PMR, LSF, sous-titrage, audiodescription)

### `agenda.html` — Agenda
- Vue **calendrier** avec pastilles colorées par catégorie
- Vue **liste** avec cards détaillées
- Navigation par mois (précédent / suivant)
- Parsing de dates françaises (`"Mardi 5 mai, 21h30"`, plages `"11 au 26 juillet"`)
- Panneau latéral au clic sur un jour ou une card
- Filtres + recherche synchronisés avec les deux vues

### `billetterie.html` — Billetterie
- 1 carte vedette statique (Jazz au Vieux-Port)
- 5 cartes dynamiques via API (bev1–bev5)
- Tarifs réels injectés depuis `ev.registration[]` ou `ev.conditions`
- Panier latéral (drawer) avec :
  - Sous-total, frais de service (1,5% + 0,50€), total
  - Code promo (`MARSEILLE10`, `VILLENOVA`, `CULTURE2025`)
  - Paiement simulé + modal de confirmation avec confettis
- Filtres par catégorie + tri (date, prix croissant/décroissant, popularité)
- Badge compteur animé sur l'icône panier

### `carte.html` — Carte interactive
- Carte des lieux événementiels marseillais

### `contact.html` — Contact
- Formulaire de contact

---

## ✅ Fonctionnalités techniques

### Éco-numérique
- Balise `<picture>` sur toutes les images OA — prête pour WebP/AVIF
- `src=""` vide sur les images dynamiques — zéro requête avant réponse API
- `loading="lazy"` sur toutes les images hors hero
- `loading="eager"` + `fetchpriority="high"` sur les images LCP (hero)
- `width` et `height` explicites sur chaque `<img>` — élimine les Layout Shifts
- `Promise.all()` — 4 requêtes API en parallèle au lieu de séquentielles

### Détection de catégorie automatique
La fonction `guessCat()` analyse **titre + mots-clés + type + lieu + description** pour détecter la vraie catégorie de chaque événement et mettre à jour `data-category` dynamiquement — les filtres fonctionnent en temps réel.

### Sécurité
- Toutes les données API passent par `escapeHtml()` avant injection DOM (protection XSS)

### Accessibilité (RGAA 4.1 / WCAG 2.1 AA)
- `aria-label`, `aria-pressed`, `aria-hidden`, `aria-live` sur tous les éléments interactifs
- `alt` dynamique mis à jour avec le vrai titre de l'événement
- Navigation clavier complète (piège de focus sur modals et panneaux)
- Touche `Escape` ferme tous les panneaux et modals
- `role` sémantiques : `list`, `listitem`, `dialog`, `banner`, `contentinfo`

### Compatibilité navigateurs
Développé avec des standards web ouverts (W3C) — compatible nativement avec :
- Google Chrome
- Mozilla Firefox
- Microsoft Edge
- Safari
- Opera

---

## 🔍 Référencement (SEO)

| Fichier | Rôle |
|---|---|
| `sitemap.xml` | Plan du site soumis aux moteurs de recherche |
| `robots.txt` | Instructions d'indexation pour les robots |

### Moteurs couverts
Google · Bing · Yahoo · DuckDuckGo · Yandex · Qwant · Ecosia

### Soumettre le sitemap (après mise en ligne)
- **Google** → [search.google.com/search-console](https://search.google.com/search-console)
- **Bing / Yahoo / Ecosia / Qwant** → [bing.com/webmasters](https://www.bing.com/webmasters)
- **Yandex** → [webmaster.yandex.com](https://webmaster.yandex.com)
- **DuckDuckGo** → automatique via `robots.txt`

---

## 🚀 Lancer le projet en local

### Option 1 — VS Code Live Server (recommandé)
1. Installer l'extension **Live Server** dans VS Code
2. Clic droit sur `html/index.html` → **Open with Live Server**
3. Le site s'ouvre sur `http://127.0.0.1:5500`

### Option 2 — Python
```bash
# Depuis la racine du projet
python -m http.server 8080
# Puis ouvrir : http://localhost:8080/html/index.html
```

---

## 🛠️ Technologies utilisées

| Technologie | Usage |
|---|---|
| HTML5 | Structure sémantique |
| CSS3 / SCSS | Mise en page, animations, variables CSS |
| JavaScript ES6+ | Logique, API, DOM |
| API OpenAgenda v2 | Données événementielles temps réel |
| IntersectionObserver | Animations au scroll, lazy loading |
| Promise.all() | Requêtes API parallèles |

---

## 👥 Projet

**VilleNova** — Projet front-end  
Marseille · 2025  
Conforme RGAA 4.1 · WCAG 2.1 AA
