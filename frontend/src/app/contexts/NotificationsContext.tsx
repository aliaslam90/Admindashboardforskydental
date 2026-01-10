import { createContext, useContext, useState, ReactNode } from 'react';

type NotificationType =
  | 'appointment_created'
  | 'appointment_cancelled'
  | 'appointment_rescheduled'
  | 'appointment_checked_in'
  | 'appointment_completed'
  | 'doctor_updated'
  | 'profile_updated';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  userId: string; // admin or doctor ID
  userType: 'admin' | 'doctor';
  appointmentId?: string;
  doctorId?: string;
}

interface NotificationsContextValue {
  notifications: Notification[];
  getNotifications: (userId: string, userType: 'admin' | 'doctor') => Notification[];
  markNotificationAsRead: (notificationId: string) => void;
  clearAllNotifications: (userId: string) => void;
  pushNotification: (notification: Notification) => void;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const getNotifications = (userId: string, userType: 'admin' | 'doctor') =>
    notifications
      .filter(
        (n) =>
          (n.userId === userId || n.userId === userType) &&
          n.userType === userType,
      )
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() -
          new Date(a.timestamp).getTime(),
      );

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
    );
  };

  const clearAllNotifications = (userId: string) => {
    setNotifications((prev) => prev.filter((n) => n.userId !== userId));
  };

  const pushNotification = (notification: Notification) => {
    setNotifications((prev) => [notification, ...prev]);
  };

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        getNotifications,
        markNotificationAsRead,
        clearAllNotifications,
        pushNotification,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return ctx;
}

