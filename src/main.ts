import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['http://localhost:3000', 'https://mypymeapp-front.vercel.app'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('MyPymeApp API')
    .setDescription('MyPymeApp API description')
    .setVersion('1.0')
    .build();
  const documentFactory = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory, {
    swaggerOptions: {
      docExpansion: 'none',
    },
  });

     // ⚡ Para que Stripe funcione con webhooks
  app.use(
    '/payments/webhooks/stripe',
    bodyParser.raw({ type: 'application/json' }), // importante: raw body
  );

  app.use(cookieParser());

  await app.listen(process.env.PORT ?? 5001);
}
bootstrap();

