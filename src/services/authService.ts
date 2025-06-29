import { prisma } from '../config/database.js';
import { hashPassword, verifyPassword, validatePasswordStrength } from '../utils/password.js';
import { generateTokenPair, verifyRefreshToken } from '../utils/jwt.js';
import { 
  LoginRequest, 
  LoginResponse, 
  CreateUserRequest, 
  UpdateUserRequest,
  UserRole 
} from '../types/index.js';
import crypto from 'crypto';

export class AuthService {
  /**
   * Registra un nuevo usuario
   */
  async register(userData: CreateUserRequest, adminUserId?: string): Promise<LoginResponse> {
    // Validar fortaleza de la contraseña
    const passwordValidation = validatePasswordStrength(userData.password);
    if (!passwordValidation.isValid) {
      throw new Error(`Contraseña no válida: ${passwordValidation.errors.join(', ')}`);
    }

    // Verificar que el email no exista
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email.toLowerCase() }
    });

    if (existingUser) {
      throw new Error('Ya existe un usuario con este email');
    }

    // Verificar organización si se proporciona
    if (userData.organizationId) {
      const organization = await prisma.organization.findUnique({
        where: { id: userData.organizationId }
      });

      if (!organization) {
        throw new Error('La organización especificada no existe');
      }
    }

    // Solo admins pueden crear otros admins o colaboradores
    if (userData.role && userData.role !== UserRole.USUARIO_BASICO) {
      if (!adminUserId) {
        throw new Error('Solo un administrador puede crear usuarios con roles especiales');
      }

      const adminUser = await prisma.user.findUnique({
        where: { id: adminUserId }
      });

      if (!adminUser || adminUser.role !== UserRole.ADMIN) {
        throw new Error('Solo un administrador puede crear usuarios con roles especiales');
      }
    }

    // Hashear contraseña
    const hashedPassword = await hashPassword(userData.password);

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        email: userData.email.toLowerCase(),
        passwordHash: hashedPassword,
        name: userData.name,
        role: userData.role || UserRole.USUARIO_BASICO,
        organizationId: userData.organizationId,
        lastLogin: new Date()
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organizationId: true,
        createdAt: true
      }
    });

    // Generar tokens
    const tokens = generateTokenPair({
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId || undefined
    });

    // Guardar refresh token hasheado
    const refreshTokenHash = crypto.createHash('sha256').update(tokens.refreshToken).digest('hex');
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshTokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
        deviceInfo: 'Registration'
      }
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId || undefined
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    };
  }

  /**
   * Inicia sesión de usuario
   */
  async login(loginData: LoginRequest, deviceInfo?: string): Promise<LoginResponse> {
    // Buscar usuario por email
    const user = await prisma.user.findUnique({
      where: { email: loginData.email.toLowerCase() },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            isActive: true
          }
        }
      }
    });

    if (!user) {
      throw new Error('Credenciales inválidas');
    }

    // Verificar que el usuario esté activo
    if (!user.isActive) {
      throw new Error('Usuario inactivo. Contacta al administrador');
    }

    // Verificar que la organización esté activa (si tiene una)
    if (user.organization && !user.organization.isActive) {
      throw new Error('Organización inactiva. Contacta al administrador');
    }

    // Verificar contraseña
    const isPasswordValid = await verifyPassword(loginData.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Credenciales inválidas');
    }

    // Actualizar último login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Generar tokens
    const tokens = generateTokenPair({
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId || undefined
    });

    // Guardar refresh token hasheado
    const refreshTokenHash = crypto.createHash('sha256').update(tokens.refreshToken).digest('hex');
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshTokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
        deviceInfo: deviceInfo || 'Unknown device'
      }
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId || undefined
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    };
  }

  /**
   * Refresca el access token usando un refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      // Verificar refresh token
      const decoded = verifyRefreshToken(refreshToken);
      
      // Hashear el token para buscarlo en la BD
      const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

      // Buscar el refresh token en la BD
      const storedToken = await prisma.refreshToken.findFirst({
        where: {
          userId: decoded.userId,
          tokenHash: refreshTokenHash,
          isRevoked: false,
          expiresAt: {
            gt: new Date()
          }
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              organizationId: true,
              isActive: true
            }
          }
        }
      });

      if (!storedToken || !storedToken.user.isActive) {
        throw new Error('Refresh token inválido o expirado');
      }

      // Revocar el refresh token usado
      await prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { isRevoked: true }
      });

      // Generar nuevos tokens
      const newTokens = generateTokenPair({
        id: storedToken.user.id,
        email: storedToken.user.email,
        role: storedToken.user.role,
        organizationId: storedToken.user.organizationId || undefined
      });

      // Guardar nuevo refresh token
      const newRefreshTokenHash = crypto.createHash('sha256').update(newTokens.refreshToken).digest('hex');
      await prisma.refreshToken.create({
        data: {
          userId: storedToken.user.id,
          tokenHash: newRefreshTokenHash,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
          deviceInfo: storedToken.deviceInfo
        }
      });

      return newTokens;
    } catch (error) {
      throw new Error('No se pudo refrescar el token');
    }
  }

  /**
   * Cierra sesión revocando el refresh token
   */
  async logout(refreshToken: string): Promise<void> {
    try {
      const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

      await prisma.refreshToken.updateMany({
        where: {
          tokenHash: refreshTokenHash,
          isRevoked: false
        },
        data: {
          isRevoked: true
        }
      });
    } catch (error) {
      // No lanzar error si no se puede revocar el token
      console.warn('No se pudo revocar el refresh token:', error);
    }
  }

  /**
   * Cierra todas las sesiones de un usuario
   */
  async logoutAll(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: {
        userId,
        isRevoked: false
      },
      data: {
        isRevoked: true
      }
    });
  }

  /**
   * Obtiene información del usuario actual
   */
  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organizationId: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        preferences: true,
        organization: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      }
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    return user;
  }

  /**
   * Actualiza información del usuario
   */
  async updateUser(userId: string, updateData: UpdateUserRequest, adminUserId?: string) {
    // Verificar que el usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      throw new Error('Usuario no encontrado');
    }

    // Solo el propio usuario o un admin puede actualizar
    if (userId !== adminUserId) {
      const adminUser = await prisma.user.findUnique({
        where: { id: adminUserId || '' }
      });

      if (!adminUser || adminUser.role !== UserRole.ADMIN) {
        throw new Error('Solo puedes actualizar tu propio perfil o ser administrador');
      }
    }

    // Verificar email único si se está cambiando
    if (updateData.email && updateData.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: updateData.email.toLowerCase() }
      });

      if (emailExists) {
        throw new Error('Ya existe un usuario con este email');
      }
    }

    // Verificar organización si se está cambiando
    if (updateData.organizationId) {
      const organization = await prisma.organization.findUnique({
        where: { id: updateData.organizationId }
      });

      if (!organization) {
        throw new Error('La organización especificada no existe');
      }
    }

    // Actualizar usuario
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(updateData.email && { email: updateData.email.toLowerCase() }),
        ...(updateData.name && { name: updateData.name }),
        ...(updateData.role && { role: updateData.role }),
        ...(updateData.organizationId !== undefined && { organizationId: updateData.organizationId }),
        ...(updateData.preferences && { preferences: updateData.preferences })
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organizationId: true,
        preferences: true,
        updatedAt: true
      }
    });

    return updatedUser;
  }

  /**
   * Limpia refresh tokens expirados
   */
  async cleanupExpiredTokens(): Promise<number> {
    const result = await prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { isRevoked: true }
        ]
      }
    });

    return result.count;
  }
} 