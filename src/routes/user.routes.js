const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { protect, adminOnly } = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

router.use(protect);

// Driver profile routes
router.get('/me', userController.getMyProfile);
router.put('/profile', userController.updateProfile);
router.put('/change-password', userController.changePassword);
router.put('/location', userController.updateLocation);

// Admin routes
router.get('/', roleMiddleware('admin'), userController.getAllUsers);
router.get('/:id/location', userController.getDriverLocation);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.delete('/:id', roleMiddleware('admin'), userController.deleteUser);

module.exports = router;