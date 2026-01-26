# Database Seeding Scripts

Ce dossier contient les scripts de gestion de la base de données pour le développement et les tests.

## 📁 Structure

```
src/database/seeds/
├── index.ts      # Script principal (reset + seed)
├── reset.ts      # Script de reset de la BDD
└── seed.ts       # Script de seed avec données de test
```

## 🚀 Commandes Disponibles

### Reset et Seed Complet

```bash
yarn db:reset-seed
```

**Description :** Supprime complètement la base de données et la reconstruit avec des données de test.

### Reset de la Base de Données

```bash
yarn db:reset
```

**Description :** Supprime toutes les tables et recrée le schéma à partir des migrations.

### Seed des Données de Test

```bash
yarn db:seed
```

**Description :** Ajoute uniquement les données de test à une base de données existante.

## 📊 Données de Test Créées

### 👥 Utilisateurs (6 utilisateurs)

- **admin** / admin123 - Administrateur avec tous les privilèges
- **marie.martin** / password123 - Designer & Manager
- **pierre.durand** / password123 - Project Manager
- **sophie.bernard** / password123 - Marketing Manager
- **thomas.moreau** / password123 - Support Specialist
- **alice.petit** / password123 - Developer

### 🎭 Rôles (5 rôles)

- **admin** - Administrateur avec tous les privilèges
- **manager** - Gestionnaire avec droits de gestion des équipes
- **developer** - Développeur avec accès aux projets de développement
- **designer** - Designer avec accès aux projets créatifs
- **viewer** - Utilisateur en lecture seule

### 👥 Rosters (5 rosters)

- **Équipe de Développement** - Roster principal de l'équipe de développement
- **Équipe Design** - Roster de l'équipe design et UX/UI
- **Management** - Roster des managers et dirigeants
- **Support Client** - Roster de l'équipe support client
- **Marketing** - Roster de l'équipe marketing

### 📞 Contacts (6 contacts)

Chaque contact inclut :

- Informations personnelles complètes (nom, prénom, entreprise, poste)
- Numéros de téléphone (mobile, bureau)
- Adresses email (professionnel, personnel)
- Marqueurs de favoris

## 🔧 Configuration

Les scripts utilisent les variables d'environnement suivantes :

- `DB_HOST` (défaut: localhost)
- `DB_PORT` (défaut: 5432)
- `DB_USERNAME` (défaut: postgres)
- `DB_PASSWORD` (défaut: password)
- `DB_NAME` (défaut: voxya)

## ⚠️ Avertissements

- **Développement uniquement** : Ces scripts sont conçus pour le développement et les tests
- **Données supprimées** : Le reset supprime TOUTES les données de la base
- **Sauvegarde recommandée** : Sauvegardez vos données importantes avant d'utiliser le reset

## 🛠️ Développement

### Ajouter de Nouvelles Données de Test

1. Modifiez le fichier `seed.ts`
2. Ajoutez vos données dans les fonctions appropriées :
   - `createRoles()` pour les rôles
   - `createRosters()` pour les rosters
   - `createContacts()` pour les contacts
   - `createUsers()` pour les utilisateurs

### Personnaliser les Scripts

- **Reset** : Modifiez `reset.ts` pour changer le comportement de suppression
- **Seed** : Modifiez `seed.ts` pour ajouter/modifier les données de test
- **Principal** : Modifiez `index.ts` pour changer l'ordre d'exécution

## 🔍 Dépannage

### Erreur de Connexion

Vérifiez que :

- PostgreSQL est démarré
- Les variables d'environnement sont correctes
- La base de données existe

### Erreur de Permissions

Assurez-vous que l'utilisateur PostgreSQL a les droits de :

- Créer/supprimer des tables
- Insérer des données
- Exécuter des migrations

### Erreur de Dépendances

Installez les dépendances manquantes :

```bash
yarn add tsconfig-paths
```
