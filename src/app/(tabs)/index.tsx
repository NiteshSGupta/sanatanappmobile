/* eslint-disable react-hooks/immutability */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle,
  withTiming, 
  useAnimatedProps,
  Easing
} from 'react-native-reanimated';
import { useFocusEffect } from 'expo-router';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const STAGES = [
  { name: 'Inhale', duration: 4, label: 'INHALE 4S' },
  { name: 'Hold', duration: 4, label: 'HOLD 4S' },
  { name: 'Exhale', duration: 8, label: 'EXHALE 8S' },
  { name: 'Pause', duration: 2, label: 'PAUSE 2S' },
];

const CIRCLE_RADIUS = 90;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;
const GAUGE_SPAN = 0.75; // 3/4 circle arc

export default function JourneyScreen() {
  const [user, setUser] = useState<any>(null);
  const [journeyStart, setJourneyStart] = useState<Date | null>(null);
  const [days, setDays] = useState(0);
  const [hours, setHours] = useState('00');
  const [minutes, setMinutes] = useState('00');
  const [seconds, setSeconds] = useState('00');
  const [isRelapseModalOpen, setIsRelapseModalOpen] = useState(false);
  const [relapseReason, setRelapseReason] = useState('');
  
  const progressOffset = useSharedValue(CIRCLE_CIRCUMFERENCE);

  const [isUrgeModalOpen, setIsUrgeModalOpen] = useState(false);
  const [isUrgeActive, setIsUrgeActive] = useState(false);
  const [urgeElapsed, setUrgeElapsed] = useState(0);
  const [urgeCycles, setUrgeCycles] = useState(0);
  const [urgeStageIndex, setUrgeStageIndex] = useState(0);
  const [urgeStageTimeLeft, setUrgeStageTimeLeft] = useState(4); // Default to inhale duration
  const urgeCircleScale = useSharedValue(1);

  // League computation matching Figma layout
  const getLeagueData = useCallback((currentDays: number) => {
    if (currentDays < 7) {
      return { current: 'Shishya', next: 'Sadhaka', nextDaysReq: 7, icon: 'seedling' };
    } else if (currentDays < 30) {
      return { current: 'Sadhaka', next: 'Tapasvi', nextDaysReq: 30, icon: 'leaf' };
    } else if (currentDays < 90) {
      return { current: 'Tapasvi', next: 'Brahmacharya', nextDaysReq: 90, icon: 'fire' };
    } else if (currentDays < 365) {
      return { current: 'Brahmacharya', next: 'Maharishi', nextDaysReq: 365, icon: 'shield-alt' };
    } else {
      return { current: 'Maharishi', next: 'None', nextDaysReq: 0, icon: 'om' };
    }
  }, []);

  const loadJourney = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
      const savedStart = await AsyncStorage.getItem('ojas_journey_start');
      if (savedStart) {
        setJourneyStart(new Date(savedStart));
      } else {
        // If not started, default to now or don't set
        const now = new Date();
        setJourneyStart(now);
        await AsyncStorage.setItem('ojas_journey_start', now.toISOString());
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

          // Calculate progress percentage inside current league
          const leagueData = getLeagueData(d);
          const percent = leagueData.nextDaysReq > 0
            ? Math.min((d / leagueData.nextDaysReq) * 100, 100)
            : 100;
          
          // Maps progress percentage to the 3/4 circle arc (GAUGE_SPAN)
          const fillPercentage = (percent / 100) * GAUGE_SPAN;
          const offset = CIRCLE_CIRCUMFERENCE - fillPercentage * CIRCLE_CIRCUMFERENCE;
          progressOffset.value = withTiming(offset, { duration: 1000, easing: Easing.out(Easing.ease) });
        }
      }, 1000);
    } else {
      progressOffset.value = CIRCLE_CIRCUMFERENCE;
    }
    return () => clearInterval(interval);
  }, [journeyStart, progressOffset, getLeagueData]);

  const animatedCircleProps = useAnimatedProps(() => {
    return {
      strokeDashoffset: progressOffset.value
    };
  });

  const confirmRelapse = async () => {
    const now = new Date();
    try {
      const storedRelapses = await AsyncStorage.getItem('ojas_relapses');
      const relapses = storedRelapses ? JSON.parse(storedRelapses) : [];
      relapses.push({
        date: now.toISOString(),
        reason: relapseReason.trim() || 'No reason specified',
      });
      await AsyncStorage.setItem('ojas_relapses', JSON.stringify(relapses));
    } catch (e) {
      console.error('Error saving relapse:', e);
    }

    setJourneyStart(now);
    await AsyncStorage.setItem('ojas_journey_start', now.toISOString());
    setIsRelapseModalOpen(false);
    setRelapseReason('');
  };

  // Urge Surfer Timer and Breathing Logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isUrgeModalOpen && isUrgeActive) {
      interval = setInterval(() => {
        setUrgeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isUrgeModalOpen, isUrgeActive]);

  useEffect(() => {
    let breathingInterval: ReturnType<typeof setInterval>;
    if (isUrgeModalOpen && isUrgeActive) {
      const currentStage = STAGES[urgeStageIndex].name;
      if (currentStage === 'Inhale') {
        urgeCircleScale.value = withTiming(1.4, {
          duration: STAGES[urgeStageIndex].duration * 1000,
          easing: Easing.inOut(Easing.ease),
        });
      } else if (currentStage === 'Exhale') {
        urgeCircleScale.value = withTiming(1.0, {
          duration: STAGES[urgeStageIndex].duration * 1000,
          easing: Easing.inOut(Easing.ease),
        });
      }

      breathingInterval = setInterval(() => {
        setUrgeStageTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            const nextIndex = (urgeStageIndex + 1) % STAGES.length;
            setUrgeStageIndex(nextIndex);
            if (nextIndex === 0) {
              setUrgeCycles(c => c + 1);
            }
            return STAGES[nextIndex].duration;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    return () => clearInterval(breathingInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUrgeModalOpen, isUrgeActive, urgeStageIndex]);

  const animatedUrgeCircleStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: urgeCircleScale.value }],
    };
  });

  const openUrgeSurfer = () => {
    setIsUrgeModalOpen(true);
    setIsUrgeActive(false); // do not start automatically, waits for click
    setUrgeElapsed(0);
    setUrgeCycles(0);
    setUrgeStageIndex(0);
    setUrgeStageTimeLeft(4);
    urgeCircleScale.value = 1;
  };

  const closeUrgeSurfer = () => {
    setIsUrgeModalOpen(false);
    setIsUrgeActive(false);
  };

  const resetUrgeSurfer = () => {
    setUrgeElapsed(0);
    setUrgeCycles(0);
    setUrgeStageIndex(0);
    setUrgeStageTimeLeft(4);
    urgeCircleScale.value = 1;
  };



  const league = getLeagueData(days);
  const nextLeagueText = league.next !== 'None' ? `Next: 🛡️ ${league.next}` : 'Ultimate Level achieved!';
  const daysRemainingText = league.nextDaysReq > 0 ? `${league.nextDaysReq - days} days away` : 'Max tier';
  const progressPercent = league.nextDaysReq > 0 ? Math.min((days / league.nextDaysReq) * 100, 100) : 100;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerLogo}>
              <FontAwesome5 name="om" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.headerTitle}>Brahmacharya</Text>
          </View>
          <Text style={styles.headerUser}>Hi, {user?.name?.split(' ')[0] || 'seeker'}</Text>
        </View>

        {/* Hero Circular Progress Gauge Card */}
        <View style={styles.heroCard}>
          <Text style={styles.streakLabel}>CURRENT STREAK</Text>
          
          <View style={styles.circleWrapper}>
            {/* Om Background Watermark */}
            <View style={styles.omWatermark}>
              <FontAwesome5 name="om" size={120} color="#EA580C" style={{ opacity: 0.05 }} />
            </View>
            
            {/* Svg Semi-Circle Ring */}
            <Svg width={CIRCLE_RADIUS * 2 + 20} height={CIRCLE_RADIUS * 2 + 20} viewBox="0 0 200 200" style={styles.svgRotation}>
              <Circle
                cx="100" cy="100" r={CIRCLE_RADIUS}
                stroke="#E2E8F0" strokeWidth="8" fill="transparent"
                strokeDasharray={CIRCLE_CIRCUMFERENCE}
                strokeDashoffset={CIRCLE_CIRCUMFERENCE * (1 - GAUGE_SPAN)}
                strokeLinecap="round"
              />
              <AnimatedCircle
                cx="100" cy="100" r={CIRCLE_RADIUS}
                stroke="#EA580C" strokeWidth="8" fill="transparent"
                strokeLinecap="round"
                strokeDasharray={CIRCLE_CIRCUMFERENCE}
                animatedProps={animatedCircleProps}
              />
            </Svg>

            {/* Inner text */}
            <View style={styles.circleCenter}>
              <Text style={styles.daysText}>{days}</Text>
              <Text style={styles.daysLabel}>Days</Text>
            </View>
          </View>

          {/* Hours, Minutes, Seconds Counters */}
          <View style={styles.timeGrid}>
            <View style={styles.timeBlock}>
              <Text style={styles.timeCount}>{hours}</Text>
              <Text style={styles.timeLabel}>HOURS</Text>
            </View>
            <Text style={styles.timeDivider}>:</Text>
            <View style={styles.timeBlock}>
              <Text style={styles.timeCount}>{minutes}</Text>
              <Text style={styles.timeLabel}>MINUTES</Text>
            </View>
            <Text style={styles.timeDivider}>:</Text>
            <View style={styles.timeBlock}>
              <Text style={styles.timeCount}>{seconds}</Text>
              <Text style={styles.timeLabel}>SECONDS</Text>
            </View>
          </View>

          {/* Action Row */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.btnEmergency} onPress={openUrgeSurfer}>
              <FontAwesome5 name="fire" size={16} color="#FFFFFF" />
              <Text style={styles.btnEmergencyText}>Emergency</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnRelapse} onPress={() => setIsRelapseModalOpen(true)}>
              <FontAwesome5 name="history" size={14} color="#0F172A" />
              <Text style={styles.btnRelapseText}>Relapsed</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Daily Quote Card */}
        <View style={styles.quoteCard}>
          <Text style={styles.quoteIcon}>&quot;</Text>
          <Text style={styles.quoteText}>
            &quot;Purity of thought, speech, and deed – this is the threefold tapas of the wise.&quot;
          </Text>
          <Text style={styles.quoteAuthor}>— YOGA SUTRAS</Text>
        </View>

        {/* Your League Card */}
        <View style={styles.leagueCard}>
          <View style={styles.leagueHeader}>
            <View>
              <Text style={styles.leagueTitle}>YOUR LEAGUE</Text>
              <Text style={styles.activeLeagueText}>
                <FontAwesome5 name={league.icon} size={16} color="#EA580C" /> {league.current}
              </Text>
            </View>
            <View style={styles.leagueRight}>
              <Text style={styles.nextLeagueText}>{nextLeagueText}</Text>
              <Text style={styles.daysAwayText}>{daysRemainingText}</Text>
            </View>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>
        </View>

      </ScrollView>

      {/* Relapse Reset Modal */}
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

            {/* Relapse Reason Input */}
            <View style={styles.relapseInputContainer}>
              <Text style={styles.relapseInputLabel}>WHAT WAS THE TRIGGER / REASON? (OPTIONAL)</Text>
              <TextInput
                style={styles.relapseTextInput}
                placeholder="e.g. boredom, late night browsing, stress..."
                placeholderTextColor="#94A3B8"
                value={relapseReason}
                onChangeText={setRelapseReason}
                multiline
              />
            </View>

            <TouchableOpacity style={styles.modalBtnPrimary} onPress={confirmRelapse}>
              <Text style={styles.modalBtnPrimaryText}>Yes, Reset Streak</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.modalBtnSecondary} 
              onPress={() => {
                setIsRelapseModalOpen(false);
                setRelapseReason('');
              }}
            >
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
            <View style={styles.urgeHeaderInfo}>
              <Text style={styles.urgeTitle}>Urge Surfer</Text>
              <Text style={styles.urgeSubtitle}>
                {Math.floor(urgeElapsed / 60)}:{(urgeElapsed % 60).toString().padStart(2, '0')} · {urgeCycles} {urgeCycles === 1 ? 'cycle' : 'cycles'}
              </Text>
            </View>

            {/* Breathing Animated Circle */}
            <View style={styles.urgeBreathContainer}>
              <View style={styles.urgeOuterRing3}>
                <View style={styles.urgeOuterRing2}>
                  <View style={styles.urgeOuterRing1}>
                    <TouchableOpacity activeOpacity={0.8} onPress={() => setIsUrgeActive(!isUrgeActive)}>
                      <Animated.View style={[styles.urgeBreathCircle, animatedUrgeCircleStyle]}>
                        <Text style={styles.urgeStageStateText}>{STAGES[urgeStageIndex].name}</Text>
                        <Text style={styles.urgeStageTimerText}>{urgeStageTimeLeft}</Text>
                      </Animated.View>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>

            {/* Breathing Stage Timeline tracker */}
            <View style={styles.urgeTimelineContainer}>
              {STAGES.map((st, index) => {
                const isCurrent = index === urgeStageIndex;
                return (
                  <View key={st.name} style={styles.urgeTimelineItem}>
                    <View style={[styles.urgeTimelineDot, isCurrent && styles.urgeTimelineDotActive]} />
                    <Text style={[styles.urgeTimelineLabel, isCurrent && styles.urgeTimelineLabelActive]}>
                      {st.label}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Action Buttons */}
            <View style={styles.urgeActionContainer}>
              <TouchableOpacity 
                style={[styles.urgeBtnStop, urgeActiveBtnStyle(isUrgeActive)]} 
                onPress={() => setIsUrgeActive(!isUrgeActive)}
              >
                <Text style={isUrgeActive ? styles.urgeBtnStopText : styles.urgeBtnStartText}>
                  {isUrgeActive ? 'Stop' : 'Start'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.urgeBtnReset} onPress={resetUrgeSurfer}>
                <Text style={styles.urgeBtnResetText}>Reset</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const urgeActiveBtnStyle = (active: boolean) => {
  return active ? styles.urgeBtnActiveStop : styles.urgeBtnActiveStart;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F4F0', // warm beige background
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    marginTop: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerLogo: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EA580C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  headerUser: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  streakLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1.5,
    marginBottom: 20,
  },
  circleWrapper: {
    width: CIRCLE_RADIUS * 2 + 20,
    height: CIRCLE_RADIUS * 2 + 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  omWatermark: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  svgRotation: {
    transform: [{ rotate: '-225deg' }], // rotate so open arc faces bottom center
    zIndex: 2,
  },
  circleCenter: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  daysText: {
    fontSize: 54,
    fontWeight: 'bold',
    color: '#0F172A',
    lineHeight: 60,
  },
  daysLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  timeGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginTop: 20,
    gap: 8,
  },
  timeBlock: {
    alignItems: 'center',
    width: 60,
  },
  timeCount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
  },
  timeLabel: {
    fontSize: 9,
    color: '#94A3B8',
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 4,
  },
  timeDivider: {
    fontSize: 20,
    fontWeight: '700',
    color: '#E2E8F0',
    marginTop: -14,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 28,
  },
  btnEmergency: {
    flex: 1.1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EA580C',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  btnEmergencyText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  btnRelapse: {
    flex: 0.9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
  },
  btnRelapseText: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 15,
  },
  quoteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    position: 'relative',
  },
  quoteIcon: {
    fontSize: 60,
    fontWeight: 'bold',
    color: '#FFEDD5',
    position: 'absolute',
    top: -10,
    left: 20,
    height: 60,
  },
  quoteText: {
    fontSize: 15,
    fontStyle: 'italic',
    color: '#334155',
    lineHeight: 24,
    marginTop: 20,
    marginBottom: 12,
  },
  quoteAuthor: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EA580C',
    letterSpacing: 1,
  },
  leagueCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  leagueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  leagueTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 4,
  },
  activeLeagueText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  leagueRight: {
    alignItems: 'flex-end',
  },
  nextLeagueText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  daysAwayText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EA580C',
    marginTop: 2,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#EA580C',
    borderRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
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
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalIconBg: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 12,
  },
  modalDesc: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
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
    backgroundColor: '#F5F4F0', // warm beige background
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 40,
  },
  closeBtn: {
    position: 'absolute',
    top: 50,
    right: 24,
    padding: 12,
    zIndex: 10,
  },
  urgeContent: {
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    width: '100%',
    paddingTop: 40,
  },
  urgeHeaderInfo: {
    alignItems: 'center',
  },
  urgeTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 6,
  },
  urgeSubtitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  urgeBreathContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  urgeOuterRing3: {
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(234, 88, 12, 0.02)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  urgeOuterRing2: {
    width: 270,
    height: 270,
    borderRadius: 135,
    backgroundColor: 'rgba(234, 88, 12, 0.03)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  urgeOuterRing1: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(234, 88, 12, 0.04)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  urgeBreathCircle: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: '#FFEDD5', // light orange tint
    borderWidth: 2,
    borderColor: '#FDBA74',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 3,
  },
  urgeStageStateText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EA580C',
    marginBottom: 4,
  },
  urgeStageTimerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#EA580C',
  },
  urgeTimelineContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 40,
  },
  urgeTimelineItem: {
    alignItems: 'center',
    flex: 1,
  },
  urgeTimelineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
    marginBottom: 8,
  },
  urgeTimelineDotActive: {
    backgroundColor: '#EA580C',
  },
  urgeTimelineLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  urgeTimelineLabelActive: {
    color: '#EA580C',
  },
  urgeActionContainer: {
    width: '100%',
    paddingHorizontal: 32,
    gap: 12,
  },
  urgeBtnStop: {
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
  },
  urgeBtnActiveStop: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  urgeBtnActiveStart: {
    backgroundColor: '#EA580C',
    borderColor: '#EA580C',
  },
  urgeBtnStopText: {
    fontSize: 16,
    color: '#475569',
    fontWeight: '700',
  },
  urgeBtnStartText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  urgeBtnReset: {
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
  },
  urgeBtnResetText: {
    fontSize: 16,
    color: '#475569',
    fontWeight: '700',
  },
  relapseInputContainer: {
    width: '100%',
    marginBottom: 20,
    marginTop: 10,
  },
  relapseInputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 8,
    textAlign: 'left',
    alignSelf: 'flex-start',
  },
  relapseTextInput: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#0F172A',
    minHeight: 60,
    textAlignVertical: 'top',
  },
});
