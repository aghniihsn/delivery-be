const express = require('express');
const router = express.Router();
const { getMyTasks, completeTask } = require('../controllers/task.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);

router.get('/my', getMyTasks); 
router.put('/complete/:id', completeTask);

module.exports = router;