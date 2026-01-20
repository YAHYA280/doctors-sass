import Pusher from "pusher";
import PusherClient from "pusher-js";

// Server-side Pusher instance
export const pusherServer = process.env.PUSHER_APP_ID
  ? new Pusher({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: process.env.PUSHER_CLUSTER || "eu",
      useTLS: true,
    })
  : null;

// Client-side Pusher instance (for components)
export const createPusherClient = () => {
  if (typeof window === "undefined") return null;

  return new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "eu",
  });
};

// Channel naming conventions
export const channels = {
  doctor: (doctorId: string) => `private-doctor-${doctorId}`,
  booking: (doctorSlug: string) => `booking-${doctorSlug}`,
  admin: () => "private-admin",
  user: (userId: string) => `private-user-${userId}`,
};

// Event types
export const events = {
  // Booking events
  SLOT_BOOKED: "slot-booked",
  SLOT_CANCELLED: "slot-cancelled",
  AVAILABILITY_UPDATED: "availability-updated",

  // Appointment events
  APPOINTMENT_CREATED: "appointment-created",
  APPOINTMENT_UPDATED: "appointment-updated",
  APPOINTMENT_CANCELLED: "appointment-cancelled",

  // Notification events
  NEW_NOTIFICATION: "new-notification",

  // Admin events
  NEW_USER: "new-user",
  NEW_SUBSCRIPTION: "new-subscription",
  NEW_TICKET: "new-ticket",
};

// Helper functions for triggering events
export async function triggerSlotBooked(
  doctorSlug: string,
  data: {
    date: string;
    timeSlot: string;
    patientName: string;
  }
): Promise<void> {
  if (!pusherServer) return;

  await pusherServer.trigger(channels.booking(doctorSlug), events.SLOT_BOOKED, data);
}

export async function triggerSlotCancelled(
  doctorSlug: string,
  data: {
    date: string;
    timeSlot: string;
  }
): Promise<void> {
  if (!pusherServer) return;

  await pusherServer.trigger(channels.booking(doctorSlug), events.SLOT_CANCELLED, data);
}

export async function triggerAvailabilityUpdated(
  doctorSlug: string,
  data: {
    date: string;
    slots: { time: string; isAvailable: boolean }[];
  }
): Promise<void> {
  if (!pusherServer) return;

  await pusherServer.trigger(channels.booking(doctorSlug), events.AVAILABILITY_UPDATED, data);
}

export async function triggerNewAppointment(
  doctorId: string,
  data: {
    appointmentId: string;
    patientName: string;
    date: string;
    time: string;
    reason?: string;
  }
): Promise<void> {
  if (!pusherServer) return;

  await pusherServer.trigger(channels.doctor(doctorId), events.APPOINTMENT_CREATED, data);
}

export async function triggerAppointmentUpdated(
  doctorId: string,
  data: {
    appointmentId: string;
    status: string;
    patientName: string;
  }
): Promise<void> {
  if (!pusherServer) return;

  await pusherServer.trigger(channels.doctor(doctorId), events.APPOINTMENT_UPDATED, data);
}

export async function triggerNewNotification(
  userId: string,
  data: {
    id: string;
    type: string;
    title: string;
    message: string;
  }
): Promise<void> {
  if (!pusherServer) return;

  await pusherServer.trigger(channels.user(userId), events.NEW_NOTIFICATION, data);
}

export async function triggerAdminEvent(
  event: string,
  data: Record<string, any>
): Promise<void> {
  if (!pusherServer) return;

  await pusherServer.trigger(channels.admin(), event, data);
}
