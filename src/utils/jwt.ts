import jwt from 'jsonwebtoken';
import { config } from '../config/environment.js';
import { AuthTokenPayload } from '../types/index.js';

// Configuración de tokens
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

/**
 * Genera un access token JWT
 */
export function generateAccessToken(payload: AuthTokenPayload): string {
  if (!config.JWT_SECRET) {
    throw new Error('JWT_SECRET no está configurado');
  }

  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    issuer: 'micuentaenorden',
    audience: 'micuentaenorden-users'
  });
}

/**
 * Genera un refresh token JWT
 */
export function generateRefreshToken(payload: { userId: string }): string {
  if (!config.JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET no está configurado');
  }

  return jwt.sign(payload, config.JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
    issuer: 'micuentaenorden',
    audience: 'micuentaenorden-refresh'
  });
}

/**
 * Verifica un access token
 */
export function verifyAccessToken(token: string): AuthTokenPayload {
  if (!config.JWT_SECRET) {
    throw new Error('JWT_SECRET no está configurado');
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET, {
      issuer: 'micuentaenorden',
      audience: 'micuentaenorden-users'
    }) as AuthTokenPayload;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expirado');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Token inválido');
    }
    throw new Error('Error al verificar token');
  }
}

/**
 * Verifica un refresh token
 */
export function verifyRefreshToken(token: string): { userId: string } {
  if (!config.JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET no está configurado');
  }

  try {
    const decoded = jwt.verify(token, config.JWT_REFRESH_SECRET, {
      issuer: 'micuentaenorden',
      audience: 'micuentaenorden-refresh'
    }) as { userId: string };

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token expirado');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Refresh token inválido');
    }
    throw new Error('Error al verificar refresh token');
  }
}

/**
 * Extrae el token del header Authorization
 */
export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7); // Remover "Bearer "
}

/**
 * Genera un par de tokens (access + refresh)
 */
export function generateTokenPair(user: {
  id: string;
  email: string;
  role: string;
  organizationId?: string;
}) {
  const accessTokenPayload: AuthTokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId
  };

  const refreshTokenPayload = {
    userId: user.id
  };

  return {
    accessToken: generateAccessToken(accessTokenPayload),
    refreshToken: generateRefreshToken(refreshTokenPayload)
  };
} 