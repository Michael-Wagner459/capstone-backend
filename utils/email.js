const nodemailer = require('nodemailer');
const UserModel = require('../models/user');
require('dotenv').config({ path: './.env.local' });

//sets up transporter for email with nodemailer. need valid email in env file
const transporter = nodemailer.createTransport({
  service: 'Hotmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

//sends a verification email to the users email to make sure it is them
const sendVerificationEmail = (user) => {
  //link that talks to the backened to let the back end know to change verification status
  const verificationLink = `${process.env.BASE_URL}/verify-email/${user.verificationToken}`;

  //mail options for the email sent. Also decrypts the email since it is encrypted at rest
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: user.getDecryptedEmail(),
    subject: 'Email Verification for Tabletop Tracker',
    html: `<p>Click <a href="${verificationLink}"> here</a> to verify your email`,
  };

  //handling for if there is an error or email is successful
  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error('Error sending email', err);
    } else {
      console.log('Verification email sent:');
    }
  });
};

module.exports = { sendVerificationEmail };
