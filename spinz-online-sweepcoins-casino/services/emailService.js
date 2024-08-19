const nodemailer = require('nodemailer');
const config = require('config');

const transporter = nodemailer.createTransport({
  host: config.get('emailHost'),
  port: config.get('emailPort'),
  auth: {
    user: config.get('emailUser'),
    pass: config.get('emailPassword')
  }
});

const sendVerificationEmail = (email, token) => {
  const mailOptions = {
    from: config.get('emailFrom'),
    to: email,
    subject: 'Verify Your Email',
    html: `
      <p>Please click on the following link to verify your email:</p>
      <a href="${config.get('clientURL')}/verify-email/${token}">Verify Email</a>
    `
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
};

const sendPasswordResetEmail = (email, token) => {
  const mailOptions = {
    from: config.get('emailFrom'),
    to: email,
    subject: 'Password Reset',
    html: `
      <p>You requested a password reset. Please click on the following link to reset your password:</p>
      <a href="${config.get('clientURL')}/reset-password/${token}">Reset Password</a>
      <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
    `
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
