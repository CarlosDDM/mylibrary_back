import * as Joi from 'joi';

const QUOTED = /^(["'])([\s\S]*)\1$/;

const unquote = (value: string): string => {
  const trimmed = value.trim();
  const match = QUOTED.exec(trimmed);

  return match ? unquote(match[2]) : trimmed;
};

const ipEntry = Joi.string().trim().ip({ cidr: 'optional' });

const toList = (value: string) =>
  value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

const trustProxyList: Joi.CustomValidator<string, string[]> = (
  value,
  helpers,
) => {
  const entries = toList(value);

  const allIps = entries.every((entry) => !ipEntry.validate(entry).error);

  return allIps ? entries : helpers.error('any.invalid');
};

const csvList: Joi.CustomValidator<string, string[]> = (value) => toList(value);

const prodRequired = (
  schema: Joi.StringSchema,
  devDefault: string | string[],
) =>
  schema.empty('').when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: schema.default(devDefault),
  });

const TRUST_PROXY_MESSAGE =
  '{{#label}} precisa ser true, false, o número de proxies à frente da app ou uma lista de IPs/CIDRs separados por vírgula';

export const envValidationSchema = Joi.object({
  // App
  NODE_ENV: Joi.string()
    .trim()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().port().empty('').default(3000),
  // true = confia em todos, número = nº de proxies na frente da app,
  // lista de IPs/CIDRs separados por vírgula, false/vazio = desligado.
  TRUST_PROXY: Joi.alternatives()
    .try(
      Joi.boolean(),
      Joi.number().integer().min(0),
      Joi.string().trim().custom(trustProxyList),
    )
    .empty('')
    .default(false)
    .messages({
      'alternatives.match': TRUST_PROXY_MESSAGE,
      'any.invalid': TRUST_PROXY_MESSAGE,
    }),
  // Publica a documentação Swagger em /docs. Desligado por padrão: a doc
  // expõe o mapa completo das rotas, inclusive as de admin.
  ACTIVE_SWAGGER: Joi.boolean().empty('').default(false),

  // PostgreSQL
  DB_HOST: prodRequired(Joi.string().trim(), 'localhost'),
  DB_PORT: Joi.number().port().empty('').default(5432),
  POSTGRES_USER: Joi.string().trim().empty('').default('postgres'),
  POSTGRES_PASSWORD: prodRequired(Joi.string().trim(), 'postgres'),
  POSTGRES_DB: Joi.string().trim().empty('').default('mylibrary'),

  // Redis (um host por client: cache e sessão)
  REDIS_CACHE_HOST: prodRequired(Joi.string().trim(), 'localhost'),
  REDIS_CACHE_PORT: Joi.number().port().empty('').default(6379),
  REDIS_SESSION_HOST: prodRequired(Joi.string().trim(), 'localhost'),
  REDIS_SESSION_PORT: Joi.number().port().empty('').default(6379),

  // CORS (origens separadas por vírgula)
  CORS_ORIGIN: prodRequired(Joi.string().trim().custom(csvList), [
    'http://localhost:4200',
  ]),

  // Sessão / Cookie
  COOKIE_NAME: Joi.string().trim().empty('').default('mylibrarycookie'),
  SESSION_SECRET: prodRequired(
    Joi.string().trim(),
    'dev-session-secret-change-me',
  ),
  // Vazio = secure só em produção.
  COOKIE_SECURE: Joi.boolean()
    .empty('')
    .default(Joi.ref('NODE_ENV', { adjust: (env) => env === 'production' })),
  COOKIE_SAMESITE: Joi.string()
    .trim()
    .valid('lax', 'strict', 'none')
    .empty('')
    .default('lax'),

  // Bcrypt
  SALT: Joi.number().empty('').default(10),

  // Admin inicial — usado pelo seeder. Obrigatórios: sem eles o seeder falha
  // e a base sobe sem nenhum admin, o que deixaria a API inadministrável.
  ADMIN_USERNAME: Joi.string().trim().empty('').required(),
  ADMIN_PASSWORD: Joi.string().trim().empty('').required(),
  ADMIN_EMAIL: Joi.string().trim().lowercase().email().empty('').default(null),

  // S3 / Garage
  S3_REGION: Joi.string().trim().empty('').default('garage'),
  S3_BUCKET: Joi.string().trim().empty('').default('images'),
  S3_API_URL: Joi.string().trim().uri().empty('').required(),
  S3_WEB_URL: Joi.string().trim().uri().empty('').required(),
  S3_KEY_ID: Joi.string().trim().empty('').required(),
  S3_SECRET_KEY: Joi.string().trim().empty('').required(),
  S3_PATH_STYLE: Joi.boolean().empty('').default(false),
});

export const validateEnv = (config: Record<string, unknown>) => {
  const normalized = Object.fromEntries(
    Object.entries(config).map(([key, value]) => [
      key,
      typeof value === 'string' ? unquote(value) : value,
    ]),
  );

  const result = envValidationSchema.validate(normalized, {
    allowUnknown: true,
    abortEarly: false,
  }) as Joi.ValidationResult<Record<string, unknown>>;

  if (result.error) {
    throw new Error(`Config validation error: ${result.error.message}`);
  }

  return result.value;
};
