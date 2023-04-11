import z from 'zod';

const configSchema = z.object({
  PORT: z.coerce.number(),
  NODE_ENV: z.enum(['development', 'test', 'production']),
  VERSION: z.string(),
  IS_DEV: z.boolean(),
  IS_PROD: z.boolean(),
  DATABASE_URI: z.string(),
  LOG_LEVEL: z.string(),
  COOKIE_SECRET: z.string(),

  CORS: z.object({
    ALLOWED_ORIGINS: z.array(z.string())
  }),

  JWT: z.object({
    SIGNATURE: z.string(),
    VALIDITY_IN_DAYS: z.number().positive()
  }),

  MAILING: z.object({
    MAILDEV: z
      .object({
        HOST: z.string(),
        PORT: z.coerce.number()
      })
      .optional()
  })
});

export const config = configSchema.parse({
  PORT: process.env.PORT ?? 5000,
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  VERSION: process.env.npm_package_version,
  IS_DEV: process.env.NODE_ENV === 'development',
  IS_PROD: process.env.NODE_ENV === 'production',
  DATABASE_URI: process.env.DB_URI,
  LOG_LEVEL:
    process.env.LOG_LEVEL ??
    (process.env.NODE_ENV === 'development' ? 'debug' : 'warn'),
  COOKIE_SECRET: process.env.COOKIE_SECRET,

  CORS: {
    ALLOWED_ORIGINS: [process.env.FRONT_URL]
  },

  JWT: {
    SIGNATURE: process.env.JWT_SIGNATURE,
    VALIDITY_IN_DAYS: 1
  },

  MAILING: {
    MAILDEV:
      process.env.MAILDEV_HOST && process.env.MAILDEV_PORT
        ? { HOST: process.env.MAILDEV_HOST, PORT: process.env.MAILDEV_PORT }
        : undefined
  }
});
