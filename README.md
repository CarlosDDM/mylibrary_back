# Mylibrary — Backend

Backend do app **Mylibrary**, um microsserviço para gerenciamento de uma
"estante" pessoal de obras (livros, mangás, light novels e webtoons), construído
com **Node.js + NestJS + TypeORM**. Fornece funcionalidades de criação, edição,
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
- **Busca full text**: busca por prefixo de palavra e indiferente a acento,
  sobre o full text search do PostgreSQL — no endpoint unificado (`/search`,
  obras e séries numa chamada só) e nos filtros `name` de autores, franquias,
  ilustradores e usuários.
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
- **Documentação OpenAPI**: Swagger UI opcional em `/docs`, com corpo, resposta
  e erros de cada rota descritos (`ACTIVE_SWAGGER`).
- **Health checks**: probes de liveness e readiness (`/health/live` e
  `/health/ready`), esta última verificando PostgreSQL e os dois Redis.
- **Testes**: 26 suítes unitárias e 9 suítes end-to-end contra a stack real.

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
- `@nestjs/swagger` (OpenAPI) e `@nestjs/terminus` (health checks)
- Jest e Supertest (testes unitários e e2e)
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
`@keyv/redis`), numa instância dedicada (`redis-cache`) separada da instância de
sessões (`redis-session`) — o cache é descartável e evicta por LRU, a sessão
não:

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

## Busca

A busca usa o **full text search do PostgreSQL**, com uma text search
configuration própria criada na migration:

```sql
CREATE TEXT SEARCH CONFIGURATION public.simple_unaccent (COPY = pg_catalog.simple)
ALTER ... WITH unaccent, simple
```

É a `simple` (sem stemmer e sem stopword) mais o dicionário `unaccent`. Os
títulos do acervo são majoritariamente nomes próprios japoneses e ingleses, em
que o stemmer de português atrapalha — ele apaga o `no` de "Kimetsu **no**
Yaiba" por confundir com a contração, e corta "Yaiba" em `yaib`.

Cada tabela buscável tem um índice GIN sobre a expressão indexada:

| Tabela         | Colunas indexadas  |
| -------------- | ------------------ |
| `works`        | `name`, `subtitle` |
| `series`       | `name`             |
| `authors`      | `name`             |
| `franchises`   | `name`             |
| `illustrators` | `name`             |
| `users`        | `name`             |

O termo digitado é convertido em `tsquery` pelo **mesmo parser** que indexa
(`to_tsvector` → `tsvector_to_array` → `:*` em cada lexema), então as duas
pontas nunca divergem na tokenização.

**O que a busca faz:**

- casa **prefixo de palavra** — `kimet` acha "Kimetsu no Yaiba";
- ignora **acento** nos dois sentidos — `coracao` acha "Coração de Tinta", e o
  dado gravado continua acentuado;
- ignora **ordem das palavras** — `man chainsaw` acha "Chainsaw Man";
- aceita **pontuação livre** no termo — `naruto!`, `vol. 2`, `yu-gi-oh 5`.

**O que ela não faz:**

- não casa no **meio da palavra** — `leach` não acha "Bleach";
- não tolera **erro de digitação** — `bersek` não acha "Berserk".

Isso vale para **todos** os pontos de busca por nome: o `/search` unificado, os
filtros `name` das listagens de obras e séries (onde o nome convive com os
filtros de mídia, idioma, autor, ilustrador, franquia e status) e as listagens
de autores, franquias, ilustradores e usuários.

O limite de tamanho do termo no `/search` é o `@MaxLength(200)` do DTO — acima
disso a requisição recebe `400`.

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
# Publica a doc Swagger em /docs. true | false (fallback: false)
ACTIVE_SWAGGER=false

# Redis — um host por client (cache e sessão)
REDIS_CACHE_HOST=localhost
REDIS_CACHE_PORT=6379
REDIS_SESSION_HOST=localhost
REDIS_SESSION_PORT=6379

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

> As variáveis são **validadas por Joi no boot**
> (`src/config/env.validation.ts`): os tipos são checados/coeridos e a maioria
> tem fallback, então a app sobe em dev sem um `.env` completo. `SESSION_SECRET`
> é **obrigatório em produção** (a app não sobe sem ele). Variáveis reais de
> ambiente têm **prioridade** sobre o `.env` — dá pra rodar 100% sem arquivo, só
> com env do Docker/K8s.

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

> A migration da busca roda `CREATE EXTENSION unaccent` e
> `CREATE TEXT SEARCH CONFIGURATION`, que exigem privilégio de superusuário no
> PostgreSQL. Em dev o `synchronize` cria as tabelas a partir das entities, mas
> **não** cria os índices GIN da busca — eles vêm só pela migration.

## Docker

> **Recomendado:** se você ainda não tem PostgreSQL e Redis rodando localmente,
> use a stack do Docker Compose — ela sobe **app + PostgreSQL + os dois Redis**
> já configurados e conectados, sem precisar instalar/configurar cada serviço na
> mão. Basta um `.env` preenchido e `make up`.

