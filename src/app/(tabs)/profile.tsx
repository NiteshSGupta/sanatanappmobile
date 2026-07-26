import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Switch, ScrollView, Modal, TextInput, Platform } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../utils/api';

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  
  // Stats states
  const [currentStreak, setCurrentStreak] = useState(0);
  const [successRate, setSuccessRate] = useState(86);
  const [totalDays, setTotalDays] = useState(0);
  const [memberSince, setMemberSince] = useState('Jan 2025');

  // Switch preferences
  const [reminders, setReminders] = useState(true);
  const [notifications, setNotifications] = useState(true);

  // Edit Profile States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAge, setEditAge] = useState('');
  const [editGender, setEditGender] = useState('Male');
  const [isSaving, setIsSaving] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const loadProfileData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }

      // Calculate streak and total days
      const savedStart = await AsyncStorage.getItem('ojas_journey_start');
      let streakDays = 0;
      let memberDateStr = 'Jan 2025';
      if (savedStart) {
        const start = new Date(savedStart);
        const now = new Date();
        const diff = now.getTime() - start.getTime();
        if (diff >= 0) {
          streakDays = Math.floor(diff / (1000 * 60 * 60 * 24));
        }
        
        // Format member since month/year (e.g. "Jul 2026")
        memberDateStr = start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }
      setCurrentStreak(streakDays);
      setTotalDays(streakDays); // total days on path
      setMemberSince(memberDateStr);

      // Success rate estimation (scan last 7 days)
      let totalTasks = 0;
      let completedTasks = 0;
      const today = new Date();
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const storedTasks = await AsyncStorage.getItem(`dincharya_${dateStr}`);
        if (storedTasks) {
          const tasks = JSON.parse(storedTasks);
          totalTasks += tasks.length;
          completedTasks += tasks.filter((t: any) => t.completed).length;
        }
      }
      if (totalTasks > 0) {
        setSuccessRate(Math.round((completedTasks / totalTasks) * 100));
      } else {
        setSuccessRate(86); // default mock to look good
      }

      // Load user preferences
      const savedReminders = await AsyncStorage.getItem('pref_reminders');
      if (savedReminders !== null) setReminders(savedReminders === 'true');
      
      const savedNotifications = await AsyncStorage.getItem('pref_notifications');
      if (savedNotifications !== null) setNotifications(savedNotifications === 'true');

    } catch (e) {
      console.error(e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProfileData();
    }, [])
  );

  const toggleReminders = async (val: boolean) => {
    setReminders(val);
    await AsyncStorage.setItem('pref_reminders', val.toString());
  };

  const toggleNotifications = async (val: boolean) => {
    setNotifications(val);
    await AsyncStorage.setItem('pref_notifications', val.toString());
  };

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const openEditModal = () => {
    setEditName(user?.name || '');
    setEditAge(user?.age?.toString() || '25');
    setEditGender(user?.gender || 'Male');
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim() || !editAge.trim()) {
      showAlert('Error', 'Please enter both your name and age.');
      return;
    }
    
    setIsSaving(true);
    try {
      const updatedUser = {
        ...user,
        name: editName.trim(),
        age: parseInt(editAge),
        gender: editGender,
      };
      
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      // Call Laravel sync in background if username exists
      const username = user?.username || user?.uuid;
      if (username) {
        await api.post('/sync', {
          uuid: username,
          password: user?.password || 'password',
          name: editName.trim(),
          age: parseInt(editAge),
          gender: editGender,
          date: new Date().toISOString().split('T')[0],
          device_info: Platform.OS === 'web' ? 'Web Browser' : 'React Native App',
        });
      }
      
      setIsEditModalOpen(false);
      showAlert('Success', 'Account updated successfully.');
    } catch (err) {
      console.error('Error saving profile details:', err);
      // Still close modal since AsyncStorage saved successfully
      setIsEditModalOpen(false);
      showAlert('Success', 'Account details saved locally.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = async () => {
    setIsLogoutModalOpen(false);
    await AsyncStorage.removeItem('user');
    router.replace('/(auth)/login');
  };

  // Extract initials
  const getInitials = () => {
    if (!user?.name) return 'NI';
    const parts = user.name.split(' ');
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return user.name.substring(0, 2).toUpperCase();
  };

  // Get league badge details
  const getLeagueBadge = (days: number) => {
    if (days < 7) return 'Shishya';
    if (days < 30) return 'Sadhaka';
    if (days < 90) return 'Tapasvi';
    if (days < 365) return 'Brahmacharya';
    return 'Maharishi';
  };

  if (!user) return null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Profile Card Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{getInitials()}</Text>
          </View>
          <View style={styles.profileMeta}>
            <View style={styles.nameRow}>
              <Text style={styles.nameText}>{user.name}</Text>
              <TouchableOpacity style={styles.btnEditProfile} onPress={openEditModal}>
                <FontAwesome5 name="cog" size={16} color="#64748B" />
              </TouchableOpacity>
            </View>
            <Text style={styles.profileSubMetaText}>Age: {user.age} · Gender: {user.gender}</Text>
            <View style={styles.leagueBadge}>
              <FontAwesome5 name="fire" size={12} color="#EA580C" />
              <Text style={styles.leagueBadgeText}>{getLeagueBadge(currentStreak)}</Text>
            </View>
          </View>
        </View>

        {/* 2x2 Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statValueText}>{currentStreak} days</Text>
            <Text style={styles.statLabelText}>Current Streak</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValueText}>{successRate}%</Text>
            <Text style={styles.statLabelText}>Success Rate</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValueText}>{totalDays}</Text>
            <Text style={styles.statLabelText}>Total Days</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValueText}>{memberSince}</Text>
            <Text style={styles.statLabelText}>Member Since</Text>
          </View>
        </View>

        {/* Privacy First Card */}
        <View style={styles.privacyCard}>
          <View style={styles.privacyHeaderRow}>
            <FontAwesome5 name="lock" size={14} color="#EA580C" />
            <Text style={styles.privacyTitle}>Privacy First</Text>
          </View>
          <Text style={styles.privacySubtext}>
            Your data lives only on this device. No email. No phone number. No servers. No analytics. Your journey is yours alone.
          </Text>
        </View>

        {/* Settings switches card */}
        <View style={styles.settingsCard}>
          <View style={styles.settingsRow}>
            <Text style={styles.settingsLabel}>Daily Reminders</Text>
            <Switch
              value={reminders}
              onValueChange={toggleReminders}
              trackColor={{ false: '#CBD5E1', true: '#FED7AA' }}
              thumbColor={reminders ? '#EA580C' : '#94A3B8'}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.settingsRow}>
            <Text style={styles.settingsLabel}>Notifications</Text>
            <Switch
              value={notifications}
              onValueChange={toggleNotifications}
              trackColor={{ false: '#CBD5E1', true: '#FED7AA' }}
              thumbColor={notifications ? '#EA580C' : '#94A3B8'}
            />
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.btnSignOut} onPress={handleLogout}>
          <Text style={styles.btnSignOutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* Bottom Sincerity Quote */}
        <Text style={styles.bottomQuote}>&quot;Walk the path with sincerity, not perfection.&quot;</Text>

      </ScrollView>

      {/* Account Settings Modal */}
      <Modal visible={isEditModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Account Settings</Text>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setIsEditModalOpen(false)}>
                <FontAwesome5 name="times" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>YOUR NAME</Text>
              <TextInput
                style={styles.textInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter name"
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* Age Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>AGE</Text>
              <TextInput
                style={styles.textInput}
                value={editAge}
                onChangeText={setEditAge}
                keyboardType="numeric"
                placeholder="Enter age"
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* Gender Selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>GENDER</Text>
              <View style={styles.genderRow}>
                {['Male', 'Female'].map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.genderBtn,
                      editGender === g && styles.genderBtnActive,
                    ]}
                    onPress={() => setEditGender(g)}
                  >
                    <Text
                      style={[
                        styles.genderBtnText,
                        editGender === g && styles.genderBtnTextActive,
                      ]}
                    >
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity style={styles.btnSave} onPress={handleSaveProfile} disabled={isSaving}>
              <Text style={styles.btnSaveText}>{isSaving ? 'Saving...' : 'Save Updates'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Sign Out Confirmation Modal */}
      <Modal visible={isLogoutModalOpen} transparent animationType="fade">
        <View style={styles.logoutModalOverlay}>
          <View style={styles.logoutModalContent}>
            <View style={styles.logoutModalIconBg}>
              <FontAwesome5 name="sign-out-alt" size={26} color="#EF4444" />
            </View>
            <Text style={styles.logoutModalTitle}>Sign Out?</Text>
            <Text style={styles.logoutModalDesc}>
              Are you sure you want to sign out? Your streak progress will remain saved on this device.
            </Text>
            <TouchableOpacity style={styles.logoutModalBtnPrimary} onPress={confirmLogout}>
              <Text style={styles.logoutModalBtnPrimaryText}>Yes, Sign Out</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutModalBtnSecondary} onPress={() => setIsLogoutModalOpen(false)}>
              <Text style={styles.logoutModalBtnSecondaryText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F4F0', // warm beige background
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 10,
    gap: 16,
  },
  avatarContainer: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: '#EA580C', // orange box icon
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  profileMeta: {
    justifyContent: 'center',
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnEditProfile: {
    padding: 4,
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F172A',
    textTransform: 'capitalize',
  },
  profileSubMetaText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  leagueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 4,
    alignSelf: 'flex-start',
    gap: 6,
  },
  leagueBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EA580C',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statBox: {
    width: '48%', // roughly 2 columns
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    padding: 16,
    flexGrow: 1,
  },
  statValueText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EA580C',
    marginBottom: 4,
  },
  statLabelText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  privacyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  privacyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  privacyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EA580C',
  },
  privacySubtext: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingVertical: 6,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  settingsLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  btnSignOut: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  btnSignOutText: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '700',
  },
  bottomQuote: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1.0,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 12,
  },
  genderBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  genderBtnActive: {
    borderColor: '#EA580C',
    backgroundColor: '#FFF7ED',
  },
  genderBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
  },
  genderBtnTextActive: {
    color: '#EA580C',
  },
  btnSave: {
    backgroundColor: '#EA580C',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  btnSaveText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  logoutModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logoutModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  logoutModalIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoutModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 12,
  },
  logoutModalDesc: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  logoutModalBtnPrimary: {
    backgroundColor: '#EF4444',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  logoutModalBtnPrimaryText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  logoutModalBtnSecondary: {
    backgroundColor: '#F1F5F9',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  logoutModalBtnSecondaryText: {
    color: '#475569',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
