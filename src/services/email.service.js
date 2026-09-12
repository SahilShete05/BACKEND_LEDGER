require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.EMAIL_USER,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

// Verify the connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Error connecting to email server:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

// Function to send email
const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Banking" <${process.env.EMAIL_USER}>`, // sender address
      to, // list of receivers
      subject, // Subject line
      text, // plain text body
      html, // html body
    });

    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Error sending email:', error);
  }
};


async function sendRegisterationEmail(userEmail, name) {
    const subject = "Welcome to Banking!";
    const text = `Hello ${name}, \n\n Thank you for registering at Banking.
    We're excited to have you on the board! /n/n Best regards, /n The Banking Team`;
    const html = `<p> Hello ${name}, </p>  <p> Thank you for registering at Baking. We're excited to have you on board! </p> 
    <p>Best Regards, <br>The Banking Team</p>`

    await sendEmail(userEmail, subject, text, html);
    
}

async function  sendTransactionEmail(userEmail, name, amount, toAccount) {
    const subject = "Transaction Successful!";
    const text = `Hello ${name}, \n\n Your transaction of $${amount} to account ${toAccount} was succssful.\n\n Best Regards, \n The Backend Ledger Team`;
    const html = `<p> Hello ${name}, </p>  <p> Your transaction of $${amount} to account ${toAccount} was successful. </p> 
    <p>Best Regards, <br>The Banking Team</p>`

    await sendEmail(userEmail, subject, text, html);
}


async function sendTransactionFailureEmail(userEmail, name, amount, toAccount) {
  const subject = 'Transaction Failed!';
  const text = `Hello ${name}, \n\n We regret to inform you that your transaction of $${amount} to account ${toAccount}`
  const html = `<p>Hello ${name}, </p> <p>We regret to inform you that your transaction of $${amount} to account ${toAccount}</p>`

  await sendEmail(userEmail, subject, text, html);
}

module.exports = {
   sendRegisterationEmail, sendTransactionEmail, sendTransactionFailureEmail
};