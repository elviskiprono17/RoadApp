import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { SubscriptionProvider } from '@/context/SubscriptionContext';
import { setupNotificationHandler } from '@/utils/notifications';

// ─── Set up notification handler at module level ────────────
if (Platform.OS !== 'web') {
  setupNotificationHandler();
}

// ─── Deep link when user taps a notification ────────────────
function useNotificationObserver() {
  useEffect(() => {
    if (Platform.OS === 'web') return;

    function redirect(notification: Notifications.Notification) {
      const url = notification.request.content.data?.url;
      if (typeof url === 'string') {
        router.push(url as any);
      }
    }

    // Handle the case where app was opened from a notification tap
    const response = Notifications.getLastNotificationResponse();
    if (response?.notification) {
      redirect(response.notification);
    }

    // Listen for future notification taps
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        redirect(response.notification);
      },
    );

    return () => {
      subscription.remove();
    };
  }, []);
}

export default function RootLayout() {
  useNotificationObserver();

  return (
    <AuthProvider>
      <SubscriptionProvider>
        <ThemeProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#1a1a2e' },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="(auth)" />
            <Stack.Screen
              name="(onboarding)"
              options={{ gestureEnabled: false }}
            />
            <Stack.Screen name="index" />
            <Stack.Screen name="create" />
            <Stack.Screen name="roadmap" />
            <Stack.Screen name="history" />
            <Stack.Screen name="history-roadmap" />
            <Stack.Screen
              name="settings"
              options={{ animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="paywall"
              options={{ animation: 'slide_from_bottom' }}
            />
          </Stack>
        </ThemeProvider>
      </SubscriptionProvider>
    </AuthProvider>
  );
}

