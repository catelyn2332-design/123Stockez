// Powered by OnSpace.AI
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AlertProvider } from '@/template';
import { AuthProvider } from '@/contexts/AuthContext';
import { GalleryProvider } from '@/contexts/GalleryContext';
import { CarnetProvider } from '@/contexts/CarnetContext';

export default function RootLayout() {
  return (
    <AlertProvider>
      <SafeAreaProvider>
        <AuthProvider>
          <GalleryProvider>
            <CarnetProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="albums" />
              <Stack.Screen name="photos" />
              <Stack.Screen name="photo-editor" options={{ presentation: 'fullScreenModal' }} />
              <Stack.Screen name="viewer" options={{ presentation: 'fullScreenModal' }} />
              <Stack.Screen name="carnet-detail" />
              <Stack.Screen name="carnet-entry" />
            </Stack>
            </CarnetProvider>
          </GalleryProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </AlertProvider>
  );
}
