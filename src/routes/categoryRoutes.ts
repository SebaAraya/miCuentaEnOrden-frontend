import { Router } from 'express'
import { authenticateToken } from '../middleware/auth.js'
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/categoryController.js'

const router = Router()

// Rutas de categorías (todas requieren autenticación)
router.get('/', authenticateToken, getCategories as any)
router.get('/:id', authenticateToken, getCategoryById as any)
router.post('/', authenticateToken, createCategory as any)
router.put('/:id', authenticateToken, updateCategory as any)
router.delete('/:id', authenticateToken, deleteCategory as any)

export default router 