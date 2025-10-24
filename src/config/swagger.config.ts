import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

const API_VERSION = '1.0.0'; // Hardcoded version

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('E-commerce API')
    .setDescription('E-commerce API with wallet and payment integration')
    .setVersion(API_VERSION)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth', // This name here is important for matching up with @ApiBearerAuth() in your controller
    )
    .addTag('auth', 'Authentication endpoints')
    .addTag('wallet', 'Wallet operations')
    .addTag('products', 'Product management')
    .addTag('orders', 'Order processing')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'method',
      docExpansion: 'none',
    },
  });
}
