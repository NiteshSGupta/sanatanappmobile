import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Linking, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AboutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleOpenURL = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error("Failed to open URL:", error);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#EA580C" />

      {/* Orange Header Bar */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <FontAwesome5 name="arrow-left" size={18} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kaivalya</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Our Mission Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <FontAwesome5 name="bullseye" size={16} color="#EA580C" />
            </View>
            <Text style={styles.cardTitle}>Our Mission</Text>
          </View>
          <Text style={styles.cardBody}>
            Kaivalya is built to support seekers on the ancient path of self-mastery. We believe that true strength comes from within — through discipline, purity, and consistency of practice.
          </Text>
        </View>

        {/* Our Philosophy Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <FontAwesome5 name="lightbulb" size={16} color="#EA580C" />
            </View>
            <Text style={styles.cardTitle}>Our Philosophy</Text>
          </View>
          <Text style={styles.cardBody}>
            Rooted in the timeless wisdom of the Vedic tradition, we honour Brahmacharya not merely as abstinence, but as the conscious channeling of vital energy towards higher spiritual and creative purpose.
          </Text>
        </View>

        {/* Our Values Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <FontAwesome5 name="award" size={16} color="#EA580C" />
            </View>
            <Text style={styles.cardTitle}>Our Values</Text>
          </View>

          {/* Privacy Value */}
          <View style={styles.valueRow}>
            <View style={[styles.valueIconBg, { backgroundColor: '#F1F5F9' }]}>
              <FontAwesome5 name="lock" size={14} color="#0F172A" />
            </View>
            <View style={styles.valueTextContainer}>
              <Text style={styles.valueTitle}>Privacy</Text>
              <Text style={styles.valueDesc}>Your journey is personal. No data leaves your device.</Text>
            </View>
          </View>

          {/* Compassion Value */}
          <View style={styles.valueRow}>
            <View style={[styles.valueIconBg, { backgroundColor: '#DCFCE7' }]}>
              <FontAwesome5 name="leaf" size={14} color="#16A34A" />
            </View>
            <View style={styles.valueTextContainer}>
              <Text style={styles.valueTitle}>Compassion</Text>
              <Text style={styles.valueDesc}>We meet every stumble with kindness, not judgement.</Text>
            </View>
          </View>

          {/* Authenticity Value */}
          <View style={styles.valueRow}>
            <View style={[styles.valueIconBg, { backgroundColor: '#DBEAFE' }]}>
              <FontAwesome5 name="book" size={14} color="#2563EB" />
            </View>
            <View style={styles.valueTextContainer}>
              <Text style={styles.valueTitle}>Authenticity</Text>
              <Text style={styles.valueDesc}>Grounded in genuine Vedic wisdom and tradition.</Text>
            </View>
          </View>

          {/* Community Value */}
          <View style={styles.valueRow}>
            <View style={[styles.valueIconBg, { backgroundColor: '#FEF9C3' }]}>
              <FontAwesome5 name="handshake" size={14} color="#CA8A04" />
            </View>
            <View style={styles.valueTextContainer}>
              <Text style={styles.valueTitle}>Community</Text>
              <Text style={styles.valueDesc}>A silent brotherhood walking the same path.</Text>
            </View>
          </View>
        </View>

        {/* Developer Card (Placed at the end) */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <FontAwesome5 name="user-tie" size={16} color="#EA580C" />
            </View>
            <Text style={styles.cardTitle}>Developer</Text>
          </View>

          {/* Inner Developer Badge Card */}
          <View style={styles.devBadgeCard}>
            <View style={styles.devProfileHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>NG</Text>
              </View>
              <View>
                <Text style={styles.devName}>Nitesh Gupta</Text>
                <Text style={styles.devRole}>App Developer</Text>
              </View>
            </View>

            <View style={styles.devDivider} />

            {/* Website Info */}
            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => handleOpenURL('https://niteshgupta.dev')}
              activeOpacity={0.7}
            >
              <View style={styles.contactIconBg}>
                <FontAwesome5 name="globe" size={14} color="#0284C7" />
              </View>
              <View style={styles.contactDetails}>
                <Text style={styles.contactLabel}>WEBSITE</Text>
                <Text style={styles.contactValueLink}>niteshgupta.dev</Text>
              </View>
            </TouchableOpacity>

            {/* Email Info */}
            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => handleOpenURL('mailto:niteshgupta9946@gmail.com')}
              activeOpacity={0.7}
            >
              <View style={styles.contactIconBg}>
                <FontAwesome5 name="envelope" size={13} color="#EA580C" />
              </View>
              <View style={styles.contactDetails}>
                <Text style={styles.contactLabel}>EMAIL</Text>
                <Text style={styles.contactValueLink}>niteshgupta9946@gmail.com</Text>
              </View>
            </TouchableOpacity>

            {/* Address Info */}
            <View style={styles.contactItem}>
              <View style={styles.contactIconBg}>
                <FontAwesome5 name="map-marker-alt" size={14} color="#EF4444" />
              </View>
              <View style={styles.contactDetails}>
                <Text style={styles.contactLabel}>ADDRESS</Text>
                <Text style={styles.contactValue}>Vadodara, Gujarat, India — 390011</Text>
              </View>
            </View>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F4F0', // warm beige background matching profile
  },
  header: {
    backgroundColor: '#EA580C', // Orange brand header color
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 90,
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
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerPlaceholder: {
    width: 40, // equal to back button to center the title perfectly
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  cardBody: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
  },
  valueIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  valueTextContainer: {
    flex: 1,
  },
  valueTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  valueDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  devBadgeCard: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    borderRadius: 16,
    padding: 16,
    marginTop: 4,
  },
  devProfileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EA580C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  devName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  devRole: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#EA580C',
    marginTop: 2,
  },
  devDivider: {
    height: 1,
    backgroundColor: '#FFEDD5',
    marginVertical: 14,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 12,
  },
  contactIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  contactDetails: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  contactValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 2,
  },
  contactValueLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EA580C',
    marginTop: 2,
    textDecorationLine: 'underline',
  },
});
