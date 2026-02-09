const Task = require('../models/task.model');
const User = require('../models/user.model');


exports.getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate('assignedTo', 'name email phone')
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const generateResi = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // Hasil: 20260209
  const random = Math.floor(1000 + Math.random() * 9000); // 4 digit acak
  return `LGT-${date}-${random}`;
};

exports.createTask = async (req, res) => {
  try {
    const { title, description, assignedTo, destination, recipientName, recipientPhone, notes } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'title wajib diisi' });
    }

    const taskId = req.body.taskId || generateResi();

    const exists = await Task.findOne({ taskId });
    if (exists) {
      return res.status(400).json({ message: `Nomor resi ${taskId} sudah ada, coba lagi.` });
    }

    let status = 'pending';
    let assignedAt = null;
    if (assignedTo) {
      const driver = await User.findById(assignedTo);
      if (!driver || driver.role !== 'driver') {
        return res.status(400).json({ message: 'Driver tidak valid' });
      }
      status = 'assigned';
      assignedAt = new Date();
    }

    const newTask = await Task.create({
      title,
      taskId,
      description,
      assignedTo: assignedTo || null,
      destination,
      recipientName,
      recipientPhone,
      notes,
      status,
      assignedAt,
    });

    const populated = await Task.findById(newTask._id).populate('assignedTo', 'name email phone');
    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/// [ADMIN] Buat task bulk
