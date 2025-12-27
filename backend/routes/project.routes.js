const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  addMemberToProject,
  removeMemberFromProject,
  deleteProject
} = require('../controllers/project.controller');
const { authMiddleware, projectRoleMiddleware } = require('../middleware/auth.middleware');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Validation rules
const projectValidation = [
  body('name')
    .isLength({ min: 1, max: 100 }).withMessage('Project name must be between 1-100 characters')
    .trim()
    .escape(),
  body('description')
    .optional()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters')
    .trim()
    .escape(),
  body('columns')
    .optional()
    .isArray().withMessage('Columns must be an array'),
  body('settings')
    .optional()
    .isObject().withMessage('Settings must be an object')
];

const memberValidation = [
  body('userId')
    .isMongoId().withMessage('Invalid user ID'),
  body('role')
    .optional()
    .isIn(['admin', 'project_manager', 'member', 'viewer'])
    .withMessage('Invalid role')
];

// Routes
router.post('/', projectValidation, createProject);
router.get('/', getProjects);
router.get('/:id', getProjectById);
router.put('/:id', projectRoleMiddleware(['admin', 'project_manager']), projectValidation, updateProject);
router.post('/:id/members', projectRoleMiddleware(['admin', 'project_manager']), memberValidation, addMemberToProject);
router.delete('/:id/members/:userId', projectRoleMiddleware(['admin', 'project_manager']), removeMemberFromProject);
router.delete('/:id', projectRoleMiddleware(['admin']), deleteProject);

module.exports = router;