import { Global, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { ServiceHttpClient } from './service-http-client.service';

const DEFAULT_TIMEOUT_MS = 5000;

@Global()
@Module({
  imports: [
    HttpModule.register({
      timeout: DEFAULT_TIMEOUT_MS,
    }),
    ConfigModule,
  ],
  providers: [ServiceHttpClient],
  exports: [ServiceHttpClient],
})
export class ServiceHttpModule {}
