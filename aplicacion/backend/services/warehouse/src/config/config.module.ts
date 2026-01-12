// config/config.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

const validationSchema = Joi.object({
    NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
    PORT: Joi.number().default(3000),
    DATABASE_URL: Joi.string().required(),
    JWT_SECRET: Joi.string().required(),
    JWT_EXPIRES_IN: Joi.string().default('1h'),
});

@Module({
    imports: [
        NestConfigModule.forRoot({
            isGlobal: true,
            validationSchema,
        }),
    ],
    exports: [NestConfigModule],
})
export class ConfigModule { }