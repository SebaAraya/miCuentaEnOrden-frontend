import { Request } from 'express';

// Re-export de tipos de Prisma
export * from '../generated/prisma/index.js';

// Tipos de respuesta de API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Tipos de autenticación
export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: string;
  organizationId?: string;
}

// Tipo para requests autenticados
export interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    organizationId?: string;
  };
  accessToken: string;
  refreshToken: string;
}

// Tipos de transacciones
export interface CreateTransactionRequest {
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  description: string;
  transactionDate: string; // ISO date string
  categoryId: string;
  recurringPatternId?: string;
  metadata?: Record<string, any>;
}

export interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  type?: 'INCOME' | 'EXPENSE';
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}

// Tipos de presupuestos
export interface CreateBudgetRequest {
  name: string;
  description?: string;
  monthlyAmount: number;
  categoryId: string;
  startDate: string;
  endDate?: string;
  alertThreshold?: number;
}

export interface BudgetStatus {
  budgetId: string;
  budgetName: string;
  monthlyAmount: number;
  spentAmount: number;
  remainingAmount: number;
  percentageUsed: number;
  status: 'UNDER_BUDGET' | 'ON_TRACK' | 'WARNING' | 'EXCEEDED';
  category: {
    id: string;
    name: string;
    icon: string;
    colorHex: string;
  };
}

// Tipos de reportes
export interface MonthlyReport {
  year: number;
  month: number;
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  budgetVariance: number;
  categorySummary: {
    categoryId: string;
    categoryName: string;
    totalAmount: number;
    transactionCount: number;
    budgetAmount?: number;
    budgetUsagePercentage?: number;
  }[];
  budgetStatus: BudgetStatus[];
}

// Tipos de categorías
export interface CreateCategoryRequest {
  name: string;
  description?: string;
  colorHex?: string;
  icon?: string;
}

// Tipos de organización
export interface CreateOrganizationRequest {
  name: string;
  description?: string;
  settings?: Record<string, any>;
}

// Tipos de usuario
export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  role?: 'ADMIN' | 'COLABORADOR' | 'USUARIO_BASICO';
  organizationId?: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: 'ADMIN' | 'COLABORADOR' | 'USUARIO_BASICO';
  organizationId?: string;
  preferences?: Record<string, any>;
}

// Tipos de permisos compartidos
export interface CreateSharedPermissionRequest {
  sharedWithUserId: string;
  resourceType: 'TRANSACTION' | 'BUDGET' | 'CATEGORY' | 'REPORT';
  resourceId: string;
  permissionType: 'READ' | 'WRITE' | 'ADMIN';
  expiresAt?: string;
}

// Tipos de patrones recurrentes
export interface CreateRecurringPatternRequest {
  name: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  intervalValue: number;
  startDate: string;
  endDate?: string;
  frequencyConfig?: Record<string, any>;
}

// Tipos de validación
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// Tipos de query parameters
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface QueryParams extends PaginationParams, SortParams {
  search?: string;
  filters?: Record<string, any>;
} 