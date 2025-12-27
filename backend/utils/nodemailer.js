const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Email transporter verification failed:', error);
  } else {
    console.log('Email transporter is ready to send messages');
  }
});

// Email templates
const emailTemplates = {
  taskAssigned: (taskTitle, projectName, assignedBy) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">New Task Assigned</h2>
      <p>Hello,</p>
      <p>You have been assigned to a new task in the project <strong>${projectName}</strong>:</p>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin: 0; color: #2d3748;">${taskTitle}</h3>
        <p style="margin: 10px 0 0 0; color: #718096;">Assigned by: ${assignedBy}</p>
      </div>
      <p>Please log in to your account to view and work on this task.</p>
      <p>Best regards,<br>Trello Lite Team</p>
    </div>
  `,
  
  projectInvite: (projectName, inviterName) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Project Invitation</h2>
      <p>Hello,</p>
      <p>You have been invited to join the project <strong>${projectName}</strong> by ${inviterName}.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" 
           style="background: #4299e1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
          Go to Project
        </a>
      </div>
      <p>Best regards,<br>Trello Lite Team</p>
    </div>
  `,
  
  dueDateReminder: (taskTitle, projectName, dueDate) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Task Due Date Reminder</h2>
      <p>Hello,</p>
      <p>This is a reminder for your task in project <strong>${projectName}</strong>:</p>
      <div style="background: #fff5f5; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #fc8181;">
        <h3 style="margin: 0; color: #c53030;">${taskTitle}</h3>
        <p style="margin: 10px 0 0 0; color: #e53e3e;">
          Due Date: ${new Date(dueDate).toLocaleDateString()} at ${new Date(dueDate).toLocaleTimeString()}
        </p>
      </div>
      <p>Please make sure to complete the task before the due date.</p>
      <p>Best regards,<br>Trello Lite Team</p>
    </div>
  `
};

// Send notification email
const sendNotificationEmail = async (to, subject, templateName, templateData) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn('Email credentials not configured. Skipping email sending.');
      return false;
    }

    const template = emailTemplates[templateName];
    if (!template) {
      throw new Error(`Email template "${templateName}" not found`);
    }

    const html = typeof template === 'function' 
      ? template(...templateData) 
      : template;

    const mailOptions = {
      from: `"Trello Lite" <${process.env.EMAIL_USER}>`,
      to,
      subject: `Trello Lite: ${subject}`,
      html,
      text: subject // Fallback text version
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

// Send custom email
const sendEmail = async (to, subject, html, text) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn('Email credentials not configured. Skipping email sending.');
      return false;
    }

    const mailOptions = {
      from: `"Trello Lite" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      text: text || subject
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

module.exports = {
  transporter,
  sendNotificationEmail,
  sendEmail,
  emailTemplates
};