/// POST /tasks/bulk
/// Body: { tasks: [{ title, taskId, description?, destination?, recipientName?, recipientPhone?, notes?, assignedTo? }, ...] }
exports.createBulkTasks = async (req, res) => {
  try {
    const { tasks } = req.body;

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({ message: 'tasks harus berupa array dan tidak boleh kosong' });
    }

    if (tasks.length > 50) {
      return res.status(400).json({ message: 'Maksimal 50 task per batch' });
    }

    // Validasi semua taskId unik dalam payload
    const taskIds = tasks.map(t => t.taskId);
    const uniqueIds = new Set(taskIds);
    if (uniqueIds.size !== taskIds.length) {
      return res.status(400).json({ message: 'Terdapat taskId duplikat dalam payload' });
    }

    // Cek duplikat dengan database
    const existingTasks = await Task.find({ taskId: { $in: taskIds } });
    if (existingTasks.length > 0) {
      const duplicates = existingTasks.map(t => t.taskId);
      return res.status(400).json({ 
        message: 'Beberapa taskId sudah ada di database',
        duplicates,
      });
    }

    // Validasi dan siapkan data
    const bulkData = [];
    for (const t of tasks) {
      if (!t.title || !t.taskId) {
        return res.status(400).json({ message: `title dan taskId wajib untuk setiap task (error di taskId: ${t.taskId || 'kosong'})` });
      }

      let status = 'pending';
      let assignedAt = null;

      if (t.assignedTo) {
        const driver = await User.findById(t.assignedTo);
        if (!driver || driver.role !== 'driver') {
          return res.status(400).json({ message: `Driver tidak valid untuk taskId "${t.taskId}"` });
        }
        status = 'assigned';
        assignedAt = new Date();
      }

      bulkData.push({
        title: t.title,
        taskId: t.taskId,
        description: t.description || '',
        assignedTo: t.assignedTo || null,
        destination: t.destination || {},
        recipientName: t.recipientName || '',
        recipientPhone: t.recipientPhone || '',
        notes: t.notes || '',
        status,
        assignedAt,
      });
    }

    const created = await Task.insertMany(bulkData);
    res.status(201).json({
      message: `${created.length} task berhasil dibuat`,
      count: created.length,
      tasks: created,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/// [ADMIN] Assign task ke driver
/// PATCH /tasks/:id/assign
/// Body: { assignedTo: "<driver_id>" }
exports.assignTask = async (req, res) => {
  try {
    const { assignedTo } = req.body;

    if (!assignedTo) {
      return res.status(400).json({ message: 'assignedTo (driver ID) wajib diisi' });
    }

    const driver = await User.findById(assignedTo);
    if (!driver || driver.role !== 'driver') {
      return res.status(400).json({ message: 'Driver tidak valid' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task tidak ditemukan' });
    }

    if (task.status === 'delivered') {
      return res.status(400).json({ message: 'Task yang sudah selesai tidak bisa di-assign ulang' });
    }

    task.assignedTo = assignedTo;
    task.status = 'assigned';
    task.assignedAt = new Date();
    await task.save();

    const populated = await Task.findById(task._id).populate('assignedTo', 'name email phone');
    res.json({ message: 'Task berhasil di-assign', task: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/// [ADMIN] Assign batch task ke driver
/// PATCH /tasks/assign-batch
/// Body: { taskIds: ["id1", "id2"], assignedTo: "<driver_id>" }
exports.assignBatchTasks = async (req, res) => {
  try {
    const { taskIds, assignedTo } = req.body;

    if (!assignedTo) {
      return res.status(400).json({ message: 'assignedTo (driver ID) wajib diisi' });
    }

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ message: 'taskIds harus berupa array dan tidak boleh kosong' });
    }

    const driver = await User.findById(assignedTo);
    if (!driver || driver.role !== 'driver') {
      return res.status(400).json({ message: 'Driver tidak valid' });
    }

    // Cek semua task ada dan belum delivered
    const tasks = await Task.find({ _id: { $in: taskIds } });
    if (tasks.length !== taskIds.length) {
      return res.status(400).json({ message: 'Beberapa task tidak ditemukan' });
    }

    const deliveredTasks = tasks.filter(t => t.status === 'delivered');
    if (deliveredTasks.length > 0) {
      return res.status(400).json({ 
        message: 'Beberapa task sudah selesai dan tidak bisa di-assign ulang',
        deliveredIds: deliveredTasks.map(t => t._id),
      });
    }

    const result = await Task.updateMany(
      { _id: { $in: taskIds } },
      { 
        $set: { 
          assignedTo, 
          status: 'assigned',
          assignedAt: new Date(),
        } 
      }
    );

    res.json({ 
      message: `${result.modifiedCount} task berhasil di-assign ke ${driver.name}`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user.id }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const ALLOWED_TRANSITIONS = {
  'assigned': ['on_delivery'],           // Kurir ambil paket
  'on_delivery': ['delivered', 'rescheduled', 'failed'],  // Hasil pengiriman
  'rescheduled': ['on_delivery'],        // Coba kirim ulang
};

exports.updateTaskStatus = async (req, res) => {
  try {
    const { status, notes, failedReason, rescheduledDate, rescheduledReason } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status baru wajib diisi' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task tidak ditemukan' });
    }

    // Pastikan kurir hanya bisa update task miliknya
    if (!task.assignedTo || task.assignedTo.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Bukan task Anda' });
    }

    // Validasi transisi status
    const allowedNext = ALLOWED_TRANSITIONS[task.status];
    if (!allowedNext) {
      return res.status(400).json({ 
        message: `Task dengan status "${task.status}" tidak bisa diubah lagi`,
        currentStatus: task.status,
      });
    }

    if (!allowedNext.includes(status)) {
      return res.status(400).json({ 
        message: `Transisi dari "${task.status}" ke "${status}" tidak diperbolehkan`,
        currentStatus: task.status,
        allowedTransitions: allowedNext,
      });
    }

    // Validasi khusus per status tujuan
    if (status === 'failed' && !failedReason) {
      return res.status(400).json({ message: 'Alasan gagal (failedReason) wajib diisi' });
    }

    if (status === 'rescheduled') {
      if (!rescheduledDate) {
        return res.status(400).json({ message: 'Tanggal reschedule (rescheduledDate) wajib diisi' });
      }
      const rescDate = new Date(rescheduledDate);
      if (isNaN(rescDate.getTime())) {
        return res.status(400).json({ message: 'Format tanggal reschedule tidak valid' });
      }
      if (rescDate <= new Date()) {
        return res.status(400).json({ message: 'Tanggal reschedule harus di masa depan' });
      }
      task.rescheduledDate = rescDate;
      task.rescheduledReason = rescheduledReason || '';
    }

    // Simpan riwayat status
    task.statusHistory.push({
      from: task.status,
      to: status,
      changedBy: req.user.id,
      notes: notes || '',
      changedAt: new Date(),
    });

    // Update field sesuai status tujuan
    const oldStatus = task.status;
    task.status = status;

    if (status === 'on_delivery' && oldStatus === 'assigned') {
      task.pickedUpAt = new Date();
    }

    if (status === 'delivered') {
      task.deliveredAt = new Date();
    }

    if (status === 'failed') {
      task.failedReason = failedReason;
    }

    if (notes) {
      task.notes = notes;
    }

    await task.save();

    // Pesan response yang informatif
    let responseMessage = 'Status berhasil diperbarui';
    if (status === 'on_delivery') {
      responseMessage = 'Paket sedang dalam pengiriman';
    } else if (status === 'delivered') {
      responseMessage = 'Pengiriman berhasil diselesaikan!';
    } else if (status === 'rescheduled' && task.rescheduledDate) {
      responseMessage = `Pengiriman dijadwalkan ulang ke ${task.rescheduledDate.toLocaleDateString('id-ID')}`;
    } else if (status === 'failed') {
      responseMessage = 'Pengiriman gagal dicatat';
    }

    res.json({ 
      message: responseMessage, 
      task,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.uploadProof = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task tidak ditemukan' });

    if (!task.assignedTo || task.assignedTo.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Bukan task Anda' });
    }

    // MODIFIKASI: Izinkan upload jika status 'on_delivery' ATAU 'delivered'
    if (task.status !== 'on_delivery' && task.status !== 'delivered') {
      return res.status(400).json({ 
        message: 'Foto hanya bisa diunggah saat status Dalam Pengiriman' 
      });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'File gambar wajib diupload' });
    }

    task.imageUrl = req.file.path;
    await task.save();

    res.json({ message: 'Bukti foto berhasil disimpan', task });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};