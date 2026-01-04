# BeninFreelance - Plateforme Freelance (Version Production)

Ce document fournit les instructions complètes pour déployer et configurer la version de production de la plateforme BeninFreelance. Le code a été nettoyé, optimisé et préparé pour un hébergement en ligne.

## Table des matières

1. [Aperçu des modifications](#aperçu-des-modifications)
2. [Prérequis](#prérequis)
3. [Guide de déploiement](#guide-de-déploiement)
4. [Connexion Base de Données et API](#connexion-base-de-données-et-api)
5. [Structure du projet](#structure-du-projet)

---

## Aperçu des modifications

La transition vers la production a impliqué les changements majeurs suivants :

| Modification | Description |
|--------------|-------------|
| **Suppression des démos** | Tout le contenu statique (textes, images, données en dur) a été retiré |
| **États de chargement** | Composants `LoadingState` et `EmptyState` ajoutés pour l'UX |
| **API centralisée** | Tous les appels DB via `client/src/lib/api.ts` |
| **Variables d'environnement** | Configuration sécurisée via `.env` |
| **Schéma SQL optimisé** | Script complet dans `database/schema.sql` |

---

## Prérequis

Avant de commencer, assurez-vous d'avoir :

- Un compte [Supabase](https://supabase.com) (niveau gratuit suffisant)
- [Node.js](https://nodejs.org/) version 18+ et `npm`
- Un compte [Vercel](https://vercel.com) ou [Netlify](https://netlify.com)
- [Git](https://git-scm.com/) installé

---

## Guide de déploiement

### Étape 1 : Configuration de Supabase

**1.1. Créez un nouveau projet Supabase**

- Connectez-vous à Supabase
- Cliquez sur "New Project"
- Choisissez un nom (ex: `beninfreelance`)
- Générez un mot de passe sécurisé
- Choisissez une région proche du Bénin

**1.2. Exécutez le script SQL**

- Allez dans **SQL Editor** dans le menu de gauche
- Cliquez sur **+ New query**
- Ouvrez le fichier `database/schema.sql` de ce projet
- Copiez **tout** le contenu et collez-le dans l'éditeur
- Cliquez sur **RUN**

**1.3. Récupérez vos clés API**

- Allez dans **Project Settings** > **API**
- Notez :
  - **Project URL** : `https://xxxxx.supabase.co`
  - **anon public key** : `eyJhbGciOiJIUzI1NiIsInR5cCI6...`

### Étape 2 : Configuration locale

**2.1. Installez les dépendances**

```bash
cd BeninFreelance-production/client
npm install
```

**2.2. Créez le fichier .env**

À la racine du projet, copiez `.env.example` vers `.env` :

```bash
cp .env.example .env
```

Puis éditez `.env` avec vos valeurs Supabase :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-cle-anon-publique
```

**2.3. Lancez le serveur de développement**

```bash
npm run dev
```

Le site est accessible sur `http://localhost:5173`

### Étape 3 : Déploiement sur Vercel/Netlify

**3.1. Poussez votre code sur GitHub**

**3.2. Importez le projet**

- Connectez-vous à Vercel/Netlify
- Importez depuis votre dépôt Git

**3.3. Configurez les paramètres de build**

| Paramètre | Valeur |
|-----------|--------|
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Root Directory | `client` |

**3.4. Ajoutez les variables d'environnement**

Dans les paramètres du projet, ajoutez :

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

**3.5. Déployez**

---

## Connexion Base de Données et API

### Comment ça fonctionne ?

La connexion entre le frontend React et Supabase se fait en deux couches :

**1. Configuration Supabase** (`client/src/lib/supabase.ts`)

Ce fichier lit les variables d'environnement et crée le client Supabase :

```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**2. Service API centralisé** (`client/src/lib/api.ts`)

Ce fichier expose des fonctions typées pour chaque opération :

```typescript
// Exemple d'utilisation dans une page
import api from '@/lib/api';

// Récupérer les services populaires
const { data, error } = await api.services.getAll({ 
  sortBy: 'popular', 
  limit: 8 
});

// Récupérer un utilisateur
const { data: user } = await api.users.getById(1);

// Récupérer les commandes d'un vendeur
const { data: orders } = await api.orders.getSellerOrders(userId);
```

### Fonctions API disponibles

| Module | Fonctions |
|--------|-----------|
| `api.services` | `getAll()`, `getById()`, `getByUser()`, `create()`, `update()`, `delete()` |
| `api.projects` | `getAll()`, `getById()`, `getByClient()`, `create()` |
| `api.orders` | `getBuyerOrders()`, `getSellerOrders()`, `updateStatus()`, `create()` |
| `api.wallet` | `getByUser()`, `getTransactions()` |
| `api.users` | `getById()`, `getByAuthId()`, `update()`, `getTopFreelancers()` |
| `api.stats` | `getGlobalStats()`, `getUserStats()` |
| `api.escrow` | `getByOrderId()`, `release()`, `refund()` |

### Sécurité (Row Level Security)

Les politiques RLS dans `database/schema.sql` garantissent que :

- Tout le monde peut voir les services actifs
- Seul le propriétaire peut modifier son service
- Un utilisateur ne voit que ses propres commandes
- Un utilisateur ne voit que son propre portefeuille

---

## Structure du projet

```
BeninFreelance-production/
├── .env.example              # Template des variables d'environnement
├── database/
│   └── schema.sql            # Script SQL complet pour Supabase
└── client/
    ├── public/               # Fichiers statiques
    └── src/
        ├── _core/
        │   └── hooks/
        │       └── useAuth.ts    # Hook d'authentification
        ├── components/
        │   ├── EmptyState.tsx    # Composant état vide
        │   ├── LoadingState.tsx  # Composant chargement
        │   └── ...               # Autres composants UI
        ├── lib/
        │   ├── api.ts            # Service API centralisé
        │   └── supabase.ts       # Configuration Supabase
        ├── pages/
        │   ├── Home.tsx          # Page d'accueil
        │   ├── Services.tsx      # Liste des services
        │   ├── Dashboard.tsx     # Tableau de bord
        │   └── ...               # Autres pages
        ├── App.tsx               # Routeur principal
        └── const.ts              # Constantes (catégories, etc.)
```

---

## Support

Pour toute question, contactez : support@beninfreelance.com

---

**Fait avec ❤️ au Bénin** 🇧🇯
