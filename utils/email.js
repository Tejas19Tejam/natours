const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');
const { google } = require('googleapis');

/**
 * @description Create a mail for different situation and send to user
 */
module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Tejas Tejam <${process.env.EMAIL_FROM}>`;
  }

  async newTransport() {
    if (process.env.NODE_ENV === 'production') {
      // Google EMAIL API
      const oAuth2Client = new google.auth.OAuth2(
        process.env.CLIENT_ID,
        process.env.CLEINT_SECRET,
        process.env.REDIRECT_URI
      );

      oAuth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

      const accessToken = await oAuth2Client.getAccessToken();

      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: 'tejas19tejam@gmail.com',
          clientId: process.env.CLIENT_ID,
          clientSecret: process.env.CLEINT_SECRET,
          refreshToken: process.env.REFRESH_TOKEN,
          accessToken: accessToken,
        },
      });
    }
    if (process.env.NODE_ENV === 'development') {
      return nodemailer.createTransport({
        host: 'sandbox.smtp.mailtrap.io',
        port: 2525,
        secure: false,
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD,
        },
        //  Activate in Gmail "less secure app " option
      });
    }
  }
  /**
   *
   * @param {String} template - Template name e.g welcome , password reset etc
   * @param {String} subject - Subject of email
   * @returns Return a Promise
   */
  async send(template, subject) {
    // 1) Render HTML based on the pug template
    const html = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      {
        firstName: this.firstName,
        url: this.url,
        subject: this.subject,
      }
    );

    // 2) Define the email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.convert(html),
    };

    // 3) Crete a transport and send email
    const result = await this.newTransport();
    await result.sendMail(mailOptions);
  }

  /**
   * @description Send a welcome mail to user who create's a new account
   */
  async sendWelcomeMail() {
    await this.send('welcome', 'Welcome to the natours familly !');
  }

  async sendPasswordResetMail() {
    await this.send(
      'passwordReset',
      'Your password rest token (valid for only 10 minutes)'
    );
  }
};

/**
 * Build mail which will then Send Password reset link vie
 * @param {Object} options - Mail information (to , subject , message )
 * @returns {Promise}
 
exports.sendEmail = async (options) => {
  // 1) Create Transporter Object
  const transporter = nodemailer.createTransport({
    host: 'sandbox.smtp.mailtrap.io',
    port: 2525,
    secure: false,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
    //  Activate in Gmail "less secure app " option
  });

  // 2) Create MailOptions Object

  // 3) Send mail to user using Transporter.sendMail() method
  // This will return a promise
  await transporter.sendMail(mailOptions);
};

*/
