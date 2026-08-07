import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomAlert from '../components/CustomAlert';
import api from '../utils/api';

export default function ContactScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Contact form states
  const [contactCategory, setContactCategory] = useState('Support');
  const [contactName, setContactName] = useState('');
  const [contactMobile, setContactMobile] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [isSendingContact, setIsSendingContact] = useState(false);

  // Custom Alert States
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  const showCustomAlert = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  const handleContactSubmit = async () => {
    if (!contactName.trim()) {
      showCustomAlert('Error', 'Please enter your name.');
      return;
    }
    if (!contactMessage.trim()) {
      showCustomAlert('Error', 'Please enter your message.');
      return;
    }

    setIsSendingContact(true);
    try {
      const response = await api.post('/contact', {
        category: contactCategory,
        name: contactName.trim(),
        mobile: contactMobile.trim() || null,
        email: contactEmail.trim() || null,
        message: contactMessage.trim(),
      });

      if (response.data && response.data.success) {
        showCustomAlert('Message Sent', 'Thank you! Your message has been sent successfully.');
        setContactName('');
        setContactMobile('');
        setContactEmail('');
        setContactMessage('');
        setContactCategory('Support');
      } else {
        showCustomAlert('Error', response.data.message || 'Could not submit message. Please try again.');
      }
    } catch (err: any) {
      console.error('Contact submission failed:', err);
      const errorMsg = err.response?.data?.message || 'Could not submit message. Please check your internet connection and try again.';
      showCustomAlert('Submission Failed', errorMsg);
    } finally {
      setIsSendingContact(false);
    }
  };

  const handleOpenEmail = async () => {
    const email = 'niteshgupta9946@gmail.com';
    const subject = encodeURIComponent(`Kaivalya App: ${contactCategory}`);
    const body = encodeURIComponent(`Hi Nitesh,\n\n`);
    const url = `mailto:${email}?subject=${subject}&body=${body}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        showCustomAlert('Error', 'Could not open mail app. Please email directly to niteshgupta9946@gmail.com');
      }
    } catch (err) {
      console.error(err);
      showCustomAlert('Error', 'Could not open mail app.');
    }
  };

  const isFormValid = contactName.trim().length > 0 && contactMessage.trim().length > 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#EA580C" />

      {/* Orange Header bar */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <FontAwesome5 name="arrow-left" size={18} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Contact Us</Text>
          <Text style={styles.headerSubtitle}>We read every message</Text>
        </View>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Category Picker */}
        <Text style={styles.label}>WHAT IS THIS ABOUT?</Text>
        <View style={styles.categoryGrid}>
          <View style={styles.categoryRow}>
            <TouchableOpacity
              style={[styles.categoryBtn, contactCategory === 'Support' && styles.categoryBtnActive]}
              onPress={() => setContactCategory('Support')}
              activeOpacity={0.7}
            >
              <FontAwesome5 name="tools" size={14} color={contactCategory === 'Support' ? '#EA580C' : '#64748B'} />
              <Text style={[styles.categoryText, contactCategory === 'Support' && styles.categoryTextActive]}>Support</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.categoryBtn, contactCategory === 'Feedback' && styles.categoryBtnActive]}
              onPress={() => setContactCategory('Feedback')}
              activeOpacity={0.7}
            >
              <FontAwesome5 name="comment-alt" size={14} color={contactCategory === 'Feedback' ? '#EA580C' : '#64748B'} />
              <Text style={[styles.categoryText, contactCategory === 'Feedback' && styles.categoryTextActive]}>Feedback</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.categoryRow}>
            <TouchableOpacity
              style={[styles.categoryBtn, contactCategory === 'Suggestion' && styles.categoryBtnActive]}
              onPress={() => setContactCategory('Suggestion')}
              activeOpacity={0.7}
            >
              <FontAwesome5 name="magic" size={14} color={contactCategory === 'Suggestion' ? '#EA580C' : '#64748B'} />
              <Text style={[styles.categoryText, contactCategory === 'Suggestion' && styles.categoryTextActive]}>Suggestion</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.categoryBtn, contactCategory === 'Other' && styles.categoryBtnActive]}
              onPress={() => setContactCategory('Other')}
              activeOpacity={0.7}
            >
              <FontAwesome5 name="inbox" size={14} color={contactCategory === 'Other' ? '#EA580C' : '#64748B'} />
              <Text style={[styles.categoryText, contactCategory === 'Other' && styles.categoryTextActive]}>Other</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Inputs */}
        <Text style={styles.label}>YOUR NAME</Text>
        <TextInput
          style={styles.input}
          value={contactName}
          onChangeText={setContactName}
          placeholder="Enter your name"
          placeholderTextColor="#94A3B8"
        />

        <Text style={styles.label}>MOBILE NO (OPTIONAL)</Text>
        <TextInput
          style={styles.input}
          value={contactMobile}
          onChangeText={setContactMobile}
          placeholder="Enter your mobile number"
          placeholderTextColor="#94A3B8"
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>EMAIL (OPTIONAL)</Text>
        <TextInput
          style={styles.input}
          value={contactEmail}
          onChangeText={setContactEmail}
          placeholder="Enter your email address"
          placeholderTextColor="#94A3B8"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>MESSAGE</Text>
        <TextInput
          style={styles.textarea}
          value={contactMessage}
          onChangeText={setContactMessage}
          placeholder="Write your message here..."
          placeholderTextColor="#94A3B8"
          multiline
        />

        {/* Send Button */}
        <TouchableOpacity
          style={[styles.sendBtn, isFormValid && styles.sendBtnActive]}
          onPress={handleContactSubmit}
          disabled={isSendingContact}
          activeOpacity={0.8}
        >
          <Text style={styles.sendBtnText}>
            {isSendingContact ? 'Sending...' : 'Send Message'}
          </Text>
        </TouchableOpacity>

        {/* Direct support email card */}
        <View style={styles.directCard}>
          <Text style={styles.directTitle}>DIRECT EMAIL</Text>
          <TouchableOpacity
            style={styles.directRow}
            onPress={handleOpenEmail}
            activeOpacity={0.7}
          >
            <FontAwesome5 name="envelope" size={16} color="#EA580C" style={styles.directIcon} />
            <View style={{ flex: 1 }}>
              <Text style={styles.directLabel}>SUPPORT EMAIL</Text>
              <Text style={styles.directValue}>niteshgupta9946@gmail.com</Text>
            </View>
          </TouchableOpacity>
        </View>

      </ScrollView>

      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F4F0', // warm beige background
  },
  header: {
    backgroundColor: '#EA580C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 100,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 5,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#FFEDD5',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  headerPlaceholder: {
    width: 40,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1,
    marginTop: 18,
    marginBottom: 8,
  },
  categoryGrid: {
    gap: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryBtnActive: {
    borderColor: '#EA580C',
    backgroundColor: '#FFF7ED',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  categoryTextActive: {
    color: '#EA580C',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1E293B',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  textarea: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1E293B',
    minHeight: 120,
    textAlignVertical: 'top',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  sendBtn: {
    backgroundColor: '#F3A382',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  sendBtnActive: {
    backgroundColor: '#EA580C',
  },
  sendBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  directCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  directTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 14,
  },
  directRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  directIcon: {
    marginRight: 12,
    width: 20,
    textAlign: 'center',
  },
  directLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  directValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 2,
  },
});
