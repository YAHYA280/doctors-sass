import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

interface WhatsAppMessageOptions {
  to: string;
  message: string;
}

interface AppointmentConfirmation {
  patientName: string;
  doctorName: string;
  clinicName?: string;
  date: string;
  time: string;
  editLink: string;
}

interface AppointmentReminder {
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
  hoursUntil: number;
}

interface DoctorBookingAlert {
  patientName: string;
  patientPhone: string;
  date: string;
  time: string;
  reason?: string;
}

export async function sendWhatsAppMessage({ to, message }: WhatsAppMessageOptions): Promise<boolean> {
  if (!client) {
    console.log("WhatsApp client not configured. Message would be sent to:", to);
    console.log("Message:", message);
    return false;
  }

  try {
    // Format phone number for WhatsApp
    let formattedNumber = to.replace(/[^0-9+]/g, "");
    if (!formattedNumber.startsWith("+")) {
      formattedNumber = "+" + formattedNumber;
    }

    await client.messages.create({
      body: message,
      from: whatsappNumber,
      to: `whatsapp:${formattedNumber}`,
    });

    return true;
  } catch (error) {
    console.error("Failed to send WhatsApp message:", error);
    return false;
  }
}

export async function sendAppointmentConfirmation(
  phone: string,
  data: AppointmentConfirmation
): Promise<boolean> {
  const message = `🏥 *Appointment Confirmed*

Hello ${data.patientName}!

Your appointment has been booked successfully.

📅 *Date:* ${data.date}
⏰ *Time:* ${data.time}
👨‍⚕️ *Doctor:* Dr. ${data.doctorName}
${data.clinicName ? `🏢 *Clinic:* ${data.clinicName}` : ""}

Need to reschedule or cancel?
Click here: ${data.editLink}

⚠️ Please note: You can modify your appointment up to 8 hours before the scheduled time.

Thank you for choosing us!`;

  return sendWhatsAppMessage({ to: phone, message });
}

export async function sendAppointmentReminder(
  phone: string,
  data: AppointmentReminder
): Promise<boolean> {
  const timeText = data.hoursUntil === 24 ? "tomorrow" : "in 1 hour";

  const message = `⏰ *Appointment Reminder*

Hello ${data.patientName}!

This is a friendly reminder that your appointment is ${timeText}.

📅 *Date:* ${data.date}
⏰ *Time:* ${data.time}
👨‍⚕️ *Doctor:* Dr. ${data.doctorName}

Please arrive 10 minutes early.

See you soon!`;

  return sendWhatsAppMessage({ to: phone, message });
}

export async function sendDoctorBookingAlert(
  phone: string,
  data: DoctorBookingAlert
): Promise<boolean> {
  const message = `📢 *New Booking Alert*

You have a new appointment!

👤 *Patient:* ${data.patientName}
📱 *Phone:* ${data.patientPhone}
📅 *Date:* ${data.date}
⏰ *Time:* ${data.time}
${data.reason ? `📝 *Reason:* ${data.reason}` : ""}

Log in to your dashboard to view details.`;

  return sendWhatsAppMessage({ to: phone, message });
}

export async function sendAppointmentCancellation(
  phone: string,
  data: { patientName: string; doctorName: string; date: string; time: string }
): Promise<boolean> {
  const message = `❌ *Appointment Cancelled*

Hello ${data.patientName},

Your appointment has been cancelled.

📅 *Date:* ${data.date}
⏰ *Time:* ${data.time}
👨‍⚕️ *Doctor:* Dr. ${data.doctorName}

If you didn't request this cancellation, please contact us immediately.

You can book a new appointment anytime.`;

  return sendWhatsAppMessage({ to: phone, message });
}

export async function sendAppointmentStatusUpdate(
  phone: string,
  data: {
    patientName: string;
    status: string;
    date: string;
    time: string;
    message?: string;
  }
): Promise<boolean> {
  let statusEmoji = "📋";
  let statusText = data.status;

  switch (data.status) {
    case "confirmed":
      statusEmoji = "✅";
      statusText = "Confirmed";
      break;
    case "completed":
      statusEmoji = "🎉";
      statusText = "Completed";
      break;
    case "cancelled":
      statusEmoji = "❌";
      statusText = "Cancelled";
      break;
    case "pending":
      statusEmoji = "⏳";
      statusText = "Pending";
      break;
  }

  const message = `${statusEmoji} *Appointment Update*

Hello ${data.patientName},

Your appointment status has been updated to: *${statusText}*

📅 *Date:* ${data.date}
⏰ *Time:* ${data.time}
${data.message ? `\n💬 *Message:* ${data.message}` : ""}

Thank you!`;

  return sendWhatsAppMessage({ to: phone, message });
}

// Meta WhatsApp Business API (alternative implementation)
export async function sendWhatsAppViaMeta(
  phone: string,
  templateName: string,
  templateParams: Record<string, string>
): Promise<boolean> {
  const apiKey = process.env.WHATSAPP_API_KEY;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!apiKey || !phoneNumberId) {
    console.log("Meta WhatsApp API not configured");
    return false;
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phone.replace(/[^0-9]/g, ""),
          type: "template",
          template: {
            name: templateName,
            language: { code: "en" },
            components: [
              {
                type: "body",
                parameters: Object.values(templateParams).map((value) => ({
                  type: "text",
                  text: value,
                })),
              },
            ],
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("Meta WhatsApp API error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to send WhatsApp via Meta:", error);
    return false;
  }
}
