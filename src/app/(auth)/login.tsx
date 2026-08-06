import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../utils/api';
import CustomAlert from '../../components/CustomAlert';

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  const showAlert = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  const handleLogin = async () => {
    if (!username.trim()) {
      showAlert('Error', 'Please enter your username.');
      return;
    }
    if (!password) {
      showAlert('Error', 'Please enter your password.');
      return;
    }
    if (password.length < 4) {
      showAlert('Error', 'Password must be at least 4 characters long.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/login', {
        username,
        password,
      });

      if (response.data.success) {
        if (remember) {
           await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
        } else {
           // For now, still set it to AsyncStorage so session persists temporarily, 
           // but ideally handled differently if "remember me" is false
           await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
        }
        router.replace('/(tabs)');
      } else {
        showAlert('Error', response.data.message || 'Login failed.');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Network error. Please try again later.';
      showAlert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          {/* Logo / Heading */}
          <View style={styles.headerContainer}>
            <View style={styles.iconWrapper}>
               <FontAwesome5 name="om" size={32} color="#FFFFFF" />
            </View>
            <Text style={styles.title}>Kaivalya</Text>
            <Text style={styles.subtitle}>Your companion on the path of self-mastery</Text>
          </View>

          {/* Tab Selector */}
          <View style={styles.tabSelectorContainer}>
            <View style={[styles.tabButton, styles.activeTabButton]}>
              <Text style={styles.activeTabButtonText}>Sign In</Text>
            </View>
            <TouchableOpacity 
              style={[styles.tabButton, styles.inactiveTabButton]}
              onPress={() => router.replace('/(auth)/register')}
            >
              <Text style={styles.inactiveTabButtonText}>Register</Text>
            </TouchableOpacity>
          </View>

          {/* Login Form */}
          <View style={styles.formContainer}>
            
            {/* Username Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>USERNAME</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your username"
                  placeholderTextColor="#94A3B8"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>PASSWORD</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#94A3B8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                   <FontAwesome5 name={showPassword ? "eye" : "eye-slash"} size={16} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Remember Me */}
            <View style={styles.rememberContainer}>
              <TouchableOpacity 
                style={styles.checkboxRow} 
                onPress={() => setRemember(!remember)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, remember && styles.checkboxChecked]}>
                  {remember && <FontAwesome5 name="check" size={10} color="#FFFFFF" />}
                </View>
                <Text style={styles.rememberText}>Remember me</Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]} 
              onPress={handleLogin} 
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>New here? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                <Text style={styles.linkText}>Create an account</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Privacy Note */}
          <View style={styles.privacyCard}>
            <FontAwesome5 name="lock" size={16} color="#1E293B" style={styles.privacyIcon} />
            <Text style={styles.privacyText}>
              <Text style={styles.privacyBold}>Privacy first.</Text> No email or phone required. All data stays on your device only.
            </Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
      <CustomAlert 
        visible={alertVisible} 
        title={alertTitle} 
        message={alertMessage} 
        onClose={() => setAlertVisible(false)} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F4F0', // warm beige background
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingTop: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconWrapper: {
    width: 68,
    height: 68,
    backgroundColor: '#EA580C', // orange box icon
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#0F172A', // dark text
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B', // gray
    marginTop: 6,
    textAlign: 'center',
  },
  tabSelectorContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 32,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTabButton: {
    backgroundColor: '#EA580C',
  },
  inactiveTabButton: {
    backgroundColor: '#FFFFFF',
  },
  activeTabButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  inactiveTabButtonText: {
    color: '#64748B',
    fontWeight: '500',
    fontSize: 15,
  },
  formContainer: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 54,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: '#0F172A',
  },
  eyeIcon: {
    padding: 8,
  },
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#EA580C',
    borderColor: '#EA580C',
  },
  rememberText: {
    fontSize: 14,
    color: '#475569',
  },
  button: {
    backgroundColor: '#EA580C',
    borderRadius: 14,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    color: '#64748B',
    fontSize: 14,
  },
  linkText: {
    color: '#EA580C',
    fontSize: 14,
    fontWeight: 'bold',
  },
  privacyCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginTop: 48,
    gap: 12,
  },
  privacyIcon: {
    marginRight: 2,
  },
  privacyText: {
    flex: 1,
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  privacyBold: {
    fontWeight: 'bold',
    color: '#0F172A',
  },
});
