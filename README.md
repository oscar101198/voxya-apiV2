# Voxya API - Gestion de Carnet de Contacts

## 📋 Description

Voxya API est une application backend moderne construite avec NestJS pour gérer et organiser un carnet de contacts. L'application suit les principes de l'architecture hexagonale (Clean Architecture) et utilise TypeORM avec PostgreSQL pour la persistance des données.

## 🏗️ Architecture

### Architecture Globale

Le projet suit une **architecture modulaire par entité** (Feature-based Architecture) avec une séparation claire des responsabilités. Chaque entité métier dispose de sa propre structure complète :

```
src/
├── contact/                    # Module métier "Contact"
│   ├── application/           # Couche application (use cases, services, DTOs, entités)
│   ├── infrastructure/        # Couche infrastructure (TypeORM, adaptateurs)
│   └── interfaces/            # Couche interface (controllers, modules)
├── infrastructure/            # Infrastructure globale partagée
│   ├── database/             # Configuration base de données
│   └── config/               # Configuration globale
└── app.module.ts             # Module racine de l'application
```

### Structure Modulaire par Entité

Chaque entité métier (comme `contact`) suit la même structure interne avec 3 couches distinctes :

#### 1. **Couche Application** (`src/contact/application/`)

- **Use Cases** : Cas d'usage métier (CRUD, recherche, etc.)
- **Services** : Orchestration des use cases
- **DTOs** : Objets de transfert de données
- **Validation** : Règles de validation des données
- **Entités** : Modèles de données métier (`Contact`, `ContactEmail`, `ContactPhone`)

#### 2. **Couche Infrastructure** (`src/contact/infrastructure/`)

- **TypeORM** : Implémentation concrète des repositories
- **Entités ORM** : Mapping base de données
- **Migrations** : Gestion des schémas de base de données
- **Configuration** : Paramètres de connexion

#### 3. **Couche Interface** (`src/contact/interfaces/`)

- **Controllers** : Points d'entrée HTTP REST
- **Modules** : Organisation des dépendances
- **Validation** : Validation des requêtes HTTP

### Avantages de cette Architecture

- **Simplicité** : Architecture allégée sans couche domaine redondante
- **Modularité** : Chaque entité est autonome et peut évoluer indépendamment
- **Scalabilité** : Facilite l'ajout de nouvelles entités métier
- **Maintenabilité** : Code organisé et facile à comprendre
- **Réutilisabilité** : Structure cohérente entre les modules
- **Séparation des responsabilités** : Chaque couche a un rôle bien défini

## 🛠️ Technologies Utilisées

### Backend

- **NestJS** (v11.1.3) - Framework Node.js pour applications serveur
- **TypeScript** (v5.8.3) - Langage de programmation typé
- **TypeORM** (v0.3.25) - ORM pour TypeScript et JavaScript
- **PostgreSQL** - Base de données relationnelle

### Validation et Transformation

- **class-validator** (v0.14.2) - Validation des objets
- **class-transformer** (v0.5.1) - Transformation des objets

### Développement

- **NestJS CLI** - Outils de développement
- **ts-node** - Exécution TypeScript en développement
- **nodemon** - Redémarrage automatique en développement

## 📊 Modèle de Données

### Entité Contact

```typescript
class Contact {
  id: string;
  displayName: string;
  namePrefix?: string;
  givenName?: string;
  middleName?: string;
  familyName?: string;
  nameSuffix?: string;
  company?: string;
  department?: string;
  jobDescription?: string;
  phones: ContactPhone[];
  emails: ContactEmail[];
  photoUri?: Buffer;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Relations

- **Contact** ↔ **ContactPhone** : One-to-Many
- **Contact** ↔ **ContactEmail** : One-to-Many

## 🚀 Fonctionnalités

### Gestion des Contacts

- ✅ Création de contacts
- ✅ Lecture de contacts (unique et liste)
- ✅ Mise à jour de contacts
- ✅ Suppression de contacts
- ✅ Gestion des favoris

### Gestion des Informations

- ✅ Informations personnelles (nom, prénom, etc.)
- ✅ Informations professionnelles (entreprise, poste)
- ✅ Numéros de téléphone multiples
- ✅ Adresses email multiples
- ✅ Photos de profil

## 🔧 Configuration

### Variables d'Environnement

```bash
# Base de données
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=voxya

