import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { Bell, CheckCircle, XCircle, Play, Calendar } from 'lucide-react';

const SOCKET_URL = 'http://localhost:5050';

export const useNotifications = (userId) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);

  // Load notifications from localStorage
  const loadNotificationsFromStorage = useCallback(() => {
    const storedNotifications = localStorage.getItem('user_notifications');
    if (storedNotifications) {
      try {
        const parsed = JSON.parse(storedNotifications);
        setNotifications(parsed);
        setUnreadCount(parsed.filter((n) => !n.read).length);
      } catch (e) {
        console.error('Error loading notifications:', e);
      }
    }
  }, []);

  // Save notifications to localStorage
  const saveNotificationsToStorage = useCallback((updatedNotifications) => {
    localStorage.setItem('user_notifications', JSON.stringify(updatedNotifications));
  }, []);

  // Generate unique notification ID
  const generateNotificationId = (bookingId, type) => {
    return `${bookingId}_${type}`;
  };

  // Check if notification already exists
  const notificationExists = (notificationsList, bookingId, type) => {
    return notificationsList.some((n) => n.id === generateNotificationId(bookingId, type));
  };

  // Add notification to list
  const addNotification = useCallback((newNotification) => {
    if (!newNotification) return;
    
    setNotifications((prev) => {
      if (notificationExists(prev, newNotification.bookingId, newNotification.type)) {
        return prev;
      }
      const updated = [newNotification, ...prev];
      saveNotificationsToStorage(updated);
      return updated;
    });
    setUnreadCount((prev) => prev + 1);
  }, [saveNotificationsToStorage]);

  // Mark notification as read
  const markAsRead = useCallback((notificationId) => {
    setNotifications((prev) => {
      const updated = prev.map((notif) =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      );
      saveNotificationsToStorage(updated);
      return updated;
    });
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, [saveNotificationsToStorage]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      const updated = prev.map((notif) => ({ ...notif, read: true }));
      saveNotificationsToStorage(updated);
      return updated;
    });
    setUnreadCount(0);
  }, [saveNotificationsToStorage]);

  // Fetch and sync notifications from bookings
  const syncNotificationsFromBookings = useCallback(async (bookings) => {
    if (!bookings || bookings.length === 0) return;
    
    const existingNotifications = JSON.parse(localStorage.getItem('user_notifications') || '[]');
    const existingIds = new Set(existingNotifications.map((n) => n.id));
    const newNotifications = [];

    bookings.forEach((booking) => {
      // Notification for booking acceptance (confirmed)
      if (booking.status === 'confirmed') {
        const notificationId = generateNotificationId(booking._id, 'booking_confirmed');
        if (!existingIds.has(notificationId)) {
          newNotifications.push({
            id: notificationId,
            type: 'booking_confirmed',
            title: 'Booking Accepted! ✅',
            message: `Your booking with ${booking.provider.name} has been accepted. They will start service on ${new Date(booking.date).toLocaleDateString()} at ${booking.time}.`,
            time: new Date(booking.updatedAt || booking.createdAt),
            read: false,
            bookingId: booking._id,
            providerName: booking.provider.name,
          });
        }
      }

      // Notification for service started
      if (booking.status === 'in_progress' && booking.startTime) {
        const notificationId = generateNotificationId(booking._id, 'service_started');
        if (!existingIds.has(notificationId)) {
          newNotifications.push({
            id: notificationId,
            type: 'service_started',
            title: 'Service Started! 🔧',
            message: `${booking.provider.name} has started working on your ${booking.service} service.`,
            time: new Date(booking.startTime),
            read: false,
            bookingId: booking._id,
            providerName: booking.provider.name,
          });
        }
      }

      // Notification for service completed
      if (booking.status === 'completed' && booking.endTime) {
        const notificationId = generateNotificationId(booking._id, 'service_completed');
        if (!existingIds.has(notificationId)) {
          newNotifications.push({
            id: notificationId,
            type: 'service_completed',
            title: 'Service Completed! 🎉',
            message: `${booking.provider.name} has completed your ${booking.service} service. Please leave a review!`,
            time: new Date(booking.endTime),
            read: false,
            bookingId: booking._id,
            providerName: booking.provider.name,
          });
        }
      }

      // Notification for booking rejection
      if (booking.status === 'rejected') {
        const notificationId = generateNotificationId(booking._id, 'booking_rejected');
        if (!existingIds.has(notificationId)) {
          newNotifications.push({
            id: notificationId,
            type: 'booking_rejected',
            title: 'Booking Rejected ❌',
            message: `Sorry, ${booking.provider.name} could not accept your booking request. Please try booking another provider.`,
            time: new Date(booking.updatedAt || booking.createdAt),
            read: false,
            bookingId: booking._id,
            providerName: booking.provider.name,
          });
        }
      }
    });

    if (newNotifications.length > 0) {
      newNotifications.sort((a, b) => new Date(b.time) - new Date(a.time));
      setNotifications((prev) => {
        const updated = [...newNotifications, ...prev];
        saveNotificationsToStorage(updated);
        return updated;
      });
      setUnreadCount((prev) => prev + newNotifications.filter((n) => !n.read).length);
    }
  }, [saveNotificationsToStorage]);

  // Initialize socket connection
  useEffect(() => {
    if (!userId) return;
    
    const newSocket = io(SOCKET_URL, { transports: ['websocket'] });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Notification socket connected');
      newSocket.emit('register', { userId, userType: 'user' });
    });

    newSocket.on('new_notification', (notification) => {
      console.log('Received new notification:', notification);
      addNotification(notification);
    });

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [userId, addNotification]);

  // Load initial notifications
  useEffect(() => {
    loadNotificationsFromStorage();
  }, [loadNotificationsFromStorage]);

  // Get notification style based on type
  const getNotificationStyle = (type) => {
    switch (type) {
      case 'booking_confirmed':
        return { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' };
      case 'service_started':
        return { icon: Play, color: 'text-blue-600', bgColor: 'bg-blue-100' };
      case 'service_completed':
        return { icon: CheckCircle, color: 'text-purple-600', bgColor: 'bg-purple-100' };
      case 'booking_rejected':
        return { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100' };
      default:
        return { icon: Bell, color: 'text-gray-600', bgColor: 'bg-gray-100' };
    }
  };

  // Format notification time
  const formatNotificationTime = (date) => {
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    addNotification,
    syncNotificationsFromBookings,
    getNotificationStyle,
    formatNotificationTime,
  };
};