import multipart from "@fastify/multipart";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import fastify, { FastifyInstance, FastifyServerOptions } from "fastify";
import { AppModule } from "./app.module";

async function bootstrap() {
  const serverOptions: FastifyServerOptions = { logger: false };
  const instance: FastifyInstance = fastify(serverOptions);

  // Register multipart/form-data support
  await instance.register(multipart, {
    limits: {
      fileSize: 1024 * 1024 * 1024, // 1GB max
    },
  });

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(instance)
  );

  // Configuration CORS
  const corsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",").map((origin) => origin.trim())
    : process.env.NODE_ENV === "production"
    ? []
    : true; // Allow all origins in development

  app.enableCors({
    origin: corsOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Content-Language"],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      validateCustomDecorators: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // Configuration Swagger
  const swagger = new DocumentBuilder()
    .setTitle("Voxya API")
    .setDescription("API de gestion de carnet de contacts")
    .setVersion("1.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        name: "JWT",
        description: "Enter JWT token",
        in: "header",
      },
      "JWT-auth", // This name matches @ApiBearerAuth() in controllers
    )
    .build();

  const document = SwaggerModule.createDocument(app, swagger);
  SwaggerModule.setup("doc", app, document);

  await app.listen(process.env.PORT || 3003, "0.0.0.0");
}
bootstrap();
