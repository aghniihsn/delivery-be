const express = require('express');
const router = express.Router();
const {
  getAllTasks,
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

// ====== ADMIN ======
router.get('/', adminOnly, getAllTasks);              // GET    /tasks
router.post('/', adminOnly, createTask);              // POST   /tasks
router.post('/bulk', adminOnly, createBulkTasks);     // POST   /tasks/bulk
router.patch('/:id/assign', adminOnly, assignTask);   // PATCH  /tasks/:id/assign
router.patch('/assign-batch', adminOnly, assignBatchTasks); // PATCH /tasks/assign-batch

// ====== DRIVER ======
router.get('/my', getMyTasks);                                        // GET   /tasks/my
router.patch('/:id/status', updateTaskStatus);                        // PATCH /tasks/:id/status
router.put('/:id/upload-proof', upload.single('image'), uploadProof); // PUT   /tasks/:id/upload-proof

module.exports = router;