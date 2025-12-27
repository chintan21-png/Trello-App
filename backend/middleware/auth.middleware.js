const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required. No token provided.' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ error: 'Authentication failed. User not found.' });
    }
    
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    
    res.status(401).json({ error: 'Authentication failed' });
  }
};

const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Access denied. Required roles: ${allowedRoles.join(', ')}` 
      });
    }
    
    next();
  };
};

const projectRoleMiddleware = (requiredRoles) => {
  return async (req, res, next) => {
    try {
      const Project = require('../models/Project');
      const projectId = req.params.projectId || req.params.id;
      
      if (!projectId) {
        return res.status(400).json({ error: 'Project ID is required' });
      }
      
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      
      const member = project.members.find(m => 
        m.user.toString() === req.user.id
      );
      
      if (!member) {
        return res.status(403).json({ error: 'You are not a member of this project' });
      }
      
      if (requiredRoles && !requiredRoles.includes(member.role)) {
        return res.status(403).json({ 
          error: `Insufficient permissions. Required roles: ${requiredRoles.join(', ')}` 
        });
      }
      
      req.project = project;
      req.memberRole = member.role;
      next();
    } catch (error) {
      console.error('Project role middleware error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  };
};

module.exports = {
  authMiddleware,
  roleMiddleware,
  projectRoleMiddleware
};