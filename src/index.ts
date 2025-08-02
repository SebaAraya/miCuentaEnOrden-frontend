import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/environment.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { prisma } from './config/database.js';
import { seedDefaultCategories } from './utils/seedCategories.js';

import authRoutes from './routes/authRoutes.js'
import financialRoutes from './routes/financialRoutes.js';
import organizationRoutes from './routes/organizationRoutes.js';
import userRoutes from './routes/userRoutes.js';
import budgetRoutes from './routes/budgetRoutes.js';

const app: Application = express();

// Obtener directorio actual para servir archivos estáticos
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware de seguridad
app.use(helmet({
  contentSecurityPolicy: false // Necesario para servir el HTML inline CSS/JS
}));
app.use(cors({
  origin: config.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Middleware de logging
app.use(morgan('combined'));

// Middleware de parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '../public')));

// Health check con verificación de base de datos
app.get('/health', async (req, res) => {
  try {
    // Verificar conexión a la base de datos
    await prisma.$queryRaw`SELECT 1`;
    
    // Obtener estadísticas básicas
    const stats = await Promise.all([
      prisma.user.count(),
      prisma.transaction.count(),
      prisma.category.count(),
      prisma.budget.count()
    ]);

    res.json({ 
      status: 'OK', 
      message: 'MiCuentaEnOrden API is running',
      database: 'Connected',
      stats: {
        users: stats[0],
        transactions: stats[1],
        categories: stats[2],
        budgets: stats[3]
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/financial', financialRoutes);
app.use('/api/v1/organizations', organizationRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/budgets', budgetRoutes);

// Rutas financieras básicas
/* app.get('/api/v1/financial/transactions', async (req, res) => {
  try {
    const { page = '1', limit = '20' } = req.query
    const pageNum = parseInt(page as string) || 1
    const limitNum = Math.min(parseInt(limit as string) || 20, 100)
    const skip = (pageNum - 1) * limitNum

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        include: {
          category: {
            select: {
              id: true,
              name: true,
              colorHex: true,
              icon: true
            }
          },
          user: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { transactionDate: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.transaction.count()
    ])

    // Convertir Decimal a string para JSON
    const transactionsWithStringAmounts = transactions.map(transaction => ({
      ...transaction,
      amount: transaction.amount.toString()
    }))

    res.json({
      success: true,
      data: {
        transactions: transactionsWithStringAmounts,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      },
      message: 'Transacciones obtenidas exitosamente'
    })
  } catch (error) {
    console.error('Error getting transactions:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}); */

// Ruta de bienvenida de la API
app.use('/api/v1', (req, res) => {
  res.json({ 
    message: 'Welcome to MiCuentaEnOrden API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/v1/auth',
      financial: '/api/v1/financial',
      organizations: '/api/v1/organizations',
      users: '/api/v1/users',
      budgets: '/api/v1/budgets',
      api: '/api/v1',
      docs: '/api/v1/docs' // Para futura documentación
    }
  });
});

// Servir login como página principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = config.PORT || 3100;

// Función para iniciar el servidor
async function startServer() {
  try {
    // Verificar conexión a la base de datos al iniciar
    await prisma.$connect();
    console.log('🔌 Conectado a PostgreSQL exitosamente');
    
    // Ejecutar seed de categorías por defecto
    await seedDefaultCategories();
    
    app.listen(PORT, () => {
      console.log(`🚀 MiCuentaEnOrden API server running at http://localhost:${PORT}`);
      console.log(`📊 Environment: ${config.NODE_ENV}`);
      console.log(`💾 Database: ${config.DATABASE_URL?.split('@')[1] || 'PostgreSQL'}`);
      console.log(`💰 Ready to manage your finances!`);
      console.log(`\n🔗 Endpoints disponibles:`);
      console.log(`   - Health Check: http://localhost:${PORT}/health`);
      console.log(`   - API Root: http://localhost:${PORT}/api/v1`);
    });
  } catch (error) {
    console.error('❌ Error al conectar con la base de datos:', error);
    process.exit(1);
  }
}

// Manejo de señales para cierre graceful
process.on('SIGINT', async () => {
  console.log('\n🛑 Recibida señal SIGINT, cerrando servidor...');
  await prisma.$disconnect();
  console.log('🔌 Desconectado de la base de datos');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Recibida señal SIGTERM, cerrando servidor...');
  await prisma.$disconnect();
  console.log('🔌 Desconectado de la base de datos');
  process.exit(0);
});

// Iniciar servidor
startServer();

export default app; 