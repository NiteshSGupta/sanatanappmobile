import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AppGuideScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#EA580C" />

      {/* Orange Header Bar */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <FontAwesome5 name="arrow-left" size={18} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>App Guide</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Introduction */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <FontAwesome5 name="compass" size={16} color="#EA580C" />
            </View>
            <Text style={styles.cardTitle}>Kaivalya Journey Guide</Text>
          </View>
          <Text style={styles.cardBody}>
            Walk the path with sincerity, not perfection.
            {"\n\n"}
            Kaivalya is a personal self-discipline and self-mastery companion. It helps you build better routines, understand your patterns, and stay consistent on your journey.
            {"\n\n"}
            You don't need to be perfect. The goal is to become more aware, disciplined, and consistent each day.
          </Text>
        </View>

        {/* Section: Your Journey */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <FontAwesome5 name="route" size={16} color="#EA580C" />
            </View>
            <Text style={styles.cardTitle}>1. Your Journey</Text>
          </View>
          <Text style={styles.cardBody}>
            Kaivalya has two connected but separate parts:
          </Text>

          <View style={styles.subSection}>
            <Text style={[styles.subTitle, { color: '#EA580C' }]}>🧘 Recovery Journey</Text>
            <Text style={styles.subText}>
              Your continuous journey of self-control. It tracks your current streak, best streak, relapses, triggers, high-risk times/locations, and recovery patterns.
              {"\n\n"}
              <Text style={{ fontWeight: '700' }}>Your Recovery Journey does not reset when a Sankalpa is completed.</Text> A relapse may reset your current streak, but your previous progress and history are never erased.
            </Text>
          </View>

          <View style={styles.subSection}>
            <Text style={[styles.subTitle, { color: '#16A34A' }]}>🌱 Sankalpa</Text>
            <Text style={styles.subText}>
              A temporary discipline commitment. For example: "I will follow my daily routine for 90 days."
              {"\n\n"}
              During a Sankalpa, you follow your Dincharya and build consistency. When the Sankalpa ends, its records are archived as history. You can then start a new Sankalpa.
              {"\n\n"}
              Your Sankalpa can restart. Your overall Recovery Journey does not.
            </Text>
          </View>
        </View>

        {/* Section: Dincharya */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <FontAwesome5 name="tasks" size={16} color="#EA580C" />
            </View>
            <Text style={styles.cardTitle}>2. Dincharya — Your Daily Routine</Text>
          </View>
          <Text style={styles.cardBody}>
            Dincharya is where you track the actions you want to complete each day (e.g. Gym, Reading, Meditation, Sleep before 10 PM).
          </Text>

          <View style={styles.subSection}>
            <Text style={styles.subTitle}>Everyday Tasks</Text>
            <Text style={styles.subText}>
              These are tasks that repeat throughout your active Sankalpa. If you add "Gym" to a 90-day Sankalpa, it becomes part of your routine for the remaining days of that Sankalpa.
            </Text>
          </View>

          <View style={styles.subSection}>
            <Text style={styles.subTitle}>One-Day Tasks</Text>
            <Text style={styles.subText}>
              These are tasks that are needed only on a particular day (e.g., Doctor appointment, Buy a book, Family function). They are added for one specific day and are included in your daily reports.
            </Text>
          </View>
        </View>

        {/* Section: Today-Only Rule */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <FontAwesome5 name="calendar-day" size={16} color="#EA580C" />
            </View>
            <Text style={styles.cardTitle}>3. Only Today Can Be Changed</Text>
          </View>
          <Text style={styles.cardBody}>
            Kaivalya protects your history by allowing you to edit only today's tasks.
          </Text>

          <View style={styles.subSection}>
            <Text style={styles.subTitle}>Past Days</Text>
            <Text style={styles.subText}>Past days are locked. You can view what you completed or missed, but you cannot change it.</Text>
          </View>

          <View style={styles.subSection}>
            <Text style={styles.subTitle}>Today</Text>
            <Text style={styles.subText}>Today is fully editable. You can complete/uncomplete tasks or add custom One-Day Tasks.</Text>
          </View>

          <View style={styles.subSection}>
            <Text style={styles.subTitle}>Future Days</Text>
            <Text style={styles.subText}>Future days are visible but locked. You cannot mark future tasks as completed. This keeps your progress honest and meaningful.</Text>
          </View>
        </View>

        {/* Section: Deleting Tasks */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <FontAwesome5 name="trash-alt" size={16} color="#EA580C" />
            </View>
            <Text style={styles.cardTitle}>4. Changing or Deleting Tasks</Text>
          </View>
          <Text style={styles.cardBody}>
            Your history is never rewritten.
            {"\n\n"}
            For example, if you track "Gym" for the first 20 days and on Day 21 replace it with "Morning Walk", your history will still show "Gym" for Days 1–20 and "Morning Walk" from Day 21 onward.
            {"\n\n"}
            Similarly, deleting a task removes it from today and future days, but does not alter your past completed records.
          </Text>
        </View>

        {/* Section: Keystone Habits */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <FontAwesome5 name="shield-alt" size={16} color="#EA580C" />
            </View>
            <Text style={styles.cardTitle}>5. Keystone Habits</Text>
          </View>
          <Text style={styles.cardBody}>
            Some habits are more important to your personal routine. You can mark them as Keystone Habits.
            {"\n\n"}
            These are the habits you personally consider essential to staying disciplined (e.g. Sleep before 10 PM, Daily exercise, Meditation). A Keystone Habit is a reminder of what matters most to you. Missing one does not mean your journey has failed.
          </Text>
        </View>

        {/* Section: Completing Sankalpa */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <FontAwesome5 name="check-circle" size={16} color="#EA580C" />
            </View>
            <Text style={styles.cardTitle}>6. Completing Your Sankalpa</Text>
          </View>
          <Text style={styles.cardBody}>
            When you complete your Sankalpa, you will see a completion overlay:
            {"\n\n"}
            <Text style={{ fontWeight: '700' }}>🏆 Sankalpa Completed</Text>
            {"\n"}
            Your discipline journey has reached its goal. Your Dincharya records and sankalp report will be preserved in History.
            {"\n\n"}
            Select <Text style={{ fontWeight: '700', color: '#EA580C' }}>Archive & Continue</Text> to save the completed Sankalpa. You can then start a new Sankalpa whenever you are ready.
            {"\n\n"}
            <Text style={{ fontWeight: '700' }}>Important:</Text> Completing a Sankalpa does not reset your Recovery Journey. Your recovery streak, best streak, relapse history, and trigger progress continue normally.
          </Text>
        </View>

        {/* Section: Reports */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <FontAwesome5 name="chart-pie" size={16} color="#EA580C" />
            </View>
            <Text style={styles.cardTitle}>7. Reports & History</Text>
          </View>
          <Text style={styles.cardBody}>
            Your Reports help you understand your journey instead of simply showing a number.
            {"\n\n"}
            Under Sankalpa History, completed Sankalpas can be clicked later to review start and end dates, routine completion %, calendar history, and your relapse statistics during that specific Sankalpa.
          </Text>
        </View>

        {/* Section: Leagues */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <FontAwesome5 name="award" size={16} color="#EA580C" />
            </View>
            <Text style={styles.cardTitle}>8. Leagues</Text>
          </View>
          <Text style={styles.cardBody}>
            Leagues represent your consistency and long-term discipline journey. As your discipline progresses, you advance through different leagues:
          </Text>

          <View style={styles.badgeRow}>
            <View style={[styles.badgeIconBg, { backgroundColor: '#F1F5F9' }]}>
              <FontAwesome5 name="seedling" size={10} color="#64748B" />
            </View>
            <View style={styles.badgeTextContainer}>
              <Text style={styles.badgeName}>🌱 Seed</Text>
              <Text style={styles.badgeDesc}>Every journey begins with a single seed.</Text>
            </View>
          </View>

          <View style={styles.badgeRow}>
            <View style={[styles.badgeIconBg, { backgroundColor: '#FFF7ED' }]}>
              <FontAwesome5 name="leaf" size={10} color="#EA580C" />
            </View>
            <View style={styles.badgeTextContainer}>
              <Text style={styles.badgeName}>🌿 Sprout</Text>
              <Text style={styles.badgeDesc}>Your discipline has taken root.</Text>
            </View>
          </View>

          <View style={styles.badgeRow}>
            <View style={[styles.badgeIconBg, { backgroundColor: '#DBEAFE' }]}>
              <FontAwesome5 name="snowflake" size={10} color="#2563EB" />
            </View>
            <View style={styles.badgeTextContainer}>
              <Text style={styles.badgeName}>❄️ Frost Bud</Text>
              <Text style={styles.badgeDesc}>You continue growing even through difficult times.</Text>
            </View>
          </View>

          <View style={styles.badgeRow}>
            <View style={[styles.badgeIconBg, { backgroundColor: '#FCE7F3' }]}>
              <FontAwesome5 name="spa" size={10} color="#DB2777" />
            </View>
            <View style={styles.badgeTextContainer}>
              <Text style={styles.badgeName}>🌸 Bloom</Text>
              <Text style={styles.badgeDesc}>Your efforts begin to blossom.</Text>
            </View>
          </View>

          <View style={styles.badgeRow}>
            <View style={[styles.badgeIconBg, { backgroundColor: '#FEF3C7' }]}>
              <FontAwesome5 name="tree" size={10} color="#D97706" />
            </View>
            <View style={styles.badgeTextContainer}>
              <Text style={styles.badgeName}>🍂 Season</Text>
              <Text style={styles.badgeDesc}>True discipline survives every season.</Text>
            </View>
          </View>

          <View style={styles.badgeRow}>
            <View style={[styles.badgeIconBg, { backgroundColor: '#FAF5FF' }]}>
              <FontAwesome5 name="sparkles" size={10} color="#7C3AED" />
            </View>
            <View style={styles.badgeTextContainer}>
              <Text style={styles.badgeName}>✨ Aurora</Text>
              <Text style={styles.badgeDesc}>Your consistency now shines from within.</Text>
            </View>
          </View>

          <View style={styles.badgeRow}>
            <View style={[styles.badgeIconBg, { backgroundColor: '#FEF2F2' }]}>
              <FontAwesome5 name="om" size={10} color="#EF4444" />
            </View>
            <View style={styles.badgeTextContainer}>
              <Text style={styles.badgeName}>🏆 Brahmachari</Text>
              <Text style={styles.badgeDesc}>Discipline is no longer something you do — it is becoming part of who you are.</Text>
            </View>
          </View>
        </View>

        {/* Section: Relapse */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <FontAwesome5 name="redo" size={16} color="#EF4444" />
            </View>
            <Text style={styles.cardTitle}>9. When You Relapse</Text>
          </View>
          <Text style={styles.cardBody}>
            If you stumble, don't hide it. Use the Relapsed option to record triggers, times, locations, emotions, and contexts.
            {"\n\n"}
            This information helps Kaivalya identify patterns (e.g. slips happening late at night or under specific situations) without judgment, helping you make better decisions next time.
            {"\n\n"}
            A relapse is an event, not the end of your journey. Your history, learning, and journey continue.
          </Text>
        </View>

        {/* Section: Ojas */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <FontAwesome5 name="bolt" size={16} color="#EA580C" />
            </View>
            <Text style={styles.cardTitle}>10. Vital Energy & Ojas</Text>
          </View>
          <Text style={styles.cardBody}>
            Brahmacharya is traditionally associated with directing one's energy toward physical, mental, intellectual, and spiritual development.
            {"\n\n"}
            In traditional Indian thought, Ojas is described as a subtle form of vital strength associated with vitality, clarity, and inner stability. Kaivalya uses this idea as part of its philosophy of disciplined living.
            {"\n\n"}
            The app is not asking you to become perfect. It is encouraging you to become more conscious of how you use your time, attention, habits, and energy.
          </Text>
        </View>

        {/* Principle */}
        <View style={[styles.card, { backgroundColor: '#FFF7ED', borderColor: '#FFEDD5' }]}>
          <Text style={[styles.cardTitle, { color: '#EA580C', marginBottom: 8, textAlign: 'center' }]}>Your Principle</Text>
          <Text style={[styles.cardBody, { color: '#7C2D12', textAlign: 'center', fontStyle: 'italic' }]}>
            &quot;Walk the path with sincerity, not perfection.&quot;
            {"\n\n"}
            Some days will be strong. Some days will be difficult. What matters is that you learn, continue, and keep moving forward.
          </Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F4F0',
  },
  header: {
    backgroundColor: '#EA580C',
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
    width: 40,
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
  boldText: {
    fontWeight: '700',
    color: '#EA580C',
  },
  italicText: {
    fontStyle: 'italic',
    color: '#64748B',
  },
  subSection: {
    marginTop: 14,
    borderLeftWidth: 2,
    borderLeftColor: '#FFEDD5',
    paddingLeft: 12,
  },
  subTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  subText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    gap: 12,
  },
  badgeIconBg: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  badgeTextContainer: {
    flex: 1,
  },
  badgeName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  badgeDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 18,
  },
});