O `docker-compose.yml` sobe quatro serviços: `app`, `postgres`, `redis-cache` e
`redis-session`. Os dois Redis têm configuração diferente de propósito —
`redis-cache` roda sem persistência, com teto de 256 MB e política
`allkeys-lru`; `redis-session` persiste em volume e usa `noeviction`, porque
despejar uma sessão significa deslogar alguém. Todos os serviços têm
healthcheck, e o `app` só sobe depois que os três estiverem saudáveis.

Em produção o `entrypoint.sh` roda migrations e seeders antes de subir a
aplicação com PM2 em modo cluster.

```bash
make help      # lista todos os alvos disponíveis
make up        # sobe os containers
make rebuild   # rebuild e sobe os containers
make logs      # acompanha os logs do container app
make down      # derruba os containers
make restart   # reinicia os containers
```

### Modo desenvolvimento

O `docker-compose.dev.yml` é um override que troca a imagem de produção pela
`Dockerfile.dev`: mantém as devDependencies, monta o código do host em `/app`
(editar `src/` reflete sem rebuild) e publica a porta do PostgreSQL em
`127.0.0.1:5432` para inspeção por cliente gráfico.

```bash
make up-dev    # sobe a stack em modo dev (watch + devDependencies)
make db-reset  # dropa e recria o schema, limpa os Redis e roda o seed
```

> O `db-reset` limpa o Redis junto, e não por acaso: o seed gera UUIDs novos
> para status, mídias e idiomas, e `GET /options` fica cacheado por 7 dias. Sem
> o flush, a API continuaria servindo ids que já não existem no banco.

## Testes

```bash
npm test           # unitários (26 suítes)
npm run test:cov   # unitários com cobertura
npm run test:e2e   # end-to-end (9 suítes)
```

Os testes **unitários** ficam ao lado do código (`src/**/*.spec.ts`) e usam
mocks — não precisam de banco nem Redis.

Os **e2e** (`test/*.e2e-spec.ts`) sobem a aplicação inteira com o `AppModule`
real e batem nas rotas via Supertest, então precisam de PostgreSQL e Redis de
verdade. Como o `.env` aponta para os hostnames da rede Docker, rode-os dentro
do container:

```bash
make test-e2e
```

Por padrão o `ThrottlerStorage` é substituído por um stub que nunca bloqueia — a
suíte dispara dezenas de requisições por segundo e tomaria `429` aleatório. O
`throttler.e2e-spec.ts` passa `comThrottler: true` para exercitar os limites de
verdade.

## Documentação da API (Swagger)

Com `ACTIVE_SWAGGER=true`, a aplicação publica a documentação OpenAPI em
**`/docs`**:

```
http://localhost:3000/docs
```

> Mantenha `false` em produção: a doc lista todas as rotas, inclusive as de
> admin.

A doc é gerada pelo plugin do `@nestjs/swagger` (configurado no `nest-cli.json`
com `introspectComments: true`) somado a decorators explícitos nos controllers.
Cada operação declara:

- o **corpo** aceito, a partir do DTO — incluindo os `PATCH`, que usam
  `PartialType` do `@nestjs/swagger` para herdar os campos do DTO de criação;
- a **resposta de sucesso** tipada pelo DTO de resposta, e não pela entidade do
  TypeORM — o que sai na rede é o que está documentado;
- os **erros** possíveis (`400`, `401`, `403`, `404`, `409`, `413`, `429`), com
  exemplos de corpo no formato do `AllExceptionsFilter`;
- um **resumo** de uma linha, escrito como JSDoc acima do handler.

O `withCredentials` já vem ligado, então dá para autenticar pelo
`POST /auth/login` no próprio Swagger UI e sair testando as rotas protegidas — o
cookie de sessão é reaproveitado nas chamadas seguintes.

## Health checks

| Método | Rota            | Descrição                                          |
| ------ | --------------- | -------------------------------------------------- |
| GET    | `/health/live`  | Liveness. Responde `200` enquanto o processo vive. |
| GET    | `/health/ready` | Readiness. Verifica PostgreSQL e os dois Redis.    |

Ambas são **públicas** (não exigem sessão) e isentas de rate limiting.

O `/health/ready` responde `200` quando as três dependências respondem, e `503`
quando qualquer uma falha. O corpo segue o formato do Terminus, com `error`
listando só o que caiu e `details` listando tudo:

```json
{
  "status": "error",
  "info": {
    "redis-cache": { "responseTime": 2, "status": "up" },
    "redis-session": { "responseTime": 1, "status": "up" }
  },
  "error": {
    "postgres": { "message": "timeout of 2000ms exceeded", "status": "down" }
  },
  "details": {
    "postgres": { "message": "timeout of 2000ms exceeded", "status": "down" },
    "redis-cache": { "responseTime": 2, "status": "up" },
    "redis-session": { "responseTime": 1, "status": "up" }
  }
}
```

