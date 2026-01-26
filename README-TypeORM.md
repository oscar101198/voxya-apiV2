# 🗄️ TypeORM Configuration - Architecture DDD

Ce guide explique comment TypeORM est configuré dans l'architecture DDD de Voxya API.

## 📁 Structure des fichiers

```
src/
├── domain/
│   ├── entities/           # Entités de domaine (avec décorateurs TypeORM)
│   │   └── user.entity.ts
│   └── repositories/       # Interfaces des repositories
│       └── user.repository.interface.ts
├── infrastructure/
│   ├── config/            # Configuration TypeORM
│   │   └── database.config.ts
│   ├── database/
│   │   ├── database.module.ts
│   │   └── migrations/    # Migrations TypeORM
│   └── repositories/      # Implémentations des repositories
│       ├── user.repository.ts
│       └── repositories.module.ts
└── app.module.ts          # Module principal
```

## 🔧 Configuration TypeORM

### 1. Configuration de base de données

```typescript
// src/infrastructure/config/database.config.ts
export const getDatabaseConfig = (
  configService: ConfigService
): TypeOrmModuleOptions => ({
  type: "postgres",
  host: configService.get("DB_HOST", "localhost"),
  port: configService.get("DB_PORT", 5432),
  username: configService.get("DB_USERNAME", "postgres"),
  password: configService.get("DB_PASSWORD", "password"),
  database: configService.get("DB_NAME", "voxya"),
  entities: [__dirname + "/../../**/*.entity{.ts,.js}"],
  synchronize: configService.get("NODE_ENV") !== "production",
  logging: configService.get("NODE_ENV") === "development",
  migrations: [__dirname + "/../database/migrations/*{.ts,.js}"],
  migrationsRun: configService.get("NODE_ENV") === "production",
  migrationsTableName: "migrations",
});
```

### 2. Module de base de données

```typescript
// src/infrastructure/database/database.module.ts
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) =>
        getDatabaseConfig(configService),
      inject: [ConfigService],
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
```

## 🏗️ Architecture DDD avec TypeORM

### 1. Entités de domaine

```typescript
// src/domain/entities/user.entity.ts
@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  @IsEmail()
  email: string;

  // Domain methods
  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  deactivate(): void {
    this.isActive = false;
  }
}
```

### 2. Interfaces de repository

```typescript
// src/domain/repositories/user.repository.interface.ts
export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  save(user: User): Promise<User>;
  update(id: string, user: Partial<User>): Promise<User | null>;
  delete(id: string): Promise<boolean>;
}
```

### 3. Implémentation TypeORM

```typescript
// src/infrastructure/repositories/user.repository.ts
@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.repository.findOne({ where: { id } });
  }

  async save(user: User): Promise<User> {
    return this.repository.save(user);
  }
}
```

### 4. Injection de dépendance

```typescript
// src/infrastructure/repositories/repositories.module.ts
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [
    {
      provide: IUserRepository,
      useClass: UserRepository,
    },
  ],
  exports: [IUserRepository],
})
export class RepositoriesModule {}
```

## 🚀 Utilisation

### Dans un service de domaine

```typescript
// src/domain/services/user-domain.service.ts
@Injectable()
export class UserDomainService {
  constructor(private readonly userRepository: IUserRepository) {}

  async createUser(userData: Partial<User>): Promise<User> {
    const user = new User();
    Object.assign(user, userData);
    return this.userRepository.save(user);
  }
}
```

### Dans un service applicatif

```typescript
// src/application/services/create-user.use-case.ts
@Injectable()
export class CreateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly userDomainService: UserDomainService
  ) {}

  async execute(userData: CreateUserDto): Promise<User> {
    return this.userDomainService.createUser(userData);
  }
}
```

## 📝 Migrations

### Générer une migration

```bash
# Générer une migration basée sur les changements d'entités
yarn migration:generate src/infrastructure/database/migrations/CreateUsers

# Exécuter les migrations
yarn migration:run

# Annuler la dernière migration
yarn migration:revert
```

### Exemple de migration

```typescript
// src/infrastructure/database/migrations/1234567890-CreateUsers.ts
import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateUsers1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "users",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          {
            name: "email",
            type: "varchar",
            isUnique: true,
          },
          {
            name: "firstName",
            type: "varchar",
          },
          {
            name: "lastName",
            type: "varchar",
          },
          {
            name: "password",
            type: "varchar",
          },
          {
            name: "isActive",
            type: "boolean",
            default: true,
          },
          {
            name: "createdAt",
            type: "timestamp",
            default: "now()",
          },
          {
            name: "updatedAt",
            type: "timestamp",
            default: "now()",
          },
        ],
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("users");
  }
}
```

## 🔄 Synchronisation vs Migrations

### Développement (synchronize: true)

- TypeORM crée automatiquement les tables
- Rapide pour le développement
- **Ne jamais utiliser en production**

### Production (migrations)

- Contrôle total sur les changements de schéma
- Sécurisé et reproductible
- Historique des changements

## 🛠️ Scripts disponibles

```bash
# Générer une migration
yarn migration:generate src/infrastructure/database/migrations/NomDeLaMigration

# Exécuter les migrations
yarn migration:run

# Annuler la dernière migration
yarn migration:revert

# Supprimer le schéma (attention !)
yarn schema:drop

# Synchroniser le schéma (développement seulement)
yarn schema:sync
```

## 🎯 Avantages de cette architecture

1. **Séparation des responsabilités** : Le domaine ne dépend pas de TypeORM
2. **Testabilité** : Facile de mocker les repositories
3. **Flexibilité** : Peut changer d'ORM sans toucher au domaine
4. **Inversion de dépendance** : Le domaine définit les contrats
5. **Maintenabilité** : Code organisé et prévisible

## 🔒 Bonnes pratiques

1. **Ne jamais utiliser `synchronize: true` en production**
2. **Toujours utiliser des migrations pour les changements de schéma**
3. **Garder les entités dans le domaine**
4. **Implémenter les repositories dans l'infrastructure**
5. **Utiliser l'injection de dépendance pour les repositories**
6. **Tester les repositories avec des mocks**
