const express = require('express');
const router = express.Router();
const {
  getAllTasks,
  getTaskById,
  createTask,
  createBulkTasks,
  assignTask,
  assignBatchTasks,
  getMyTasks,
  updateTaskStatus,
  uploadProof,
} = require('../controllers/task.controller');
const { protect, adminOnly } = require('../middlewares/auth.middleware');
const { upload } = require('../config/cloudinary');

router.use(protect);

// ====== DRIVER (static paths first) ======
router.get('/my', getMyTasks);                                        // GET   /tasks/my
router.patch('/:id/status', updateTaskStatus);                        // PATCH /tasks/:id/status
router.put('/:id/upload-proof', upload.single('image'), uploadProof); // PUT   /tasks/:id/upload-proof

// ====== ADMIN ======
router.get('/', adminOnly, getAllTasks);              // GET    /tasks
router.get('/:id', adminOnly, getTaskById);           // GET    /tasks/:id
router.post('/', adminOnly, createTask);              // POST   /tasks
router.post('/bulk', adminOnly, createBulkTasks);     // POST   /tasks/bulk
router.patch('/:id/assign', adminOnly, assignTask);   // PATCH  /tasks/:id/assign
router.patch('/assign-batch', adminOnly, assignBatchTasks); // PATCH /tasks/assign-batch

module.exports = router;