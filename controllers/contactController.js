const ContactMessage = require('../models/ContactMessage');
const { sendContactNotification } = require('../services/emailService');
const { generateIpHash } = require('../utils/visitorHash');

/**
 * Handle new contact form submissions
 * POST /api/contact
 */
const submitContact = async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;

    const ipAddressHash = generateIpHash(req);

    // Save message to MongoDB
    const newMessage = await ContactMessage.create({
      name,
      email,
      subject,
      message,
      ipAddressHash,
    });

    // Send email notification asynchronously
    sendContactNotification({
      name: newMessage.name,
      email: newMessage.email,
      subject: newMessage.subject,
      message: newMessage.message,
      receivedAt: newMessage.createdAt,
    }).catch((err) => {
      console.error('[Notification Trigger Error]', err.message);
    });

    return res.status(201).json({
      success: true,
      message: 'Transmission received! Thank you, Sajith will connect back shortly.',
      data: {
        id: newMessage._id,
        createdAt: newMessage.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitContact,
};

