import * as Joi from 'joi';

/**
 * Schema de validación para variables de entorno
 * SEGURIDAD: JWT_SECRET y JWT_REFRESH_SECRET son obligatorios y deben tener mínimo 32 caracteres
 */
export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3001),
  DATABASE_URL: Joi.string().required().messages({
    'any.required': 'DATABASE_URL es requerido para conectar a PostgreSQL',
  }),
  
  // JWT_SECRET obligatorio - mínimo 32 caracteres para seguridad
  JWT_SECRET: Joi.string()
    .min(32)
    .required()
    .messages({
      'any.required': 'JWT_SECRET es requerido. Genere uno con: openssl rand -base64 32',
      'string.min': 'JWT_SECRET debe tener mínimo 32 caracteres para seguridad adecuada',
    }),
  
  // JWT_REFRESH_SECRET obligatorio - mínimo 32 caracteres
  JWT_REFRESH_SECRET: Joi.string()
    .min(32)
    .required()
    .messages({
      'any.required': 'JWT_REFRESH_SECRET es requerido. Genere uno con: openssl rand -base64 32',
      'string.min': 'JWT_REFRESH_SECRET debe tener mínimo 32 caracteres para seguridad adecuada',
    }),
  
  JWT_EXPIRES_IN: Joi.string().default('1h'),
  ACCESS_TOKEN_TTL: Joi.string().default('12h'),
  REFRESH_TOKEN_TTL: Joi.string().default('7d'),
  CORS_ORIGIN: Joi.string().optional(),
  SINGLE_SESSION: Joi.string().valid('true', 'false').default('false'),
});
