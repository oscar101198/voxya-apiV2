# 🐳 Voxya API - Docker Setup

Ce guide explique comment utiliser Docker pour développer et déployer l'application Voxya API.

## 📋 Prérequis

- Docker Desktop installé
- Docker Compose installé
- Au moins 4GB de RAM disponible

## 🚀 Démarrage rapide

### 1. Cloner et configurer

```bash
# Copier le fichier d'environnement
cp env.example .env

# Rendre le script exécutable (si pas déjà fait)
chmod +x docker-scripts.sh
```

### 2. Lancer l'environnement complet

```bash
# Construire et démarrer tous les services (développement)
./docker-scripts.sh build
./docker-scripts.sh up
```

### 3. Vérifier que tout fonctionne

```bash
# Vérifier les logs
./docker-scripts.sh logs

# Tester l'API
curl http://localhost:3003/health
```

## 🛠️ Commandes utiles

### Scripts automatiques

```bash
# === DÉVELOPPEMENT ===
# Construire les images de développement
./docker-scripts.sh build

# Démarrer tous les services (avec hot-reload)
./docker-scripts.sh up

# Arrêter tous les services
./docker-scripts.sh down

# Redémarrer les services
./docker-scripts.sh restart

# Voir les logs
./docker-scripts.sh logs

# Voir les logs de l'API seulement
./docker-scripts.sh logs-api

# Voir les logs de la base de données
./docker-scripts.sh logs-db

# Ouvrir un shell dans le conteneur API
./docker-scripts.sh shell

# Ouvrir un shell PostgreSQL
./docker-scripts.sh db-shell

# Nettoyer tout (conteneurs + volumes)
./docker-scripts.sh clean

# Mode développement (base de données + Redis seulement)
./docker-scripts.sh dev

# === PRODUCTION ===
# Construire les images de production
./docker-scripts.sh build-prod

# Démarrer les services de production
./docker-scripts.sh up-prod

# Arrêter les services de production
./docker-scripts.sh down-prod

# Voir les logs de production
./docker-scripts.sh logs-prod

# Nettoyer la production
./docker-scripts.sh clean-prod
```

### Commandes Docker Compose directes

```bash
# === DÉVELOPPEMENT ===
# Démarrer en mode développement (avec logs)
docker-compose up

# Démarrer en arrière-plan
docker-compose up -d

# Reconstruire et redémarrer
docker-compose up --build

# Arrêter et supprimer les conteneurs
docker-compose down

# === PRODUCTION ===
# Démarrer en mode production
docker-compose -f docker-compose.prod.yml up -d

# Arrêter la production
docker-compose -f docker-compose.prod.yml down
```

## 🏗️ Architecture des services

### Services inclus

1. **PostgreSQL** (port 5432)

   - Base de données principale
   - Données persistantes via volume
   - Health check intégré

2. **Redis** (port 6380)

   - Cache et sessions
   - Optionnel pour le développement

3. **NestJS API** (port 3003)
   - Application principale
   - **Développement** : Hot-reload avec volumes
   - **Production** : Build optimisé multi-stage
   - Health check intégré

### Variables d'environnement

Les variables d'environnement sont configurées dans le `docker-compose.yml` :

```yaml
environment:
  NODE_ENV: development
  DB_HOST: postgres
  DB_PORT: 5432
  DB_USERNAME: postgres
  DB_PASSWORD: password
  DB_NAME: voxya
  PORT: 3003
```

## 🔧 Développement

### Mode développement avec hot-reload

Votre configuration Docker est maintenant optimisée pour le développement :

```bash
# Démarrer l'environnement complet avec hot-reload
./docker-scripts.sh up

# Modifier votre code - les changements sont automatiquement détectés !
```

**Avantages de cette configuration :**

- ✅ **Hot-reload automatique** : Vos modifications de code sont immédiatement reflétées
- ✅ **Volumes montés** : Le code source est monté dans le conteneur
- ✅ **node_modules préservés** : Les dépendances du conteneur ne sont pas écrasées
- ✅ **Pas de rebuild nécessaire** : L'image ne change pas, seul le code est mis à jour

