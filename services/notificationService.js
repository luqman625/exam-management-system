const nodemailer = require('nodemailer');
const QRCode = require('qrcode');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendResultNotification = async (email, studentName, courseCode, grade, status) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Exam Result Published: ${courseCode}`,
    text: `Hello ${studentName},\n\nYour result for ${courseCode} has been published.\nGrade: ${grade}\nStatus: ${status}\n\nRegards,\nExamination Unit`,
  };
  return transporter.sendMail(mailOptions);
};

const generateExamQRCode = async (dataString) => {
  return await QRCode.toDataURL(dataString);
};

module.exports = { sendResultNotification, generateExamQRCode };