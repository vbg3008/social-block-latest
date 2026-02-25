import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "SocialBlock API",
      version: "1.0.0",
      description: "API documentation for the SocialBlock Next.js REST API suite."
    },
    servers: [
      {
        url: "/api",
        description: "Local development server",
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "token",
          description: "JWT token stored in HTTP-only cookie"
        },
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      }
    },
    security: [
      { cookieAuth: [] },
      { bearerAuth: [] }
    ],
  },
  apis: [
    './app/api/**/*.ts'
  ],
};

export const swaggerSpec = swaggerJSDoc(options);
