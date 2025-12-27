const Task = require('../models/Task');
const Project = require('../models/Project');
const Notification = require('../models/Notification');
const { sendNotificationEmail } = require('../utils/nodemailer');

const createTask = async (req, res) => {
  try {
    const { title, description, column, assignees, dueDate, priority, labels } = req.body;
    const projectId = req.params.projectId;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if user has permission
    const member = project.members.find(m => m.user.toString() === req.user.id);
    if (!member || ['viewer'].includes(member.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Check if members can create tasks
    if (member.role === 'member' && !project.settings.allowMembersToCreateTasks) {
      return res.status(403).json({ error: 'You cannot create tasks in this project' });
    }

    // Get highest order in column
    const maxOrderTask = await Task.findOne({ project: projectId, column })
      .sort('-order')
      .limit(1);

    const task = new Task({
      title,
      description,
      project: projectId,
      column: column || 'To Do',
      assignees,
      createdBy: req.user.id,
      dueDate,
      priority: priority || 'medium',
      labels: labels || [],
      order: maxOrderTask ? maxOrderTask.order + 1 : 0
    });

    await task.save();

    // Populate for response
    await task.populate([
      { path: 'assignees', select: 'username email avatar' },
      { path: 'createdBy', select: 'username avatar' },
      { path: 'project', select: 'name' }
    ]);

    // Send notifications to assignees
    if (assignees && assignees.length > 0) {
      const notificationPromises = assignees.map(async (assigneeId) => {
        if (assigneeId.toString() !== req.user.id.toString()) {
          const notification = new Notification({
            user: assigneeId,
            type: 'task_assigned',
            title: 'New Task Assigned',
            message: `${req.user.username} assigned you to task: "${title}" in project "${project.name}"`,
            relatedItem: task._id,
            relatedModel: 'Task'
          });
          await notification.save();

          // TODO: Send email notification if user has it enabled
        }
      });

      await Promise.all(notificationPromises);

      // Emit WebSocket event
      const io = req.app.get('io');
      assignees.forEach(assigneeId => {
        io.to(`user-${assigneeId}`).emit('notification', {
          type: 'task_assigned',
          message: `You have been assigned to task: "${title}"`,
          taskId: task._id
        });
      });
    }

    // Emit task created event
    const io = req.app.get('io');
    io.to(`project-${projectId}`).emit('taskCreated', task);

    res.status(201).json({
      message: 'Task created successfully',
      task
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getProjectTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { column } = req.query;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if user is a member
    const isMember = project.members.some(member => 
      member.user.toString() === req.user.id
    );

    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const query = { project: projectId };
    if (column) query.column = column;

    const tasks = await Task.find(query)
      .populate('assignees', 'username email avatar')
      .populate('createdBy', 'username avatar')
      .sort({ order: 1, createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignees', 'username email avatar')
      .populate('createdBy', 'username avatar')
      .populate('project', 'name members');

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if user has access to the task's project
    const isMember = task.project.members.some(member => 
      member.user.toString() === req.user.id
    );

    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(task);
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const updateTask = async (req, res) => {
  try {
    const { title, description, assignees, dueDate, priority, labels, column } = req.body;

    const task = await Task.findById(req.params.id)
      .populate('project', 'name members');

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if user has permission
    const member = task.project.members.find(m => m.user.toString() === req.user.id);
    if (!member || ['viewer'].includes(member.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Update task
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (priority !== undefined) task.priority = priority;
    if (labels !== undefined) task.labels = labels;
    
    // Handle column change
    if (column && column !== task.column) {
      const maxOrderTask = await Task.findOne({ 
        project: task.project._id, 
        column 
      }).sort('-order').limit(1);
      
      task.column = column;
      task.order = maxOrderTask ? maxOrderTask.order + 1 : 0;
    }

    // Handle assignees change
    if (assignees !== undefined) {
      const newAssignees = assignees.filter(id => 
        !task.assignees.some(a => a.toString() === id)
      );
      
      task.assignees = assignees;

      // Send notifications to new assignees
      if (newAssignees.length > 0) {
        const notificationPromises = newAssignees.map(async (assigneeId) => {
          if (assigneeId.toString() !== req.user.id) {
            const notification = new Notification({
              user: assigneeId,
              type: 'task_assigned',
              title: 'Task Assigned',
              message: `${req.user.username} assigned you to task: "${task.title}"`,
              relatedItem: task._id,
              relatedModel: 'Task'
            });
            await notification.save();
          }
        });

        await Promise.all(notificationPromises);
      }
    }

    await task.save();

    // Populate for response
    await task.populate('assignees', 'username email avatar');

    // Emit update event
    const io = req.app.get('io');
    io.to(`project-${task.project._id}`).emit('taskUpdated', task);

    res.json({
      message: 'Task updated successfully',
      task
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const updateTaskPosition = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { column, order, sourceColumn } = req.body;

    const task = await Task.findById(taskId).populate('project');
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check project permissions
    const project = await Project.findById(task.project._id);
    const member = project.members.find(m => m.user.toString() === req.user.id);
    if (!member || ['viewer'].includes(member.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Update order of other tasks if moving within same column
    if (sourceColumn === column) {
      if (order > task.order) {
        // Moving down
        await Task.updateMany(
          {
            project: task.project._id,
            column: column,
            order: { $gt: task.order, $lte: order }
          },
          { $inc: { order: -1 } }
        );
      } else if (order < task.order) {
        // Moving up
        await Task.updateMany(
          {
            project: task.project._id,
            column: column,
            order: { $gte: order, $lt: task.order }
          },
          { $inc: { order: 1 } }
        );
      }
    } else {
      // Moving to different column
      // Decrement orders in source column
      await Task.updateMany(
        {
          project: task.project._id,
          column: sourceColumn,
          order: { $gt: task.order }
        },
        { $inc: { order: -1 } }
      );

      // Increment orders in target column
      await Task.updateMany(
        {
          project: task.project._id,
          column: column,
          order: { $gte: order }
        },
        { $inc: { order: 1 } }
      );
    }

    // Update task
    task.column = column;
    task.order = order;
    await task.save();

    // Create notification for task movement
    const notification = new Notification({
      user: task.createdBy,
      type: 'task_moved',
      title: 'Task Moved',
      message: `${req.user.username} moved task "${task.title}" from ${sourceColumn} to ${column}`,
      relatedItem: task._id,
      relatedModel: 'Task'
    });
    await notification.save();

    // Emit WebSocket event for real-time updates
    const io = req.app.get('io');
    io.to(`project-${task.project._id}`).emit('taskMoved', {
      taskId: task._id,
      column,
      order,
      sourceColumn
    });

    res.json({
      message: 'Task position updated',
      task
    });
  } catch (error) {
    console.error('Update task position error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('project');
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if user has permission
    const member = task.project.members.find(m => m.user.toString() === req.user.id);
    if (!member || ['viewer'].includes(member.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Update order of remaining tasks in the column
    await Task.updateMany(
      {
        project: task.project._id,
        column: task.column,
        order: { $gt: task.order }
      },
      { $inc: { order: -1 } }
    );

    await task.deleteOne();

    // Emit delete event
    const io = req.app.get('io');
    io.to(`project-${task.project._id}`).emit('taskDeleted', {
      taskId: task._id,
      column: task.column
    });

    res.json({
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  createTask,
  getProjectTasks,
  getTaskById,
  updateTask,
  updateTaskPosition,
  deleteTask
};