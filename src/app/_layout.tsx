import { Stack } from 'expo-router';
import { ThemeProvider } from '@/context/ThemeContext';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#1a1a2e' },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="create" />
        <Stack.Screen name="roadmap" />
        <Stack.Screen name="history" />
        <Stack.Screen name="history-roadmap" />
        <Stack.Screen
          name="settings"
          options={{ animation: 'slide_from_bottom' }}
        />
      </Stack>
    </ThemeProvider>
  );
}
