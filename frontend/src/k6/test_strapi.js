import http from 'k6/http';
import { check, sleep, Counter, Trend } from 'k6';
import exec from 'k6/execution';

// Métricas personalizadas
//const responseTime = new Trend('custom_response_time', true);
const requestErrors = new Counter('custom_request_errors');
const successfulLogins = new Counter('successful_logins');
const failedLogins = new Counter('failed_logins');

// Configuración base
const BASE_URL = 'https://revisor-documental-production.up.railway.app';

// Configuración de la prueba
export const options = {
  stages: [
    { duration: '2m', target: 10 },
    { duration: '5m', target: 50 },
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    custom_request_errors: ['count<10'], // No más de 10 errores
  },
};

// Credenciales de prueba
const users = {
  estudiante: {
    identifier: 'cristian.capa20@gmail.com',
    password: 'capa1234',
  },
  tutor: {
    identifier: 'juan.f.castillo.e1@unl.edu.ec',
    password: 'admin1234',
  },
};

/* export function setup() {
  const sessions = {};

  // Login para estudiante
  const studentLogin = http.post(
    `${BASE_URL}/api/auth/local`,
    JSON.stringify(users.estudiante),
    { headers: { 'Content-Type': 'application/json' } }
  );

  if (studentLogin.status === 200) {
    sessions.estudiante = {
      jwt: studentLogin.json().jwt,
      rol: 'estudiante',
    };
  } else {
    console.error('Error en login de estudiante:', studentLogin.status, studentLogin.body);
  }

  // Login para tutor
  const tutorLogin = http.post(
    `${BASE_URL}/api/auth/local`,
    JSON.stringify(users.tutor),
    { headers: { 'Content-Type': 'application/json' } }
  );

  if (tutorLogin.status === 200) {
    sessions.tutor = {
      jwt: tutorLogin.json().jwt,
      rol: 'tutor',
    };
  } else {
    console.error('Error en login de tutor:', tutorLogin.status, tutorLogin.body);
  }

  if (!sessions.estudiante || !sessions.tutor) {
    console.error('No se pudo obtener la sesión para uno o ambos usuarios');
    return null; // Asegúrate de devolver null si no hay sesiones válidas
  }

  return sessions; // Retorna solo si las sesiones son válidas
} */



// Función principal
/* export default function (sessions) {
  if (!sessions) {
    console.error('Las sesiones no fueron inicializadas correctamente');
    return;
  }

  if (!sessions.estudiante || !sessions.tutor) {
    console.error('No hay sesiones válidas para el estudiante o el tutor');
    return;
  }
  
  const rol = exec.scenario.iterationInInstance % 2 === 0 ? 'estudiante' : 'tutor';

  if (!sessions[rol]) {
    console.error(`No hay sesión válida para el rol: ${rol}`);
    return;
  }

  const headers = {
    Authorization: `Bearer ${sessions[rol].jwt}`,
    'Content-Type': 'application/json',
  };

  const ids = {
    projects: [2, 3],
    documents: [1, 2],
    comments: [1, 2],
  };

  try {
    const randomValue = Math.random();
    if (randomValue < 0.4) {
      performGetRequests(headers);
    } else if (randomValue < 0.7) {
      performPostRequests(rol, headers);
    } else {
      performPutRequests(rol, headers, ids);
    }
  } catch (error) {
    console.error(`Error en iteración para rol ${rol}:`, error);
    requestErrors.add(1);
  }

  sleep(1);
}
 */
// Función para solicitudes GET
function performGetRequests(headers) {
  const getEndpoints = [
    { name: 'List Projects', url: '/api/projects' },
    { name: 'List Documents', url: '/api/documents' },
    { name: 'View Document with Comments', url: '/api/documents?populate=comments' },
    { name: 'View Notifications', url: '/api/notifications' },
  ];

  getEndpoints.forEach((endpoint) => {
    const response = http.get(`${BASE_URL}${endpoint.url}`, { headers });
    responseTime.add(response.timings.duration);
    check(response, {
      [`${endpoint.name} status 200`]: (r) => r.status === 200,
    }) || requestErrors.add(1);
  });
}

// Función para solicitudes POST
function performPostRequests(rol, headers) {
  const postEndpoints = {
    estudiante: [
      {
        name: 'Create Project',
        url: '/api/projects',
        payload: JSON.stringify({
          data: {
            title: 'Nuevo Proyecto',
            description: 'Descripción de prueba del proyecto',
            projectType: 'Desarrollo',
            itinerary: 'Desarrollo de Software',
          },
        }),
      },
      {
        name: 'Create Document',
        url: '/api/documents',
        payload: JSON.stringify({
          data: {
            title: 'test document',
            project: 20,
            isRevised: false,
          },
        }),
      },
    ],
    tutor: [
      {
        name: 'Add Comment',
        url: '/api/comments',
        payload: JSON.stringify({
          data: {
            correction: 'Test comment',
          },
        }),
      },
    ],
  };

  postEndpoints[rol].forEach((endpoint) => {
    const response = http.post(`${BASE_URL}${endpoint.url}`, endpoint.payload, { headers });
    responseTime.add(response.timings.duration);
    check(response, {
      [`${endpoint.name} status 200`]: (r) => r.status === 200,
    }) || requestErrors.add(1);
  });
}

// Función para solicitudes PUT
function performPutRequests(rol, headers, ids) {
  const putEndpoints = {
    estudiante: [
      {
        name: 'Update Project',
        url: `/api/projects/${ids.projects[0]}`,
        payload: JSON.stringify({
          data: {
            title: 'Proyecto Actualizado',
            description: 'Descripción actualizada del proyecto',
            projectType: 'Desarrollo',
            itinerary: 'Desarrollo de Software',
          },
        }),
      },
    ],
    tutor: [
      {
        name: 'Update Comment',
        url: `/api/comments/${ids.comments[0]}`,
        payload: JSON.stringify({
          data: {
            correction: 'Test comment updated',
          },
        }),
      },
      {
        name: 'Update Document Status Revisado',
        url: `/api/documents/${ids.documents[0]}`,
        payload: JSON.stringify({
          data: {
            isRevised: true,
          },
        }),
      },
    ],
  };

  putEndpoints[rol].forEach((endpoint) => {
    const response = http.put(`${BASE_URL}${endpoint.url}`, endpoint.payload, { headers });
    responseTime.add(response.timings.duration);
    check(response, {
      [`${endpoint.name} status 200`]: (r) => r.status === 200,
    }) || requestErrors.add(1);
  });
}
