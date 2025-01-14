module.exports = [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  /*  'strapi::cors', */
  /*   {
      name: 'strapi::cors',
      config: {
        origin: ['http://localhost:3000'], // Cambia esto por la URL de tu frontend
        credentials: true,
      },
    }, */

  {
    name: 'strapi::cors',
    config: {
      origin: process.env.NODE_ENV === 'production'
        ? ['https://docmentor-unl.vercel.app']
        : ['http://localhost:3000'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      exposedHeaders: [],
      credentials: true,
      maxAge: 3600,
    },
  },
  {
    name: '@strapi/plugin-users-permissions::rateLimit',
    config: {
      interval: 60000, // 1 minuto en milisegundos
      max: 200, // Permite hasta 200 solicitudes por IP en 1 minuto
      message: 'Too many requests, please try again later.',
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
