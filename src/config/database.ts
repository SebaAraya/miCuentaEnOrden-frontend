import { PrismaClient } from '../generated/prisma/index.js';

// Configuración del cliente Prisma con logging según el entorno
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['info', 'warn', 'error']
    : ['error'],
  errorFormat: 'pretty',
});

// Middleware para logging de queries lentas en desarrollo
if (process.env.NODE_ENV === 'development') {
  prisma.$use(async (params, next) => {
    const before = Date.now();
    const result = await next(params);
    const after = Date.now();
    
    const queryTime = after - before;
    if (queryTime > 1000) { // Queries que toman más de 1 segundo
      console.log(`🐌 Query lenta detectada: ${params.model}.${params.action} - ${queryTime}ms`);
    }
    
    return result;
  });
}

// El manejo de conexión y desconexión se hace en index.ts

export { prisma };
export default prisma; 