import { PrismaClient, UserRole, TransactionType } from '../generated/prisma/index.js';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Limpiar datos existentes (solo en desarrollo)
  if (process.env.NODE_ENV === 'development') {
    console.log('🧹 Limpiando datos existentes...');
    await prisma.transaction.deleteMany();
    await prisma.budget.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();
    await prisma.organization.deleteMany();
  }

  // 1. Crear organización de prueba
  console.log('🏢 Creando organización de prueba...');
  const organization = await prisma.organization.create({
    data: {
      name: 'MiCuentaEnOrden Demo',
      description: 'Organización de demostración para MiCuentaEnOrden',
      settings: {
        currency: 'CLP',
        timezone: 'America/Santiago',
        features: ['budgets', 'reports', 'collaboration']
      }
    }
  });

  // 2. Crear categorías predefinidas
  console.log('📋 Creando categorías predefinidas...');
  const categories = [
    { name: 'Alimentación', icon: '🍽️', colorHex: '#10b981', description: 'Compras de comida y restaurantes' },
    { name: 'Transporte', icon: '🚗', colorHex: '#3b82f6', description: 'Combustible, transporte público, mantención' },
    { name: 'Vivienda', icon: '🏠', colorHex: '#8b5cf6', description: 'Arriendo, servicios básicos, mantención hogar' },
    { name: 'Salud', icon: '🏥', colorHex: '#ef4444', description: 'Medicamentos, consultas médicas, seguros' },
    { name: 'Entretenimiento', icon: '🎬', colorHex: '#f59e0b', description: 'Cine, streaming, actividades recreativas' },
    { name: 'Educación', icon: '📚', colorHex: '#06b6d4', description: 'Cursos, libros, material educativo' },
    { name: 'Ropa', icon: '👕', colorHex: '#ec4899', description: 'Vestimenta y accesorios' },
    { name: 'Ahorros', icon: '💰', colorHex: '#22c55e', description: 'Inversiones y ahorros' },
    { name: 'Servicios', icon: '🔧', colorHex: '#6b7280', description: 'Internet, teléfono, suscripciones' },
    { name: 'Tecnología', icon: '💻', colorHex: '#4f46e5', description: 'Dispositivos, software, apps' },
    { name: 'Mascotas', icon: '🐕', colorHex: '#f97316', description: 'Comida, veterinario, accesorios para mascotas' },
    { name: 'Otros', icon: '📦', colorHex: '#64748b', description: 'Gastos varios no categorizados' }
  ];

  const createdCategories = await Promise.all(
    categories.map(category =>
      prisma.category.create({
        data: {
          ...category,
          isDefault: true,
          organizationId: organization.id
        }
      })
    )
  );

  // 3. Crear usuarios de prueba
  console.log('👥 Creando usuarios de prueba...');
  const passwordHash = await bcrypt.hash('123456', 12);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@micuentaenorden.com',
      passwordHash,
      name: 'Administrador Demo',
      role: UserRole.ADMIN,
      organizationId: organization.id,
      preferences: {
        theme: 'light',
        notifications: true,
        currency: 'CLP'
      }
    }
  });

  const colaboradorUser = await prisma.user.create({
    data: {
      email: 'colaborador@micuentaenorden.com',
      passwordHash,
      name: 'Colaborador Demo',
      role: UserRole.COLABORADOR,
      organizationId: organization.id,
      preferences: {
        theme: 'dark',
        notifications: true,
        currency: 'CLP'
      }
    }
  });

  const basicUser = await prisma.user.create({
    data: {
      email: 'usuario@micuentaenorden.com',
      passwordHash,
      name: 'Usuario Básico Demo',
      role: UserRole.USUARIO_BASICO,
      organizationId: organization.id
    }
  });

  // 4. Crear presupuestos de ejemplo
  console.log('💳 Creando presupuestos de ejemplo...');
  const budgets = [
    { name: 'Presupuesto Alimentación', monthlyAmount: 150000, categoryName: 'Alimentación', userId: adminUser.id },
    { name: 'Presupuesto Transporte', monthlyAmount: 80000, categoryName: 'Transporte', userId: adminUser.id },
    { name: 'Presupuesto Entretenimiento', monthlyAmount: 50000, categoryName: 'Entretenimiento', userId: colaboradorUser.id },
    { name: 'Presupuesto Salud', monthlyAmount: 40000, categoryName: 'Salud', userId: basicUser.id }
  ];

  await Promise.all(
    budgets.map(async budget => {
      const category = createdCategories.find(cat => cat.name === budget.categoryName);
      if (category) {
        return prisma.budget.create({
          data: {
            name: budget.name,
            description: `Presupuesto mensual para ${budget.categoryName.toLowerCase()}`,
            monthlyAmount: budget.monthlyAmount,
            categoryId: category.id,
            userId: budget.userId,
            startDate: new Date('2025-01-01'),
            alertThreshold: 80.0
          }
        });
      }
    })
  );

  // 5. Crear transacciones de ejemplo
  console.log('💸 Creando transacciones de ejemplo...');
  const currentDate = new Date();
  const transactions = [
    // Transacciones del admin
    { amount: 25000, type: TransactionType.EXPENSE, description: 'Supermercado Jumbo', categoryName: 'Alimentación', userId: adminUser.id, daysAgo: 1 },
    { amount: 15000, type: TransactionType.EXPENSE, description: 'Combustible', categoryName: 'Transporte', userId: adminUser.id, daysAgo: 2 },
    { amount: 8000, type: TransactionType.EXPENSE, description: 'Almuerzo trabajo', categoryName: 'Alimentación', userId: adminUser.id, daysAgo: 3 },
    { amount: 1200000, type: TransactionType.INCOME, description: 'Sueldo enero', categoryName: 'Otros', userId: adminUser.id, daysAgo: 5 },
    
    // Transacciones del colaborador
    { amount: 12000, type: TransactionType.EXPENSE, description: 'Netflix suscripción', categoryName: 'Entretenimiento', userId: colaboradorUser.id, daysAgo: 1 },
    { amount: 35000, type: TransactionType.EXPENSE, description: 'Cena restaurante', categoryName: 'Entretenimiento', userId: colaboradorUser.id, daysAgo: 4 },
    { amount: 800000, type: TransactionType.INCOME, description: 'Freelance proyecto', categoryName: 'Otros', userId: colaboradorUser.id, daysAgo: 7 },
    
    // Transacciones del usuario básico
    { amount: 18000, type: TransactionType.EXPENSE, description: 'Farmacia medicamentos', categoryName: 'Salud', userId: basicUser.id, daysAgo: 2 },
    { amount: 22000, type: TransactionType.EXPENSE, description: 'Consulta médica', categoryName: 'Salud', userId: basicUser.id, daysAgo: 6 },
    { amount: 600000, type: TransactionType.INCOME, description: 'Sueldo part-time', categoryName: 'Otros', userId: basicUser.id, daysAgo: 8 }
  ];

  await Promise.all(
    transactions.map(async transaction => {
      const category = createdCategories.find(cat => cat.name === transaction.categoryName);
      if (category) {
        const transactionDate = new Date(currentDate);
        transactionDate.setDate(currentDate.getDate() - transaction.daysAgo);
        
        return prisma.transaction.create({
          data: {
            amount: transaction.amount,
            type: transaction.type,
            description: transaction.description,
            transactionDate,
            categoryId: category.id,
            userId: transaction.userId,
            metadata: {
              source: 'seed',
              tags: ['demo']
            }
          }
        });
      }
    })
  );

  console.log('✅ Seed completado exitosamente!');
  console.log('\n📊 Datos creados:');
  console.log(`- 1 organización: ${organization.name}`);
  console.log(`- ${createdCategories.length} categorías predefinidas`);
  console.log(`- 3 usuarios de prueba (admin, colaborador, básico)`);
  console.log(`- ${budgets.length} presupuestos de ejemplo`);
  console.log(`- ${transactions.length} transacciones de ejemplo`);
  console.log('\n🔑 Credenciales de prueba:');
  console.log('- admin@micuentaenorden.com / 123456');
  console.log('- colaborador@micuentaenorden.com / 123456');
  console.log('- usuario@micuentaenorden.com / 123456');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 