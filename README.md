# Mylibrary — Backend

Backend do app **Mylibrary**, um microsserviço para gerenciamento de uma
"estante" pessoal de obras (livros, mangás, HQs etc.), construído com
**Node.js + NestJS + TypeORM**. Fornece funcionalidades de criação, edição,
exclusão e listagem com filtros e paginação, upload de imagens de capa para um
armazenamento **S3-compatível** (ex.: Garage/MinIO/AWS S3), cache em **Redis**,
autenticação por **sessão** e controle de acesso por papéis (roles).

## Domínio

O acervo é modelado em torno das seguintes entidades:

- **Obras (`works`)**: unidade central. Possui nome, subtítulo, volume, nome de
  volume, preço, edição especial, mídia, idioma, série e uma ou mais capas.
- **Séries (`series`)**: agrupam obras (volumes) e possuem status e franquia.
- **Franquias (`franchises`)**: agrupam séries relacionadas.
- **Autores (`authors`)** e **Ilustradores (`illustrators`)**: associados às
  obras (N:N).
- **Mídias (`medias`)**, **Idiomas (`languages`)** e **Status (`status`)**:
  dados de referência (lookup) usados pelas obras e séries.
- **Usuários (`users`)**: contas de acesso, com papéis `admin` e `user`.

## Funcionalidades

- **Gerenciamento de Obras**: criação, atualização, exclusão e detalhamento de
  obras, incluindo relacionamento com autores, ilustradores, mídia, idioma e
  série.
- **Capas**: upload de imagens de capa (multipart/form-data) para um bucket
  S3-compatível, com o link persistido no banco. Suporte a múltiplas capas por
  obra, incluindo capas de edição especial.
- **Séries e Franquias**: organização das obras em séries e franquias, com capa
  própria para a série.
- **Listagem com Filtros e Paginação**: listagem de obras com filtros dinâmicos
  (nome, mídias, idiomas, autores, ilustradores, edição especial) e paginação
  via `skip`/`take`.
- **Busca**: endpoint de busca unificada (`/search`).
- **Dashboard**: estatísticas do acervo (`/dashboard/statistics`).
- **Usuários e Papéis**: CRUD de usuários e troca de senha (própria e por
  admin), com controle de acesso por papel (`admin`/`user`).
- **Autenticação por Sessão**: login via Passport (estratégia local), com sessão
  persistida no Redis (cookie `httpOnly`). Não utiliza JWT.
- **Segurança e Robustez**: Helmet, CORS por whitelist, rate limiting
  (throttler), validação global de payloads e filtro global de exceções.

## Tecnologias Utilizadas

- Node.js (v22)
- NestJS 11
- TypeORM 0.3
- PostgreSQL 17
- Redis 8 (sessão + cache)
- Armazenamento S3-compatível (Garage / MinIO / AWS S3) via AWS SDK v3
- Passport (`passport-local`) + `express-session` + `connect-redis`
- Helmet, `@nestjs/throttler`, `class-validator` / `class-transformer`
- Docker / Docker Compose / PM2
- ESLint e Prettier

## Requisitos

- Node.js: v22+
- npm
- PostgreSQL
- Redis: v6+
- Um serviço S3-compatível (Garage, MinIO ou AWS S3) com credenciais

## Autenticação e Autorização

A API usa **autenticação baseada em sessão**:

1. `POST /auth/login` com `{ "username", "password" }` cria a sessão e retorna
   um cookie (`COOKIE_NAME`) `httpOnly`.
2. As requisições subsequentes devem enviar esse cookie (`credentials: true`).
3. `POST /auth/logout` encerra a sessão e limpa o cookie.

A maioria das rotas exige sessão autenticada (`AuthenticatedGuard`). Rotas de
escrita em recursos de acervo (obras, séries, franquias, autores, ilustradores)
e a gestão de usuários exigem o papel **`admin`** (`RoleGuard` + `@Roles`).

O primeiro usuário administrador é criado automaticamente pelo seeder a partir
das variáveis `ADMIN_USERNAME`, `ADMIN_PASSWORD` e `ADMIN_EMAIL`.

## Cache

Dados são cacheados no **Redis** (via `cache-manager` + `@keyv/redis`) para
reduzir a carga no banco:

