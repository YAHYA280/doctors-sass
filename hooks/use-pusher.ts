"use client";

import { useEffect, useState, useCallback } from "react";
import PusherClient from "pusher-js";

let pusherInstance: PusherClient | null = null;

function getPusherInstance() {
  if (!pusherInstance && typeof window !== "undefined") {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

    if (key && cluster) {
      pusherInstance = new PusherClient(key, {
        cluster,
      });
    }
  }
  return pusherInstance;
}

export function usePusher() {
  const [pusher, setPusher] = useState<PusherClient | null>(null);

  useEffect(() => {
    const instance = getPusherInstance();
    setPusher(instance);

    return () => {
      // Don't disconnect on unmount to maintain connection
    };
  }, []);

  return pusher;
}

export function useChannel(channelName: string) {
  const pusher = usePusher();
  const [channel, setChannel] = useState<any>(null);

  useEffect(() => {
    if (!pusher || !channelName) return;

    const ch = pusher.subscribe(channelName);
    setChannel(ch);

    return () => {
      pusher.unsubscribe(channelName);
    };
  }, [pusher, channelName]);

  return channel;
}

export function useEvent<T = any>(
  channelName: string,
  eventName: string,
  callback: (data: T) => void
) {
  const channel = useChannel(channelName);

  useEffect(() => {
    if (!channel) return;

    channel.bind(eventName, callback);

    return () => {
      channel.unbind(eventName, callback);
    };
  }, [channel, eventName, callback]);
}

// Specific hooks for common use cases
export function useBookingUpdates(
  doctorSlug: string,
  onSlotBooked: (data: { date: string; timeSlot: string; patientName: string }) => void,
  onSlotCancelled: (data: { date: string; timeSlot: string }) => void
) {
  const channelName = `booking-${doctorSlug}`;

  useEvent(channelName, "slot-booked", onSlotBooked);
  useEvent(channelName, "slot-cancelled", onSlotCancelled);
}

export function useDoctorNotifications(
  doctorId: string,
  onNewAppointment: (data: any) => void,
  onAppointmentUpdated: (data: any) => void
) {
  const channelName = `private-doctor-${doctorId}`;

  useEvent(channelName, "appointment-created", onNewAppointment);
  useEvent(channelName, "appointment-updated", onAppointmentUpdated);
}

export function useUserNotifications(
  userId: string,
  onNewNotification: (data: any) => void
) {
  const channelName = `private-user-${userId}`;

  useEvent(channelName, "new-notification", onNewNotification);
}
