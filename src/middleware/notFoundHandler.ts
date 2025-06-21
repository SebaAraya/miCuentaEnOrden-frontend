import { Request, Response, NextFunction } from 'express';

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = {
    status: 404,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableEndpoints: {
      health: 'GET /health',
      api: 'GET /api/v1'
    }
  };
  
  res.status(404).json({ error });
}; 