- **Dados dinâmicos** (listagens, detalhes): TTL padrão de **10 minutos**.
- **Dados estáticos/de referência**: TTL de **7 dias**.
- Invalidação automática nas operações de escrita (create, update e delete).

O Redis também armazena as **sessões** de autenticação (prefixo `mylibrary:`).

## Configuração e Instalação

Clone o repositório:

```bash
git clone <url-do-repositorio>
cd mylibrary_back
```

Instale as dependências:

```bash
npm install
```

Configure as variáveis de ambiente. Copie o arquivo de exemplo e preencha os
valores:

```bash
cp .env.example .env
```

```env
NODE_ENV=development

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
POSTGRES_USER=<seu-usuario>
POSTGRES_PASSWORD=<sua-senha>
POSTGRES_DB=mylibrary

# App
PORT=3000
# Nº de proxies na frente da app (1 = nginx/traefik). true = confia em todos. Vazio = desligado
TRUST_PROXY=1

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# CORS — origens permitidas, separadas por vírgula
CORS_ORIGIN=http://localhost:4200

# Sessão (express-session)
COOKIE_NAME=mylibrarycookie
SESSION_SECRET=<um-segredo-forte>
# true/false força o secure do cookie. Vazio = secure só em produção
COOKIE_SECURE=
# lax | strict | none. Vazio = lax
COOKIE_SAMESITE=lax

# Bcrypt
SALT=10

# Admin inicial (seeder)
ADMIN_USERNAME=
ADMIN_PASSWORD=
ADMIN_EMAIL=

# S3 / Garage
S3_REGION=garage
S3_BUCKET=images
S3_API_URL=<endpoint-da-api-s3>
S3_WEB_URL=<url-publica-das-imagens>
S3_KEY_ID=<sua-access-key>
S3_SECRET_KEY=<sua-secret-key>
S3_PATH_STYLE=false
```

> Em `development` (`NODE_ENV != production`), o TypeORM usa `synchronize: true`
> e cria/atualiza as tabelas automaticamente ao iniciar. Em produção, use as
> migrations.

Inicie o servidor em desenvolvimento:

```bash
npm run start:dev
```

O serviço estará disponível em `http://localhost:3000`.

### Migrations e Seed

```bash
npm run migration:generate   # gera uma migration a partir das entidades
npm run migration:run        # aplica as migrations
npm run migration:revert     # reverte a última migration
npm run seed                 # popula dados de referência e o admin inicial
```

## Docker

O projeto acompanha `docker-compose.yml` (app + PostgreSQL + Redis) e um
`Makefile` com atalhos. Em produção, o container roda migrations e seeders no
`entrypoint.sh` e sobe a aplicação com PM2 em modo cluster.

```bash
make up        # sobe os containers (docker compose up -d)
make rebuild   # rebuild e sobe os containers
make logs      # acompanha os logs do container app
make down      # derruba os containers
make restart   # reinicia os containers
```

## Endpoints

> Todas as rotas (exceto `POST /auth/login`) exigem sessão autenticada. As rotas
> marcadas com 🔒 são de uso **exclusivo de administradores** (role `admin`) —
> um usuário comum autenticado recebe `403 Forbidden`. As rotas **sem** cadeado
> ficam disponíveis para qualquer usuário autenticado.

### Autenticação

| Método | Rota           | Descrição                                             |
| ------ | -------------- | ----------------------------------------------------- |
| POST   | `/auth/login`  | Autentica (`{ username, password }`) e cria a sessão. |
| GET    | `/auth/me`     | Retorna o usuário da sessão atual.                    |
| POST   | `/auth/logout` | Encerra a sessão e limpa o cookie.                    |

### Obras (`/works`)

| Método | Rota                            | Descrição                                           |
| ------ | ------------------------------- | --------------------------------------------------- |
| POST   | `/works` 🔒                     | Cria uma obra.                                      |
| GET    | `/works`                        | Lista obras com filtros e paginação.                |
| GET    | `/works/:id`                    | Detalha uma obra.                                   |
| PATCH  | `/works/:id` 🔒                 | Atualiza uma obra.                                  |
| DELETE | `/works/:id` 🔒                 | Remove uma obra.                                    |
| POST   | `/works/:id/covers` 🔒          | Envia uma capa (multipart, campo `file`, máx. 5MB). |
| DELETE | `/works/:id/covers/:coverId` 🔒 | Remove uma capa da obra.                            |

