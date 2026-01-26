# Plan d'implémentation - Module Memos

## Vue d'ensemble

Création d'un module `memos` permettant de gérer des fichiers audio liés aux utilisateurs avec stockage MinIO.

**Relations:**
- User 1:N Memo (un utilisateur peut avoir plusieurs memos)
- Un memo est lié à un tenant (via user.tenantId)

**Fonctionnalités:**
- POST /memo : Création d'un memo avec upload de fichier audio
- DELETE /memo : Suppression d'un memo (soft delete + suppression fichier MinIO)

---

## 1. Création Base de Données

### 1.1 Entité TypeORM

**Fichier:** `src/memo/infrastructure/typeorm/entities/memo.orm.entity.ts`

**Champs:**
- `id` (UUID, Primary Key)
- `userId` (UUID, Foreign Key vers users.id)
- `audioUrl` (VARCHAR, URL du fichier dans MinIO)
- `audioKey` (VARCHAR, clé MinIO pour suppression)
- `fileName` (VARCHAR, nom original du fichier)
- `fileSize` (INTEGER, taille en bytes)
- `mimeType` (VARCHAR, type MIME du fichier)
- `duration` (INTEGER, optionnel, durée en secondes)
- `createdAt` (TIMESTAMP)
- `updatedAt` (TIMESTAMP)
- `deletedAt` (TIMESTAMP, soft delete)

**Index:**
- Index sur `userId` pour les requêtes de récupération par user
- Index sur `deletedAt` pour les requêtes filtrées

### 1.2 Migration TypeORM

**Génération automatique de la migration:**

TypeORM génère automatiquement la migration à partir de l'entité. Une fois l'entité `memo.orm.entity.ts` créée :

1. **Générer la migration:**
   ```bash
   yarn migration:generate src/infrastructure/database/migrations/CreateMemosTable
   ```

2. **Vérifier la migration générée:**
   - TypeORM créera automatiquement le fichier avec timestamp
   - Vérifier que les index et contraintes sont corrects

3. **Exécuter la migration:**
   ```bash
   yarn migration:run
   ```

**Ce que TypeORM générera automatiquement:**
- Création de la table `memos` avec tous les champs
- Création des index définis dans l'entité (`@Index`)
- Création de la contrainte de clé étrangère (`@ManyToOne` ou `@JoinColumn`)
- Gestion des colonnes avec les bonnes contraintes (NOT NULL, DEFAULT, etc.)

**Note:** Il n'est pas nécessaire de créer manuellement le fichier de migration. TypeORM le génère à partir de l'entité.

---

## 2. Configuration MinIO

### 2.1 Module de configuration

**Fichier:** `src/infrastructure/config/storage.config.ts`

