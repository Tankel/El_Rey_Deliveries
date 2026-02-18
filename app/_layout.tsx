import { Stack } from 'expo-router';
import { AppProviders } from '@/state';

export default function RootLayout() {
  return (
    <AppProviders>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(client)" />
        <Stack.Screen name="(admin)" />
        <Stack.Screen name="(driver)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </AppProviders>
  );
}
