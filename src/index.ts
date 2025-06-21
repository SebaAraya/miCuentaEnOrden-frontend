import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/environment.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';

const app: Application = express();

// Middleware de seguridad
app.use(helmet());
app.use(cors({
  origin: config.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Middleware de logging
app.use(morgan('combined'));

// Middleware de parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'MiCuentaEnOrden API is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/v1', (req, res) => {
  res.json({ 
    message: 'Welcome to MiCuentaEnOrden API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api/v1'
    }
  });
});

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = config.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 MiCuentaEnOrden API server running at http://localhost:${PORT}`);
  console.log(`📊 Environment: ${config.NODE_ENV}`);
  console.log(`💰 Ready to manage your finances!`);
});

export default app; 