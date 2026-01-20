import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: EmailOptions): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || "MediBook <noreply@medibook.com>",
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ""),
    });
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}

export async function sendWelcomeEmail(
  email: string,
  name: string,
  loginUrl: string
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #111827; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #0A6847; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #F5F7F9; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #0A6847; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to MediBook!</h1>
        </div>
        <div class="content">
          <h2>Hello Dr. ${name}!</h2>
          <p>Thank you for joining MediBook. Your account has been created successfully.</p>
          <p>With MediBook, you can:</p>
          <ul>
            <li>Manage your appointments efficiently</li>
            <li>Create custom patient intake forms</li>
            <li>Share your booking page with patients</li>
            <li>Send automatic WhatsApp confirmations</li>
            <li>Track your practice analytics</li>
          </ul>
          <p>Your 14-day free trial has started. Explore all features and upgrade when ready!</p>
          <center>
            <a href="${loginUrl}" class="button">Go to Dashboard</a>
          </center>
          <p>If you have any questions, our support team is here to help.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} MediBook. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: "Welcome to MediBook - Your Account is Ready!",
    html,
  });
}

export async function sendAppointmentConfirmationEmail(
  email: string,
  data: {
    patientName: string;
    doctorName: string;
    clinicName?: string;
    date: string;
    time: string;
    editLink: string;
  }
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #111827; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #0A6847; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #F5F7F9; padding: 30px; border-radius: 0 0 8px 8px; }
        .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .detail-row { display: flex; padding: 10px 0; border-bottom: 1px solid #eee; }
        .detail-label { font-weight: bold; width: 120px; }
        .button { display: inline-block; background: #1E88E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
        .button-cancel { background: #EF4444; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Appointment Confirmed</h1>
        </div>
        <div class="content">
          <h2>Hello ${data.patientName}!</h2>
          <p>Your appointment has been successfully booked.</p>
          <div class="details">
            <div class="detail-row">
              <span class="detail-label">Date:</span>
              <span>${data.date}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Time:</span>
              <span>${data.time}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Doctor:</span>
              <span>Dr. ${data.doctorName}</span>
            </div>
            ${data.clinicName ? `
            <div class="detail-row">
              <span class="detail-label">Clinic:</span>
              <span>${data.clinicName}</span>
            </div>
            ` : ""}
          </div>
          <p>Need to make changes? You can modify your appointment up to 8 hours before the scheduled time.</p>
          <center>
            <a href="${data.editLink}" class="button">Manage Appointment</a>
          </center>
          <p><strong>Please arrive 10 minutes early.</strong></p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} MediBook. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Appointment Confirmed - ${data.date} at ${data.time}`,
    html,
  });
}

export async function sendAppointmentReminderEmail(
  email: string,
  data: {
    patientName: string;
    doctorName: string;
    date: string;
    time: string;
    hoursUntil: number;
  }
): Promise<boolean> {
  const timeText = data.hoursUntil === 24 ? "tomorrow" : "in 1 hour";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #111827; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #F59E0B; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #F5F7F9; padding: 30px; border-radius: 0 0 8px 8px; }
        .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⏰ Appointment Reminder</h1>
        </div>
        <div class="content">
          <h2>Hello ${data.patientName}!</h2>
          <p>This is a friendly reminder that your appointment is <strong>${timeText}</strong>.</p>
          <div class="details">
            <p><strong>Date:</strong> ${data.date}</p>
            <p><strong>Time:</strong> ${data.time}</p>
            <p><strong>Doctor:</strong> Dr. ${data.doctorName}</p>
          </div>
          <p>Please arrive 10 minutes early. We look forward to seeing you!</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} MediBook. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Reminder: Your appointment is ${timeText}`,
    html,
  });
}

export async function sendTrialExpiringEmail(
  email: string,
  name: string,
  daysRemaining: number,
  upgradeUrl: string
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #111827; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #F59E0B; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #F5F7F9; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #0A6847; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Your Trial is Ending Soon</h1>
        </div>
        <div class="content">
          <h2>Hello Dr. ${name}!</h2>
          <p>Your MediBook free trial will expire in <strong>${daysRemaining} days</strong>.</p>
          <p>Don't lose access to these amazing features:</p>
          <ul>
            <li>Unlimited patient management</li>
            <li>Custom intake forms</li>
            <li>WhatsApp notifications</li>
            <li>Advanced analytics</li>
            <li>Priority support</li>
          </ul>
          <center>
            <a href="${upgradeUrl}" class="button">Upgrade Now</a>
          </center>
          <p>Have questions? Our team is happy to help!</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} MediBook. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Your MediBook trial expires in ${daysRemaining} days`,
    html,
  });
}
