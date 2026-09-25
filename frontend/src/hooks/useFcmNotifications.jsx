import { useEffect } from 'react';
import { messaging, getToken, onMessage } from '../config/firebase';
import { toast } from 'react-toastify';
import api from "../config/axiosInstance";
import { useSelector } from 'react-redux';

export const useFcmNotifications = () => {
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    // Only request permission if user is logged in
    if (!user) return;

    const requestPermission = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          // Replace with your VAPID key from Firebase Console -> Project Settings -> Cloud Messaging -> Web configuration if you generate one.
          const token = await getToken(messaging);
          
          if (token) {
            // Send token to backend
            await api.post('/api/v1/fcm/register', {
              token: token,
              deviceInfo: navigator.userAgent
            });
          }
        } else {
          console.warn('Notification permission denied');
        }
      } catch (error) {
        console.error('An error occurred while retrieving token:', error);
      }
    };

    requestPermission();

    // Handle incoming messages when the app is in the foreground
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Message received in foreground: ', payload);
      
      const { title, body } = payload.notification || {};
      if (title || body) {
        toast.info(
          <div>
            <strong>{title}</strong>
            <p>{body}</p>
          </div>
        );
      }
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);
};
