import type { Config } from './config.interface';

const config: Config = {
  nest: {
    port: 3000,
  },
  cors: {
    enabled: true,
  },
  swagger: {
    enabled: true,
    title: 'Nestjs FTW',
    description: 'The nestjs API description',
    version: '1.5',
    path: 'api',
  },
  security: {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    bcryptSaltOrRound: 10,
  },
};

export default (): Config => config;
