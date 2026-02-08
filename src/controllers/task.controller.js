const Task = require('../models/task.model');

exports.getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.find().populate('assignedTo', 'name email');
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createTask = async (req, res) => {
  try {
    const { title, taskId, assignedTo, destination } = req.body;
    const newTask = await Task.create({
      title,
      taskId,
      assignedTo,
      destination 
    });
    res.status(201).json(newTask);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user.id });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.completeTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Tugas tidak ditemukan' });

    task.status = 'delivered';
    if (req.file) {
      task.imageUrl = req.file.path; 
    }

    await task.save();
    res.json({ message: 'Pengiriman selesai!', task });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};