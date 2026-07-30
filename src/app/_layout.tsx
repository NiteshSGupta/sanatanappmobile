import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import InternetConnectionWrapper from '../components/InternetConnectionWrapper';
import { SafeAreaProvider } from 'react-native-safe-area-context';


export default function RootLayout() {
  const [isAuthCheckDone, setIsAuthCheckDone] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await AsyncStorage.getItem('user');
      } catch (error) {
        console.error('Initial auth check failed:', error);
      } finally {
        setIsAuthCheckDone(true);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (!isAuthCheckDone) return;

    const inAuthGroup = segments[0] === '(auth)';

    const determineRoute = async () => {
      try {
        const user = await AsyncStorage.getItem('user');
        const isUserAuthenticated = !!user;
        
        if (!isUserAuthenticated && !inAuthGroup) {
          router.replace('/(auth)/login');
        } else if (isUserAuthenticated && inAuthGroup) {
          router.replace('/(tabs)');
        }
      } catch (err) {
        console.error('Routing check failed:', err);
      } finally {
        SplashScreen.hideAsync();
      }
    };

    determineRoute();
  }, [isAuthCheckDone, segments, router]);

  if (!isAuthCheckDone) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <InternetConnectionWrapper>
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </InternetConnectionWrapper>
    </SafeAreaProvider>
  );
}
