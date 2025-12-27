const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  register,
  login,
  getCurrentUser,
  updateProfile,
  changePassword,
  getUsers,
  getUserById,
  logout,
  checkUsernameAvailability,
  checkEmailAvailability
} = require('../controllers/auth.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');

// Validation rules
const registerValidation = [
  body('username')
    .isLength({ min: 3 }).withMessage('Username must be at least 3 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores')
    .trim()
    .escape(),
  body('email')
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/).withMessage('Password must contain at least one letter and one number'),
  body('role')
    .optional()
    .isIn(['admin', 'project_manager', 'member', 'viewer'])
    .withMessage('Invalid role')
];

const loginValidation = [
  body('email')
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/).withMessage('Password must contain at least one letter and one number')
];

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/check-username', checkUsernameAvailability);
router.get('/check-email', checkEmailAvailability);

// Protected routes (require authentication)
router.use(authMiddleware);

router.get('/me', getCurrentUser);
router.put('/profile', updateProfile);
router.put('/change-password', changePasswordValidation, changePassword);
router.post('/logout', logout);
router.get('/users', roleMiddleware('admin', 'project_manager'), getUsers);
router.get('/users/:id', getUserById);

module.exports = router;