Cada indicador tem timeout de 2 s. Um `HealthCheckFilter` escopado no controller
preserva esse corpo, que de outra forma seria reescrito pelo filtro global de
exceções — e aí se perderia justamente a informação de qual dependência caiu.

## Endpoints

> Todas as rotas exigem sessão autenticada, exceto `POST /auth/login` e as duas
> de `/health`.
>
> - 🔒 = exclusivo de **admin** (`role: admin`); usuário comum recebe `403`.
> - 🙋 = **dono ou admin** (o usuário só acessa os próprios dados).
> - Sem marcador = qualquer usuário autenticado.
>
> Todas estão sujeitas ao rate limiting global de **20 req/s, 100 req/10s e 300
> req/min** por IP, com exceção de `/health`. O `POST /auth/login` tem um limite
> próprio, mais apertado: **5 tentativas por minuto**.

### Autenticação

| Método | Rota           | Descrição                                             |
| ------ | -------------- | ----------------------------------------------------- |
| POST   | `/auth/login`  | Autentica (`{ username, password }`) e cria a sessão. |
| GET    | `/auth/me`     | Retorna o usuário da sessão atual.                    |
| POST   | `/auth/logout` | Encerra a sessão e limpa o cookie.                    |

### Obras (`/works`)

| Método | Rota                            | Descrição                                            |
| ------ | ------------------------------- | ---------------------------------------------------- |
| POST   | `/works` 🔒                     | Cria uma obra.                                       |
| GET    | `/works`                        | Lista obras com filtros e paginação.                 |
| GET    | `/works/:id`                    | Detalha uma obra.                                    |
| PATCH  | `/works/:id` 🔒                 | Atualiza uma obra.                                   |
| DELETE | `/works/:id` 🔒                 | Remove uma obra.                                     |
| POST   | `/works/:id/covers` 🔒          | Envia uma capa (multipart, campo `file`, máx. 5 MB). |
| DELETE | `/works/:id/covers/:coverId` 🔒 | Remove uma capa da obra.                             |

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
como `multipart/form-data`, no campo `file`. São aceitos **jpeg, png e webp**,
com no máximo **5 MB** — fora disso a API responde `400` (formato) ou `413`
(tamanho). O campo opcional `isSpecialEdition` marca a capa como de edição
especial.

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
| GET    | `/search`               | Busca full text de obras e séries (query `name`).   |
| GET    | `/dashboard/statistics` | Estatísticas do acervo.                             |
| GET    | `/options`              | Dados de referência (mídias, idiomas, status etc.). |

### Formato de resposta paginada

```json
{
  "data": [/* ... */],
  "total": 50,
  "pages": 5,
  "current_page": 1
}
```

### Formato de resposta da busca

O `/search` aceita `take`/`skip`, mas devolve um envelope próprio — dois grupos,
cada um com `data` e `total`, sem `pages`/`current_page`:

```json
{
  "works": { "data": [/* ... */], "total": 12 },
  "series": { "data": [/* ... */], "total": 3 }
}
```

Sem o parâmetro `name`, os dois grupos voltam vazios (a busca não lista o acervo
inteiro — para isso use `GET /works` e `GET /series`).

### Formato de erro

Todo erro passa pelo `AllExceptionsFilter` e sai no mesmo formato, com `message`
sempre em array — a validação de payload devolve várias mensagens de uma vez:

```json
{
  "message": ["name should not be empty"],
  "error": "Bad Request",
  "statusCode": 400
}
```

| Status | Quando                                                                   |
| ------ | ------------------------------------------------------------------------ |
| `400`  | Payload reprovado na validação, ou id de rota que não é um UUID v4.      |
| `401`  | Sem sessão, ou sessão expirada/invalidada.                               |
| `403`  | Autenticado mas sem permissão (não é admin, ou não é o dono do recurso). |
| `404`  | Recurso inexistente.                                                     |
| `409`  | Violação de unicidade (nome já cadastrado, volume repetido na série).    |
| `413`  | Upload acima de 5 MB.                                                    |
| `429`  | Rate limit estourado.                                                    |

> O `ValidationPipe` roda com `whitelist` e `forbidNonWhitelisted`, então mandar
> um campo que o DTO não declara também derruba com `400`
> (`property X should not exist`) em vez de ser ignorado silenciosamente.

## Observação sobre o armazenamento S3

O upload de imagens é feito diretamente para o bucket S3-compatível usando as
credenciais configuradas (`S3_*`). O endpoint é configurável via `S3_API_URL`,
permitindo usar serviços como **Garage** ou **MinIO** além do AWS S3.
Certifique-se de configurar as permissões adequadas do bucket para leitura
pública das imagens (a URL pública é derivada de `S3_WEB_URL`) ou utilize URLs
assinadas para maior segurança. O parâmetro `S3_PATH_STYLE` controla o uso de
path-style vs. virtual-hosted-style nas URLs.
