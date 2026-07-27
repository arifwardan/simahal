import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  await app.listen(3001);
  console.log(`🚀 Server SiMahal API berjalan di: http://localhost:3001/api`);
}
bootstrap();