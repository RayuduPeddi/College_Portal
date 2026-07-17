const nodemailer = require('nodemailer');

const sendWelcomeEmail = async (email, name, role, password) => {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT || 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const appUrl = process.env.APP_URL || 'http://localhost:5173';

  const plainTextContent = `
Hello ${name},

Your account has been created by the administrator.
Here are your login credentials:

Login Email: ${email}
Password: ${password}

You can log in at: ${appUrl}

This is an automated email. Please do not reply directly.
`;

  const htmlContent = `
<div style="font-family: Arial, sans-serif; font-size: 15px; color: #333333; line-height: 1.6; max-width: 600px;">
  <p>Hello <strong>${name}</strong>,</p>
  <p>Your account has been created by the administrator. Here are your login credentials to access the portal:</p>
  
  <p style="margin-left: 20px; font-size: 15px;">
    <strong>Email:</strong> <span style="color: #0056b3; font-family: monospace; font-size: 16px;">${email}</span><br />
    <strong>Password:</strong> <span style="color: #dc3545; font-family: monospace; font-size: 16px; font-weight: bold;">${password}</span>
  </p>
  
  <p>You can log in at: <a href="${appUrl}" target="_blank" style="color: #0056b3; text-decoration: underline; font-weight: bold;">${appUrl}</a></p>
  
  <p style="margin-top: 30px; font-size: 13px; color: #777777;">Best regards,<br />Campus Connect Portal</p>
</div>
`;

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.log('\n==================================================');
    console.log(`[SMTP Not Configured] Would have sent welcome email to: ${email}`);
    console.log(`Name: ${name}`);
    console.log(`Role: ${role}`);
    console.log(`Password: ${password}`);
    console.log('==================================================\n');
    return { success: true, logged: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort == 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const info = await transporter.sendMail({
      from: `"Campus Connect" <${smtpUser}>`,
      to: email,
      subject: 'Welcome to Campus Connect - Account Created',
      text: plainTextContent,
      html: htmlContent,
    });

    console.log(`[Email Sent] Message ID: ${info.messageId} to ${email}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending welcome email via configured SMTP:', error.message);
    console.log('Attempting to fall back to an Ethereal Test Account to send the email...');
    try {
      const testAccount = await nodemailer.createTestAccount();
      const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });

      const info = await transporter.sendMail({
        from: '"Campus Connect (Test)" <sender@example.com>',
        to: email,
        subject: 'Welcome to Campus Connect - Account Created (Test)',
        text: plainTextContent,
        html: htmlContent,
      });

      console.log('\n==================================================');
      console.log(`[Ethereal Test Email Sent] Message ID: ${info.messageId} to ${email}`);
      console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      console.log('==================================================\n');
      return { success: true, previewUrl: nodemailer.getTestMessageUrl(info) };
    } catch (fallbackError) {
      console.error('Ethereal fallback failed:', fallbackError.message);
      // Final fallback to console log
      console.log('\n==================================================');
      console.log(`[SMTP & Ethereal Failed] Would have sent welcome email to: ${email}`);
      console.log(`Name: ${name}`);
      console.log(`Role: ${role}`);
      console.log(`Password: ${password}`);
      console.log('==================================================\n');
      return { success: true, logged: true };
    }
  }
};

module.exports = { sendWelcomeEmail };
