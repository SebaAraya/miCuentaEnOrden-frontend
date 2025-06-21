import { Request, Response, NextFunction } from 'express';
import { config } from '../config/environment.js';

interface CustomError extends Error {
  status?: number;
  statusCode?: number;
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  // Log error in development
  if (config.NODE_ENV === 'development') {
    console.error('❌ Error:', {
      status,
      message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  }
  
  // Don't leak error details in production
  const response = {
    error: {
      status,
      message: config.NODE_ENV === 'production' && status === 500 
        ? 'Something went wrong!' 
        : message,
      ...(config.NODE_ENV === 'development' && { stack: err.stack })
    }
  };
  
  res.status(status).json(response);
}; 