# Application
NODE_ENV=development
```

### Base de Données

- **Type** : PostgreSQL
- **Synchronisation** : Désactivée (migrations uniquement)
- **Logging** : Activé en développement
- **Migrations** : Gérées via TypeORM CLI

## 📦 Installation et Démarrage

### Prérequis

- Node.js (v18+)
- PostgreSQL
- Yarn

### Installation

```bash
# Cloner le projet
git clone <repository-url>
cd voxya-api

# Installer les dépendances
yarn install

# Copier la configuration d'environnement
cp env.example .env

# Configurer les variables d'environnement
# Éditer le fichier .env

# Démarrer la base de données
docker-compose up -d

# Exécuter les migrations
yarn migration:run

# Démarrer l'application
yarn start:dev
```

### Scripts Disponibles

```bash
# Développement
yarn start:dev          # Démarrage avec hot reload
yarn build              # Compilation TypeScript
yarn start              # Démarrage production

# Base de données
yarn migration:generate # Générer une migration
yarn migration:run      # Exécuter les migrations
yarn migration:revert   # Annuler la dernière migration
yarn schema:sync        # Synchroniser le schéma
yarn schema:drop        # Supprimer le schéma
```

## 🐳 Docker

### Développement

```bash
# Démarrer l'environnement de développement
docker-compose up -d

# Démarrer l'API en mode développement
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### Production

```bash
# Démarrer l'environnement de production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 📁 Structure des Fichiers

```
voxya-api/
├── src/
│   ├── contact/                    # Module métier "Contact"
│   │   ├── application/           # Couche application
│   │   │   ├── entities/          # Entités métier (Contact, ContactEmail, ContactPhone)
│   │   │   ├── use-cases/         # Cas d'usage métier (CRUD, recherche)
│   │   │   ├── services/          # Services applicatifs
│   │   │   └── dto/               # Objets de transfert de données
│   │   ├── infrastructure/        # Couche infrastructure
│   │   │   └── typeorm/           # Implémentation TypeORM (repositories, entités ORM)
│   │   └── interfaces/            # Couche interface
│   │       └── controllers/       # Controllers HTTP REST
│   ├── infrastructure/            # Infrastructure globale partagée
│   │   ├── database/              # Configuration base de données
│   │   └── config/                # Configuration globale
│   ├── app.module.ts              # Module racine de l'application
│   ├── app.controller.ts          # Controller racine
│   └── main.ts                    # Point d'entrée de l'application
├── migration/                      # Migrations de base de données
├── dist/                          # Code compilé TypeScript
├── docker-compose.yml             # Configuration Docker
├── Dockerfile                     # Image Docker
├── typeorm.config.ts              # Configuration TypeORM
└── package.json                   # Dépendances et scripts
```

### Organisation Modulaire

Cette structure permet d'ajouter facilement de nouvelles entités métier en suivant le même pattern :

```
src/
├── contact/          # Module Contact (existant)
├── user/             # Module User (futur)
├── company/          # Module Company (futur)
├── infrastructure/   # Infrastructure partagée
└── app.module.ts     # Module racine
```

## 🔍 API Endpoints

### Contacts

- `GET /contacts` - Récupérer tous les contacts
- `GET /contacts/:id` - Récupérer un contact par ID
- `POST /contacts` - Créer un nouveau contact
- `PUT /contacts/:id` - Mettre à jour un contact
- `DELETE /contacts/:id` - Supprimer un contact

## 🧪 Tests

```bash
# Exécuter les tests
yarn test

# Tests en mode watch
yarn test:watch

# Couverture de code
yarn test:cov
```

## 📚 Documentation Supplémentaire

- [README-Docker.md](./README-Docker.md) - Documentation Docker détaillée
- [README-TypeORM.md](./README-TypeORM.md) - Configuration et utilisation de TypeORM
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Guide de déploiement manuel en production

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 👥 Auteurs

- Équipe Voxya

---

_Ce README documente l'architecture et l'organisation du projet Voxya API. Pour toute question ou suggestion d'amélioration, n'hésitez pas à ouvrir une issue._