**Variables d'environnement à ajouter:**
- `MINIO_ENDPOINT` : URL du serveur MinIO (ex: http://localhost:9000)
- `MINIO_ACCESS_KEY_ID` : Clé d'accès MinIO
- `MINIO_SECRET_ACCESS_KEY` : Clé secrète MinIO
- `MINIO_BUCKET_NAME` : Nom du bucket
- `MINIO_USE_SSL` : true/false (pour HTTPS)
- `MINIO_PORT` : Port du serveur MinIO (optionnel, par défaut 9000)

### 2.2 Service de stockage

**Fichier:** `src/infrastructure/storage/storage.service.ts`

**Méthodes:**
- `uploadFile(file: Buffer, key: string, mimeType: string): Promise<string>` 
  - Upload un fichier vers MinIO et retourne l'URL publique
- `deleteFile(key: string): Promise<void>`
  - Supprime un fichier du bucket MinIO
- `generateKey(userId: string, fileName: string): string`
  - Génère une clé unique : `memos/{userId}/{timestamp}-{filename}`
- `ensureBucketExists(): Promise<void>`
  - Vérifie et crée le bucket s'il n'existe pas

**Dépendances:**
- `@aws-sdk/client-s3` (compatible avec MinIO via endpoint personnalisé)
- Configuration via `ConfigService`

**Note:** MinIO est compatible avec l'API S3, donc on utilise `@aws-sdk/client-s3` avec un endpoint personnalisé pointant vers MinIO.

### 2.3 Module de stockage

**Fichier:** `src/infrastructure/storage/storage.module.ts`

**Exports:**
- `StorageService` pour injection dans les autres modules

---

## 3. POST /memos

### 3.1 DTO Input

**Fichier:** `src/memo/interfaces/dto/inputs/create-memo.input.ts`

**Champs:**
- Pas de champs dans le body (tout vient du fichier uploadé)
- Le fichier audio est reçu via `multipart/form-data` avec le champ `audio`

**Validation:**
- Fichier requis
- Type MIME : audio/* uniquement
- Taille max : 100MB (configurable)

### 3.2 DTO Output

**Fichier:** `src/memo/interfaces/dto/outputs/create-memo.output.ts`

**Champs:**
- `id` : UUID du memo créé
- `audioUrl` : URL publique du fichier
- `fileName` : Nom original
- `fileSize` : Taille en bytes
- `createdAt` : Date de création

### 3.3 Repository

**Fichier:** `src/memo/infrastructure/typeorm/repositories/memo.orm.repository.ts`

**Méthodes:**
- `save(memo: Partial<MemoEntity>): Promise<MemoEntity>`
- `findById(id: string, tenantId: string): Promise<MemoEntity | null>`
  - Vérifie que le memo appartient à un user du tenant
- `delete(id: string, tenantId: string): Promise<boolean>`
  - Soft delete avec vérification du tenant

### 3.4 Service

**Fichier:** `src/memo/application/services/memo.service.ts`

**Méthode `createMemo`:**
1. Valider que le user existe et appartient au tenant
2. Valider le fichier audio (type MIME, taille)
3. Générer une clé unique pour MinIO
4. Uploader le fichier vers MinIO via `StorageService`
5. Créer l'entité memo en BDD avec l'URL et la clé MinIO
6. Retourner le memo créé

**Gestion d'erreurs:**
- Si upload MinIO échoue : rollback (ne pas créer le memo en BDD)
- Si création BDD échoue : supprimer le fichier MinIO (cleanup)

### 3.5 Controller

**Fichier:** `src/memo/interfaces/controllers/memo.controller.ts`

**Endpoint POST /memo:**
- Utiliser `@UseInterceptors(FastifyFileInterceptor('audio', { ... }))`
- Récupérer le fichier depuis `request.file`
- Appeler `memoService.createMemo(file, userId, tenantId)`
- Retourner l'ID et les infos du memo créé

**Décorateurs:**
- `@BearerAuth()` : Authentification requise
- `@GetAuthenticatedUser()` : Récupérer userId et tenantId
- `@Payload({ code: DefaultCodeEnum.SUCCESS_OK, type: CreateMemoOutput })`

---

## 4. DELETE /memos

### 4.1 DTO Query

**Fichier:** `src/memo/interfaces/dto/queries/get-memo.query.ts`

**Champs:**
- `id` : UUID du memo à supprimer

### 4.2 Service

**Méthode `deleteMemo`:**
1. Récupérer le memo par ID avec vérification du tenant
2. Si le memo existe :
   - Supprimer le fichier de MinIO via `StorageService.deleteFile(audioKey)`
   - Effectuer un soft delete en BDD
3. Retourner un booléen de succès

**Gestion d'erreurs:**
- Si le memo n'existe pas : `NotFoundException`
- Si la suppression MinIO échoue : logger l'erreur mais continuer (le soft delete en BDD est fait)
- Si la suppression BDD échoue : throw exception

### 4.3 Controller

**Endpoint DELETE /memo:**
- `@Query() query: GetMemoQuery`
- Appeler `memoService.deleteMemo(query.id, tenantId)`
- Retourner un message de succès

**Décorateurs:**
- `@BearerAuth()`
- `@GetAuthenticatedUser()`
- `@Payload({ code: DefaultCodeEnum.SUCCESS_OK })`

---

## 5. Structure des fichiers à créer

```
src/
├── memo/
│   ├── application/
│   │   ├── index.ts
│   │   └── services/
│   │       ├── index.ts
│   │       └── memo.service.ts
│   ├── infrastructure/
│   │   └── typeorm/
│   │       ├── entities/
│   │       │   ├── index.ts
│   │       │   └── memo.orm.entity.ts
│   │       ├── repositories/
│   │       │   ├── index.ts
│   │       │   └── memo.orm.repository.ts
│   │       └── memo-typeorm.module.ts
│   └── interfaces/
│       ├── controllers/
│       │   ├── index.ts
│       │   └── memo.controller.ts
│       ├── dto/
│       │   ├── inputs/
│       │   │   └── create-memo.input.ts
│       │   ├── outputs/
│       │   │   └── create-memo.output.ts
│       │   ├── queries/
│       │   │   └── get-memo.query.ts
│       │   └── index.ts
│       ├── index.ts
│       └── memo-interfaces.module.ts
├── infrastructure/
│   ├── config/
│   │   └── storage.config.ts
│   ├── database/
│   │   └── migrations/
│   │       └── [timestamp]-CreateMemosTable.ts
│   └── storage/
│       ├── storage.service.ts
│       ├── storage.module.ts
│       └── index.ts
```

---

## 6. Dépendances à installer

```bash
yarn add @aws-sdk/client-s3
yarn add -D @types/multer  # Si nécessaire
```

---

## 7. Configuration environnement

**Ajout dans `env.example`:**
```env
# MinIO Configuration
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY_ID=minioadmin
MINIO_SECRET_ACCESS_KEY=minioadmin
MINIO_BUCKET_NAME=memos
MINIO_USE_SSL=false
MINIO_PORT=9000
```

**Ajout dans `docker-compose.yml` (MinIO local):**
```yaml
minio:
  image: minio/minio:latest
  container_name: voxya-minio
  ports:
    - "9000:9000"
    - "9001:9001"
  environment:
    MINIO_ROOT_USER: minioadmin
    MINIO_ROOT_PASSWORD: minioadmin
  command: server /data --console-address ":9001"
  volumes:
    - minio_data:/data
  networks:
    - voxya-network
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
    interval: 30s
    timeout: 20s
    retries: 3
```

**Ajout du volume dans `docker-compose.yml`:**
```yaml
volumes:
  postgres_data:
  redis_data:
  minio_data:  # Ajouter cette ligne
```

---

## 8. Ordre d'implémentation recommandé

1. **Configuration MinIO**
   - Créer `storage.config.ts` avec configuration MinIO
   - Créer `storage.service.ts` et `storage.module.ts`
   - Configurer le client S3 avec endpoint MinIO
   - Tester l'upload/suppression manuellement
   - S'assurer que le bucket existe au démarrage

2. **Base de données**
   - Créer l'entité `memo.orm.entity.ts` avec tous les champs et décorateurs
   - Générer la migration automatiquement : `yarn migration:generate src/infrastructure/database/migrations/CreateMemosTable`
   - Vérifier le fichier de migration généré
   - Exécuter la migration : `yarn migration:run`

3. **Repository**
   - Créer `memo.orm.repository.ts`
   - Implémenter les méthodes CRUD

4. **Service**
   - Créer `memo.service.ts`
   - Implémenter `createMemo` et `deleteMemo`

5. **DTOs et Controller**
   - Créer les DTOs
   - Créer le controller avec POST et DELETE

6. **Module**
   - Créer `memo-interfaces.module.ts`
   - Importer dans `app.module.ts`

7. **Tests**
   - Tester POST avec fichier audio
   - Tester DELETE avec vérification suppression MinIO
   - Vérifier que les fichiers sont bien stockés dans MinIO

---

## 9. Points d'attention

### 9.1 Sécurité
- Vérifier que le user appartient au tenant à chaque opération
- Valider le type MIME du fichier (audio uniquement)
- Limiter la taille des fichiers
- Générer des clés uniques pour éviter les collisions

### 9.2 Performance
- Utiliser des streams pour les gros fichiers
- Implémenter un cleanup job pour les fichiers orphelins (optionnel)

### 9.3 Gestion d'erreurs
- Rollback en cas d'échec partiel (upload MinIO réussi mais BDD échoue)
- Logger les erreurs de suppression MinIO (ne pas bloquer le soft delete)
- Gérer les erreurs de connexion à MinIO (retry, fallback)

### 9.4 Validation
- Type MIME : `audio/mpeg`, `audio/wav`, `audio/mp4`, `audio/ogg`, etc.
- Taille max : 100MB (configurable)
- Extension de fichier : `.mp3`, `.wav`, `.m4a`, `.ogg`, etc.

---

## 10. Exemple de requête POST

```bash
curl -X POST http://localhost:3003/memo \
  -H "Authorization: Bearer <token>" \
  -F "audio=@/path/to/audio.mp3"
```

**Réponse:**
```json
{
  "code": "SUCCESS_OK",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "audioUrl": "http://localhost:9000/memos/user-id/timestamp-audio.mp3",
    "fileName": "audio.mp3",
    "fileSize": 5242880,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

## 11. Exemple de requête DELETE

```bash
curl -X DELETE "http://localhost:3003/memo?id=123e4567-e89b-12d3-a456-426614174000" \
  -H "Authorization: Bearer <token>"
```

**Réponse:**
```json
{
  "code": "SUCCESS_OK",
  "data": {
    "message": "Memo supprimé avec succès"
  }
}
```
