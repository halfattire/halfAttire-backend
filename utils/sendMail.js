// import nodemailer from "nodemailer";
// import dotenv from "dotenv";

// // Load environment variables
// dotenv.config();

// const sendMail = async (options) => {
//   const transporter = nodemailer.createTransport({
//     host: process.env.SMTP_HOST,
//     port: parseInt(process.env.SMTP_PORT, 10), // Ensure port is a number
//     service: process.env.SMTP_SERVICE,
//     secure: process.env.SMTP_PORT === "465", // true for 465 (SSL), false for 587 (STARTTLS)
//     auth: {
//       user: process.env.SMTP_MAIL,
//       pass: process.env.SMTP_PASSWORD,
//     },
//   });
  

//   const mailOptions = {
//     from: process.env.SMTP_MAIL,
//     to: options.email,
//     subject: options.subject,
//     text: options.message,
//   };

//   await transporter.sendMail(mailOptions);
// };

// export default sendMail;













import nodemailer from "nodemailer"
import dotenv from "dotenv"

// Load environment variables
dotenv.config()

const sendMail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number.parseInt(process.env.SMTP_PORT, 10), // Ensure port is a number
    service: process.env.SMTP_SERVICE,
    secure: process.env.SMTP_PORT === "465", // true for 465 (SSL), false for 587 (STARTTLS)
    auth: {
      user: process.env.SMTP_MAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  })

  const mailOptions = {
    from: process.env.SMTP_MAIL,
    to: options.email,
    subject: options.subject,
    text: options.message || "", // Fallback plain text version
    html: options.html || "", // Add the HTML content here
  }

  await transporter.sendMail(mailOptions)
}

export default sendMail
