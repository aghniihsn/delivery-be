const express = require('express');
const router = express.Router();
const { getAllTasks, createTask, getMyTasks, completeTask } = require('../controllers/task.controller');
const { protect, adminOnly } = require('../middlewares/auth.middleware');

router.use(protect);

router.get('/', adminOnly, getAllTasks);
router.post('/', adminOnly, createTask);
router.get('/my', getMyTasks); 
router.put('/complete/:id', completeTask);

module.exports = router;