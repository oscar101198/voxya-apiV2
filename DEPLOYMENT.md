# Guide de Déploiement Manuel en Production

Ce guide décrit les étapes pour déployer manuellement l'API Voxya en production.

## 📋 Prérequis

### Sur le serveur de production

- **Docker** (version 20.10+)
- **Docker Compose** (version 2.0+)
- **Git** (pour cloner le repository)
- **Accès SSH** au serveur
- **Ports disponibles** :
  - `3003` : API NestJS
  - `5432` : PostgreSQL (ou un port personnalisé)
  - `6380` : Redis (optionnel)

### Variables d'environnement requises

Assurez-vous d'avoir les valeurs suivantes :

- Mot de passe PostgreSQL sécurisé
- Clé privée JWT
- Configuration Firebase (fichier `voxya_firebase.json`)
- Toutes les autres variables d'environnement nécessaires

## 🚀 Déploiement Rapide avec Script

Pour un déploiement automatisé, vous pouvez utiliser le script fourni :

```bash
# Rendre le script exécutable (première fois seulement)
chmod +x deploy.sh

# Déploiement initial
./deploy.sh

# Mise à jour de l'application
./deploy.sh update
```

Le script effectue automatiquement :

- Build de l'image Docker
- Démarrage des services
- Attente que PostgreSQL soit prêt
- Exécution des migrations
- Vérification de la santé de l'API

## 🚀 Étapes de Déploiement Manuel

Si vous préférez effectuer le déploiement manuellement, suivez ces étapes :

### 1. Préparation du serveur

```bash
# Se connecter au serveur
ssh user@your-server-ip

# Créer un répertoire pour l'application
mkdir -p /opt/voxya-api
cd /opt/voxya-api
```

### 2. Cloner le repository

```bash
# Cloner le projet (ou utiliser votre méthode préférée)
git clone <repository-url> .

# Ou si vous avez déjà le code, le transférer via SCP/RSYNC
# scp -r /local/path user@server:/opt/voxya-api
```

### 3. Configuration des variables d'environnement

```bash
# Créer le fichier .env pour la production
cp env.example .env

# Éditer le fichier .env avec vos valeurs de production
nano .env
```

**Variables importantes à configurer :**

```bash
# Base de données
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=<MOT_DE_PASSE_SECURISE>
DB_NAME=voxya

# Application
NODE_ENV=production
PORT=3003

# JWT
JWT_PRIVATE_KEY=<CLE_PRIVEE_JWT_SECURISEE>
JWT_ACCESS_TOKEN_EXPIRATION_TIME_IN_MILLISECONDS=604800000
ALGORITHM=HS256

# Redis (optionnel)
REDIS_HOST=redis
REDIS_PORT=6380

# Firebase
FIREBASE_SERVICE_ACCOUNT_PATH=voxya_firebase.json
```

**Important :** Assurez-vous que le fichier `voxya_firebase.json` est présent dans le répertoire du projet.

### 4. Configuration du docker-compose.prod.yml

Vérifiez que le fichier `docker-compose.prod.yml` utilise la variable `DB_PASSWORD` depuis votre `.env` :

```bash
# Le fichier devrait déjà être configuré, mais vérifiez :
cat docker-compose.prod.yml | grep DB_PASSWORD
```

### 5. Build et démarrage des services

```bash
# Build de l'image Docker de production
docker compose -f docker-compose.prod.yml build

# Démarrer les services en arrière-plan
docker compose -f docker-compose.prod.yml up -d

# Vérifier que les conteneurs sont démarrés
docker compose -f docker-compose.prod.yml ps
```

### 6. Exécution des migrations de base de données

```bash
# Attendre que PostgreSQL soit prêt (quelques secondes)
sleep 10

# Exécuter les migrations
sudo docker compose -f docker-compose.prod.yml exec api yarn migration:run:prod

# Vérifier que les migrations ont été appliquées
sudo docker compose -f docker-compose.prod.yml exec api yarn typeorm migration:show
```

### 7. Vérification du déploiement

```bash
# Vérifier les logs de l'API
docker-compose -f docker-compose.prod.yml logs api

# Vérifier les logs de PostgreSQL
docker-compose -f docker-compose.prod.yml logs postgres

# Tester l'endpoint de santé
curl http://localhost:3003/_health

# Ou depuis l'extérieur du serveur (si le port est exposé)
curl http://your-server-ip:3003/_health
```

### 8. Configuration du reverse proxy (optionnel mais recommandé)

Si vous utilisez Nginx comme reverse proxy :

```nginx
server {
    listen 80;
    server_name api.voxya.com;

    location / {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔄 Mise à jour de l'Application

Pour mettre à jour l'application après des modifications :

```bash
# Se connecter au serveur
ssh user@your-server-ip
cd /opt/voxya-api

# Récupérer les dernières modifications
git pull origin master

# Rebuild l'image Docker
sudo docker compose -f docker-compose.prod.yml build api

# Redémarrer les services
sudo docker compose -f docker-compose.prod.yml up -d

# Exécuter les nouvelles migrations (si nécessaire)
sudo docker compose -f docker-compose.prod.yml exec api yarn migration:run

