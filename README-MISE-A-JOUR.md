# BeninFreelance - Mise à jour V3

## Résumé des modifications

Cette mise à jour intègre deux nouvelles fonctionnalités basées sur le design de Codeur.com :

### 1. Page de Profil Freelance (`/freelance/profile`)

Une page complète pour éditer le profil freelance avec :

- **Sélection du type de compte** : Freelance ou Agence (boutons toggle style Codeur)
- **Gestion des compétences** : 
  - Tags cliquables avec suppression (×)
  - Suggestions de compétences populaires
  - Limite de 10 compétences maximum
- **Spécialité** : Dropdown avec liste prédéfinie
- **Tarif horaire** : Champ numérique avec suffixe "€ / heure"
- **Photo de profil** : Avatar cliquable avec upload
- **Bannière** : Image de couverture personnalisable (style code par défaut)
- **Bio** : Textarea avec compteur de caractères (200 max)
- **Présentation** : Zone de texte longue avec avertissement
- **Toggle** : Afficher/masquer le nom complet sur le profil

### 2. Page Tous les Projets (`/projects/all`)

Une page de listing des projets avec filtres avancés :

- **Header bleu** : Titre "Tous les projets"
- **Sidebar catégories** : 
  - Dans mes compétences (filtrage intelligent)
  - Toutes les catégories
  - Développement, E-commerce, Web, IA, Graphisme, etc.
- **Filtres avancés** (panneau latéral) :
  - Par état : Ouverts, En travail, Terminés, Fermés
  - Par lecture : Lus/Non-lus
  - Filtres personnels : Postulés, Suivis, Remportés, Créés
  - Par budget : Devis, <500€, 500-1000€, 1000-10000€, >10000€
  - Ordre de tri : Plus récents / Plus anciens
- **Barre de recherche** avec boutons RSS et filtres
- **Cartes projets** : 
  - Titre cliquable (bleu)
  - Badge statut (vert pour ouvert)
  - Infos : budget, offres, vues, interactions
  - Description tronquée
  - Compétences requises
  - Date et client avec drapeau pays
  - Bouton bookmark (sauvegarder)

---

## Fichiers modifiés/ajoutés

### Nouveaux fichiers

| Fichier | Description |
|---------|-------------|
| `client/src/pages/FreelanceProfile.tsx` | Page d'édition du profil freelance |
| `client/src/pages/AllProjects.tsx` | Page de listing des projets avec filtres |
| `database/schema_update.sql` | Mise à jour du schéma SQL |

### Fichiers modifiés

| Fichier | Modifications |
|---------|---------------|
| `client/src/App.tsx` | Ajout des routes `/projects/all`, `/profile/edit`, `/freelance/profile` |
| `client/src/components/Navbar.tsx` | Menu dropdown Projets, lien vers profil freelance |

---

## Base de données - Mise à jour

### Exécuter le fichier `database/schema_update.sql` dans Supabase

Ce fichier contient :

```sql
-- Nouvelles colonnes pour la table users
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_account_type VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS specialty VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS presentation TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS show_full_name BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS cover_banner TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_views INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS availability_status VARCHAR(20);

-- Nouvelles tables
CREATE TABLE IF NOT EXISTS freelance_skills (...);
CREATE TABLE IF NOT EXISTS specialties (...);
CREATE TABLE IF NOT EXISTS project_views (...);
CREATE TABLE IF NOT EXISTS project_bookmarks (...);
CREATE TABLE IF NOT EXISTS project_skills (...);
CREATE TABLE IF NOT EXISTS user_alerts (...);

-- Nouvelles colonnes pour la table projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS offers_count INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS interactions_count INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS freelancer_id INTEGER;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS budget_type VARCHAR(20);
```

### Instructions

1. Connectez-vous à votre dashboard Supabase
2. Allez dans **SQL Editor**
3. Copiez-collez le contenu de `database/schema_update.sql`
4. Exécutez le script

**Note** : Toutes les commandes utilisent `IF NOT EXISTS` pour éviter les erreurs si les tables/colonnes existent déjà.

---

## Nouvelles routes

| Route | Page | Description |
|-------|------|-------------|
| `/projects/all` | AllProjects | Liste tous les projets avec filtres avancés |
| `/freelance/profile` | FreelanceProfile | Édition du profil freelance |
| `/profile/edit` | FreelanceProfile | Alias pour l'édition du profil |

---

## Couleurs utilisées

Les nouvelles pages respectent la palette de couleurs existante :

| Couleur | Code | Utilisation |
|---------|------|-------------|
| Terracotta | `#C75B39` | Boutons primaires, accents |
| Bleu | `#3B82F6` | Boutons d'action, liens, header projets |
| Olive | `#5C6B4A` | Succès, badges vérifiés |
| Cream | `#FAF7F2` | Fond de page |
| Warm White | `#FFFDFB` | Fond des cartes |
| Sand | `#E8E2D9` | Bordures, séparateurs |
| Ink | `#1A1714` | Texte principal |
| Charcoal | `#3D3833` | Texte secondaire |
| Stone | `#6B6560` | Texte tertiaire |

---

## Déploiement

### Vercel

1. Push le code sur GitHub
2. Connectez le repo à Vercel
3. Configurez les variables d'environnement :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### Local

```bash
npm install
npm run dev
```

---

## Captures d'écran de référence

Les images de référence sont dans `client/public/` :
- `Screenshot_20260104_001506_Chrome.png` - Page profil Codeur
- `Screenshot_20260104_001025_Chrome.png` - Page projets Codeur
- `Screenshot_20260103_224248_SamsungInternet.png` - Icône de référence

---

## Support

Pour toute question, contactez l'équipe de développement.
