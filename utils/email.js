const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

// new Email(user, url).sendWelcome

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `John brown <${process.env.EMAIL_FROM}>`;
  }

  createEmailTransport() {
    if (process.env.NODE_ENV === 'production') {
      //sendgrid

      return 1;
    }

    return nodemailer.createTransport({
      // service: 'Gmail',
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
      //activate in gmail 'l
    });
  }

  async send(template, subject) {
    // render html template
    const html = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      {
        firstName: this.firstName,
        subject,
        url: this.url,
      },
    );

    // Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      text: htmlToText.convert(html, {
        wordwrap: 80,
      }),
      html: html,
    };

    // Create a transport and send email
    await this.createEmailTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('Welcome', 'Welcome to the Natours Family');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid for only 10 minutes)',
    );
  }
};

// const sendEmail = async (options) => {
//   //1) create a transporter
//   // email services => sendgrid or mailgun
//   const transporter = nodemailer.createTransport({
//     // service: 'Gmail',
//     host: process.env.EMAIL_HOST,
//     port: process.env.EMAIL_PORT,
//     auth: {
//       user: process.env.EMAIL_USERNAME,
//       pass: process.env.EMAIL_PASSWORD,
//     },
//     //activate in gmail 'less secure app' option
//   });
//
//   //2) define the email options
//   const mailOptions = {
//     from: 'John brown <hello@mail.com>',
//     to: options.email,
//     subject: options.subject,
//     text: options.message,
//     // html:
//   };
//
//   //3) send the mail
//   await transporter.sendMail(mailOptions);
// };
