import * as Joi from 'joi';
export const envValidationSchema = Joi.object({
  // App
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().port().empty('').default(3000),
  // Nº de proxies na frente da app. Vazio = desligado.
  TRUST_PROXY: Joi.string().allow('').default(''),

  // PostgreSQL
  DB_HOST: Joi.string().empty('').default('localhost'),
  DB_PORT: Joi.number().port().empty('').default(5432),
  POSTGRES_USER: Joi.string().empty('').default('postgres'),
  POSTGRES_PASSWORD: Joi.string().empty('').default('postgres'),
  POSTGRES_DB: Joi.string().empty('').default('mylibrary'),

  // Redis
  REDIS_HOST: Joi.string().empty('').default('localhost'),
  REDIS_PORT: Joi.number().port().empty('').default(6379),
  REDIS_PASSWORD: Joi.string().allow('').default(''),

  // CORS (origens separadas por vírgula)
  CORS_ORIGIN: Joi.string().empty('').default('http://localhost:4200'),

  // Sessão / Cookie
  COOKIE_NAME: Joi.string().empty('').default('mylibrarycookie'),
  SESSION_SECRET: Joi.string()
    .empty('')
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.required(),
      otherwise: Joi.string().default('dev-session-secret-change-me'),
    }),
  // Vazio = secure só em produção.
  COOKIE_SECURE: Joi.string().valid('true', 'false').allow('').default(''),
  COOKIE_SAMESITE: Joi.string().valid('lax', 'strict', 'none').default('lax'),

  // Bcrypt
  SALT: Joi.number().empty('').default(10),

  // Admin inicial — usado pelo seeder (processo separado, via dotenv).
  // Aqui só declarado para documentar/validar formato quando presente.
  ADMIN_USERNAME: Joi.string().allow(''),
  ADMIN_PASSWORD: Joi.string().allow(''),
  ADMIN_EMAIL: Joi.string().email().allow(''),

  // S3 / Garage
  S3_REGION: Joi.string().empty('').default('garage'),
  S3_BUCKET: Joi.string().empty('').default('images'),
  S3_API_URL: Joi.string().allow('').default(''),
  S3_WEB_URL: Joi.string().allow('').default(''),
  S3_KEY_ID: Joi.string().allow('').default(''),
  S3_SECRET_KEY: Joi.string().allow('').default(''),
  S3_PATH_STYLE: Joi.string().valid('true', 'false').empty('').default('false'),
});
