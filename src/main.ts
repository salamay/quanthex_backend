import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { JwtAuthGuard } from './auth/jwt/jwt_auth_guard';
import { MyInterceptorsInterceptor } from './my_interceptors/my_interceptors.interceptor';

async function bootstrap() {
  (BigInt.prototype as any).toJSON = function () {
    return this.toString();
  };
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalGuards(new JwtAuthGuard());
  app.useGlobalInterceptors(new MyInterceptorsInterceptor());
  await app.listen(process.env.PORT ?? 5790);
}
bootstrap();
