import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withRepeat,
  withSequence,
  useAnimatedProps,
  Easing
} from 'react-native-reanimated';
import { useFocusEffect } from 'expo-router';

const { width } = Dimensions.get('window');
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const CIRCLE_RADIUS = 100;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;
const GOAL_DAYS = 90;

export default function JourneyScreen() {
  const [journeyStart, setJourneyStart] = useState<Date | null>(null);
  const [days, setDays] = useState(0);
  const [hours, setHours] = useState('00');
  const [minutes, setMinutes] = useState('00');
  const [seconds, setSeconds] = useState('00');
  
  const [isUrgeModalOpen, setIsUrgeModalOpen] = useState(false);
  const [isRelapseModalOpen, setIsRelapseModalOpen] = useState(false);
  const [urgeSeconds, setUrgeSeconds] = useState(60);
  const [isUrgeActive, setIsUrgeActive] = useState(false);
  
  const progressOffset = useSharedValue(CIRCLE_CIRCUMFERENCE);
  const breatheScale = useSharedValue(1);

  const loadJourney = async () => {
    try {
      const savedStart = await AsyncStorage.getItem('ojas_journey_start');
      if (savedStart) {
        setJourneyStart(new Date(savedStart));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadJourney();
    }, [])
  );

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (journeyStart) {
      interval = setInterval(() => {
        const now = new Date();
        const diff = now.getTime() - journeyStart.getTime();
        if (diff >= 0) {
          const d = Math.floor(diff / (1000 * 60 * 60 * 24));
          const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
          const m = Math.floor((diff / 1000 / 60) % 60);
          const s = Math.floor((diff / 1000) % 60);

          setDays(d);
          setHours(h.toString().padStart(2, '0'));
          setMinutes(m.toString().padStart(2, '0'));
          setSeconds(s.toString().padStart(2, '0'));

          const percent = Math.min((d / GOAL_DAYS) * 100, 100);
          const offset = CIRCLE_CIRCUMFERENCE - (percent / 100) * CIRCLE_CIRCUMFERENCE;
          progressOffset.value = withTiming(offset, { duration: 1000, easing: Easing.out(Easing.ease) });
        }
      }, 1000);
    } else {
      progressOffset.value = CIRCLE_CIRCUMFERENCE;
    }
    return () => clearInterval(interval);
  }, [journeyStart]);

  const animatedCircleProps = useAnimatedProps(() => {
    return {
      strokeDashoffset: progressOffset.value
    };
  });

  const breatheStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: breatheScale.value }]
    };
  });

  const startJourney = async () => {
    const now = new Date();
    setJourneyStart(now);
    await AsyncStorage.setItem('ojas_journey_start', now.toISOString());
  };

  const confirmRelapse = async () => {
    const now = new Date();
    setJourneyStart(now);
    await AsyncStorage.setItem('ojas_journey_start', now.toISOString());
    setIsRelapseModalOpen(false);
  };

  const openUrgeSurfer = () => {
    setIsUrgeModalOpen(true);
    setUrgeSeconds(60);
    setIsUrgeActive(true);
    
    // Start breathing animation
    breatheScale.value = withRepeat(
      withSequence(
        withTiming(1.5, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  };

  const closeUrgeSurfer = () => {
    setIsUrgeModalOpen(false);
    setIsUrgeActive(false);
    breatheScale.value = 1;
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isUrgeActive && urgeSeconds > 0) {
      interval = setInterval(() => {
        setUrgeSeconds(prev => prev - 1);
      }, 1000);
    } else if (urgeSeconds === 0) {
      setIsUrgeActive(false);
    }
    return () => clearInterval(interval);
  }, [isUrgeActive, urgeSeconds]);

  const renderMilestone = (dayReq: number, currentDays: number, title: string, desc: string, icon: string) => {
    const isAchieved = currentDays >= dayReq;
    return (
      <View style={styles.milestoneContainer} key={dayReq}>
        <View style={styles.timelineLine} />
        <View style={[styles.milestoneIcon, isAchieved ? styles.milestoneIconAchieved : {}]}>
          <FontAwesome5 name={icon} size={16} color={isAchieved ? "#FFFFFF" : "#94A3B8"} />
        </View>
        <View style={[styles.milestoneCard, isAchieved ? styles.milestoneCardAchieved : {}]}>
          <Text style={styles.milestoneTitle}>Day {dayReq}: {title}</Text>
          <Text style={styles.milestoneDesc}>{desc}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLogo}>
            <FontAwesome5 name="om" size={24} color="#EA580C" />
          </View>
          <Text style={styles.headerTitle}>Brahmacharya</Text>
        </View>

        {/* Hero Section */}
        <View style={styles.heroCard}>
          <View style={styles.heroGradient} />
          <Text style={styles.streakLabel}>CURRENT STREAK</Text>
          
          <TouchableOpacity 
            activeOpacity={0.9} 
            onPress={!journeyStart ? startJourney : undefined}
            style={styles.circleWrapper}
          >
            <FontAwesome5 name="om" size={140} color="rgba(234, 88, 12, 0.05)" style={styles.omBackground} />
            
            <Svg width={CIRCLE_RADIUS * 2 + 20} height={CIRCLE_RADIUS * 2 + 20} viewBox="0 0 220 220" style={{ transform: [{ rotate: '-90deg' }] }}>
              <Circle
                cx="110" cy="110" r={CIRCLE_RADIUS}
                stroke="#F1F5F9" strokeWidth="8" fill="transparent"
              />
              <AnimatedCircle
                cx="110" cy="110" r={CIRCLE_RADIUS}
                stroke="#EA580C" strokeWidth="8" fill="transparent"
                strokeLinecap="round"
                strokeDasharray={CIRCLE_CIRCUMFERENCE}
                animatedProps={animatedCircleProps}
              />
            </Svg>

            <View style={styles.circleCenter}>
              {!journeyStart ? (
                <Text style={styles.startText}>Start{'\n'}Journey</Text>
              ) : (
                <>
                  <Text style={styles.daysText}>{days}</Text>
                  <Text style={styles.daysLabel}>Days</Text>
                </>
              )}
            </View>
          </TouchableOpacity>

          {journeyStart && (
            <View style={styles.timeGrid}>
              <View style={styles.timeBlock}>
                <Text style={styles.timeCount}>{hours}</Text>
                <Text style={styles.timeLabel}>Hours</Text>
              </View>
              <View style={styles.timeBlock}>
                <Text style={styles.timeCount}>{minutes}</Text>
                <Text style={styles.timeLabel}>Minutes</Text>
              </View>
              <View style={styles.timeBlock}>
                <Text style={styles.timeCount}>{seconds}</Text>
                <Text style={styles.timeLabel}>Seconds</Text>
              </View>
            </View>
          )}

          {journeyStart && (
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.btnEmergency} onPress={openUrgeSurfer}>
                <FontAwesome5 name="fire" size={16} color="#EF4444" />
                <Text style={styles.btnEmergencyText}>Emergency</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnRelapse} onPress={() => setIsRelapseModalOpen(true)}>
                <FontAwesome5 name="history" size={16} color="#64748B" />
                <Text style={styles.btnRelapseText}>Relapsed</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Daily Quote */}
        <View style={styles.quoteCard}>
          <FontAwesome5 name="quote-left" size={24} color="#FED7AA" style={styles.quoteIcon} />
          <Text style={styles.quoteText}>
            "The chaste brain has tremendous energy and gigantic willpower. Without chastity there can be no spiritual strength."
          </Text>
          <Text style={styles.quoteAuthor}>— Swami Vivekananda</Text>
        </View>

        {/* Timeline */}
        <View style={styles.timelineSection}>
          <Text style={styles.sectionTitle}>
            <FontAwesome5 name="seedling" size={18} color="#789b7b" /> Journey of the Seed
          </Text>
          
          <View style={styles.timelineWrapper}>
            {renderMilestone(7, days, 'Testosterone Spike', 'Physical energy increases. Brain fog begins to lift.', 'check')}
            {renderMilestone(30, days, 'Mental Clarity', 'Dopamine baseline stabilizes. Increased confidence.', 'lock')}
            {renderMilestone(90, days, 'Ojas Cultivation', 'Profound inner peace, magnetism, and willpower.', 'star')}
          </View>
        </View>

      </ScrollView>

      {/* Relapse Modal */}
      <Modal visible={isRelapseModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconBg}>
              <FontAwesome5 name="history" size={30} color="#EF4444" />
            </View>
            <Text style={styles.modalTitle}>Reset Streak?</Text>
            <Text style={styles.modalDesc}>
              Relapses happen on the path to mastery. Acknowledge it, learn from it, and begin again. Are you sure you want to reset your streak?
            </Text>
            <TouchableOpacity style={styles.modalBtnPrimary} onPress={confirmRelapse}>
              <Text style={styles.modalBtnPrimaryText}>Yes, Reset Streak</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalBtnSecondary} onPress={() => setIsRelapseModalOpen(false)}>
              <Text style={styles.modalBtnSecondaryText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Urge Surfer Modal */}
      <Modal visible={isUrgeModalOpen} transparent animationType="slide">
        <View style={styles.urgeOverlay}>
          <TouchableOpacity style={styles.closeBtn} onPress={closeUrgeSurfer}>
            <FontAwesome5 name="times" size={24} color="#94A3B8" />
          </TouchableOpacity>
          
          <View style={styles.urgeContent}>
            {urgeSeconds > 0 ? (
              <>
                <Text style={styles.urgeTitle}>Ride the Wave</Text>
                <Text style={styles.urgeDesc}>An urge is just a sensation. Breathe with the circle.</Text>
                
                <View style={styles.breatheWrapper}>
                  <Animated.View style={[styles.breatheCircleOutline, breatheStyle]} />
                  <View style={styles.breatheCircleInner}>
                    <Text style={styles.urgeTimerText}>{urgeSeconds}</Text>
                  </View>
                </View>
                
                <Text style={styles.urgeFooterText}>"This too shall pass."</Text>
              </>
            ) : (
              <>
                <View style={[styles.modalIconBg, { backgroundColor: 'rgba(34, 197, 94, 0.2)' }]}>
                  <FontAwesome5 name="check" size={40} color="#22C55E" />
                </View>
                <Text style={[styles.urgeTitle, { marginTop: 24 }]}>Urge Survived</Text>
                <Text style={styles.urgeDesc}>You successfully surfed the wave. Your energy remains protected.</Text>
                <TouchableOpacity style={styles.modalBtnPrimary} onPress={closeUrgeSurfer}>
                  <Text style={styles.modalBtnPrimaryText}>Return to Dashboard</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCFBF9',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFEDD5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#7C2D12',
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
    marginBottom: 24,
    overflow: 'hidden',
  },
  heroGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: '#EA580C',
  },
  streakLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 2,
    marginBottom: 24,
  },
  circleWrapper: {
    width: CIRCLE_RADIUS * 2 + 20,
    height: CIRCLE_RADIUS * 2 + 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  omBackground: {
    position: 'absolute',
  },
  circleCenter: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  daysText: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#1E293B',
    lineHeight: 64,
  },
  daysLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  startText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#EA580C',
    textAlign: 'center',
  },
  timeGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    marginTop: 32,
    gap: 32,
  },
  timeBlock: {
    alignItems: 'center',
  },
  timeCount: {
    fontSize: 24,
    fontWeight: '600',
    color: '#334155',
  },
  timeLabel: {
    fontSize: 10,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 32,
  },
  btnEmergency: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
  },
  btnEmergencyText: {
    color: '#EF4444',
    fontWeight: '600',
    fontSize: 15,
  },
  btnRelapse: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
  },
  btnRelapseText: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 15,
  },
  quoteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 32,
    position: 'relative',
  },
  quoteIcon: {
    position: 'absolute',
    top: 24,
    left: 24,
  },
  quoteText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#334155',
    lineHeight: 26,
    marginTop: 12,
    marginLeft: 16,
    marginBottom: 16,
  },
  quoteAuthor: {
    fontSize: 13,
    fontWeight: '700',
    color: '#C2410C',
    textTransform: 'uppercase',
    marginLeft: 16,
    letterSpacing: 1,
  },
  timelineSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelineWrapper: {
    marginLeft: 16,
  },
  milestoneContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: 19,
    top: 30,
    bottom: -30,
    width: 2,
    backgroundColor: '#E2E8F0',
    zIndex: 1,
  },
  milestoneIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 4,
    borderColor: '#FCFBF9',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  milestoneIconAchieved: {
    backgroundColor: '#EA580C',
  },
  milestoneCard: {
    flex: 1,
    marginLeft: 16,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    opacity: 0.7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  milestoneCardAchieved: {
    opacity: 1,
  },
  milestoneTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  milestoneDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 12,
  },
  modalDesc: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  modalBtnPrimary: {
    backgroundColor: '#EA580C',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  modalBtnPrimaryText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalBtnSecondary: {
    backgroundColor: '#F1F5F9',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  modalBtnSecondaryText: {
    color: '#475569',
    fontWeight: 'bold',
    fontSize: 16,
  },
  urgeOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 60,
    right: 24,
    padding: 12,
    zIndex: 10,
  },
  urgeContent: {
    width: '100%',
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  urgeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  urgeDesc: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 64,
  },
  breatheWrapper: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 64,
  },
  breatheCircleOutline: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(234, 88, 12, 0.2)',
  },
  breatheCircleInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#EA580C',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  urgeTimerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  urgeFooterText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#64748B',
  }
});
