import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Rent-a-Car API',
      version: '1.0.0',
      description: 'API documentation for the Rent-a-Car application',
    },
    servers: [
      {
        url: 'http://localhost:5000', // Change this to your deployed server URL
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts'], // Path to your API route files
};

const swaggerSpec = swaggerJsdoc(options);

const setupSwagger = (app: Express) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log('Swagger UI is available at /api-docs');
};

export default setupSwagger;
