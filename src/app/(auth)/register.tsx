import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomAlert from '../../components/CustomAlert';
import api from '../../utils/api';

export default function RegisterScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [loading, setLoading] = useState(false);
  const [committed, setCommitted] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  const showAlert = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  const handleRegister = async () => {
    if (!name.trim()) {
      showAlert('Error', 'Please enter your name.');
      return;
    }
    if (!username.trim()) {
      showAlert('Error', 'Please choose a username.');
      return;
    }
    if (!password) {
      showAlert('Error', 'Please create a password.');
      return;
    }
    if (password.length < 4) {
      showAlert('Error', 'Password must be at least 4 characters long.');
      return;
    }
    if (!age.trim()) {
      showAlert('Error', 'Please enter your age.');
      return;
    }
    const parsedAge = parseInt(age);
    if (isNaN(parsedAge) || parsedAge <= 0 || age.length > 2 || !/^\d+$/.test(age)) {
      showAlert('Error', 'Age must be a valid 2-digit number (e.g., 24).');
      return;
    }
    if (!committed) {
      showAlert('Commitment Required', 'Please check the box to commit to this journey before continuing.');
      return;
    }

    setLoading(true);
    try {
      // Check username uniqueness
      const checkResponse = await api.post('/check-username', {
        username: username.trim(),
      });

      if (checkResponse.data.exists) {
        showAlert('Error', 'Username is already taken. Please choose another one.');
        setLoading(false);
        return;
      }

      const response = await api.post('/sync', {
        uuid: username.trim(),
        password: password,
        name: name.trim(),
        age: parsedAge,
        gender: gender,
        date: new Date().toISOString().split('T')[0],
        device_info: 'React Native App',
      });

      if (response.data.success) {
        const userObj = { 
          username: username.trim(), 
          name: name.trim(), 
          age: parsedAge, 
          gender: gender,
          created_at: new Date().toISOString()
        };
        await AsyncStorage.setItem('user', JSON.stringify(userObj));

        // Start challenge status as inactive initially
        await AsyncStorage.setItem('ojas_journey_active', 'false');
        await AsyncStorage.removeItem('ojas_journey_start');

        router.replace('/(tabs)');
      } else {
        showAlert('Error', response.data.message || 'Registration failed.');
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
            <Text style={styles.title}>Brahmacharya</Text>
            <Text style={styles.subtitle}>Begin your journey of self-mastery</Text>
          </View>
    
          {/* Tab Selector */}
          <View style={styles.tabSelectorContainer}>
            <TouchableOpacity
              style={[styles.tabButton, styles.inactiveTabButton]}
              onPress={() => router.replace('/(auth)/login')}
            >
              <Text style={styles.inactiveTabButtonText}>Sign In</Text>
            </TouchableOpacity>
            <View style={[styles.tabButton, styles.activeTabButton]}>
              <Text style={styles.activeTabButtonText}>Register</Text>
            </View>
          </View>
    
          {/* Form */}
          <View style={styles.formContainer}>
            {/* Full Name Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>YOUR NAME</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your name"
                  placeholderTextColor="#94A3B8"
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>
    
            {/* Username Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>CHOOSE A USERNAME</Text>
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
              <Text style={styles.label}>CREATE PASSWORD</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Min. 4 characters"
                  placeholderTextColor="#94A3B8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
            </View>
    
            {/* Age Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>YOUR AGE</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your age"
                  placeholderTextColor="#94A3B8"
                  value={age}
                  onChangeText={(text) => setAge(text.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                  maxLength={2}
                />
              </View>
            </View>
    
            {/* Gender Selector Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>GENDER</Text>
              <View style={styles.genderSelectorRow}>
                {['Male', 'Female'].map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.genderSelectBtn,
                      gender === g && styles.genderSelectBtnActive,
                    ]}
                    onPress={() => setGender(g)}
                  >
                    <Text
                      style={[
                        styles.genderSelectBtnText,
                        gender === g && styles.genderSelectBtnTextActive,
                      ]}
                    >
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
    
            {/* Info card */}
            <View style={styles.privacyCard}>
              <View style={styles.privacyHeader}>
                <FontAwesome5 name="lock" size={14} color="#1E293B" style={styles.privacyIcon} />
                <Text style={styles.privacyTitle}>No email. No phone. No tracking.</Text>
              </View>
              <Text style={styles.privacyText}>
                Your journey stays entirely on your device. We never collect or share your data.
              </Text>
    
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setCommitted(!committed)}
                activeOpacity={0.8}
              >
                <View style={[styles.checkbox, committed && styles.checkboxChecked]}>
                  {committed && <FontAwesome5 name="check" size={10} color="#FFFFFF" />}
                </View>
                <Text style={styles.commitText}>
                  I commit to this journey with sincerity. I understand this path requires patience and self-compassion.
                </Text>
              </TouchableOpacity>
            </View>
    
            {/* Action Button */}
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Begin the Journey</Text>
              )}
            </TouchableOpacity>
    
            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text style={styles.linkText}>Sign in</Text>
              </TouchableOpacity>
            </View>
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
    paddingBottom: 40,
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
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
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
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 10,
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
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  goalCard: {
    width: '48%', // roughly 2 columns
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    flexGrow: 1,
  },
  goalCardSelected: {
    borderColor: '#EA580C',
    backgroundColor: '#FFF7ED',
  },
  goalDaysText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  goalDaysTextSelected: {
    color: '#EA580C',
  },
  goalLabelText: {
    fontSize: 12,
    color: '#64748B',
  },
  privacyCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    padding: 20,
    marginBottom: 24,
  },
  privacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  privacyIcon: {
    marginTop: -2,
  },
  privacyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  privacyText: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 16,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginRight: 12,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#EA580C',
    borderColor: '#EA580C',
  },
  commitText: {
    flex: 1,
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
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
  genderSelectorRow: {
    flexDirection: 'row',
    gap: 12,
  },
  genderSelectBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  genderSelectBtnActive: {
    borderColor: '#EA580C',
    backgroundColor: '#FFF7ED',
  },
  genderSelectBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
  },
  genderSelectBtnTextActive: {
    color: '#EA580C',
  },
});
