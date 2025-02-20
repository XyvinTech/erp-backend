const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { version } = require('../package.json');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Xyvin ERP API Documentation',
      version: version,
      description: 'API documentation for Xyvin ERP system',
      contact: {
        name: 'API Support',
        email: 'support@xyvin-erp.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}`,
        description: 'Development server'
      },
      {
        url: process.env.PRODUCTION_API_URL,
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    example: 'Unauthorized'
                  }
                }
              }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    example: 'Resource not found'
                  }
                }
              }
            }
          }
        }
      }
    },
    security: [{
      bearerAuth: []
    }],
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Users', description: 'User management endpoints' },
      { name: 'Departments', description: 'Department management endpoints' },
      { name: 'Positions', description: 'Position management endpoints' },
      { name: 'Employees', description: 'Employee management endpoints' }
    ]
  },
  apis: [
    './swagger/schemas/*.yaml',
    './swagger/paths/*.yaml',
    './swagger/tags/*.yaml'
  ]
};

const swaggerSpec = swaggerJsDoc(options);

const setupSwagger = (app) => {
  // Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Xyvin ERP API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true
    }
  }));

  // Serve swagger spec as JSON
  app.get('/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};

module.exports = { setupSwagger, swaggerSpec }; 