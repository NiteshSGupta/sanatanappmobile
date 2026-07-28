import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator, Animated, Platform } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';
import { FontAwesome5 } from '@expo/vector-icons';

interface InternetConnectionWrapperProps {
  children: React.ReactNode;
}

export default function InternetConnectionWrapper({ children }: InternetConnectionWrapperProps) {
  const netInfo = useNetInfo();
  
  // Custom states to ensure we are actually online (ping check)
  const [isInternetActive, setIsInternetActive] = useState<boolean>(true);
  const [checking, setChecking] = useState<boolean>(false);
  
  // Animation for the pulsing offline icon
  const [pulseAnim] = useState(() => new Animated.Value(1));

  // Run a ping check to verify true internet connectivity (e.g. DNS resolution/backhaul check)
  const verifyInternet = async () => {
    setChecking(true);
    
    // On Web, use navigator.onLine as a first-class check to avoid CORS failures
    if (Platform.OS === 'web') {
      const online = typeof window !== 'undefined' && window.navigator ? window.navigator.onLine : true;
      setIsInternetActive(online);
      setChecking(false);
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      
      // Ping an ultra-reliable, lightweight endpoint
      const response = await fetch('https://clients3.google.com/generate_204', {
        method: 'GET',
        signal: controller.signal,
        headers: { 'Cache-Control': 'no-cache' },
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok || response.status === 204) {
        setIsInternetActive(true);
      } else {
        setIsInternetActive(false);
      }
    } catch {
      setIsInternetActive(false);
    } finally {
      setChecking(false);
    }
  };

  // Pulse animation loop
  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;
    if (!isInternetActive) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.5,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
    } else {
      pulseAnim.setValue(1);
    }

    return () => {
      if (animation) {
        animation.stop();
      }
    };
  }, [isInternetActive, pulseAnim]);

  // Listen to web online/offline events
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleOnline = () => setIsInternetActive(true);
      const handleOffline = () => setIsInternetActive(false);

      if (typeof window !== 'undefined') {
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsInternetActive(window.navigator.onLine);
      }

      return () => {
        if (typeof window !== 'undefined') {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
        }
      };
    }
  }, []);

  // Sync state with NetInfo updates (only for native)
  useEffect(() => {
    if (Platform.OS !== 'web') {
      if (netInfo.isConnected === false) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsInternetActive(false);
      } else if (netInfo.isConnected === true) {
        verifyInternet();
      }
    }
  }, [netInfo.isConnected]);

  // Periodic network check every 10 seconds to ensure connection remains active (only for native)
  useEffect(() => {
    if (Platform.OS !== 'web') {
      const interval = setInterval(() => {
        if (netInfo.isConnected !== false) {
          verifyInternet();
        }
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [netInfo.isConnected]);

  return (
    <View style={{ flex: 1 }}>
      {children}
      
      <Modal
        visible={!isInternetActive}
        transparent={true}
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Animated.View style={[styles.iconWrapper, { opacity: pulseAnim }]}>
              <FontAwesome5 name="wifi" size={36} color="#FFFFFF" style={styles.icon} />
              <View style={styles.slashLine} />
            </Animated.View>

            <Text style={styles.title}>Internet Required</Text>
            <Text style={styles.description}>
              This application requires an active internet connection to synchronize your journey. Please connect to the internet to continue.
            </Text>

            <TouchableOpacity 
              style={[styles.button, checking && styles.buttonDisabled]} 
              onPress={verifyInternet}
              disabled={checking}
              activeOpacity={0.8}
            >
              {checking ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.buttonText}>Check Connection</Text>
              )}
            </TouchableOpacity>
            
            {checking && (
              <Text style={styles.checkingText}>Verifying connection status...</Text>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)', // beautiful slate dark overlay
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  iconWrapper: {
    width: 80,
    height: 80,
    backgroundColor: '#EF4444', // Red status indicator
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  icon: {
    marginRight: 2,
  },
  slashLine: {
    position: 'absolute',
    width: 50,
    height: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    transform: [{ rotate: '-45deg' }],
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 28,
  },
  button: {
    width: '100%',
    height: 52,
    backgroundColor: '#EA580C', // Match theme orange
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkingText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 12,
  },
});