### Mode développement local

Pour développer avec votre IDE local :

```bash
# Démarrer seulement la base de données et Redis
./docker-scripts.sh dev

# Lancer l'application en mode développement
yarn start:dev
```

### Accès à la base de données

```bash
# Via Docker
./docker-scripts.sh db-shell

# Via votre client SQL préféré
Host: localhost
Port: 5432
Database: voxya
Username: postgres
Password: password
```

### Logs et debugging

```bash
# Voir tous les logs
./docker-scripts.sh logs

# Voir les logs de l'API en temps réel
./docker-scripts.sh logs-api

# Voir les logs de la base de données
./docker-scripts.sh logs-db
```

## 🚀 Production

### Build pour la production

```bash
# Construire l'image de production
./docker-scripts.sh build-prod

# Démarrer les services de production
./docker-scripts.sh up-prod
```

### Variables d'environnement de production

Créer un fichier `.env.prod` :

```env
NODE_ENV=production
DB_PASSWORD=your-secure-password
JWT_SECRET=your-secure-jwt-secret
```

## 🔄 Différences entre Dev et Prod

| Aspect           | Développement           | Production            |
| ---------------- | ----------------------- | --------------------- |
| **Dockerfile**   | `Dockerfile.dev`        | `Dockerfile`          |
| **Build**        | Simple, avec hot-reload | Multi-stage optimisé  |
| **Volumes**      | Code source monté       | Aucun volume          |
| **Hot-reload**   | ✅ Activé               | ❌ Désactivé          |
| **Performance**  | Optimisé pour le dev    | Optimisé pour la prod |
| **Taille image** | Plus grande             | Plus petite           |

## 🐛 Dépannage

### Problèmes courants

1. **Ports déjà utilisés**

   ```bash
   # Vérifier les ports utilisés
   lsof -i :3003
   lsof -i :5432

   # Arrêter les services qui utilisent ces ports
   ```

2. **Problèmes de permissions**

   ```bash
   # Nettoyer les volumes
   ./docker-scripts.sh clean
   ```

3. **Base de données ne démarre pas**

   ```bash
   # Vérifier les logs
   ./docker-scripts.sh logs-db

   # Redémarrer le service
   docker-compose restart postgres
   ```

4. **API ne peut pas se connecter à la base de données**

   ```bash
   # Vérifier que PostgreSQL est prêt
   docker-compose exec postgres pg_isready -U postgres

   # Vérifier les variables d'environnement
   docker-compose exec api env | grep DB
   ```

5. **Hot-reload ne fonctionne pas**

   ```bash
   # Vérifier que les volumes sont bien montés
   docker-compose exec api ls -la /app

   # Redémarrer le service API
   docker-compose restart api
   ```

### Nettoyage complet

```bash
# Arrêter et supprimer tout (développement)
./docker-scripts.sh clean

# Arrêter et supprimer tout (production)
./docker-scripts.sh clean-prod

# Supprimer les images aussi
docker rmi $(docker images -q voxya-api)
```

## 📊 Monitoring

### Health checks

- **API** : `http://localhost:3003/health`
- **PostgreSQL** : Automatique via docker-compose
- **Redis** : Automatique via docker-compose

### Métriques

```bash
# Voir l'utilisation des ressources
docker stats

# Voir les conteneurs en cours
docker ps
```

## 🔒 Sécurité

### Bonnes pratiques

1. **Ne jamais commiter les fichiers `.env`**
2. **Utiliser des mots de passe forts en production**
3. **Limiter l'accès aux ports exposés**
4. **Mettre à jour régulièrement les images Docker**

### Variables sensibles

En production, utilisez des secrets Docker ou des variables d'environnement sécurisées :

```bash
# Avec Docker secrets
echo "your-secure-password" | docker secret create db_password -

# Avec des variables d'environnement
export DB_PASSWORD="your-secure-password"
docker-compose -f docker-compose.prod.yml up
```
