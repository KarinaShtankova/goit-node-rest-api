import nodemailer from "nodemailer";

const nodemailerConfig = {
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: process.env.MAILTRAP_USERNAME,
    pass: process.env.MAILTRAP_PASSWORD,
  },
};

const transport = nodemailer.createTransport(nodemailerConfig);

export default function sendMail(message) {
  return transport.sendMail(message);
}
