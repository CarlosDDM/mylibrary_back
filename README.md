# Mylibrary — Backend

Backend do app **Mylibrary**, um microsserviço para gerenciamento de uma
"estante" pessoal de obras (livros, mangás, light novels e webtoons), construído com
**Node.js + NestJS + TypeORM**. Fornece funcionalidades de criação, edição,
exclusão e listagem com filtros e paginação, upload de imagens de capa para um
armazenamento **S3-compatível** (ex.: Garage/MinIO/AWS S3), cache em **Redis**,
autenticação por **sessão** e controle de acesso por papéis (roles).

> **Front-end:** a interface web da aplicação está no repositório
> [CarlosDDM/mylibrary_front](https://github.com/CarlosDDM/mylibrary_front).

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
- **Usuários e Papéis**: CRUD de usuários, troca de senha (própria e por admin)
  e promoção/rebaixamento de papel (`admin`/`user`). As rotas de autosserviço
  são restritas ao dono (ou admin), e mudanças de papel/senha e exclusão
  **invalidam as sessões** do usuário afetado.
- **Autenticação por Sessão**: login via Passport (estratégia local), com sessão
  persistida no Redis (cookie `httpOnly`). Não utiliza JWT.
- **Validação de Ambiente**: variáveis validadas por Joi no boot, com fallbacks
  e `SESSION_SECRET` obrigatório em produção.
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
- Joi (validação de variáveis de ambiente)
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

Há três níveis de acesso:

- **Autenticado** (`AuthenticatedGuard`): qualquer sessão válida.
- **Admin** (`RoleGuard` + `@Roles(ADMIN)`): escrita no acervo (obras, séries,
  franquias, autores, ilustradores), gestão de usuários e promoção/rebaixamento
  de papéis.
- **Dono ou admin** (`SelfOrAdminGuard`): rotas de autosserviço do usuário
  (`GET`/`PATCH /users/:id` e troca da própria senha) — cada usuário só acessa
  os próprios dados; admin acessa qualquer um.

Como o papel (`role`) fica gravado na sessão, mudanças sensíveis **invalidam as
sessões** do usuário afetado no Redis: promover/rebaixar papel, trocar senha e
excluir usuário derrubam as sessions ativas e forçam novo login. Assim um admin
rebaixado perde o acesso na hora, sem esperar o TTL.

O primeiro usuário administrador é criado automaticamente pelo seeder a partir
das variáveis `ADMIN_USERNAME`, `ADMIN_PASSWORD` e `ADMIN_EMAIL`.

## Cache

As leituras mais custosas são cacheadas no **Redis** (via `cache-manager` +
`@keyv/redis`), no banco lógico **db 1** (as sessões ficam no **db 0**):

- **Itens por id**: chaves `work:{id}`, `serie:{id}`, `author:{id}`, etc.
- **Listagens**: chave `work:list:{params}` — a chave inclui paginação e
  filtros, então cada página/filtro é cacheada separadamente.
- **Cacheados hoje**: obras, séries, autores, franquias e ilustradores, além do
  dashboard (`dashboard:statistics`) e das opções de referência (`options`).
  Usuários **não** são cacheados.
- **TTL**: **10 minutos** para dados dinâmicos; **7 dias** para `options`.
- **Invalidação**: toda escrita (create/update/delete) apaga o item e as
  listagens afetadas — as listas via `SCAN`/`DEL` por prefixo
  (`invalidateByPrefix`). Escritas de obras/séries/franquias também invalidam o
  `dashboard:statistics`.
- **Fallback**: se o Redis estiver indisponível, as leituras caem direto no
  banco (o `CacheService` engole e loga os erros).

O Redis também guarda as **sessões** de autenticação (db 0, prefixo
`mylibrary:`).

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

> As variáveis são **validadas por Joi no boot** (`src/config/env.validation.ts`):
> os tipos são checados/coeridos e a maioria tem fallback, então a app sobe em
> dev sem um `.env` completo. `SESSION_SECRET` é **obrigatório em produção** (a
> app não sobe sem ele). Variáveis reais de ambiente têm **prioridade** sobre o
> `.env` — dá pra rodar 100% sem arquivo, só com env do Docker/K8s.

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

> **Recomendado:** se você ainda não tem PostgreSQL e Redis rodando localmente,
> use a stack do Docker Compose — ela sobe **app + PostgreSQL + Redis** já
> configurados e conectados, sem precisar instalar/configurar cada serviço na
> mão. Basta um `.env` preenchido e `make up`.

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

> Todas as rotas (exceto `POST /auth/login`) exigem sessão autenticada.
>
> - 🔒 = exclusivo de **admin** (`role: admin`); usuário comum recebe `403`.
> - 🙋 = **dono ou admin** (o usuário só acessa os próprios dados).
> - Sem marcador = qualquer usuário autenticado.

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

CRUD completo com listagem paginada e filtro por `name`. Leitura (`GET`) livre
para autenticados; escrita (`POST`, `PATCH`, `DELETE`) exige **admin** 🔒.

### Usuários (`/users`)

| Método | Rota                           | Descrição                                     |
| ------ | ------------------------------ | --------------------------------------------- |
| POST   | `/users` 🔒                    | Cria um usuário.                              |
| GET    | `/users` 🔒                    | Lista usuários (paginado, filtro `name`).     |
| GET    | `/users/:id` 🙋                | Detalha um usuário.                           |
| PATCH  | `/users/:id` 🙋                | Atualiza nome/email.                          |
| DELETE | `/users/:id` 🔒                | Remove um usuário (derruba as sessions dele). |
| PATCH  | `/users/:id/password` 🙋       | Altera a própria senha (derruba as sessions). |
| PATCH  | `/users/:id/password/admin` 🔒 | Admin redefine a senha de qualquer usuário.   |
| POST   | `/users/:id/promote` 🔒        | Promove o usuário a admin.                    |
| POST   | `/users/:id/demote` 🔒         | Rebaixa o admin para usuário comum.           |

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
