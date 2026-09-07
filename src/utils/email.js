const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'opeyemioluwadamilare415@gmail.com',
    // Your 16-character App Password (spaces removed)
    pass: 'slueqxmpyxcvpozb'
  }
});

const sendEmail = async (to, subject, text) => {
  try {
    await transporter.sendMail({ 
      from: 'SkillNest <opeyemioluwadamilare415@gmail.com>', 
      to, 
      subject, 
      text 
    });
    console.log('Email sent to ' + to);
  } catch (error) {
    console.error('Email error:', error);
  }
};

module.exports = { sendEmail };