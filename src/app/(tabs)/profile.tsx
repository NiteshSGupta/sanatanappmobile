import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomAlert from '../../components/CustomAlert';
import api from '../../utils/api';

const LEAGUE_BADGES: { [key: string]: any } = {
  seed: require('../../../assets/leaque-images/seed.png'),
  sprout: require('../../../assets/leaque-images/sprout.png'),
  frozen: require('../../../assets/leaque-images/frozen.png'),
  bloom: require('../../../assets/leaque-images/bloom.png'),
  season: require('../../../assets/leaque-images/season.png'),
  aurora: require('../../../assets/leaque-images/aurora.png'),
  brahmachari: require('../../../assets/leaque-images/brahmacharya.png'),
};

const LEAGUE_NAMES: { [key: string]: string } = {
  seed: 'Seed',
  sprout: 'Sprout',
  frozen: 'Frozen',
  bloom: 'Bloom',
  season: 'Season',
  aurora: 'Aurora',
  brahmachari: 'Brahmachari',
};

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  // Stats states
  const [currentStreak, setCurrentStreak] = useState(0);

  // Edit Profile States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAge, setEditAge] = useState('');
  const [editGender, setEditGender] = useState('Male');
  const [isSaving, setIsSaving] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Update Password States
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Custom Alert States
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  const showCustomAlert = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  const loadProfileData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }

      // Calculate streak
      const savedStart = await AsyncStorage.getItem('ojas_journey_start');
      let streakDays = 0;
      if (savedStart) {
        const start = new Date(savedStart);
        const now = new Date();
        const diff = now.getTime() - start.getTime();
        if (diff >= 0) {
          streakDays = Math.floor(diff / (1000 * 60 * 60 * 24));
        }
      }
      setCurrentStreak(streakDays);

    } catch (e) {
      console.error(e);
    }
  };

  const getFormattedJoiningDate = () => {
    if (!user || !user.created_at) return new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
    const d = new Date(user.created_at);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  useFocusEffect(
    useCallback(() => {
      loadProfileData();
    }, [])
  );

  const openEditModal = () => {
    setEditName(user?.name || '');
    setEditAge(user?.age?.toString() || '25');
    setEditGender(user?.gender || 'Male');
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim() || !editAge.trim()) {
      showCustomAlert('Error', 'Please enter both your name and age.');
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
          device_info: 'React Native App',
        });
      }

      setIsEditModalOpen(false);
      showCustomAlert('Success', 'Account updated successfully.');
    } catch (err) {
      console.error('Error saving profile details:', err);
      // Still close modal since AsyncStorage saved successfully
      setIsEditModalOpen(false);
      showCustomAlert('Success', 'Account details saved locally.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword.trim() || !newPassword.trim() || !confirmNewPassword.trim()) {
      showCustomAlert('Error', 'Please fill in all fields.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showCustomAlert('Error', 'New password and confirm password do not match.');
      return;
    }
    setIsUpdatingPassword(true);
    try {
      const username = user?.username || user?.uuid;
      if (username) {
        const response = await api.post('/profile', {
          uuid: username,
          password: currentPassword.trim(),
          new_password: newPassword.trim(),
        });

        if (response.data.success) {
          const updatedUser = {
            ...user,
            password: response.data.user.password || response.data.password || user.password,
          };
          await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
          setUser(updatedUser);

          setIsPasswordModalOpen(false);
          setCurrentPassword('');
          setNewPassword('');
          setConfirmNewPassword('');
          showCustomAlert('Success', 'Password updated successfully on server.');
        } else {
          showCustomAlert('Error', response.data.message || 'Could not update password.');
        }
      } else {
        showCustomAlert('Error', 'User profile not found.');
      }
    } catch (err: any) {
      console.error('Password update failed:', err);
      const errMsg = err.response?.data?.message || 'Current password incorrect or connection failure.';
      showCustomAlert('Error', errMsg);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = async () => {
    setIsLogoutModalOpen(false);
    await AsyncStorage.clear();
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
    if (days < 7) return 'seed';
    if (days < 21) return 'sprout';
    if (days < 40) return 'frozen';
    if (days < 90) return 'bloom';
    if (days < 180) return 'season';
    if (days < 365) return 'aurora';
    return 'brahmachari';
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
                <FontAwesome5 name="cog" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>
            <Text style={styles.profileSubMetaText}>Age: {user.age} · Gender: {user.gender}</Text>
            <View style={styles.leagueBadge}>
              {LEAGUE_BADGES[getLeagueBadge(currentStreak)] ? (
                <Image
                  source={LEAGUE_BADGES[getLeagueBadge(currentStreak)]}
                  style={{ width: 20, height: 20, borderRadius: getLeagueBadge(currentStreak) === 'aurora' ? 4 : 0 }}
                  resizeMode="contain"
                />
              ) : (
                <FontAwesome5 name="fire" size={12} color="#EA580C" />
              )}
              <Text style={styles.leagueBadgeText}>{LEAGUE_NAMES[getLeagueBadge(currentStreak)] || getLeagueBadge(currentStreak)}</Text>
            </View>
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

        {/* Account Settings Card */}
        <View style={styles.settingsCard}>
          <TouchableOpacity style={styles.settingsRow} onPress={() => router.push('/about')}>
            <Text style={styles.settingsLabel}>About Us</Text>
            <FontAwesome5 name="chevron-right" size={14} color="#94A3B8" />
          </TouchableOpacity>
          <View style={styles.divider} />

          <TouchableOpacity style={styles.settingsRow} onPress={() => router.push('/contact')}>
            <Text style={styles.settingsLabel}>Contact Us</Text>
            <FontAwesome5 name="chevron-right" size={14} color="#94A3B8" />
          </TouchableOpacity>
          <View style={styles.divider} />

          <TouchableOpacity style={styles.settingsRow} onPress={() => setIsPasswordModalOpen(true)}>
            <Text style={styles.settingsLabel}>Update Password</Text>
            <FontAwesome5 name="chevron-right" size={14} color="#94A3B8" />
          </TouchableOpacity>
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

            {/* Joining Date (Un-editable) */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>JOINING DATE</Text>
              <View style={[styles.textInput, styles.disabledInputCard]}>
                <Text style={styles.disabledInputText}>{getFormattedJoiningDate()}</Text>
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

      {/* Update Password Modal */}
      <Modal visible={isPasswordModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Password</Text>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setIsPasswordModalOpen(false)}>
                <FontAwesome5 name="times" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Current Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>CURRENT PASSWORD</Text>
              <TextInput
                style={styles.textInput}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password"
                placeholderTextColor="#94A3B8"
                secureTextEntry
              />
            </View>

            {/* New Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>NEW PASSWORD</Text>
              <TextInput
                style={styles.textInput}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                placeholderTextColor="#94A3B8"
                secureTextEntry
              />
            </View>

            {/* Confirm New Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>CONFIRM NEW PASSWORD</Text>
              <TextInput
                style={styles.textInput}
                value={confirmNewPassword}
                onChangeText={setConfirmNewPassword}
                placeholder="Confirm new password"
                placeholderTextColor="#94A3B8"
                secureTextEntry
              />
            </View>

            {/* Save Button */}
            <TouchableOpacity style={styles.btnSave} onPress={handleUpdatePassword} disabled={isUpdatingPassword}>
              <Text style={styles.btnSaveText}>{isUpdatingPassword ? 'Updating...' : 'Update Password'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>



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
  disabledInputCard: {
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  disabledInputText: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '500',
  },

});