# Vérifier les logs
sudo docker compose -f docker-compose.prod.yml logs -f api
```

## 🛠️ Commandes Utiles

### Gestion des conteneurs

```bash
# Voir l'état des conteneurs
docker-compose -f docker-compose.prod.yml ps

# Voir les logs en temps réel
docker-compose -f docker-compose.prod.yml logs -f api

# Arrêter les services
docker-compose -f docker-compose.prod.yml stop

# Redémarrer les services
docker-compose -f docker-compose.prod.yml restart

# Arrêter et supprimer les conteneurs (sans supprimer les volumes)
docker-compose -f docker-compose.prod.yml down

# Arrêter et supprimer tout (y compris les volumes - ATTENTION !)
docker-compose -f docker-compose.prod.yml down -v
```

### Base de données

```bash
# Se connecter à PostgreSQL
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d voxya

# Sauvegarder la base de données
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres voxya > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurer une sauvegarde
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres voxya < backup.sql
```

### Migrations

```bash
# Voir les migrations appliquées
docker-compose -f docker-compose.prod.yml exec api yarn typeorm migration:show

# Exécuter les migrations
docker-compose -f docker-compose.prod.yml exec api yarn migration:run

# Revenir en arrière d'une migration
docker-compose -f docker-compose.prod.yml exec api yarn migration:revert
```

### Debugging

```bash
# Accéder au shell du conteneur API
docker-compose -f docker-compose.prod.yml exec api sh

# Voir les variables d'environnement du conteneur
docker-compose -f docker-compose.prod.yml exec api env

# Vérifier la santé du conteneur
docker inspect voxya-api-prod | grep -A 10 Health
```

## 🔒 Sécurité

### Recommandations importantes

1. **Mots de passe forts** : Utilisez des mots de passe complexes pour PostgreSQL
2. **Clés JWT sécurisées** : Générez une clé JWT forte et unique pour la production
3. **Firewall** : Configurez un firewall pour limiter l'accès aux ports
4. **HTTPS** : Utilisez un reverse proxy avec SSL/TLS (Let's Encrypt)
5. **Backups** : Configurez des sauvegardes régulières de la base de données
6. **Variables d'environnement** : Ne commitez jamais le fichier `.env`
7. **Fichier Firebase** : Protégez le fichier `voxya_firebase.json`

### Script de sauvegarde automatique

Un script de sauvegarde est fourni avec le projet. Utilisez-le ainsi :

```bash
# Rendre le script exécutable (première fois seulement)
chmod +x backup.sh

# Exécuter une sauvegarde manuelle
./backup.sh
```

Le script crée automatiquement une sauvegarde dans le répertoire `./backups/`, la compresse, et nettoie les anciennes sauvegardes (conserve les 7 dernières par défaut).

Pour des sauvegardes automatiques, ajoutez-le au crontab :

```bash
# Sauvegarder tous les jours à 2h du matin
0 2 * * * /opt/voxya-api/backup.sh
```

## 📊 Monitoring

### Vérification de la santé

```bash
# Vérifier l'endpoint de santé
curl http://localhost:3003/_health

# Vérifier les métriques Docker
docker stats voxya-api-prod
```

### Logs

```bash
# Suivre les logs en temps réel
docker-compose -f docker-compose.prod.yml logs -f api

# Voir les 100 dernières lignes
docker-compose -f docker-compose.prod.yml logs --tail=100 api
```

## 🐛 Dépannage

### L'API ne démarre pas

```bash
# Vérifier les logs
docker-compose -f docker-compose.prod.yml logs api

# Vérifier que PostgreSQL est accessible
docker-compose -f docker-compose.prod.yml exec api ping postgres

# Vérifier les variables d'environnement
docker-compose -f docker-compose.prod.yml exec api env | grep DB_
```

### Problèmes de connexion à la base de données

```bash
# Vérifier que PostgreSQL est démarré
docker-compose -f docker-compose.prod.yml ps postgres

# Tester la connexion depuis le conteneur API
docker-compose -f docker-compose.prod.yml exec api sh
# Puis dans le shell : ping postgres
```

### Les migrations échouent

```bash
# Vérifier l'état des migrations
docker-compose -f docker-compose.prod.yml exec api yarn typeorm migration:show

# Vérifier les logs de migration
docker-compose -f docker-compose.prod.yml logs api | grep migration
```

## 📝 Checklist de Déploiement

Avant de mettre en production, vérifiez :

- [ ] Toutes les variables d'environnement sont configurées
- [ ] Le fichier `voxya_firebase.json` est présent
- [ ] Les mots de passe sont sécurisés
- [ ] Le firewall est configuré
- [ ] Les ports sont correctement exposés
- [ ] Les migrations sont à jour
- [ ] Les sauvegardes sont configurées
- [ ] Le monitoring est en place
- [ ] Les logs sont accessibles
- [ ] L'endpoint de santé répond correctement

## 🔗 Ressources

- [Documentation Docker](https://docs.docker.com/)
- [Documentation Docker Compose](https://docs.docker.com/compose/)
- [Documentation NestJS](https://docs.nestjs.com/)
- [Documentation TypeORM](https://typeorm.io/)

---

**Note :** Ce guide décrit un déploiement manuel. Pour un déploiement automatisé, considérez l'utilisation de CI/CD (GitHub Actions, GitLab CI, etc.).
