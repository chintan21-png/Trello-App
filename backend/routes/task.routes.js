const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createTask,
  getProjectTasks,
  getTaskById,
  updateTask,
  updateTaskPosition,
  deleteTask
} = require('../controllers/task.controller');
const { authMiddleware, projectRoleMiddleware } = require('../middleware/auth.middleware');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Validation rules
const taskValidation = [
  body('title')
    .isLength({ min: 1, max: 200 }).withMessage('Title must be between 1-200 characters')
    .trim()
    .escape(),
  body('description')
    .optional()
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters')
    .trim()
    .escape(),
  body('column')
    .optional()
    .trim()
    .escape(),
  body('assignees')
    .optional()
    .isArray().withMessage('Assignees must be an array'),
  body('dueDate')
    .optional()
    .isISO8601().withMessage('Invalid date format'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority'),
  body('labels')
    .optional()
    .isArray().withMessage('Labels must be an array')
];

const positionValidation = [
  body('column')
    .notEmpty().withMessage('Column is required')
    .trim()
    .escape(),
  body('order')
    .isInt({ min: 0 }).withMessage('Order must be a non-negative integer'),
  body('sourceColumn')
    .optional()
    .trim()
    .escape()
];

// Routes
router.post('/:projectId/tasks', projectRoleMiddleware(), taskValidation, createTask);
router.get('/:projectId/tasks', projectRoleMiddleware(), getProjectTasks);
router.get('/tasks/:id', getTaskById);
router.put('/tasks/:id', taskValidation, updateTask);
router.patch('/tasks/:taskId/position', positionValidation, updateTaskPosition);
router.delete('/tasks/:id', deleteTask);

module.exports = router;