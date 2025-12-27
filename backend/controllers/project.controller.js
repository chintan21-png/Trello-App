const Project = require('../models/Project');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendNotificationEmail } = require('../utils/nodemailer');

const createProject = async (req, res) => {
  try {
    const { name, description, columns, settings } = req.body;

    const defaultColumns = [
      { name: 'To Do', color: '#CBD5E0', order: 0 },
      { name: 'In Progress', color: '#4299E1', order: 1 },
      { name: 'Done', color: '#48BB78', order: 2 }
    ];

    const project = new Project({
      name,
      description,
      createdBy: req.user.id,
      columns: columns || defaultColumns,
      settings: settings || {
        allowMembersToCreateTasks: true,
        allowMembersToInvite: false
      },
      members: [{
        user: req.user.id,
        role: 'admin',
        joinedAt: new Date()
      }]
    });

    await project.save();

    // Populate createdBy
    await project.populate('createdBy', 'username email');

    res.status(201).json({
      message: 'Project created successfully',
      project
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getProjects = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get projects where user is a member
    const projects = await Project.find({
      'members.user': req.user.id,
      isActive: true
    })
      .populate('createdBy', 'username')
      .populate('members.user', 'username email')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Project.countDocuments({
      'members.user': req.user.id,
      isActive: true
    });

    res.json({
      projects,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'username email')
      .populate('members.user', 'username email role avatar');

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if user is a member
    const isMember = project.members.some(member => 
      member.user._id.toString() === req.user.id
    );

    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(project);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const updateProject = async (req, res) => {
  try {
    const { name, description, columns, settings } = req.body;

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if user is admin or project manager
    const member = project.members.find(m => m.user.toString() === req.user.id);
    if (!member || !['admin', 'project_manager'].includes(member.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Update project
    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (columns) project.columns = columns;
    if (settings) project.settings = settings;

    await project.save();

    // Create notification for members
    const notificationPromises = project.members.map(async (member) => {
      if (member.user.toString() !== req.user.id) {
        const notification = new Notification({
          user: member.user,
          type: 'project_updated',
          title: 'Project Updated',
          message: `${req.user.username} updated project "${project.name}"`,
          relatedItem: project._id,
          relatedModel: 'Project'
        });
        await notification.save();
      }
    });

    await Promise.all(notificationPromises);

    res.json({
      message: 'Project updated successfully',
      project
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const addMemberToProject = async (req, res) => {
  try {
    const { userId, role } = req.body;

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if current user has permission to add members
    const currentMember = project.members.find(m => m.user.toString() === req.user.id);
    if (!currentMember || !['admin', 'project_manager'].includes(currentMember.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Check if user exists
    const userToAdd = await User.findById(userId);
    if (!userToAdd) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is already a member
    const existingMember = project.members.find(m => m.user.toString() === userId);
    if (existingMember) {
      return res.status(400).json({ error: 'User is already a member' });
    }

    // Add member
    project.members.push({
      user: userId,
      role: role || 'member',
      joinedAt: new Date()
    });

    await project.save();

    // Create notification for the new member
    const notification = new Notification({
      user: userId,
      type: 'project_invite',
      title: 'Project Invitation',
      message: `You have been added to project "${project.name}" by ${req.user.username}`,
      relatedItem: project._id,
      relatedModel: 'Project'
    });
    await notification.save();

    // Send email notification
    if (userToAdd.notificationsEnabled) {
      await sendNotificationEmail(
        userToAdd.email,
        'Project Invitation',
        `You have been added to project "${project.name}"`
      );
    }

    // Populate the new member
    await project.populate('members.user', 'username email');

    res.json({
      message: 'Member added successfully',
      project
    });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const removeMemberFromProject = async (req, res) => {
  try {
    const { userId } = req.params;

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if current user has permission
    const currentMember = project.members.find(m => m.user.toString() === req.user.id);
    if (!currentMember || !['admin', 'project_manager'].includes(currentMember.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Cannot remove yourself if you're the only admin
    if (userId === req.user.id) {
      const adminCount = project.members.filter(m => 
        ['admin', 'project_manager'].includes(m.role)
      ).length;
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Cannot remove the only admin' });
      }
    }

    // Remove member
    project.members = project.members.filter(m => m.user.toString() !== userId);
    await project.save();

    res.json({
      message: 'Member removed successfully',
      project
    });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if user is admin
    const member = project.members.find(m => m.user.toString() === req.user.id);
    if (!member || member.role !== 'admin') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Soft delete
    project.isActive = false;
    await project.save();

    res.json({
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  addMemberToProject,
  removeMemberFromProject,
  deleteProject
};