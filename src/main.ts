import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import { ForbiddenExceptionFilter } from './common/forbidden.filter';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;

  app.use(compression());
  app.use(cookieParser());
  app.useGlobalFilters(new ForbiddenExceptionFilter());
  app.useStaticAssets(join(__dirname, '..', 'public'));
  
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