**Filtros e paginação de `GET /works`:**

- `skip` (padrão: `0`) e `take` (padrão: `20`) — paginação.
- `name` — filtro por nome.
- `mediaIds`, `languageIds`, `authorIds`, `illustratorIds` — filtros por UUID
  (múltiplos).
- `isSpecialEdition` — `true`/`false`.

Exemplo:

```http
GET /works?skip=0&take=10&name=NomeDaObra&isSpecialEdition=true
```

**Payload de criação (`POST /works`):**

```json
{
  "name": "NomeDaObra...",
  "subtitle": "SubTituloDaObra",
  "volume": 1,
  "price": 89.9,
  "mediaId": "b3f1c2a4-...",
  "languageId": "d4e5f6a7-...",
  "serieId": "a1b2c3d4-...",
  "isSpecialEdition": true,
  "authors": ["8f14e45f-..."],
  "illustrators": ["9c56cc50-..."]
}
```

O upload da capa é feito em uma requisição separada (`POST /works/:id/covers`)
como `multipart/form-data`.

### Séries (`/series`)

| Método | Rota                   | Descrição                                     |
| ------ | ---------------------- | --------------------------------------------- |
| POST   | `/series` 🔒           | Cria uma série.                               |
| GET    | `/series`              | Lista séries com filtros e paginação.         |
| GET    | `/series/:id`          | Detalha uma série.                            |
| PATCH  | `/series/:id` 🔒       | Atualiza uma série.                           |
| DELETE | `/series/:id` 🔒       | Remove uma série.                             |
| PUT    | `/series/:id/cover` 🔒 | Define/substitui a capa da série (multipart). |
| DELETE | `/series/:id/cover` 🔒 | Remove a capa da série.                       |

### Franquias (`/franchises`)

CRUD completo: `POST` 🔒, `GET` (lista com filtro `name` e paginação),
`GET /:id`, `PATCH /:id` 🔒, `DELETE /:id` 🔒.

### Autores (`/authors`) e Ilustradores (`/illustrators`)

CRUD completo (escrita exige admin), com listagem paginada e filtro por `name`.

### Usuários (`/users`)

| Método | Rota                           | Descrição                                   |
| ------ | ------------------------------ | ------------------------------------------- |
| POST   | `/users` 🔒                    | Cria um usuário.                            |
| GET    | `/users` 🔒                    | Lista usuários (paginado, filtro `name`).   |
| GET    | `/users/:id`                   | Detalha um usuário.                         |
| PATCH  | `/users/:id`                   | Atualiza um usuário.                        |
| DELETE | `/users/:id` 🔒                | Remove um usuário.                          |
| PATCH  | `/users/:id/password`          | Altera a própria senha.                     |
| PATCH  | `/users/:id/password/admin` 🔒 | Admin redefine a senha de qualquer usuário. |

### Outros

| Método | Rota                    | Descrição                                           |
| ------ | ----------------------- | --------------------------------------------------- |
| GET    | `/search`               | Busca unificada (query `name`, paginado).           |
| GET    | `/dashboard/statistics` | Estatísticas do acervo.                             |
| GET    | `/options`              | Dados de referência (mídias, idiomas, status etc.). |

### Formato de resposta paginada

```json
{
  "data": [
    /* ... */
  ],
  "total": 50,
  "pages": 5,
  "current_page": 1
}
```

## Observação sobre o armazenamento S3

O upload de imagens é feito diretamente para o bucket S3-compatível usando as
credenciais configuradas (`S3_*`). O endpoint é configurável via `S3_API_URL`,
permitindo usar serviços como **Garage** ou **MinIO** além do AWS S3.
Certifique-se de configurar as permissões adequadas do bucket para leitura
pública das imagens (a URL pública é derivada de `S3_WEB_URL`) ou utilize URLs
assinadas para maior segurança. O parâmetro `S3_PATH_STYLE` controla o uso de
path-style vs. virtual-hosted-style nas URLs.
